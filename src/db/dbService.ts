import { getDb, getPool } from "./dbClient";
import { localDb } from "./index";
import * as schema from "./schema";
import { eq, like, or } from "drizzle-orm";

export interface StayInput {
  title: string;
  category: "Luxury" | "Family" | "Workation" | "Dorm" | "Long-Stay";
  image: string;
  description: string;
  price: string;
  priceValue: number;
  capacity: number;
  features: string[];
}

export interface ExperienceInput {
  title: string;
  category: string;
  price: string;
  description: string;
  longDescription: string;
  mainImage: string;
  galleryImages: string[];
  duration: string;
  meetingPoint: string;
  minAge: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  inclusions: string[];
  exclusions: string[];
  timings: string[];
  variants: any[];
  capacity: number;
}

export interface BookingModifyInput {
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  arrivalTime?: string;
  specialNotes?: string;
  status?: "Pending" | "Confirmed" | "Completed" | "Cancelled";
}

let schemaInitialized = false;
let localDbLockPromise: Promise<any> = Promise.resolve();


// Auto-initialize PostgreSQL tables and seed data if PG is available
export async function initializePostgresDatabase() {
  if (schemaInitialized) return;
  const pool = getPool();
  
  // Skip if we are running in local JSON fallback mode
  if (pool.fallbackMode) {
    console.log("[DB SERVICE] Running in high-fidelity JSON fallback mode. Skipping PG schema setup.");
    schemaInitialized = true;
    return;
  }

  try {
    const client = await pool.connect();
    try {
      console.log("[DB SERVICE] Initializing PostgreSQL schemas with production-grade Enums...");

      // 1. Create Enums if they do not exist
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
            CREATE TYPE user_status AS ENUM ('Active', 'Suspended', 'Inactive');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stay_category') THEN
            CREATE TYPE stay_category AS ENUM ('Luxury', 'Family', 'Workation', 'Dorm', 'Long-Stay');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
            CREATE TYPE difficulty AS ENUM ('Easy', 'Moderate', 'Challenging');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
            CREATE TYPE booking_status AS ENUM ('Pending', 'Confirmed', 'Completed', 'Cancelled');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
            CREATE TYPE refund_status AS ENUM ('NotRefunded', 'Refunded', 'Failed', 'Processing');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waitlist_status') THEN
            CREATE TYPE waitlist_status AS ENUM ('Pending', 'Promoted', 'Cancelled');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
            CREATE TYPE reservation_status AS ENUM ('Pending', 'Confirmed', 'Expired');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_category') THEN
            CREATE TYPE experience_category AS ENUM ('Adventure', 'Trekking', 'WaterSports', 'Sightseeing', 'Camping', 'Cultural');
          END IF;
        END $$;
      `);

      // 2. Create tables using raw SQL DDL for absolute robustness
      await client.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" SERIAL PRIMARY KEY,
          "uid" TEXT NOT NULL UNIQUE,
          "email" TEXT NOT NULL,
          "name" TEXT,
          "first_name" TEXT,
          "last_name" TEXT,
          "phone" TEXT,
          "status" user_status NOT NULL DEFAULT 'Active',
          "passport_level" INTEGER NOT NULL DEFAULT 1,
          "is_verified" BOOLEAN NOT NULL DEFAULT false,
          "created_at" TIMESTAMP DEFAULT NOW()
        );
      `);

      // Ensure that users table has email as unique
      await client.query(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq_idx ON "users"("email");
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "stays" (
          "id" TEXT PRIMARY KEY,
          "title" TEXT NOT NULL,
          "category" stay_category NOT NULL,
          "image" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "price" TEXT NOT NULL,
          "price_value" DOUBLE PRECISION NOT NULL,
          "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
          "features" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "is_archived" BOOLEAN NOT NULL DEFAULT false,
          "capacity" INTEGER NOT NULL,
          "blocked_dates" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "maintenance_dates" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "dynamic_price_override" DOUBLE PRECISION
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "experiences" (
          "id" TEXT PRIMARY KEY,
          "category" experience_category NOT NULL,
          "title" TEXT NOT NULL,
          "price" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "long_description" TEXT NOT NULL,
          "main_image" TEXT NOT NULL,
          "gallery_images" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "duration" TEXT NOT NULL,
          "meeting_point" TEXT NOT NULL,
          "min_age" TEXT NOT NULL,
          "difficulty" difficulty NOT NULL,
          "inclusions" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "exclusions" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "timings" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "faqs" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "variants" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "is_archived" BOOLEAN NOT NULL DEFAULT false,
          "capacity" INTEGER NOT NULL,
          "scheduled_dates" JSONB NOT NULL DEFAULT '[]'::jsonb
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "bookings" (
          "id" SERIAL PRIMARY KEY,
          "booking_id" TEXT NOT NULL UNIQUE,
          "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
          "guest_name" TEXT NOT NULL,
          "guest_phone" TEXT NOT NULL,
          "guest_email" TEXT NOT NULL,
          "country" TEXT,
          "arrival_time" TEXT,
          "travel_purpose" TEXT,
          "special_notes" TEXT,
          "marketing_consent" BOOLEAN DEFAULT false,
          "payment_type" TEXT NOT NULL,
          "selected_addons" JSONB DEFAULT '[]'::jsonb,
          "cart_stays" JSONB DEFAULT '[]'::jsonb,
          "cart_experiences" JSONB DEFAULT '[]'::jsonb,
          "amount_payable" DOUBLE PRECISION NOT NULL,
          "amount_paid" DOUBLE PRECISION NOT NULL,
          "amount_remaining" DOUBLE PRECISION NOT NULL,
          "currency" TEXT NOT NULL,
          "status" booking_status NOT NULL DEFAULT 'Pending',
          "status_date" TIMESTAMP WITH TIME ZONE,
          "razorpay_order_id" TEXT,
          "razorpay_payment_id" TEXT,
          "razorpay_signature" TEXT,
          "refund_status" refund_status DEFAULT 'NotRefunded',
          "refund_transaction_id" TEXT,
          "refund_amount" DOUBLE PRECISION,
          "refund_timestamp" TIMESTAMP WITH TIME ZONE,
          "refund_reason" TEXT,
          "created_at" TIMESTAMP DEFAULT NOW()
        );
      `);

      // Upgrade existing bookings tables dynamically
      await client.query(`
        ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "refund_amount" DOUBLE PRECISION;
        ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "refund_timestamp" TIMESTAMP WITH TIME ZONE;
        ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "refund_reason" TEXT;
      `);

      // Run robust dynamic type upgrades for existing PostgreSQL databases and columns
      await client.query(`
        -- Alter stays rating if it is still text
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'rating' AND data_type = 'text') THEN
            ALTER TABLE "stays" ALTER COLUMN "rating" TYPE DOUBLE PRECISION USING "rating"::double precision;
            ALTER TABLE "stays" ALTER COLUMN "rating" SET DEFAULT 5.0;
          END IF;
        END $$;

        -- Alter experiences category if it is still text
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiences' AND column_name = 'category' AND data_type = 'text') THEN
            ALTER TABLE "experiences" ALTER COLUMN "category" TYPE experience_category USING "category"::experience_category;
          END IF;
        END $$;

        -- Alter bookings status_date to timestamp with timezone
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'status_date' AND data_type = 'text') THEN
            ALTER TABLE "bookings" ALTER COLUMN "status_date" TYPE TIMESTAMP WITH TIME ZONE USING "status_date"::timestamp with time zone;
          END IF;
        END $$;
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "waitlists" (
          "id" SERIAL PRIMARY KEY,
          "experience_id" TEXT REFERENCES "experiences"("id") ON DELETE CASCADE NOT NULL,
          "guest_name" TEXT NOT NULL,
          "guest_email" TEXT NOT NULL,
          "guest_phone" TEXT NOT NULL,
          "requested_date" TEXT NOT NULL,
          "status" waitlist_status NOT NULL DEFAULT 'Pending',
          "created_at" TIMESTAMP DEFAULT NOW()
        );
      `);

      // Enforce DB unique constraint on waitlists
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS waitlist_experience_email_date_uq_idx ON "waitlists"("experience_id", "guest_email", "requested_date");
      `);

      // Create new table inventory_reservations for transient locks
      await client.query(`
        CREATE TABLE IF NOT EXISTS "inventory_reservations" (
          "id" SERIAL PRIMARY KEY,
          "resource_id" TEXT NOT NULL,
          "resource_type" TEXT NOT NULL,
          "booking_id" TEXT,
          "reserved_until" TIMESTAMP WITH TIME ZONE NOT NULL,
          "status" reservation_status NOT NULL DEFAULT 'Pending',
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "check_in_date" TEXT,
          "check_out_date" TEXT,
          "experience_date" TEXT,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);

      // Alter inventory_reservations columns on existing setups
      await client.query(`
        ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "check_in_date" TEXT;
        ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "check_out_date" TEXT;
        ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "experience_date" TEXT;
      `);

      // Create new table webhook_events for idempotency
      await client.query(`
        CREATE TABLE IF NOT EXISTS "webhook_events" (
          "id" SERIAL PRIMARY KEY,
          "webhook_event_id" TEXT NOT NULL UNIQUE,
          "processed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);

      // Create pricing audit trails table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "price_change_audits" (
          "id" SERIAL PRIMARY KEY,
          "stay_id" TEXT,
          "experience_id" TEXT,
          "previous_value" DOUBLE PRECISION NOT NULL,
          "new_value" DOUBLE PRECISION NOT NULL,
          "admin_user_id" TEXT,
          "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          "correlation_id" TEXT NOT NULL
        );
      `);

      // Create sequence definitions for sequential inquiry ID generation
      await client.query('CREATE SEQUENCE IF NOT EXISTS "ubex_stay_seq" START WITH 1001;');
      await client.query('CREATE SEQUENCE IF NOT EXISTS "ubex_experience_seq" START WITH 2001;');
      await client.query('CREATE SEQUENCE IF NOT EXISTS "ubex_wellness_seq" START WITH 3001;');
      await client.query('CREATE SEQUENCE IF NOT EXISTS "ubex_community_seq" START WITH 4001;');
      await client.query('CREATE SEQUENCE IF NOT EXISTS "ubex_corporate_seq" START WITH 5001;');

      // Create inquiries table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "inquiries" (
          "inquiry_id" TEXT PRIMARY KEY,
          "inquiry_type" TEXT NOT NULL,
          "listing_id" TEXT,
          "listing_title" TEXT NOT NULL,
          "category" TEXT,
          "room_name" TEXT,
          "experience_name" TEXT,
          "selected_date" TEXT,
          "selected_dates" JSONB,
          "guest_count" INTEGER DEFAULT 1,
          "visitor_count" INTEGER,
          "selected_addons" JSONB,
          "source_page" TEXT,
          "device_type" TEXT,
          "user_agent" TEXT,
          "inquiry_status" TEXT DEFAULT 'pending' NOT NULL,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "lead_source" TEXT,
          "campaign_source" TEXT,
          "campaign_medium" TEXT,
          "campaign_name" TEXT,
          "email" TEXT
        );
      `);

      // Create indexes for performance tuning
      await client.query('CREATE INDEX IF NOT EXISTS "inquiries_inquiry_status_idx" ON "inquiries" ("inquiry_status");');
      await client.query('CREATE INDEX IF NOT EXISTS "inquiries_created_at_idx" ON "inquiries" ("created_at");');
      await client.query('CREATE INDEX IF NOT EXISTS "inquiries_inquiry_type_idx" ON "inquiries" ("inquiry_type");');
      await client.query('CREATE INDEX IF NOT EXISTS "inquiries_source_page_idx" ON "inquiries" ("source_page");');
      await client.query('CREATE INDEX IF NOT EXISTS "inquiries_listing_id_idx" ON "inquiries" ("listing_id");');

      console.log("[DB SERVICE] PostgreSQL tables and production-grade enums checked/created/altered.");

      // Seed core elements if table is empty
      const staysCountRes = await client.query('SELECT COUNT(*) FROM "stays";');
      if (parseInt(staysCountRes.rows[0].count, 10) === 0) {
        console.log("[DB SERVICE] Seeding Stays into PG database...");
        const defaultStays = localDb.getStays();
        for (const stay of defaultStays) {
          await client.query(
            `INSERT INTO "stays" (id, title, category, image, description, price, price_value, rating, features, is_archived, capacity, blocked_dates, maintenance_dates, dynamic_price_override)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
            [
              stay.id, stay.title, stay.category, stay.image, stay.description, stay.price, stay.priceValue,
              stay.rating || "5.00", JSON.stringify(stay.features || []), stay.isArchived || false, stay.capacity || 10,
              JSON.stringify(stay.blockedDates || []), JSON.stringify(stay.maintenanceDates || []), stay.dynamicPriceOverride || null
            ]
          );
        }
      }

      const expCountRes = await client.query('SELECT COUNT(*) FROM "experiences";');
      if (parseInt(expCountRes.rows[0].count, 10) === 0) {
        console.log("[DB SERVICE] Seeding Experiences into PG database...");
        const defaultExps = localDb.getExperiences();
        for (const exp of defaultExps) {
          await client.query(
            `INSERT INTO "experiences" (id, category, title, price, description, long_description, main_image, gallery_images, duration, meeting_point, min_age, difficulty, inclusions, exclusions, timings, faqs, variants, is_archived, capacity, scheduled_dates)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20);`,
            [
              exp.id, exp.category, exp.title, exp.price, exp.description, exp.longDescription, exp.mainImage,
              JSON.stringify(exp.galleryImages || []), exp.duration, exp.meetingPoint, exp.minAge, exp.difficulty,
              JSON.stringify(exp.inclusions || []), JSON.stringify(exp.exclusions || []), JSON.stringify(exp.timings || []),
              JSON.stringify(exp.faqs || []), JSON.stringify(exp.variants || []), exp.isArchived || false, exp.capacity || 15,
              JSON.stringify(exp.scheduledDates || [])
            ]
          );
        }
      }

      const usersCountRes = await client.query('SELECT COUNT(*) FROM "users";');
      if (parseInt(usersCountRes.rows[0].count, 10) === 0) {
        console.log("[DB SERVICE] Seeding Users into PG database...");
        const defaultUsers = localDb.getUsers();
        for (const user of defaultUsers) {
          await client.query(
            `INSERT INTO "users" (id, uid, email, name, first_name, last_name, phone, status, passport_level, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
            [
              user.id, user.uid, user.email, user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              user.firstName || null, user.lastName || null, user.phone || null, user.status || "Active",
              user.passportLevel || 1, user.isVerified || false
            ]
          );
        }
      }

      const bookingsCountRes = await client.query('SELECT COUNT(*) FROM "bookings";');
      if (parseInt(bookingsCountRes.rows[0].count, 10) === 0) {
        console.log("[DB SERVICE] Seeding Bookings into PG database...");
        const defaultBookings = localDb.getBookings();
        for (const booking of defaultBookings) {
          await client.query(
            `INSERT INTO "bookings" (id, booking_id, user_id, guest_name, guest_phone, guest_email, country, arrival_time, travel_purpose, special_notes, marketing_consent, payment_type, selected_addons, cart_stays, cart_experiences, amount_payable, amount_paid, amount_remaining, currency, status, status_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21);`,
            [
              booking.id, booking.bookingId, booking.userId, booking.guestName, booking.guestPhone, booking.guestEmail,
              booking.country, booking.arrivalTime, booking.travelPurpose, booking.specialNotes, booking.marketingConsent,
              booking.paymentType, JSON.stringify(booking.selectedAddons || []), JSON.stringify(booking.cartStays || []),
              JSON.stringify(booking.cartExperiences || []), booking.amountPayable, booking.amountPaid, booking.amountRemaining,
              booking.currency, booking.status || "Confirmed", booking.statusDate || new Date().toISOString()
            ]
          );
        }
      }

      console.log("[DB SERVICE] Seeding completed successfully.");
    } finally {
      client.release();
    }
    schemaInitialized = true;
  } catch (err) {
    console.error("[DB SERVICE] Auto-setup of PostgreSQL schema failed:", err);
  }
}

// Check database mode helper
function isPostgresActive(): boolean {
  return !getPool().fallbackMode;
}

export const DbService = {
  // ==========================================
  // STAYS REPOSITORY
  // ==========================================
  async getStays(includeArchived: boolean = true) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      let queryRes: any[];
      if (!includeArchived) {
        queryRes = await db.select().from(schema.stays).where(eq(schema.stays.isArchived, false));
      } else {
        queryRes = await db.select().from(schema.stays);
      }
      return queryRes.map(row => ({
        ...row,
        features: typeof row.features === "string" ? JSON.parse(row.features) : row.features,
        blockedDates: typeof row.blockedDates === "string" ? JSON.parse(row.blockedDates) : row.blockedDates,
        maintenanceDates: typeof row.maintenanceDates === "string" ? JSON.parse(row.maintenanceDates) : row.maintenanceDates,
      }));
    } else {
      const stays = localDb.getStays();
      return !includeArchived ? stays.filter((s: any) => !s.isArchived) : stays;
    }
  },

  async getStayById(id: string) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const results = await db.select().from(schema.stays).where(eq(schema.stays.id, id));
      if (results.length === 0) return null;
      const row = results[0];
      return {
        ...row,
        features: typeof row.features === "string" ? JSON.parse(row.features) : row.features,
        blockedDates: typeof row.blockedDates === "string" ? JSON.parse(row.blockedDates) : row.blockedDates,
        maintenanceDates: typeof row.maintenanceDates === "string" ? JSON.parse(row.maintenanceDates) : row.maintenanceDates,
      };
    } else {
      const stays = localDb.getStays();
      return stays.find((s: any) => s.id === id) || null;
    }
  },

  async createStay(data: any) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const newStay = {
        id: data.id || "stay-" + Date.now(),
        title: data.title,
        category: data.category,
        image: data.image,
        description: data.description,
        price: data.price,
        priceValue: data.priceValue,
        rating: data.rating || "5.00",
        features: data.features || [],
        isArchived: false,
        capacity: data.capacity || 10,
        blockedDates: data.blockedDates || [],
        maintenanceDates: data.maintenanceDates || [],
        dynamicPriceOverride: data.dynamicPriceOverride || null
      };
      await db.insert(schema.stays).values(newStay);
      return newStay;
    } else {
      const stays = localDb.getStays();
      const newStay = {
        id: data.id || "stay-" + Date.now(),
        ...data,
        rating: data.rating || "5.00",
        isArchived: false,
        blockedDates: data.blockedDates || [],
        maintenanceDates: data.maintenanceDates || [],
        dynamicPriceOverride: data.dynamicPriceOverride || null
      };
      stays.push(newStay);
      localDb.saveStays(stays);
      return newStay;
    }
  },

  async updateStay(id: string, data: any) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const cleanUpdate: any = {};
      if (data.title !== undefined) cleanUpdate.title = data.title;
      if (data.category !== undefined) cleanUpdate.category = data.category;
      if (data.image !== undefined) cleanUpdate.image = data.image;
      if (data.description !== undefined) cleanUpdate.description = data.description;
      if (data.price !== undefined) cleanUpdate.price = data.price;
      if (data.priceValue !== undefined) cleanUpdate.priceValue = data.priceValue;
      if (data.rating !== undefined) cleanUpdate.rating = data.rating;
      if (data.features !== undefined) cleanUpdate.features = data.features;
      if (data.isArchived !== undefined) cleanUpdate.isArchived = data.isArchived;
      if (data.capacity !== undefined) cleanUpdate.capacity = data.capacity;
      if (data.blockedDates !== undefined) cleanUpdate.blockedDates = data.blockedDates;
      if (data.maintenanceDates !== undefined) cleanUpdate.maintenanceDates = data.maintenanceDates;
      if (data.dynamicPriceOverride !== undefined) cleanUpdate.dynamicPriceOverride = data.dynamicPriceOverride;

      await db.update(schema.stays).set(cleanUpdate).where(eq(schema.stays.id, id));
      return await this.getStayById(id);
    } else {
      const stays = localDb.getStays();
      const idx = stays.findIndex((s: any) => s.id === id);
      if (idx === -1) throw new Error(`Stay ${id} not found.`);
      stays[idx] = { ...stays[idx], ...data };
      localDb.saveStays(stays);
      return stays[idx];
    }
  },

  async deleteStay(id: string) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      await db.delete(schema.stays).where(eq(schema.stays.id, id));
    } else {
      const stays = localDb.getStays();
      const idx = stays.findIndex((s: any) => s.id === id);
      if (idx === -1) throw new Error(`Stay ${id} not found.`);
      stays.splice(idx, 1);
      localDb.saveStays(stays);
    }
  },

  // ==========================================
  // EXPERIENCES REPOSITORY
  // ==========================================
  async getExperiences(includeArchived: boolean = true) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      let queryRes: any[];
      if (!includeArchived) {
        queryRes = await db.select().from(schema.experiences).where(eq(schema.experiences.isArchived, false));
      } else {
        queryRes = await db.select().from(schema.experiences);
      }
      return queryRes.map(row => ({
        ...row,
        galleryImages: typeof row.galleryImages === "string" ? JSON.parse(row.galleryImages) : row.galleryImages,
        inclusions: typeof row.inclusions === "string" ? JSON.parse(row.inclusions) : row.inclusions,
        exclusions: typeof row.exclusions === "string" ? JSON.parse(row.exclusions) : row.exclusions,
        timings: typeof row.timings === "string" ? JSON.parse(row.timings) : row.timings,
        faqs: typeof row.faqs === "string" ? JSON.parse(row.faqs) : row.faqs,
        variants: typeof row.variants === "string" ? JSON.parse(row.variants) : row.variants,
        scheduledDates: typeof row.scheduledDates === "string" ? JSON.parse(row.scheduledDates) : row.scheduledDates,
      }));
    } else {
      const exps = localDb.getExperiences();
      return !includeArchived ? exps.filter((e: any) => !e.isArchived) : exps;
    }
  },

  async getExperienceById(id: string) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const results = await db.select().from(schema.experiences).where(eq(schema.experiences.id, id));
      if (results.length === 0) return null;
      const row = results[0];
      return {
        ...row,
        galleryImages: typeof row.galleryImages === "string" ? JSON.parse(row.galleryImages) : row.galleryImages,
        inclusions: typeof row.inclusions === "string" ? JSON.parse(row.inclusions) : row.inclusions,
        exclusions: typeof row.exclusions === "string" ? JSON.parse(row.exclusions) : row.exclusions,
        timings: typeof row.timings === "string" ? JSON.parse(row.timings) : row.timings,
        faqs: typeof row.faqs === "string" ? JSON.parse(row.faqs) : row.faqs,
        variants: typeof row.variants === "string" ? JSON.parse(row.variants) : row.variants,
        scheduledDates: typeof row.scheduledDates === "string" ? JSON.parse(row.scheduledDates) : row.scheduledDates,
      };
    } else {
      const exps = localDb.getExperiences();
      return exps.find((e: any) => e.id === id) || null;
    }
  },

  async createExperience(data: any) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const newExp = {
        id: data.id || "exp-" + Date.now(),
        category: data.category,
        title: data.title,
        price: data.price,
        description: data.description,
        longDescription: data.longDescription || data.description,
        mainImage: data.mainImage,
        galleryImages: data.galleryImages || [],
        duration: data.duration,
        meetingPoint: data.meetingPoint,
        minAge: data.minAge,
        difficulty: data.difficulty || "Moderate",
        inclusions: data.inclusions || [],
        exclusions: data.exclusions || [],
        timings: data.timings || [],
        faqs: data.faqs || [],
        variants: data.variants || [],
        isArchived: false,
        capacity: data.capacity || 15,
        scheduledDates: data.scheduledDates || []
      };
      await db.insert(schema.experiences).values(newExp);
      return newExp;
    } else {
      const exps = localDb.getExperiences();
      const newExp = {
        id: data.id || "exp-" + Date.now(),
        ...data,
        isArchived: false,
        faqs: data.faqs || [],
        scheduledDates: data.scheduledDates || []
      };
      exps.push(newExp);
      localDb.saveExperiences(exps);
      return newExp;
    }
  },

  async updateExperience(id: string, data: any) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const cleanUpdate: any = {};
      if (data.category !== undefined) cleanUpdate.category = data.category;
      if (data.title !== undefined) cleanUpdate.title = data.title;
      if (data.price !== undefined) cleanUpdate.price = data.price;
      if (data.description !== undefined) cleanUpdate.description = data.description;
      if (data.longDescription !== undefined) cleanUpdate.longDescription = data.longDescription;
      if (data.mainImage !== undefined) cleanUpdate.mainImage = data.mainImage;
      if (data.galleryImages !== undefined) cleanUpdate.galleryImages = data.galleryImages;
      if (data.duration !== undefined) cleanUpdate.duration = data.duration;
      if (data.meetingPoint !== undefined) cleanUpdate.meetingPoint = data.meetingPoint;
      if (data.minAge !== undefined) cleanUpdate.minAge = data.minAge;
      if (data.difficulty !== undefined) cleanUpdate.difficulty = data.difficulty;
      if (data.inclusions !== undefined) cleanUpdate.inclusions = data.inclusions;
      if (data.exclusions !== undefined) cleanUpdate.exclusions = data.exclusions;
      if (data.timings !== undefined) cleanUpdate.timings = data.timings;
      if (data.faqs !== undefined) cleanUpdate.faqs = data.faqs;
      if (data.variants !== undefined) cleanUpdate.variants = data.variants;
      if (data.isArchived !== undefined) cleanUpdate.isArchived = data.isArchived;
      if (data.capacity !== undefined) cleanUpdate.capacity = data.capacity;
      if (data.scheduledDates !== undefined) cleanUpdate.scheduledDates = data.scheduledDates;

      await db.update(schema.experiences).set(cleanUpdate).where(eq(schema.experiences.id, id));
      return await this.getExperienceById(id);
    } else {
      const exps = localDb.getExperiences();
      const idx = exps.findIndex((e: any) => e.id === id);
      if (idx === -1) throw new Error(`Experience ${id} not found.`);
      exps[idx] = { ...exps[idx], ...data };
      localDb.saveExperiences(exps);
      return exps[idx];
    }
  },

  async deleteExperience(id: string) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      await db.delete(schema.experiences).where(eq(schema.experiences.id, id));
    } else {
      const exps = localDb.getExperiences();
      const idx = exps.findIndex((e: any) => e.id === id);
      if (idx === -1) throw new Error(`Experience ${id} not found.`);
      exps.splice(idx, 1);
      localDb.saveExperiences(exps);
    }
  },

  // ==========================================
  // BOOKINGS REPOSITORY
  // ==========================================
  async getBookings() {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const results = await db.select().from(schema.bookings);
      return results.map(row => ({
        ...row,
        selectedAddons: typeof row.selectedAddons === "string" ? JSON.parse(row.selectedAddons) : row.selectedAddons,
        cartStays: typeof row.cartStays === "string" ? JSON.parse(row.cartStays) : row.cartStays,
        cartExperiences: typeof row.cartExperiences === "string" ? JSON.parse(row.cartExperiences) : row.cartExperiences,
      }));
    } else {
      return localDb.getBookings();
    }
  },

  async searchBookings(query?: string) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      if (!query) return await this.getBookings();
      const term = `%${query.toLowerCase()}%`;
      const results = await db.select().from(schema.bookings).where(
        or(
          like(schema.bookings.bookingId, term),
          like(schema.bookings.guestName, term),
          like(schema.bookings.guestEmail, term),
          like(schema.bookings.guestPhone, term)
        )
      );
      return results.map(row => ({
        ...row,
        selectedAddons: typeof row.selectedAddons === "string" ? JSON.parse(row.selectedAddons) : row.selectedAddons,
        cartStays: typeof row.cartStays === "string" ? JSON.parse(row.cartStays) : row.cartStays,
        cartExperiences: typeof row.cartExperiences === "string" ? JSON.parse(row.cartExperiences) : row.cartExperiences,
      }));
    } else {
      const list = localDb.getBookings();
      if (!query) return list;
      const term = query.toLowerCase();
      return list.filter((b: any) => 
        b.bookingId.toLowerCase().includes(term) ||
        b.guestEmail.toLowerCase().includes(term) ||
        b.guestName.toLowerCase().includes(term) ||
        b.guestPhone.includes(term)
      );
    }
  },

  async getBookingByBookingId(bookingId: string) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const results = await db.select().from(schema.bookings).where(eq(schema.bookings.bookingId, bookingId));
      if (results.length === 0) return null;
      const row = results[0];
      return {
        ...row,
        selectedAddons: typeof row.selectedAddons === "string" ? JSON.parse(row.selectedAddons) : row.selectedAddons,
        cartStays: typeof row.cartStays === "string" ? JSON.parse(row.cartStays) : row.cartStays,
        cartExperiences: typeof row.cartExperiences === "string" ? JSON.parse(row.cartExperiences) : row.cartExperiences,
      };
    } else {
      const list = localDb.getBookings();
      return list.find((b: any) => b.bookingId === bookingId) || null;
    }
  },

  async createBooking(data: any) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const newBooking = {
        bookingId: data.bookingId,
        userId: data.userId || null,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
        country: data.country || null,
        arrivalTime: data.arrivalTime || null,
        travelPurpose: data.travelPurpose || null,
        specialNotes: data.specialNotes || null,
        marketingConsent: data.marketingConsent || false,
        paymentType: data.paymentType,
        selectedAddons: data.selectedAddons || [],
        cartStays: data.cartStays || [],
        cartExperiences: data.cartExperiences || [],
        amountPayable: Number(data.amountPayable),
        amountPaid: Number(data.amountPaid),
        amountRemaining: Number(data.amountRemaining),
        currency: data.currency,
        status: data.status || "Pending",
        statusDate: data.statusDate ? new Date(data.statusDate) : new Date(),
        razorpayOrderId: data.razorpayOrderId || null,
        razorpayPaymentId: data.razorpayPaymentId || null,
        razorpaySignature: data.razorpaySignature || null,
        refundStatus: data.refundStatus || "NotRefunded",
        refundTransactionId: data.refundTransactionId || null
      };
      const insertedRows = await db.insert(schema.bookings).values(newBooking).returning();
      return {
        ...newBooking,
        id: insertedRows[0]?.id || 1,
        statusDate: newBooking.statusDate.toISOString()
      };
    } else {
      const list = localDb.getBookings();
      const nextId = list.length ? Math.max(...list.map(b => b.id)) + 1 : 1;
      const newBooking = {
        id: nextId,
        bookingId: data.bookingId,
        userId: data.userId || null,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
        country: data.country,
        arrivalTime: data.arrivalTime,
        travelPurpose: data.travelPurpose,
        specialNotes: data.specialNotes,
        marketingConsent: data.marketingConsent || false,
        paymentType: data.paymentType,
        selectedAddons: data.selectedAddons || [],
        cartStays: data.cartStays || [],
        cartExperiences: data.cartExperiences || [],
        amountPayable: Number(data.amountPayable),
        amountPaid: Number(data.amountPaid),
        amountRemaining: Number(data.amountRemaining),
        currency: data.currency,
        createdAt: new Date().toISOString(),
        status: data.status || "Confirmed",
        statusDate: data.statusDate || new Date().toISOString()
      };
      list.push(newBooking);
      localDb.saveBookings(list);
      return newBooking;
    }
  },

  async updateBooking(id: number, data: any) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const cl: any = {};
      if (data.guestName !== undefined) cl.guestName = data.guestName;
      if (data.guestPhone !== undefined) cl.guestPhone = data.guestPhone;
      if (data.guestEmail !== undefined) cl.guestEmail = data.guestEmail;
      if (data.arrivalTime !== undefined) cl.arrivalTime = data.arrivalTime;
      if (data.specialNotes !== undefined) cl.specialNotes = data.specialNotes;
      if (data.status !== undefined) cl.status = data.status;
      if (data.statusDate !== undefined) cl.statusDate = data.statusDate;
      if (data.amountPaid !== undefined) cl.amountPaid = Number(data.amountPaid);
      if (data.amountRemaining !== undefined) cl.amountRemaining = Number(data.amountRemaining);
      if (data.razorpayOrderId !== undefined) cl.razorpayOrderId = data.razorpayOrderId;
      if (data.razorpayPaymentId !== undefined) cl.razorpayPaymentId = data.razorpayPaymentId;
      if (data.razorpaySignature !== undefined) cl.razorpaySignature = data.razorpaySignature;
      if (data.refundStatus !== undefined) cl.refundStatus = data.refundStatus;
      if (data.refundTransactionId !== undefined) cl.refundTransactionId = data.refundTransactionId;

      await db.update(schema.bookings).set(cl).where(eq(schema.bookings.id, id));
      
      const results = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
      const row = results[0];
      return {
        ...row,
        selectedAddons: typeof row.selectedAddons === "string" ? JSON.parse(row.selectedAddons) : row.selectedAddons,
        cartStays: typeof row.cartStays === "string" ? JSON.parse(row.cartStays) : row.cartStays,
        cartExperiences: typeof row.cartExperiences === "string" ? JSON.parse(row.cartExperiences) : row.cartExperiences,
      };
    } else {
      const list = localDb.getBookings();
      const idx = list.findIndex((b: any) => b.id === id);
      if (idx === -1) throw new Error(`Booking ID ${id} not found.`);
      list[idx] = {
        ...list[idx],
        ...data,
        statusDate: data.status ? new Date().toISOString() : list[idx].statusDate
      };
      localDb.saveBookings(list);
      return list[idx];
    }
  },

  // ==========================================
  // WAITLIST REPOSITORY
  // ==========================================
  async getWaitlists() {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      return await db.select().from(schema.waitlists);
    } else {
      // In JSON mode, read from in-memory waitlist inside settings/db
      const db = (localDb as any).readDb ? (localDb as any).readDb() : { waitlists: [] };
      return db.waitlists || [];
    }
  },

  async createWaitlist(data: any) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      const newWait = {
        experienceId: data.experienceId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        requestedDate: data.requestedDate,
        status: data.status || "Pending",
      };
      await db.insert(schema.waitlists).values(newWait);
      return newWait;
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
      const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      if (!d.waitlists) d.waitlists = [];
      const newWait = {
        id: d.waitlists.length + 1,
        ...data,
        status: data.status || "Pending",
        createdAt: new Date().toISOString()
      };
      d.waitlists.push(newWait);
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(d, null, 2), "utf-8");
      return newWait;
    }
  },

  async updateWaitlist(id: number, status: string) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      await db.update(schema.waitlists).set({ status: status as any }).where(eq(schema.waitlists.id, id));
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
      const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      if (!d.waitlists) d.waitlists = [];
      const idx = d.waitlists.findIndex((w: any) => w.id === id);
      if (idx !== -1) {
        d.waitlists[idx].status = status;
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(d, null, 2), "utf-8");
      }
    }
  },

  // ==========================================
  // INQUIRIES REPOSITORY
  // ==========================================
  async createInquiry(data: any) {
    await initializePostgresDatabase();
    const newInquiry = {
      inquiryId: data.inquiryId,
      inquiryType: data.inquiryType,
      listingId: data.listingId || null,
      listingTitle: data.listingTitle,
      category: data.category || null,
      roomName: data.roomName || null,
      experienceName: data.experienceName || null,
      selectedDate: data.selectedDate || null,
      selectedDates: data.selectedDates || null,
      guestCount: data.guestCount || 1,
      visitorCount: data.visitorCount || null,
      selectedAddons: data.selectedAddons || null,
      sourcePage: data.sourcePage || null,
      deviceType: data.deviceType || "Desktop",
      userAgent: data.userAgent || "",
      inquiryStatus: data.inquiryStatus || "pending",
      createdAt: new Date(),
      leadSource: data.leadSource || null,
      campaignSource: data.campaignSource || null,
      campaignMedium: data.campaignMedium || null,
      campaignName: data.campaignName || null,
      email: data.email || null,
    };

    if (isPostgresActive()) {
      const db = getDb();
      await db.insert(schema.inquiries).values({
        ...newInquiry,
        selectedDates: newInquiry.selectedDates ? newInquiry.selectedDates as any : null,
        selectedAddons: newInquiry.selectedAddons ? newInquiry.selectedAddons as any : null,
      });
      return newInquiry;
    } else {
      const inquiries = localDb.getInquiries();
      const inqToSave = {
        ...newInquiry,
        createdAt: newInquiry.createdAt.toISOString()
      };
      inquiries.push(inqToSave);
      localDb.saveInquiries(inquiries);
      return inqToSave;
    }
  },

  async getInquiries() {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      return await db.select().from(schema.inquiries);
    } else {
      return localDb.getInquiries();
    }
  },

  async updateInquiryStatus(inquiryId: string, status: string) {
    await initializePostgresDatabase();
    const typedStatus = status as any;
    if (isPostgresActive()) {
      const db = getDb();
      await db.update(schema.inquiries)
        .set({ inquiryStatus: typedStatus })
        .where(eq(schema.inquiries.inquiryId, inquiryId));
    } else {
      const inquiries = localDb.getInquiries();
      const idx = inquiries.findIndex((inq: any) => inq.inquiryId === inquiryId || inq.inquiry_id === inquiryId);
      if (idx !== -1) {
        inquiries[idx].inquiryStatus = typedStatus;
        localDb.saveInquiries(inquiries);
      }
    }
    return { success: true, inquiryId, status: typedStatus };
  },

  // ==========================================
  // OPTIMIZED QUERIES (Anti-FullTable Scans)
  // ==========================================
  async getOverlappingBookingsCount(stayId: string, checkInStr: string, checkOutStr: string): Promise<number> {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const pool = getPool();
      const checkIn = new Date(checkInStr).toISOString();
      const checkOut = new Date(checkOutStr).toISOString();
      const client = await pool.connect();
      try {
        const res = await client.query(
          `SELECT COUNT(*) FROM "bookings" WHERE ("status" = 'Confirmed' OR "status" = 'Completed') AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof("cart_stays") = 'array' THEN "cart_stays" ELSE '[]'::jsonb END) cs
            WHERE (cs->>'id' = $1 OR cs->>'stayId' = $1) AND
            (LEAST((cs->>'checkOutDate')::text, (cs->>'checkOut')::text)::timestamp > $2::timestamp AND
             GREATEST((cs->>'checkInDate')::text, (cs->>'checkIn')::text)::timestamp < $3::timestamp)
          );`,
          [stayId, checkIn, checkOut]
        );
        return parseInt(res.rows[0].count, 10);
      } catch (err) {
        console.error("SQL dynamic stay booking verification failed, using fallback mapper:", err);
        const bookings = await this.getBookings();
        return bookings.filter((b: any) => {
          if (b.status !== "Confirmed" && b.status !== "Completed") return false;
          const matches = b.cartStays?.filter((cs: any) => cs.id === stayId) || [];
          return matches.some((cs: any) => {
            const bIn = new Date(cs.checkInDate || cs.checkIn);
            const bOut = new Date(cs.checkOutDate || cs.checkOut);
            const checkInDate = new Date(checkInStr);
            const checkOutDate = new Date(checkOutStr);
            return checkInDate < bOut && bIn < checkOutDate;
          });
        }).length;
      } finally {
        client.release();
      }
    } else {
      const bookings = localDb.getBookings();
      return bookings.filter((b: any) => {
        if (b.status !== "Confirmed" && b.status !== "Completed") return false;
        const matches = b.cartStays?.filter((cs: any) => cs.id === stayId) || [];
        return matches.some((cs: any) => {
          const bIn = new Date(cs.checkInDate || cs.checkIn);
          const bOut = new Date(cs.checkOutDate || cs.checkOut);
          const checkInDate = new Date(checkInStr);
          const checkOutDate = new Date(checkOutStr);
          return checkInDate < bOut && bIn < checkOutDate;
        });
      }).length;
    }
  },

  async getExperienceBookedGuests(experienceId: string, dateStr: string): Promise<number> {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        const res = await client.query(
          `SELECT COALESCE(SUM((ce->>'guests')::integer), 0) as total FROM "bookings" WHERE ("status" = 'Confirmed' OR "status" = 'Completed') AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof("cart_experiences") = 'array' THEN "cart_experiences" ELSE '[]'::jsonb END) ce
            WHERE (ce->>'id' = $1 OR ce->>'experienceId' = $1) AND (ce->>'date' LIKE $2 OR ce->>'scheduledDate' LIKE $2)
          );`,
          [experienceId, `${dateStr}%`]
        );
        return parseInt(res.rows[0].total || "0", 10);
      } catch (err) {
        console.error("SQL dynamic experience booking verification failed, using fallback mapper:", err);
        const bookings = await this.getBookings();
        let count = 0;
        for (const b of bookings) {
          if (b.status !== "Confirmed" && b.status !== "Completed") continue;
          const matches = b.cartExperiences?.filter((ce: any) => ce.id === experienceId) || [];
          for (const ce of matches) {
            const itemDateStr = String(ce.date || ce.scheduledDate || b.arrivalTime || "");
            if (itemDateStr.startsWith(dateStr)) {
              count += Number(ce.guests || 1);
            }
          }
        }
        return count;
      } finally {
        client.release();
      }
    } else {
      const bookings = localDb.getBookings();
      let count = 0;
      for (const b of bookings) {
        if (b.status !== "Confirmed" && b.status !== "Completed") continue;
        const matches = b.cartExperiences?.filter((ce: any) => ce.id === experienceId) || [];
        for (const ce of matches) {
          const itemDateStr = String(ce.date || ce.scheduledDate || b.arrivalTime || "");
          if (itemDateStr.startsWith(dateStr)) {
            count += Number(ce.guests || 1);
          }
        }
      }
      return count;
    }
  },

  // ==========================================
  // WEBHOOK IDEMPOTENCY SYSTEM (P0 Task)
  // ==========================================
  async checkAndSaveWebhookEvent(eventId: string): Promise<boolean> {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      try {
        await db.insert(schema.webhookEvents).values({ webhookEventId: eventId });
        return true; 
      } catch (err: any) {
        if (err.code === "23505" || String(err.message || "").toLowerCase().includes("unique")) {
          console.log(`[DB SERVICE] Webhook event ${eventId} already inserted (duplicate prevention).`);
          return false;
        }
        console.error("Failed to check/save webhook event status:", err);
        return false; // Fail safe - reject if we can't save/verify!
      }
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
      const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      if (!d.webhookEvents) d.webhookEvents = [];
      if (d.webhookEvents.includes(eventId)) {
        return false;
      }
      d.webhookEvents.push(eventId);
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(d, null, 2), "utf-8");
      return true;
    }
  },

  // ==========================================
  // INVENTORY RESERVATIONS LOCKING (P0 Task)
  // ==========================================
  async createReservation(
    resourceId: string,
    resourceType: string,
    bookingId: string,
    quantity: number = 1,
    durationMinutes: number = 15,
    checkInDate?: string,
    checkOutDate?: string,
    experienceDate?: string
  ) {
    await initializePostgresDatabase();
    const reservedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    if (isPostgresActive()) {
      const db = getDb();
      const newReservation = {
        resourceId,
        resourceType,
        bookingId,
        reservedUntil,
        status: "Pending" as const,
        quantity,
        checkInDate: checkInDate || null,
        checkOutDate: checkOutDate || null,
        experienceDate: experienceDate || null
      };
      await db.insert(schema.inventoryReservations).values(newReservation);
      return newReservation;
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
      const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      if (!d.inventoryReservations) d.inventoryReservations = [];
      const newReservation = {
        id: d.inventoryReservations.length + 1,
        resourceId,
        resourceType,
        bookingId,
        reservedUntil: reservedUntil.toISOString(),
        status: "Pending",
        quantity,
        checkInDate: checkInDate || null,
        checkOutDate: checkOutDate || null,
        experienceDate: experienceDate || null,
        createdAt: new Date().toISOString()
      };
      d.inventoryReservations.push(newReservation);
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(d, null, 2), "utf-8");
      return newReservation;
    }
  },

  async confirmReservation(bookingId: string) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      await db.update(schema.inventoryReservations)
        .set({ status: "Confirmed" as const })
        .where(eq(schema.inventoryReservations.bookingId, bookingId));
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
      const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      if (d.inventoryReservations) {
        d.inventoryReservations.forEach((r: any) => {
          if (r.bookingId === bookingId) {
            r.status = "Confirmed";
          }
        });
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(d, null, 2), "utf-8");
      }
    }
  },

  async getActiveReservationsCount(
    resourceId: string,
    resourceType: string,
    checkInOrDate?: string,
    checkOut?: string
  ): Promise<number> {
    await initializePostgresDatabase();
    const now = new Date();
    if (isPostgresActive()) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        if (resourceType === "stay") {
          const res = await client.query(
            `SELECT COALESCE(SUM("quantity"), 0) as total FROM "inventory_reservations"
             WHERE "resource_id" = $1 AND "resource_type" = 'stay'
               AND "status" = 'Pending' AND "reserved_until" > $2
               AND "check_in_date" < $3 AND "check_out_date" > $4;`,
            [resourceId, now, checkOut || "", checkInOrDate || ""]
          );
          return parseInt(res.rows[0].total, 10);
        } else {
          const res = await client.query(
            `SELECT COALESCE(SUM("quantity"), 0) as total FROM "inventory_reservations"
             WHERE "resource_id" = $1 AND "resource_type" = 'experience'
               AND "status" = 'Pending' AND "reserved_until" > $2
               AND "experience_date" = $3;`,
            [resourceId, now, checkInOrDate || ""]
          );
          return parseInt(res.rows[0].total, 10);
        }
      } catch (err) {
        console.error("SQL active reservation check failed:", err);
        return 0;
      } finally {
        client.release();
      }
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
      if (!fs.existsSync(DB_FILE_PATH)) return 0;
      const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      if (!d.inventoryReservations) return 0;
      return d.inventoryReservations
        .filter((r: any) => {
          if (r.resourceId !== resourceId || r.resourceType !== resourceType || r.status !== "Pending" || new Date(r.reservedUntil) <= now) {
            return false;
          }
          if (resourceType === "stay") {
            return r.checkInDate < (checkOut || "") && r.checkOutDate > (checkInOrDate || "");
          } else {
            return r.experienceDate === checkInOrDate;
          }
        })
        .reduce((sum: number, r: any) => sum + Number(r.quantity || 1), 0);
    }
  },

  async validateAndReserveAtomically(
    cartStays: any[],
    cartExperiences: any[],
    bookingId: string
  ): Promise<{ success: boolean; errors: string[] }> {
    await initializePostgresDatabase();
    
    // First, run lazy holding expirations to free stale resources before checking!
    await this.cleanupExpiredReservations();

    if (isPostgresActive()) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query("BEGIN;");
        
        // Dynamic selective advisory locking on target resource entities
        const resourceIds = [
          ...cartStays.map(s => s.id),
          ...cartExperiences.map(e => e.id)
        ];
        const sortedKeys = Array.from(new Set(resourceIds))
          .map(id => {
            let hash = 0;
            for (let i = 0; i < id.length; i++) {
              hash = (hash << 5) - hash + id.charCodeAt(i);
              hash |= 0;
            }
            return Math.abs(hash);
          })
          .sort((a, b) => a - b);

        for (const key of sortedKeys) {
          await client.query("SELECT pg_advisory_xact_lock($1);", [key]);
        }

        const now = new Date();
        const errors: string[] = [];

        for (const stayItem of cartStays) {
          const stayId = stayItem.id;
          const checkInStr = stayItem.checkInDate;
          const checkOutStr = stayItem.checkOutDate;

          const stayRes = await client.query('SELECT * FROM "stays" WHERE "id" = $1;', [stayId]);
          if (stayRes.rows.length === 0) {
            errors.push(`Stay property ${stayId} not found.`);
            continue;
          }
          const stay = stayRes.rows[0];
          if (stay.is_archived) {
            errors.push(`Stay property ${stay.title} is archived.`);
            continue;
          }

          const checkIn = new Date(checkInStr);
          const checkOut = new Date(checkOutStr);

          const blockedDates = stay.blocked_dates || [];
          for (const bDateStr of blockedDates) {
            const bDate = new Date(bDateStr);
            if (bDate >= checkIn && bDate < checkOut) {
              errors.push(`Stay ${stay.title} is blocked on date ${bDateStr}.`);
            }
          }

          const maintDates = stay.maintenance_dates || [];
          for (const mDateStr of maintDates) {
            const mDate = new Date(mDateStr);
            if (mDate >= checkIn && mDate < checkOut) {
              errors.push(`Stay ${stay.title} is under maintenance on date ${mDateStr}.`);
            }
          }

          const bookingsRes = await client.query('SELECT "cart_stays", "status" FROM "bookings" WHERE "status" = \'Confirmed\' OR "status" = \'Completed\';');
          let overlappingBookingsCount = 0;
          for (const row of bookingsRes.rows) {
            const csList = row.cart_stays || [];
            const matches = csList.filter((cs: any) => cs.id === stayId);
            const isOverlapping = matches.some((cs: any) => {
              const bIn = new Date(cs.checkInDate || cs.checkIn);
              const bOut = new Date(cs.checkOutDate || cs.checkOut);
              return checkIn < bOut && bIn < checkOut;
            });
            if (isOverlapping) {
              overlappingBookingsCount++;
            }
          }

          const reservationsRes = await client.query(
            `SELECT COALESCE(SUM("quantity"), 0) as total FROM "inventory_reservations"
             WHERE "resource_id" = $1 AND "resource_type" = 'stay'
               AND "status" = 'Pending' AND "reserved_until" > $2
               AND "check_in_date" < $3 AND "check_out_date" > $4;`,
            [stayId, now, checkOutStr, checkInStr]
          );
          const activeReservationsCount = parseInt(reservationsRes.rows[0].total || "0", 10);
          
          const bookedAndReservedCount = overlappingBookingsCount + activeReservationsCount;
          if (bookedAndReservedCount >= (stay.capacity || 1)) {
            errors.push(
              `Sold out. Stay ${stay.title} capacity reached (Booked: ${overlappingBookingsCount}, Temporary holds: ${activeReservationsCount}).`
            );
          }
        }

        for (const expItem of cartExperiences) {
          const expId = expItem.id;
          const dateStr = expItem.date;
          const requestedGuests = expItem.guests;

          const expRes = await client.query('SELECT * FROM "experiences" WHERE "id" = $1;', [expId]);
          if (expRes.rows.length === 0) {
            errors.push(`Experience ${expId} not found.`);
            continue;
          }
          const exp = expRes.rows[0];
          if (exp.is_archived) {
            errors.push(`Experience ${exp.title} is archived.`);
            continue;
          }

          const scheduledDates = exp.scheduled_dates || [];
          if (scheduledDates.length > 0 && !scheduledDates.includes(dateStr)) {
            errors.push(`Experience ${exp.title} is not scheduled on ${dateStr}.`);
            continue;
          }

          const bookingsRes = await client.query('SELECT "cart_experiences" FROM "bookings" WHERE "status" = \'Confirmed\' OR "status" = \'Completed\';');
          let bookedCount = 0;
          for (const row of bookingsRes.rows) {
            const ceList = row.cart_experiences || [];
            const matches = ceList.filter((ce: any) => ce.id === expId);
            for (const ce of matches) {
              const itemDateStr = String(ce.date || ce.scheduledDate || "");
              if (itemDateStr.startsWith(dateStr)) {
                bookedCount += Number(ce.guests || 1);
              }
            }
          }

          const reservationsRes = await client.query(
            `SELECT COALESCE(SUM("quantity"), 0) as total FROM "inventory_reservations"
             WHERE "resource_id" = $1 AND "resource_type" = 'experience'
               AND "status" = 'Pending' AND "reserved_until" > $2
               AND "experience_date" = $3;`,
            [expId, now, dateStr]
          );
          const activeReservationsCount = parseInt(reservationsRes.rows[0].total || "0", 10);

          const totalHeldAndBooked = bookedCount + activeReservationsCount;
          const maxCapacity = exp.capacity || 15;
          const remainingSlots = Math.max(0, maxCapacity - totalHeldAndBooked);

          if (remainingSlots < requestedGuests) {
            errors.push(
              `Only ${remainingSlots} slots remaining for ${exp.title} on ${dateStr} (Booked: ${bookedCount}, Temporary holds: ${activeReservationsCount}, Requested: ${requestedGuests} guests).`
            );
          }
        }

        if (errors.length > 0) {
          await client.query("ROLLBACK;");
          return { success: false, errors };
        }

        const reservedUntil = new Date(Date.now() + 15 * 60 * 1000);
        for (const stayItem of cartStays) {
          await client.query(
            `INSERT INTO "inventory_reservations" 
             ("resource_id", "resource_type", "booking_id", "reserved_until", "status", "quantity", "check_in_date", "check_out_date")
             VALUES ($1, 'stay', $2, $3, 'Pending', 1, $4, $5);`,
            [stayItem.id, bookingId, reservedUntil, stayItem.checkInDate, stayItem.checkOutDate]
          );
        }
        for (const expItem of cartExperiences) {
          await client.query(
            `INSERT INTO "inventory_reservations" 
             ("resource_id", "resource_type", "booking_id", "reserved_until", "status", "quantity", "experience_date")
             VALUES ($1, 'experience', $2, $3, 'Pending', $4, $5);`,
            [expItem.id, bookingId, reservedUntil, expItem.guests, expItem.date]
          );
        }

        await client.query("COMMIT;");
        return { success: true, errors: [] };
      } catch (transactionErr: any) {
        await client.query("ROLLBACK;");
        console.error("Atomic check and reservation transaction failed:", transactionErr);
        return { success: false, errors: [transactionErr.message || "Failed to process concurrent checkout safely."] };
      } finally {
        client.release();
      }
    } else {
      const currentLock = localDbLockPromise;
      let resolveLock: (val?: any) => void;
      localDbLockPromise = new Promise(resolve => {
        resolveLock = resolve;
      });
      await currentLock;

      try {
        const fs = await import("fs");
        const path = await import("path");
        const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
        const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));

        const now = new Date();
        const errors: string[] = [];

        for (const stayItem of cartStays) {
          const stayId = stayItem.id;
          const checkInStr = stayItem.checkInDate;
          const checkOutStr = stayItem.checkOutDate;

          const stay = (d.stays || []).find((s: any) => s.id === stayId);
          if (!stay) {
            errors.push(`Stay property ${stayId} not found.`);
            continue;
          }
          if (stay.isArchived) {
            errors.push(`Stay property ${stay.title} is archived.`);
            continue;
          }

          const checkIn = new Date(checkInStr);
          const checkOut = new Date(checkOutStr);

          for (const bDateStr of (stay.blockedDates || [])) {
            const bDate = new Date(bDateStr);
            if (bDate >= checkIn && bDate < checkOut) {
              errors.push(`Stay ${stay.title} is blocked on date ${bDateStr}.`);
            }
          }

          for (const mDateStr of (stay.maintenanceDates || [])) {
            const mDate = new Date(mDateStr);
            if (mDate >= checkIn && mDate < checkOut) {
              errors.push(`Stay ${stay.title} is under maintenance on date ${mDateStr}.`);
            }
          }

          const activeBookings = (d.bookings || []).filter((b: any) => b.status === "Confirmed" || b.status === "Completed");
          let overlappingBookingsCount = 0;
          for (const b of activeBookings) {
            const csList = b.cartStays || [];
            const matches = csList.filter((cs: any) => cs.id === stayId);
            const isOverlapping = matches.some((cs: any) => {
              const bIn = new Date(cs.checkInDate || cs.checkIn);
              const bOut = new Date(cs.checkOutDate || cs.checkOut);
              return checkIn < bOut && bIn < checkOut;
            });
            if (isOverlapping) {
              overlappingBookingsCount++;
            }
          }

          const activeResCount = (d.inventoryReservations || [])
            .filter((r: any) => 
              r.resourceId === stayId &&
              r.resourceType === "stay" &&
              r.status === "Pending" &&
              new Date(r.reservedUntil) > now &&
              r.checkInDate < checkOutStr &&
              r.checkOutDate > checkInStr
            )
            .reduce((sum: number, r: any) => sum + Number(r.quantity || 1), 0);

          const bookedAndReserved = overlappingBookingsCount + activeResCount;
          if (bookedAndReserved >= (stay.capacity || 1)) {
            errors.push(
              `Sold out. Stay ${stay.title} capacity reached (Booked: ${overlappingBookingsCount}, Temporary holds: ${activeResCount}).`
            );
          }
        }

        for (const expItem of cartExperiences) {
          const expId = expItem.id;
          const dateStr = expItem.date;
          const requestedGuests = expItem.guests;

          const exp = (d.experiences || []).find((e: any) => e.id === expId);
          if (!exp) {
            errors.push(`Experience ${expId} not found.`);
            continue;
          }
          if (exp.isArchived) {
            errors.push(`Experience ${exp.title} is archived.`);
            continue;
          }

          const scheduledDates = exp.scheduledDates || [];
          if (scheduledDates.length > 0 && !scheduledDates.includes(dateStr)) {
            errors.push(`Experience ${exp.title} is not scheduled on ${dateStr}.`);
            continue;
          }

          const activeBookings = (d.bookings || []).filter((b: any) => b.status === "Confirmed" || b.status === "Completed");
          let bookedCount = 0;
          for (const b of activeBookings) {
            const ceList = b.cartExperiences || [];
            const matches = ceList.filter((ce: any) => ce.id === expId);
            for (const ce of matches) {
              const itemDateStr = String(ce.date || ce.scheduledDate || "");
              if (itemDateStr.startsWith(dateStr)) {
                bookedCount += Number(ce.guest || ce.guests || 1);
              }
            }
          }

          const activeResCount = (d.inventoryReservations || [])
            .filter((r: any) => 
              r.resourceId === expId &&
              r.resourceType === "experience" &&
              r.status === "Pending" &&
              new Date(r.reservedUntil) > now &&
              r.experienceDate === dateStr
            )
            .reduce((sum: number, r: any) => sum + Number(r.quantity || 1), 0);

          const totalHeldAndBooked = bookedCount + activeResCount;
          const maxCapacity = exp.capacity || 15;
          const remainingSlots = Math.max(0, maxCapacity - totalHeldAndBooked);

          if (remainingSlots < requestedGuests) {
            errors.push(
              `Only ${remainingSlots} slots remaining for ${exp.title} on ${dateStr} (Booked: ${bookedCount}, Temporary holds: ${activeResCount}, Requested: ${requestedGuests} guests).`
            );
          }
        }

        if (errors.length > 0) {
          return { success: false, errors };
        }

        if (!d.inventoryReservations) d.inventoryReservations = [];
        const reservedUntil = new Date(Date.now() + 15 * 60 * 1000);
        
        for (const stayItem of cartStays) {
          d.inventoryReservations.push({
            id: d.inventoryReservations.length + 1,
            resourceId: stayItem.id,
            resourceType: "stay",
            bookingId,
            reservedUntil: reservedUntil.toISOString(),
            status: "Pending",
            quantity: 1,
            checkInDate: stayItem.checkInDate,
            checkOutDate: stayItem.checkOutDate,
            createdAt: new Date().toISOString()
          });
        }
        for (const expItem of cartExperiences) {
          d.inventoryReservations.push({
            id: d.inventoryReservations.length + 1,
            resourceId: expItem.id,
            resourceType: "experience",
            bookingId,
            reservedUntil: reservedUntil.toISOString(),
            status: "Pending",
            quantity: expItem.guests,
            experienceDate: expItem.date,
            createdAt: new Date().toISOString()
          });
        }

        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(d, null, 2), "utf-8");
        return { success: true, errors: [] };
      } finally {
        resolveLock!();
      }
    }
  },

  async cleanupExpiredReservations(): Promise<number> {
    await initializePostgresDatabase();
    const now = new Date();
    if (isPostgresActive()) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        const res = await client.query(
          `UPDATE "inventory_reservations"
           SET "status" = 'Expired'
           WHERE "status" = 'Pending' AND "reserved_until" <= $1;`,
          [now]
        );
        return res.rowCount || 0;
      } catch (err) {
        console.error("[DB SERVICE] Failed to clean up expired PG reservations:", err);
        return 0;
      } finally {
        client.release();
      }
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
      if (!fs.existsSync(DB_FILE_PATH)) return 0;
      const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      if (!d.inventoryReservations) return 0;
      
      let count = 0;
      d.inventoryReservations.forEach((r: any) => {
        if (r.status === "Pending" && new Date(r.reservedUntil) <= now) {
          r.status = "Expired";
          count++;
        }
      });
      if (count > 0) {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(d, null, 2), "utf-8");
      }
      return count;
    }
  },

  async logPriceChange(
    stayId: string | null,
    experienceId: string | null,
    previousValue: number,
    newValue: number,
    adminUserId: string,
    correlationId: string
  ) {
    await initializePostgresDatabase();
    if (isPostgresActive()) {
      const db = getDb();
      await db.insert(schema.priceChangeAudits).values({
        stayId,
        experienceId,
        previousValue,
        newValue,
        adminUserId,
        correlationId,
      });
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
      const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      if (!d.priceChangeAudits) d.priceChangeAudits = [];
      d.priceChangeAudits.push({
        id: d.priceChangeAudits.length + 1,
        stayId,
        experienceId,
        previousValue,
        newValue,
        adminUserId,
        timestamp: new Date().toISOString(),
        correlationId
      });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(d, null, 2), "utf-8");
    }
  },

  async cleanupExpiredWebhookEvents(): Promise<number> {
    await initializePostgresDatabase();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    if (isPostgresActive()) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        const res = await client.query(
          `DELETE FROM "webhook_events" WHERE "processed_at" <= $1;`,
          [ninetyDaysAgo]
        );
        return res.rowCount || 0;
      } catch (err) {
        console.error("[DB SERVICE] Failed to purge older webhook events:", err);
        return 0;
      } finally {
        client.release();
      }
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");
      if (!fs.existsSync(DB_FILE_PATH)) return 0;
      const d = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      if (!d.webhookEvents) return 0;
      if (d.webhookEvents.length > 500) {
        const oldLength = d.webhookEvents.length;
        d.webhookEvents = d.webhookEvents.slice(-500);
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(d, null, 2), "utf-8");
        return oldLength - 500;
      }
      return 0;
    }
  }
};
