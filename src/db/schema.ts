import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, boolean, jsonb, doublePrecision, unique, pgEnum, index } from "drizzle-orm/pg-core";

// Define PostgreSQL Enums for database integrity and strict validation in Cloud SQL
export const userStatusEnum = pgEnum("user_status", ["Active", "Suspended", "Inactive"]);
export const stayCategoryEnum = pgEnum("stay_category", ["Luxury", "Family", "Workation", "Dorm", "Long-Stay"]);
export const experienceCategoryEnum = pgEnum("experience_category", ["Adventure", "Trekking", "WaterSports", "Sightseeing", "Camping", "Cultural"]);
export const difficultyEnum = pgEnum("difficulty", ["Easy", "Moderate", "Challenging"]);
export const bookingStatusEnum = pgEnum("booking_status", ["Pending", "Confirmed", "Completed", "Cancelled"]);
export const refundStatusEnum = pgEnum("refund_status", ["NotRefunded", "Refunded", "Failed", "Processing"]);
export const waitlistStatusEnum = pgEnum("waitlist_status", ["Pending", "Promoted", "Cancelled"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["Pending", "Confirmed", "Expired"]);

// Define the 'users' table as required by the Cloud SQL / Firebase user schema.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull().unique(), // Enforce UNIQUE(email) constraint
  name: text("name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  status: userStatusEnum("status").default("Active").notNull(),
  passportLevel: integer("passport_level").default(1).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define the 'stays' table for properties.
export const stays = pgTable("stays", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: stayCategoryEnum("category").notNull(), // "Luxury" | "Family" | "Workation" | "Dorm" | "Long-Stay"
  image: text("image").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(),
  priceValue: doublePrecision("price_value").notNull(),
  rating: doublePrecision("rating").default(5.0).notNull(),
  features: jsonb("features").notNull().default([]),
  isArchived: boolean("is_archived").default(false).notNull(),
  capacity: integer("capacity").notNull(),
  blockedDates: jsonb("blocked_dates").notNull().default([]), // Array of string dates
  maintenanceDates: jsonb("maintenance_dates").notNull().default([]), // Array of string dates
  dynamicPriceOverride: doublePrecision("dynamic_price_override"),
});

// Define the 'experiences' table.
export const experiences = pgTable("experiences", {
  id: text("id").primaryKey(),
  category: experienceCategoryEnum("category").notNull(),
  title: text("title").notNull(),
  price: text("price").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description").notNull(),
  mainImage: text("main_image").notNull(),
  galleryImages: jsonb("gallery_images").notNull().default([]),
  duration: text("duration").notNull(),
  meetingPoint: text("meeting_point").notNull(),
  minAge: text("min_age").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(), // "Easy" | "Moderate" | "Challenging"
  inclusions: jsonb("inclusions").notNull().default([]),
  exclusions: jsonb("exclusions").notNull().default([]),
  timings: jsonb("timings").notNull().default([]),
  faqs: jsonb("faqs").notNull().default([]),
  variants: jsonb("variants").notNull().default([]),
  isArchived: boolean("is_archived").default(false).notNull(),
  capacity: integer("capacity").notNull(),
  scheduledDates: jsonb("scheduled_dates").notNull().default([]),
});

// Define the 'bookings' table to capture all data gathered from the CheckoutPage.
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").notNull().unique(), // UBX-RISH-XX-XXX format
  userId: integer("user_id").references(() => users.id), // Optional foreign key if logged-in user
  guestName: text("guest_name").notNull(),
  guestPhone: text("guest_phone").notNull(),
  guestEmail: text("guest_email").notNull(),
  country: text("country"),
  arrivalTime: text("arrival_time"),
  travelPurpose: text("travel_purpose"),
  specialNotes: text("special_notes"),
  marketingConsent: boolean("marketing_consent").default(false),
  paymentType: text("payment_type").notNull(),
  selectedAddons: jsonb("selected_addons").default([]),
  cartStays: jsonb("cart_stays").default([]),
  cartExperiences: jsonb("cart_experiences").default([]),
  amountPayable: doublePrecision("amount_payable").notNull(),
  amountPaid: doublePrecision("amount_paid").notNull(),
  amountRemaining: doublePrecision("amount_remaining").notNull(),
  currency: text("currency").notNull(),
  status: bookingStatusEnum("status").default("Pending").notNull(), // Pending, Confirmed, Completed, Cancelled
  statusDate: timestamp("status_date", { precision: 6, withTimezone: true }),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  refundStatus: refundStatusEnum("refund_status").default("NotRefunded"), // NotRefunded, Refunded, Failed, Processing
  refundTransactionId: text("refund_transaction_id"),
  refundAmount: doublePrecision("refund_amount"),
  refundTimestamp: timestamp("refund_timestamp", { precision: 6, withTimezone: true }),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("bookings_booking_id_idx").on(table.bookingId),
  index("bookings_status_idx").on(table.status),
  index("bookings_razorpay_order_id_idx").on(table.razorpayOrderId),
  index("bookings_razorpay_payment_id_idx").on(table.razorpayPaymentId)
]);

// Define 'waitlist' table for over-capacity Experience requests.
export const waitlists = pgTable("waitlists", {
  id: serial("id").primaryKey(),
  experienceId: text("experience_id").references(() => experiences.id, { onDelete: "cascade" }).notNull(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  requestedDate: text("requested_date").notNull(), // e.g. "2026-06-20"
  status: waitlistStatusEnum("status").default("Pending").notNull(), // Pending, Promoted, Cancelled
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("waitlist_experience_email_date_unq").on(table.experienceId, table.guestEmail, table.requestedDate),
  index("waitlist_experience_requested_idx").on(table.experienceId, table.requestedDate)
]);

// Define the 'inventory_reservations' table for transient transaction safety
export const inventoryReservations = pgTable("inventory_reservations", {
  id: serial("id").primaryKey(),
  resourceId: text("resource_id").notNull(),
  resourceType: text("resource_type").notNull(), // "stay" | "experience"
  bookingId: text("booking_id"),
  reservedUntil: timestamp("reserved_until", { precision: 6, withTimezone: true }).notNull(),
  status: reservationStatusEnum("status").default("Pending").notNull(), // "Pending", "Confirmed", "Expired"
  quantity: integer("quantity").default(1).notNull(),
  checkInDate: text("check_in_date"),
  checkOutDate: text("check_out_date"),
  experienceDate: text("experience_date"),
  createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("reservations_resource_id_idx").on(table.resourceId),
  index("reservations_resource_type_idx").on(table.resourceType),
  index("reservations_status_idx").on(table.status),
  index("reservations_reserved_until_idx").on(table.reservedUntil),
  index("reservations_combo_resource_status_idx").on(table.resourceId, table.resourceType, table.status),
  index("reservations_combo_stay_dates_idx").on(table.resourceId, table.checkInDate, table.checkOutDate),
  index("reservations_combo_exp_date_idx").on(table.resourceId, table.experienceDate)
]);

// Define 'webhook_events' table for payment idempotency
export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  webhookEventId: text("webhook_event_id").unique().notNull(),
  processedAt: timestamp("processed_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("webhook_events_evt_id_idx").on(table.webhookEventId)
]);

// Define 'price_change_audits' table for pricing auditable logs
export const priceChangeAudits = pgTable("price_change_audits", {
  id: serial("id").primaryKey(),
  stayId: text("stay_id").references(() => stays.id, { onDelete: "cascade" }),
  experienceId: text("experience_id").references(() => experiences.id, { onDelete: "cascade" }),
  previousValue: doublePrecision("previous_value").notNull(),
  newValue: doublePrecision("new_value").notNull(),
  adminUserId: text("admin_user_id"),
  timestamp: timestamp("timestamp", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  correlationId: text("correlation_id").notNull(),
}, (table) => [
  index("price_audits_timestamp_idx").on(table.timestamp)
]);

// Define relationships.
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

export const waitlistsRelations = relations(waitlists, ({ one }) => ({
  experience: one(experiences, {
    fields: [waitlists.experienceId],
    references: [experiences.id],
  }),
}));

export const inquiries = pgTable("inquiries", {
  inquiryId: text("inquiry_id").primaryKey(),
  inquiryType: text("inquiry_type").notNull(),
  listingId: text("listing_id"),
  listingTitle: text("listing_title").notNull(),
  category: text("category"),
  roomName: text("room_name"),
  experienceName: text("experience_name"),
  selectedDate: text("selected_date"),
  selectedDates: jsonb("selected_dates"),
  guestCount: integer("guest_count").default(1),
  visitorCount: integer("visitor_count"),
  selectedAddons: jsonb("selected_addons"),
  sourcePage: text("source_page"),
  deviceType: text("device_type"),
  userAgent: text("user_agent"),
  inquiryStatus: text("inquiry_status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  leadSource: text("lead_source"),
  campaignSource: text("campaign_source"),
  campaignMedium: text("campaign_medium"),
  campaignName: text("campaign_name"),
  email: text("email"),
}, (table) => [
  index("inquiries_inquiry_status_idx").on(table.inquiryStatus),
  index("inquiries_created_at_idx").on(table.createdAt),
  index("inquiries_inquiry_type_idx").on(table.inquiryType),
  index("inquiries_source_page_idx").on(table.sourcePage),
  index("inquiries_listing_id_idx").on(table.listingId),
]);

