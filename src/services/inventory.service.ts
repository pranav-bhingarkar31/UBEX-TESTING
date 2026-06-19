import { DbService } from "../db/dbService";

export interface StayReservationInput {
  id: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
}

export interface ExperienceReservationInput {
  id: string;
  date: string;         // YYYY-MM-DD
  guests: number;
}

export const InventoryService = {
  /**
   * Helper to parse dates and check overlap
   */
  areDatesOverlapping(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
    return startA < endB && startB < endA;
  },

  /**
   * Check if a Stay is available for the given dates
   */
  async getStayAvailability(stayId: string, checkInStr: string, checkOutStr: string): Promise<{ available: boolean; reason?: string }> {
    const stay = await DbService.getStayById(stayId);
    if (!stay) {
      return { available: false, reason: "Stay property not found" };
    }

    if (stay.isArchived) {
      return { available: false, reason: "Stay property is currently inactive/archived" };
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkIn >= checkOut) {
      return { available: false, reason: "Invalid date range selected" };
    }

    // 1. Check Blocked Dates
    const blockedDates: string[] = stay.blockedDates || [];
    for (const bDateStr of blockedDates) {
      const bDate = new Date(bDateStr);
      // If check-in or check-out encompasses this date
      const d = bDate.getTime();
      if (d >= checkIn.getTime() && d < checkOut.getTime()) {
        return { available: false, reason: `Stay is blocked on date: ${bDateStr}` };
      }
    }

    // 2. Check Maintenance Dates
    const maintenanceDates: string[] = stay.maintenanceDates || [];
    for (const mDateStr of maintenanceDates) {
      const mDate = new Date(mDateStr);
      const d = mDate.getTime();
      if (d >= checkIn.getTime() && d < checkOut.getTime()) {
        return { available: false, reason: `Stay is under maintenance on date: ${mDateStr}` };
      }
    }

    // 3. Double booking / capacity validation. Query existing active bookings and active tentative reservations.
    const activeBookingsCount = await DbService.getOverlappingBookingsCount(stayId, checkInStr, checkOutStr);
    const activeReservationsCount = await DbService.getActiveReservationsCount(stayId, "stay", checkInStr, checkOutStr);
    const bookedAndReservedCount = activeBookingsCount + activeReservationsCount;

    // Stays capacity typically represents maximum overlap. If we exceed limits:
    if (bookedAndReservedCount >= (stay.capacity || 1)) {
      return { 
        available: false, 
        reason: `Sold out. Stay capacity of ${stay.capacity} reached/held (Confirmed bookings: ${activeBookingsCount}, Temporary holds: ${activeReservationsCount}).` 
      };
    }

    return { available: true };
  },

  /**
   * Check Experience capacity and slots remaining
   */
  async getExperienceAvailability(experienceId: string, dateStr: string, requestedGuests: number): Promise<{ available: boolean; remainingSlots: number; reason?: string }> {
    const exp = await DbService.getExperienceById(experienceId);
    if (!exp) {
      return { available: false, remainingSlots: 0, reason: "Experience not found" };
    }

    if (exp.isArchived) {
      return { available: false, remainingSlots: 0, reason: "Experience is currently archived" };
    }

    // Check if the date is on the schedule
    const scheduledDates: string[] = exp.scheduledDates || [];
    if (scheduledDates.length > 0 && !scheduledDates.includes(dateStr)) {
      return { available: false, remainingSlots: 0, reason: `Experience is not scheduled / operating on ${dateStr}. Available days: ${scheduledDates.join(", ")}` };
    }

    // Query active bookings and active tentative reservations for this experience on this date
    const bookedCount = await DbService.getExperienceBookedGuests(experienceId, dateStr);
    const reservedCount = await DbService.getActiveReservationsCount(experienceId, "experience", dateStr);
    const totalHeldAndBooked = bookedCount + reservedCount;

    const maxCapacity = exp.capacity || 15;
    const remainingSlots = Math.max(0, maxCapacity - totalHeldAndBooked);

    if (remainingSlots < requestedGuests) {
      return {
        available: false,
        remainingSlots,
        reason: `Only ${remainingSlots} slots remaining for ${dateStr} (Booked: ${bookedCount}, Temporary holds: ${reservedCount}, Requested: ${requestedGuests} guests). Waitlist option is available.`
      };
    }

    return { available: true, remainingSlots };
  },

  /**
   * Complete Cart validation engine prior to payment / storage
   */
  async validateCartAndReserve(
    cartStays: StayReservationInput[],
    cartExperiences: ExperienceReservationInput[],
    bookingId: string
  ): Promise<{ success: boolean; errors: string[] }> {
    return await DbService.validateAndReserveAtomically(cartStays, cartExperiences, bookingId);
  },

  /**
   * Overrides Inventory settings manually (used by Admin)
   */
  async overrideStayInventory(stayId: string, blockedDates: string[], maintenanceDates: string[], dynamicPriceOverride?: number, capacity?: number): Promise<any> {
    return await DbService.updateStay(stayId, {
      blockedDates,
      maintenanceDates,
      dynamicPriceOverride: dynamicPriceOverride !== undefined ? dynamicPriceOverride : null,
      capacity: capacity !== undefined ? capacity : undefined
    });
  },

  async overrideExperienceInventory(experienceId: string, scheduledDates: string[], capacity?: number): Promise<any> {
    return await DbService.updateExperience(experienceId, {
      scheduledDates,
      capacity: capacity !== undefined ? capacity : undefined
    });
  },

  /**
   * Waitlist registrations for fully booked experiences
   */
  async joinExperienceWaitlist(experienceId: string, guestName: string, guestEmail: string, guestPhone: string, dateStr: string): Promise<any> {
    const exp = await DbService.getExperienceById(experienceId);
    if (!exp) {
      throw new Error("Experience does not exist.");
    }
    return await DbService.createWaitlist({
      experienceId,
      guestName,
      guestEmail,
      guestPhone,
      requestedDate: dateStr,
      status: "Pending"
    });
  },

  async promoteWaitlistBooking(waitlistId: number): Promise<any> {
    await DbService.updateWaitlist(waitlistId, "Promoted");
  }
};
