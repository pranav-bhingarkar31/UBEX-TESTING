import { DbService, BookingModifyInput } from "../../db/dbService";
import { SecurityService } from "../audit.service";
import { OtpService } from "../otp.service";

export type { BookingModifyInput };


export const AdminBookingsService = {
  async getBookings() {
    return await DbService.getBookings();
  },

  async searchBookings(query?: string) {
    return await DbService.searchBookings(query);
  },

  async modifyBooking(id: number, patch: BookingModifyInput, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const updatedBooking = await DbService.updateBooking(id, {
      ...patch,
      statusDate: patch.status ? new Date().toISOString() : undefined
    });

    await SecurityService.logAudit({
      adminUserId,
      eventType: "BOOKING_UPDATE",
      description: `Booking '${updatedBooking.bookingId}' details updated by Administrator.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, patch }
    });

    return updatedBooking;
  },

  async refundBooking(
    bookingId: string, 
    challengeId: string, 
    otp: string, 
    adminPermissions: string[], 
    adminUserId: string, 
    correlationId: string, 
    ipAddress: string, 
    userAgent: string
  ) {
    // 1. Role / Authority validation (Permission: refund:execute)
    if (!adminPermissions.includes("refund:execute")) {
      throw new Error("Access Denied: Administrative permission 'refund:execute' is required to process refunds.");
    }

    // 2. Multi-Factor Token / OTP execution validation (Option B OTP verification)
    if (!challengeId || !otp) {
      throw new Error("MFA Step-Up Security Validation Required: Please complete SMS OTP challenge verification to execute refund.");
    }

    // Verify SMS OTP challenge using the central OtpService
    await OtpService.verifyChallenge(
      { id: challengeId, type: "PHONE" },
      otp,
      correlationId,
      ipAddress,
      userAgent
    );

    // 3. Mark booking as Cancelled & Refunded
    const booking = await DbService.getBookingByBookingId(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found.`);
    }

    // REFUND ACCOUNTING RULES:
    // 1. Maintain historical paid records intact (Never alter amountPaid / amountRemaining)
    // 2. Populate complete refund audit trail fields: refundAmount, refundTimestamp, refundReason, refundTransactionId
    const updatedBooking = await DbService.updateBooking(booking.id, {
      status: "Cancelled",
      statusDate: new Date().toISOString(),
      refundStatus: "Refunded",
      refundTransactionId: "REF-" + Date.now().toString(),
      refundAmount: booking.amountPaid, // Full paid value is captured as refundAmount
      refundTimestamp: new Date().toISOString(),
      refundReason: "Administrative Step-Up MFA Refund"
    });

    // 4. Log High-Privilege Security-Audit Log Event
    await SecurityService.logAudit({
      adminUserId,
      eventType: "BOOKING_REFUND_EXECUTED",
      description: `High-privilege refund operations executed successfully for Booking: ${bookingId} (MFA Verified).`,
      correlationId,
      ipAddress,
      userAgent,
      payload: { bookingId, challengeId, refundedAmount: booking.amountPayable }
    });

    return updatedBooking;
  },

  async reassignBooking(id: number, targetResource: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const bookings = await DbService.getBookings();
    const bRow = bookings.find((b: any) => b.id === id);
    if (!bRow) {
      throw new Error(`Booking ID ${id} not found.`);
    }

    const previousId = bRow.bookingId;
    const notesPatch = `${bRow.specialNotes || ""}\n[Reassigned to ${targetResource} on ${new Date().toISOString()}]`;
    const updatedBooking = await DbService.updateBooking(id, {
      specialNotes: notesPatch
    });

    await SecurityService.logAudit({
      adminUserId,
      eventType: "BOOKING_REASSIGNMENT",
      description: `Booking '${previousId}' reallocated / reassigned to Outpost resource ${targetResource}.`,
      correlationId: "",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "",
      payload: { id, targetResource }
    });

    return updatedBooking;
  }
};

