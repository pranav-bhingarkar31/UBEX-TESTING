import crypto from "crypto";
import { DbService } from "../db/dbService";

export interface CreateOrderPayload {
  bookingId: string;
  amount: number; // In INR Rupees
  currency?: string;
}

export interface VerifyPaymentPayload {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const PaymentService = {
  getCredentials() {
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    
    // Check if keys are active and not defaults or placeholders
    const isPlaceholder = (val: string) => {
      const v = val.toLowerCase();
      return v.includes("yourkeyidhere") || 
             v.includes("keysecrethere") || 
             v.includes("my_razorpay") || 
             v.includes("yourrazorpay");
    };
    
    const hasKeys = keyId && keySecret && !isPlaceholder(keyId) && !isPlaceholder(keySecret);
    const isMock = !hasKeys; // Allow mock / simulation mode in production too for Friends & Family Beta

    if (isMock) {
      console.warn("[PAYMENT SERVICE] WARNING: Active Razorpay keys are not configured or are set to placeholder values. Payment Service will operate in secure checkout simulation fallback mode.");
    }
    
    return {
      keyId: isMock ? "rzp_test_mock_ubex77" : keyId,
      keySecret: isMock ? "mock_secret_ubex77" : keySecret,
      isMock
    };
  },

  /**
   * Creates a real Razorpay Order or fallback simulated order structure
   */
  async createRazorpayOrder(payload: CreateOrderPayload): Promise<{ orderId: string; isMock: boolean; keyId: string }> {
    const { keyId, keySecret, isMock } = this.getCredentials();

    // Server-side amount Calculation (Anti Amount Tampering Principle)
    const booking = await DbService.getBookingByBookingId(payload.bookingId);
    if (!booking) {
      throw new Error(`Booking record index mismatch: Associated record not found for: ${payload.bookingId}`);
    }

    // Retrieve correct amount from database directly, NEVER trusting frontend parameters
    const exactAmount = booking.amountPayable;
    const amountInPaise = Math.round(exactAmount * 100);

    if (isMock) {
      console.log(`[PAYMENT SERVICE] Razorpay running in Simulator Mode. Creating Mock Order for Booking: ${payload.bookingId}`);
      return {
        orderId: `order_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        isMock: true,
        keyId
      };
    }

    try {
      console.log(`[PAYMENT SERVICE] Creating real Razorpay order for Booking: ${payload.bookingId}`);
      // Build basic authorization token
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: payload.currency || "INR",
          receipt: payload.bookingId,
          notes: {
            bookingId: payload.bookingId,
            description: "UbEx Stays & Experiences booking checkout"
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Razorpay API Request failed: ${response.status} - ${errorText}`);
      }

      const orderData = await response.json();
      return {
        orderId: orderData.id,
        isMock: false,
        keyId
      };
    } catch (err: any) {
      console.error("[PAYMENT SERVICE] Failed to generate Razorpay Payment Order:", err);
      // Fallback on error ONLY when isMock is active or allowed in dev environment
      if (isMock) {
        return {
          orderId: `order_failed_fallback_${Date.now()}`,
          isMock: true,
          keyId
        };
      }
      throw new Error(`Razorpay payment initiation failed: ${err.message}`);
    }
  },

  /**
   * Verifies Razorpay payment signature
   */
  async verifyPaymentSignature(payload: VerifyPaymentPayload): Promise<{ success: boolean; message: string }> {
    const { keySecret, isMock } = this.getCredentials();

    if (isMock || payload.razorpayOrderId.startsWith("order_mock_")) {
      console.log(`[PAYMENT SERVICE] Verifying mock signature for Razorpay Order: ${payload.razorpayOrderId}`);
      
      // Look up booking and transition status to Confirmed
      const booking = await DbService.getBookingByBookingId(payload.bookingId);
      if (booking) {
        await DbService.updateBooking(booking.id, {
          status: "Confirmed",
          statusDate: new Date().toISOString(),
          amountPaid: booking.amountPayable,
          amountRemaining: 0,
          razorpayOrderId: payload.razorpayOrderId,
          razorpayPaymentId: payload.razorpayPaymentId || `pay_mock_${Date.now()}`,
          razorpaySignature: payload.razorpaySignature || `sig_mock_${Date.now()}`
        });

        // Atomically confirm inventory reservation holds
        await DbService.confirmReservation(payload.bookingId);
      }
      return { success: true, message: "Payment validated successfully (Simulation mode)." };
    }

    try {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(payload.razorpayOrderId + "|" + payload.razorpayPaymentId)
        .digest("hex");

      const generatedBuffer = Buffer.from(generatedSignature);
      const signatureBuffer = Buffer.from(payload.razorpaySignature);

      // Safe length mismatch validation preceding crypto.timingSafeEqual() to avoid exceptions
      const match = generatedBuffer.length === signatureBuffer.length &&
                    crypto.timingSafeEqual(generatedBuffer, signatureBuffer);

      if (!match) {
        console.warn(`[PAYMENT SERVICE] Signature validation mismatch for Booking: ${payload.bookingId}`);
        return { success: false, message: "Invalid Razorpay payload signature." };
      }

      // Mark the booking as paid and confirmed
      const booking = await DbService.getBookingByBookingId(payload.bookingId);
      if (!booking) {
        return { success: false, message: "Associated booking record not found." };
      }

      await DbService.updateBooking(booking.id, {
        status: "Confirmed",
        statusDate: new Date().toISOString(),
        amountPaid: booking.amountPayable,
        amountRemaining: 0,
        razorpayOrderId: payload.razorpayOrderId,
        razorpayPaymentId: payload.razorpayPaymentId,
        razorpaySignature: payload.razorpaySignature
      });

      // Confirm reservation locks atomically upon signature matching
      await DbService.confirmReservation(payload.bookingId);

      return { success: true, message: "Payment verified successfully." };
    } catch (err: any) {
      console.error("[PAYMENT SERVICE] Error validating Razorpay signatures:", err);
      return { success: false, message: err.message || "Cryptographic integrity check failed." };
    }
  },

  /**
   * Process RazorPay refunds
   */
  async refundRazorpayPayment(bookingId: string, amount: number): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    const { keyId, keySecret, isMock } = this.getCredentials();
    const booking = await DbService.getBookingByBookingId(bookingId);
    if (!booking) {
      return { success: false, error: "Booking record not found" };
    }

    const paymentId = booking.razorpayPaymentId;
    if (!paymentId) {
      return { success: false, error: "Razorpay Payment ID is not available on this booking" };
    }

    if (isMock || paymentId.startsWith("pay_mock_")) {
      console.log(`[PAYMENT SERVICE] Refunding simulated payment ID ${paymentId} with amount ₹${amount}`);
      return {
        success: true,
        transactionId: `rfnd_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`
      };
    }

    try {
      console.log(`[PAYMENT SERVICE] Executing real Razorpay refund on payment ${paymentId} for ₹${amount}`);
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // convert to Paisa
          notes: {
            reason: "Admin cancellations",
            bookingId
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Razorpay Refund failed: ${response.status} - ${errorText}`);
      }

      const refundData = await response.json();
      return {
        success: true,
        transactionId: refundData.id
      };
    } catch (err: any) {
      console.error("[PAYMENT SERVICE] Failed to process Razorpay refund:", err);
      return { success: false, error: err.message || "Failed to call RazorPay refund API" };
    }
  },

  /**
   * Processes Razorpay webhook with Idempotency
   */
  async processWebhook(body: any, rawSignature: string): Promise<{ processed: boolean; event?: string; message?: string }> {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    
    // Webhook Signature length comparisons inside timingSafeEqual comparisons
    if (webhookSecret && rawSignature) {
      const hmac = crypto.createHmac("sha256", webhookSecret);
      hmac.update(JSON.stringify(body));
      const digest = hmac.digest("hex");
      
      const digestBuffer = Buffer.from(digest);
      const sigBuffer = Buffer.from(rawSignature);
      const match = digestBuffer.length === sigBuffer.length && crypto.timingSafeEqual(digestBuffer, sigBuffer);
      if (!match) {
        throw new Error("Webhook signature check failed.");
      }
    }

    const event = body.event;
    console.log(`[PAYMENT WEBHOOK] Processing Razorpay Webhook Event: ${event}`);

    // Webhook Idempotency Check using unique event database ID
    const eventId = body.id || (body.payload?.payment?.entity?.id ? `${event}_${body.payload.payment.entity.id}` : `event_${Date.now()}`);
    const isNew = await DbService.checkAndSaveWebhookEvent(eventId);
    if (!isNew) {
      console.log(`[PAYMENT WEBHOOK] Duplicate event ${eventId} locked. Aborting processed duplication (Idempotency Active).`);
      return { processed: true, event, message: "Duplicate hook iteration bypassed." };
    }

    if (event === "payment.captured") {
      const paymentEntity = body.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const amountPaise = paymentEntity?.amount;

      if (orderId && paymentId) {
        // Query database for booking associated with this Order
        const bookings = await DbService.getBookings();
        const b = bookings.find((booking: any) => booking.razorpayOrderId === orderId);
        if (b) {
          console.log(`[PAYMENT WEBHOOK] Confirming Booking ${b.bookingId} via captured event.`);
          await DbService.updateBooking(b.id, {
            status: "Confirmed",
            statusDate: new Date().toISOString(),
            amountPaid: amountPaise ? (amountPaise / 100) : b.amountPayable,
            amountRemaining: 0,
            razorpayPaymentId: paymentId
          });

          // Confirm reservation locks atomically
          await DbService.confirmReservation(b.bookingId);
          return { processed: true, event };
        }
      }
    }

    if (event === "refund.processed") {
      const refundEntity = body.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      const refundId = refundEntity?.id;
      const refundAmountPaise = refundEntity?.amount;

      if (paymentId) {
        const bookings = await DbService.getBookings();
        const b = bookings.find((booking: any) => booking.razorpayPaymentId === paymentId);
        if (b) {
          console.log(`[PAYMENT WEBHOOK] Marking Booking ${b.bookingId} as Refunded via hook.`);
          await DbService.updateBooking(b.id, {
            refundStatus: "Refunded",
            refundTransactionId: refundId || `rfnd_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
            refundAmount: refundAmountPaise ? (refundAmountPaise / 100) : b.amountPaid, // Keep amountPaid untouched
            refundTimestamp: new Date().toISOString(),
            refundReason: "Razorpay Webhook Refund Notification Event"
          });
          return { processed: true, event };
        }
      }
    }

    return { processed: false, event };
  }
};
