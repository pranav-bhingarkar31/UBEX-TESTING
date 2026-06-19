import { pgTable, text, integer, timestamp, doublePrecision, uuid, pgEnum, index, unique, serial } from "drizzle-orm/pg-core";
import { stays, experiences } from "./schema";

/**
 * @file media_schema.ts
 * @description Production-grade Media Storage Metadata schema for UbEx DAM.
 * Fully compatible with PostgreSQL and Drizzle-ORM. Built for scale.
 */

// 1. Lifecycle Gating State Enum matching Enterprise Workflow standard
export const lifecycleStageEnum = pgEnum("lifecycle_stage", [
  "RAW",        // Direct camera uploads
  "REVIEW",     // Under administrative quality review
  "APPROVED",   // Reviewed, passed initial QC
  "EDITED",     // Filtered and cropped by content editors
  "OPTIMIZED",  // Resized, compressed formats (WebP/AVIF)
  "PUBLISHED",  // Staged and rendered globally on live catalog pages
  "ARCHIVED"    // Deprecated, historical backup, or replaced
]);

// 2. Room Type Scope Identifier Enum
export const roomTypeScopeEnum = pgEnum("room_type_scope", [
  "dorm",
  "private-room",
  "premium-room",
  "suite",
  "villa",
  "none"        // Catch-all for non-stay assets (lobby, dining, locations)
]);

// 3. Core Media Assets Catalog Database
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: text("property_id").references(() => stays.id, { onDelete: "set null" }),
  experienceId: text("experience_id").references(() => experiences.id, { onDelete: "set null" }),
  roomType: roomTypeScopeEnum("room_type").default("none").notNull(),
  category: text("category").default("unassigned").notNull(), // e.g. "lobby", "bathroom", "amenities", "outdoor"
  title: text("title").notNull(),
  altText: text("alt_text"),
  sourceFilePath: text("source_file_path").notNull(), // Original high-res R2 master key
  fileSize: integer("file_size").notNull(), // Bytes
  dimensions: text("dimensions").notNull(), // "5760x3840"
  mimeType: text("mime_type").notNull(), // "image/jpeg", "video/mp4"
  lifecycleStage: lifecycleStageEnum("lifecycle_stage").default("RAW").notNull(),
  
  // Scoring, rankings, & sorting metrics
  heroRank: integer("hero_rank").default(0).notNull(), // Display order weight (1 = primary listing image)
  aiScore: doublePrecision("ai_score").default(0.0).notNull(), // 0.0 to 10.0 quality valuation score
  aiPredictions: text("ai_predictions"), // JSON stringified prediction metrics (labels, brightness analysis)
  
  // Timestamp audits
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index("media_assets_property_room_idx").on(table.propertyId, table.roomType, table.lifecycleStage),
  index("media_assets_experience_idx").on(table.experienceId, table.lifecycleStage),
  index("media_assets_hero_idx").on(table.propertyId, table.heroRank)
]);

// 4. Media Variants Database (Handles resizing variants, low quality blur hashes, and viewports)
export const mediaVariants = pgTable("media_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
  variantName: text("variant_name").notNull(), // "desktop_hero", "mobile_hero", "thumbnail", "blur_hash"
  filePath: text("file_path").notNull(), // Resolution specific target R2 Key
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  unique("media_variants_asset_name_unq").on(table.assetId, table.variantName),
  index("media_variants_asset_idx").on(table.assetId)
]);

// 5. Media Tags Table (Supports multi-indexed tag filters, search queries & AI labels)
export const mediaTags = pgTable("media_tags", {
  id: serial("id").primaryKey(),
  assetId: uuid("asset_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
  tagName: text("tag_name").notNull(),
  confidence: doublePrecision("confidence").default(1.0).notNull() // Manual tagging has weight of 1.0; AI models output confidence score
}, (table) => [
  unique("media_tags_asset_tag_unq").on(table.assetId, table.tagName),
  index("media_tags_name_idx").on(table.tagName)
]);
