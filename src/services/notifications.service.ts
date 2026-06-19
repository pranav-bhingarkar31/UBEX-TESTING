import { SecurityService } from "./audit.service";

export interface SendMessagePayload {
  toEmail: string;
  toPhone: string;
  recipientName: string;
  templateType: "BOOKING_CONFIRMED" | "REFUND_PROCESSED" | "WAITLIST_PROMOTED" | "SECURITY_OTP";
  variables: Record<string, any>;
}

export const NotificationService = {
  /**
   * Exponential backoff retry wrapper
   */
  async retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 1) throw err;
      console.warn(`[NOTIFICATIONS] Action failed, retrying in ${delayMs}ms. Error: ${String(err)}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return await this.retry(fn, retries - 1, delayMs * 2);
    }
  },

  /**
   * Generates email template body
   */
  getEmailTemplate(type: string, name: string, vars: Record<string, any>): { subject: string; html: string } {
    switch (type) {
      case "BOOKING_CONFIRMED":
        return {
          subject: `UbEx Rishikesh: Booking Confirmation - ${vars.bookingId || "Successful"}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Booking Confirmed! 🚣</h2>
              <p>Dear <strong>${name}</strong>,</p>
              <p>Your payment has been verified, and your booking is officially <strong>Confirmed</strong> for your upcoming stay in Rishikesh!</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Booking Reference ID:</strong> ${vars.bookingId}</p>
                <p style="margin: 5px 0;"><strong>Total Amount Paid:</strong> ${vars.amount} ${vars.currency || "INR"}</p>
                ${vars.details || ""}
              </div>
              <p>We are preparing a spectacular experience for you. See you soon in the spiritual capital!</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">This is an automated operational notification from UbEx Rishikesh.</p>
            </div>
          `
        };
      case "REFUND_PROCESSED":
        return {
          subject: `UbEx Rishikesh: Refund Executed - ${vars.bookingId}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Refund Executed successfully</h2>
              <p>Dear <strong>${name}</strong>,</p>
              <p>As per your request, booking <strong>${vars.bookingId}</strong> has been cancelled, and a complete refund has been initiated.</p>
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p style="margin: 5px 0;"><strong>Booking Reference:</strong> ${vars.bookingId}</p>
                <p style="margin: 5px 0;"><strong>Refund Transaction ID:</strong> ${vars.refundTransactionId}</p>
                <p style="margin: 5px 0;"><strong>Refund Value:</strong> ${vars.amount} ${vars.currency || "INR"}</p>
              </div>
              <p>The funds should settle in your source payment account within 5-7 business days depending on your bank.</p>
              <p>We hope to host you again in the future!</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">UbEx Operations Audit Center.</p>
            </div>
          `
        };
      case "WAITLIST_PROMOTED":
        return {
          subject: `UbEx Rishikesh: Great News! Waitlist Promoted`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Waitlist Promotion Approved! 🏔️</h2>
              <p>Dear <strong>${name}</strong>,</p>
              <p>A slot has opened up, and you have been successfully promoted from the waitlist for your requested experience!</p>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Experience:</strong> ${vars.experienceName}</p>
                <p style="margin: 5px 0;"><strong>Scheduled Date:</strong> ${vars.requestedDate}</p>
              </div>
              <p>Our concierge team will reach out to collect payment and verify your booking.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">UbEx Operations Office.</p>
            </div>
          `
        };
      case "SECURITY_OTP":
        return {
          subject: `UbEx Administrative security Action - Step-Up MFA Code`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Security Verification Code</h2>
              <p>Dear Admin,</p>
              <p>You have triggered a high-privilege administrative action (Refund Processing or Security Override).</p>
              <p>Your Administrative One-Time Password (OTP) verification code is:</p>
              <div style="text-align: center; background-color: #f5f3ff; font-size: 32px; font-weight: bold; tracking: 4px; padding: 15px; border-radius: 6px; letter-spacing: 5px; color: #4f46e5; border: 1px dashed #c084fc; margin: 20px 0;">
                ${vars.otp}
              </div>
              <p>This code is valid for exactly <strong>3 minutes</strong>. Do not share this credential with anyone.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">UbEx Administrative Step-Up Security Authority.</p>
            </div>
          `
        };
      default:
        return {
          subject: "UbEx Notice",
          html: `<h3>Notification</h3><p>Dear ${name}, this is a notice from UbEx.</p>`
        };
    }
  },

  /**
   * Generates plaintext SMS template body
   */
  getSmsTemplate(type: string, name: string, vars: Record<string, any>): string {
    switch (type) {
      case "BOOKING_CONFIRMED":
        return `Hello ${name}, your booking ${vars.bookingId} with UbEx Rishikesh is CONFIRMED. Total Paid: ₹${vars.amount}. We look forward to hosting you!`;
      case "REFUND_PROCESSED":
        return `Hello ${name}, refund for booking ${vars.bookingId} has been successfully executed. transaction: ${vars.refundTransactionId}. Value: ₹${vars.amount}.`;
      case "WAITLIST_PROMOTED":
        return `Great news ${name}, you're promoted from the waitlist for ${vars.experienceName} on ${vars.requestedDate}! UbEx Concierge will contact you shortly.`;
      case "SECURITY_OTP":
        return `UbEx Admin Step-Up OTP: ${vars.otp}. Code expires in 3 mins. Do NOT share.`;
      default:
        return `Notification from UbEx for ${name}. Check your email.`;
    }
  },

  /**
   * Unified dispatcher with retry mechanisms, audit tracking, and dual mock/real operations
   */
  async sendNotification(payload: SendMessagePayload): Promise<{ emailSent: boolean; smsSent: boolean }> {
    const resendApiKey = process.env.RESEND_API_KEY || "";
    const twilioSid = process.env.TWILIO_ACCOUNT_SID || "";
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN || "";
    const twilioNum = process.env.TWILIO_NUMBER || "";

    const isEmailConfigured = resendApiKey && resendApiKey !== "MY_RESEND_API_KEY" && resendApiKey.trim() !== "";
    const isSmsConfigured = twilioSid && twilioAuth && twilioNum && twilioSid !== "MY_TWILIO_SID" && twilioSid.trim() !== "";

    const { subject, html } = this.getEmailTemplate(payload.templateType, payload.recipientName, payload.variables);
    const smsText = this.getSmsTemplate(payload.templateType, payload.recipientName, payload.variables);

    let emailSent = false;
    let smsSent = false;

    // 1. Dispatch Email
    if (isEmailConfigured && payload.toEmail) {
      console.log(`[NOTIFICATIONS] Sending real email via Resend to ${payload.toEmail}`);
      try {
        await this.retry(async () => {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: "UbEx Booking <bookings@ubex.com>",
              to: [payload.toEmail],
              subject,
              html
            })
          });
          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Resend API status ${response.status} - ${errBody}`);
          }
        });
        emailSent = true;
      } catch (err) {
        console.error(`[NOTIFICATIONS] Resend email dispatch failed permanently:`, err);
      }
    } else {
      console.log(`[NOTIFICATIONS] [SIMULATION] Email not sent (missing Resend API Keys). To: ${payload.toEmail}. Subject: ${subject}`);
    }

    // 2. Dispatch SMS
    if (isSmsConfigured && payload.toPhone) {
      console.log(`[NOTIFICATIONS] Sending real SMS via Twilio to ${payload.toPhone}`);
      try {
        await this.retry(async () => {
          const auth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
          const params = new URLSearchParams();
          params.append("To", payload.toPhone);
          params.append("From", twilioNum);
          params.append("Body", smsText);

          const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${auth}`
            },
            body: params.toString()
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Twilio status ${response.status} - ${errBody}`);
          }
        });
        smsSent = true;
      } catch (err) {
        console.error(`[NOTIFICATIONS] Twilio SMS dispatch failed permanently:`, err);
      }
    } else {
      console.log(`[NOTIFICATIONS] [SIMULATION] SMS not sent (missing Twilio API Keys). To: ${payload.toPhone}. Text: ${smsText}`);
    }

    // 3. Store security audit log for communication delivery
    try {
      await SecurityService.logAudit({
        adminUserId: "SYSTEM",
        eventType: "COMMUNICATION_DISPATCH",
        description: `Notification sent to ${payload.recipientName} (${payload.toEmail || payload.toPhone}). Template: ${payload.templateType}. Email status: ${emailSent ? 'Delivered' : 'Simulated'}, SMS status: ${smsSent ? 'Delivered' : 'Simulated'}`,
        correlationId: payload.variables.bookingId || "SYSTEM",
        ipAddress: "127.0.0.1",
        userAgent: "UbEx Automated Dispatch Service",
        payload: {
          recipient: payload.recipientName,
          email: payload.toEmail,
          phone: payload.toPhone,
          template: payload.templateType,
          emailSent,
          smsSent,
          smsContentText: smsText
        }
      });
    } catch (auditError) {
      console.error("[NOTIFICATIONS] Failed to write communication audit logs:", auditError);
    }

    return { emailSent, smsSent };
  }
};
