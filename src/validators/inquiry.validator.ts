import { z } from "zod";

/**
 * Valid strict inquiry states for lead lifecycle tracking.
 */
export enum InquiryStatus {
  PENDING = "pending",
  CONTACTED = "contacted",
  QUALIFIED = "qualified",
  CONVERTED = "converted",
  CLOSED = "closed",
  SPAM = "spam"
}

/**
 * Zod validation schema for new customer inquiries
 */
export const createInquirySchema = z.object({
  inquiryType: z.string().min(1, "Inquiry type is required"),
  listingId: z.string().nullable().optional(),
  listingTitle: z.string().min(1, "Listing title is required"),
  category: z.string().nullable().optional(),
  roomName: z.string().nullable().optional(),
  experienceName: z.string().nullable().optional(),
  selectedDate: z.string().nullable().optional(),
  selectedDates: z.array(z.string()).nullable().optional(),
  guestCount: z.number().int().min(1).default(1),
  visitorCount: z.number().int().nullable().optional(),
  selectedAddons: z.any().nullable().optional(),
  sourcePage: z.string().nullable().optional(),
  deviceType: z.string().nullable().optional(),
  leadSource: z.string().nullable().optional(),
  campaignSource: z.string().nullable().optional(),
  campaignMedium: z.string().nullable().optional(),
  campaignName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional()
});

/**
 * Zod validation schema for updating inquiry statuses
 */
export const updateInquiryStatusSchema = z.object({
  status: z.nativeEnum(InquiryStatus)
});
