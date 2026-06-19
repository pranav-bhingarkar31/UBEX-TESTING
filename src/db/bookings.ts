import { DbService } from "./dbService";
import { InventoryService } from "../services/inventory.service";

export interface BookingInput {
  bookingId: string;
  userId?: number | null;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  country?: string;
  arrivalTime?: string;
  travelPurpose?: string;
  specialNotes?: string;
  marketingConsent?: boolean;
  paymentType: string;
  selectedAddons?: any[];
  cartStays?: any[];
  cartExperiences?: any[];
  amountPayable: number;
  amountPaid: number;
  amountRemaining: number;
  currency: string;
}

export async function createNewBooking(data: BookingInput) {
  try {
    // 1. Avoid duplicate booking creation
    const existingBooking = await DbService.getBookingByBookingId(data.bookingId);
    if (existingBooking) {
      return existingBooking;
    }

    // 2. Perform Real-Time PRE-BOOKING Inventory/Capacity check to prevent race-conditions/double-booking
    const staysForCheck = (data.cartStays || []).map((cs: any) => ({
      id: cs.id,
      checkInDate: cs.checkInDate || cs.checkIn,
      checkOutDate: cs.checkOutDate || cs.checkOut
    })).filter(x => x.id && x.checkInDate && x.checkOutDate);

    const expsForCheck = (data.cartExperiences || []).map((ce: any) => ({
      id: ce.id,
      date: ce.date || ce.scheduledDate || data.arrivalTime,
      guests: Number(ce.guests || 1)
    })).filter(x => x.id && x.date);

    const validation = await InventoryService.validateCartAndReserve(staysForCheck, expsForCheck, data.bookingId);
    if (!validation.success) {
      throw new Error(`Inventory Check Failed: ${validation.errors.join("; ")}`);
    }

    // 3. Create the Booking via Relational Transaction Service
    const savedBooking = await DbService.createBooking({
      bookingId: data.bookingId,
      userId: data.userId || null,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail,
      country: data.country || "",
      arrivalTime: data.arrivalTime || "",
      travelPurpose: data.travelPurpose || "",
      specialNotes: data.specialNotes || "",
      marketingConsent: !!data.marketingConsent,
      paymentType: data.paymentType,
      selectedAddons: data.selectedAddons || [],
      cartStays: data.cartStays || [],
      cartExperiences: data.cartExperiences || [],
      amountPayable: Number(data.amountPayable),
      amountPaid: Number(data.amountPaid),
      amountRemaining: Number(data.amountRemaining),
      currency: data.currency,
      status: "Pending", // Set status to 'Pending' upon creation as required by Payment Status Correction
      statusDate: new Date().toISOString()
    });

    return savedBooking;
  } catch (error: any) {
    console.error("[POSTGRES BOOKING SYSTEM] Booking transaction creation failed:", error);
    throw new Error(error.message || "Failed to save customer booking to database.");
  }
}

export async function getBookingsByUser(userId: number) {
  try {
    const bookings = await DbService.getBookings();
    return bookings
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime());
  } catch (error) {
    console.error("[POSTGRES BOOKING SYSTEM] Query for user bookings failed:", error);
    throw new Error("Failed to retrieve bookings from database.", { cause: error });
  }
}

export async function getAllBookings() {
  try {
    const bookings = await DbService.getBookings();
    return bookings.sort((a, b) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime());
  } catch (error) {
    console.error("[POSTGRES BOOKING SYSTEM] Query for all bookings failed:", error);
    throw new Error("Database query failed to fetch administrative booking logs.", { cause: error });
  }
}
