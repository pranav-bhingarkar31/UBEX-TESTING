# UBEX ENTERPRISE DIGITAL ASSET MANAGEMENT (DAM) & MEDIA ARCHITECTURE
### Standard Enterprise Media Storage Specification for Stays, Experiences, and Marketing Assets

This document specifies the professional, enterprise-grade media architecture designed for **UbEx** as it transitions into Public Beta and prepares to scale to **10,000+ properties, 500,000+ high-definition images, and 100,000+ video assets**. 

As property owners will not upload media initially, this architecture is optimized for a **centralized media operations team** to collect, select, edit, optimize, and publish assets with future extension capabilities for AI scoring, automated resizing, and eventual owner/guest uploads.

---

## 1. System Topology & Storage Stack

```
                                  +-------------------+
                                  |   UbEx Admin OS   | (Centralized Ops)
                                  +---------+---------+
                                            |
                                            v (Direct Presigned Uploads)
+-----------------------+         +---------+---------+         +-----------------------+
|  Cloudflare R2 (DAM)  |<=======>|  Express API Server |<=======>| PostgreSQL Database  |
|  - High Performance   |         |  - Metadata Sync  |         | (Metadata & Catalog)  |
|  - Zero Egress Fees   |         |  - Presigned URLs |         | - `media_assets`      |
|  - S3-Compatible      |         |  - Lifecycle Gating|        | - `media_variants`    |
+-----------+-----------+         +-------------------+         +-----------------------+
            |
            v
+-----------------------+
|  Cloudflare Image CDN | (Global Caching, Format Negotiation, On-the-fly resizing)
+-----------+-----------+
            |
            v
+-----------+-----------+
| Guest Browser / Client| (WebP / AVIF dynamically served based on Device DPR)
+-----------------------+
```

### Storage Selection Reasoning: Cloudflare R2
*   **Zero Egress Fees:** Traditional AWS S3 or GCP Cloud Storage charges high egress fees when public users load 4K hero images and high-framerate drone video tours. R2 charges $0 in egress fees, keeping operational costs flat and scalable.
*   **Strong S3 Compatibility:** Fully compatible with `@aws-sdk/client-s3` (already installed in UbEx), bypassing vendor lock-in.
*   **Cloudflare Images / Workers integration:** Allows dynamic on-the-fly resizing, format shifting (JPEG -> AVIF/WebP), and smart compression directly at the edge.

---

## 2. R2 Object Storage Prefix (Folder) Hierarchy

Rather than using partition-heavy flat layouts, R2 objects are organized under virtual hierarchical path prefixes matching the domain structure of the luxury stays, local experiences, destination booklets, blog layouts, and promotional campaigns.

### 2.1 Core Category Buckets / Namespace Prefixes
```yaml
/ubex-media-assets (R2 Bucket)
  ├── stays/               # Stays & Properties Media
  ├── experiences/         # Local Experiences (e.g., River Rafting, Bungees)
  ├── destinations/        # Destination-specific assets (e.g., Rishikesh guidebooks)
  ├── blogs/               # Content engine, thumbnails, article assets
  ├── marketing/           # Corporate collateral, landing heroes, partner logos
  └── social-media/        # UGC, guest-shared stories, reels, and raw footage
```

### 2.2 Property Deep-Dive Structure (`/stays/{property-id}/...`)
Every property has a dedicated scope representing its exact asset pipeline structure:

```yaml
stays/{property-id}/
  ├── raw/                 # Unedited High-Resolution uploads directly from field DSLR/Drones
  ├── selected/            # Pre-filtered assets selected during metadata curation
  ├── edited/              # Adobe Lightroom / Premiere pro-edited color-corrected master assets
  ├── optimized/           # Compressed, stripped EXIF, resized web-ready images
  ├── thumbnails/          # Dynamic card grid-previews and low-res representations
  ├── videos/              # Landscape cinematic videos, horizontal master tours
  ├── reels/               # Portait 9:16 vertical TikTok/Instagram marketing assets
  ├── hero/                # Property landing banners (Web, Tab, Mobile)
  └── room-types/          # Room Category specific imagery
        ├── dorm/          # Shared dorm space layouts
        ├── private-room/  # Private queen/king standard rooms
        ├── premium-room/  # Premium rooms with river/mountain balconies
        ├── suite/         # Executive master suites
        └── villa/         # Private boutique cottage villas
```

---

## 3. High-Performance Enterprise Naming Conventions

Strict, machine-readable, lowercase naming conventions enable automated file sorting, SEO indexability, duplicate cache-busting, and metadata extraction.

### 3.1 Hero Images (`stays/{property_id}/hero/`)
*   **Template:** `{property-name-slug}-hero-{viewport-type}-{hash/version}.{extension}`
*   *Examples:*
    *   `luxury-villa-rishikesh-hero-main.webp` (Web Master Canvas Banner)
    *   `luxury-villa-rishikesh-hero-mobile.webp` (Optimized vertical crop for iPhone/Android layouts)
    *   `luxury-villa-rishikesh-hero-thumbnail.webp` (Low-resolution, Blurred background placeholders / LQIP)

### 3.2 Room Images (`stays/{property_id}/room-types/{room_category}/`)
*   **Template:** `{property-name-slug}-{room-type-slug}-{sequence-number}-{hash}.{extension}`
*   *Examples:*
    *   `luxury-villa-rishikesh-dorm-01-ad98f.webp`
    *   `luxury-villa-rishikesh-private-room-02-bc32e.webp`
    *   `luxury-villa-rishikesh-premium-room-01-f112a.webp`
    *   `luxury-villa-rishikesh-suite-03-aa991.webp`
    *   `luxury-villa-rishikesh-villa-01-987ea.webp`

### 3.3 Dynamic Videos (`stays/{property_id}/videos/` or `/reels/`)
*   **Template:** `{property-name-slug}-{tour-type-slug}.{extension}`
*   *Examples:*
    *   `luxury-villa-rishikesh-room-tour.mp4` (Horizontal landscape 1080p inner walk)
    *   `luxury-villa-rishikesh-property-tour.mp4` (Cinematic horizontal slider showcasing pool/views)
    *   `luxury-villa-rishikesh-drone-tour.mp4` (4K 60fps outdoor flight clip)
    *   `luxury-villa-rishikesh-reels-yoga-1080x1920.mp4` (9:16 vertical overlay clip)

---

## 4. PostgreSQL Relational Metadata Schema

The catalog database stores metadata indexes to support ultra-fast frontend filtering, search indexing, SEO optimization, and future AI tasks.

```
+--------------------+            +--------------------+            +---------------------+
|     properties     |            |    media_assets    |            |   media_variants    |
+--------------------+            +--------------------+            +---------------------+
| id [PK, UUID]      | 1        N | id [PK, UUID]      | 1        N | id [PK, UUID]       |
| name               | ---------- | property_id [FK]   | ---------- | asset_id [FK]       |
| slug               |            | title              |            | variant_name        |
| status             |            | alt_text           |            | file_path (R2 Key)  |
| ...                |            | lifecycle_stage    |            | width / height     |
+--------------------+            | file_size          |            | mime_type           |
                                  | ai_score           |            | ...                 |
                                  +--------------------+            +---------------------+
                                            | 1
                                            |
                                            | N
                                  +---------+----------+
                                  |     media_tags     |
                                  +--------------------+
                                  | id [PK, Serial]    |
                                  | asset_id [FK]      |
                                  | tag_name           |
                                  +--------------------+
```

### 4.1 Schema Tables Spec
Below are Postgres schema tables and their constraints, structured for compatibility with both raw SQL engines and TypeScript-focused dynamic ORMs like **Drizzle**:

```sql
-- 1. Lifecycle Gating State Enum
CREATE TYPE "lifecycle_stage" AS ENUM (
  'RAW',        -- Uploaded directly from field camera
  'REVIEW',     -- Checked by operational staff for quality
  'APPROVED',   -- Approved, staged for design adjustments
  'EDITED',     -- Processed by editors (color grades, crops, filters)
  'OPTIMIZED',  -- Compressed, converted to WebP/AVIF format, resized
  'PUBLISHED',  -- Staged on live public stays/experiences pages
  'ARCHIVED'    -- Deprecated or replaced for historical log preservation
);

-- 2. Room Type Scope Identifier Enum
CREATE TYPE "room_type_scope" AS ENUM (
  'dorm',
  'private-room',
  'premium-room',
  'suite',
  'villa',
  'none'        -- Used for non-stay assets (e.g. general lobby, location, tours)
);

-- 3. Core Media Assets Table
CREATE TABLE "media_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" varchar(100) REFERENCES "stays"("id") ON DELETE SET NULL,
  "experience_id" varchar(100) REFERENCES "experiences"("id") ON DELETE SET NULL,
  "room_type" "room_type_scope" DEFAULT 'none' NOT NULL,
  "category" varchar(100) DEFAULT 'unassigned' NOT NULL, -- "lobby", "amenities", "outdoor"
  "title" varchar(255) NOT NULL,
  "alt_text" text,
  "source_file_path" varchar(1024) NOT NULL, -- Original master R2 Key path
  "file_size" integer NOT NULL, -- Bytes
  "dimensions" varchar(50) NOT NULL, -- e.g. "5760x3840"
  "mime_type" varchar(100) NOT NULL, -- e.g. "image/jpeg"
  "lifecycle_stage" "lifecycle_stage" DEFAULT 'RAW' NOT NULL,
  
  -- Marketing/Ranking parameters
  "hero_rank" integer DEFAULT 0 NOT NULL, -- Operational sort rank for listing carousels (1 = prime)
  "ai_score" doublePrecision DEFAULT 0.0 NOT NULL, -- Predictive score of aesthetics and layout (0.0 to 10.0)
  "ai_predictions" jsonb DEFAULT '{}'::jsonb NOT NULL, -- Quality analysis, lighting logs, and labels
  
  -- System controls
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create optimized composite indexes for high-speed queries on stays/rooms list
CREATE INDEX "media_assets_property_room_idx" ON "media_assets" ("property_id", "room_type", "lifecycle_stage");
CREATE INDEX "media_assets_experience_idx" ON "media_assets" ("experience_id", "lifecycle_stage");
CREATE INDEX "media_assets_hero_rank_idx" ON "media_assets" ("property_id", "hero_rank") WHERE "lifecycle_stage" = 'PUBLISHED';

-- 4. Media Variants Table (Dynamic representations of the same asset)
CREATE TABLE "media_variants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "asset_id" uuid REFERENCES "media_assets"("id") ON DELETE CASCADE NOT NULL,
  "variant_name" varchar(50) NOT NULL, -- "desktop_hero", "mobile_hero", "thumbnail", "blur_hash"
  "file_path" varchar(1024) NOT NULL, -- Resolution specific R2 key
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "file_size" integer NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "media_variants_asset_name_unq" ON "media_variants" ("asset_id", "variant_name");

-- 5. Media Tags (For search, dynamic filtering, and categorizations)
CREATE TABLE "media_tags" (
  "id" serial PRIMARY KEY,
  "asset_id" uuid REFERENCES "media_assets"("id") ON DELETE CASCADE NOT NULL,
  "tag_name" varchar(100) NOT NULL,
  "confidence" doublePrecision DEFAULT 1.0 NOT NULL -- High confidence for manual, decimal for AI tags
);

CREATE INDEX "media_tags_name_idx" ON "media_tags" ("tag_name");
CREATE UNIQUE INDEX "media_tags_asset_tag_unq" ON "media_tags" ("asset_id", "tag_name");
```

---

## 5. Enterprise Media Asset Lifecycle Workflows

A rigorous lifecycle process governs how photos pass from field camera memory cards to live public deployment. This prevents unedited or oversized images from slowing down performance.

```
[Camera Field DSLR]
       | (Bulk Upload to R2 `/raw/` prefix)
       v
  Stage: RAW =======> [Reviewer Workspace] =======> Stage: REVIEW
                             |
                    (Passes QC Checks?)
                    /               \
                   v Yes             v No
            Stage: APPROVED       Stage: ARCHIVED
                   |
            [Creative Editors]
            - Color balance, standardizing crops, noise reduction
                   |
                   v (Upload to R2 `/edited/` prefix)
            Stage: EDITED
                   |
            [Automation Worker]
            - Resize & compression (AVIF, WebP, Progressive JPG)
            - Automated alternate viewport crops (Desktop, Tab, Mobile)
            - Blurhash Generation (Low Quality Image Placeholder)
                   |
                   v (Write to R2 `/optimized/` prefix)
            Stage: OPTIMIZED
                   |
            [Release Gatekeeper]
            - Content / alt description review
            - AI metadata & layout rank validation
                   |
                   v
            Stage: PUBLISHED (Live in Catalog DB & served over Cloudflare CDN)
```

---

## 6. Future-Ready AI-Powered Extensions (Phase 2 Roadmap)

This schema and pipeline was architected to seamlessly interface with modern AI computer-vision systems (e.g. using the `@google/genai` TypeScript SDK already active in UbEx's bundle).

### 6.1 AI Aesthetic Scoring & Quality Analysis
*   **Workflow:** When an asset moves to `EDITED`, an asynchronous consumer kicks off a background evaluation job with the Gemini API.
*   **Prompting Profile:** The model analyzes the photo for blurriness, lens flares, color saturation, and human presence.
*   **Database Record:** Writes the results directly to `media_assets.ai_score` (0.0 to 10.0 scale) and populates helper analytics in the JSONB `ai_predictions` field:
    ```json
    {
      "brightness": "optimal",
      "composition": "rule-of-thirds",
      "resolution_evaluation": "high-res",
      "recommended_action": "pass"
    }
    ```

### 6.2 AI Duplicate Detection & Aesthetic Grouping
*   **Workflow:** To avoid showcasing six virtually identical pictures of the same cottage window, the system generates perceptual hashes (pHash) during the `OPTIMIZED` phase.
*   **Deduplication:** A local Python worker calculates pairwise Hamming distances of perceptual hashes. Photos with proximity scores > 90% are grouped. The system automatically promotes the asset with the highest `ai_score` to `hero_rank = 1` and marks the remainder as secondary gallery assets.

### 6.3 AI Captions & Automated Alt-Text Synthesis
*   **Workflow:** Accessibility compliant platforms mandate alternate image context for search bots and screen readers.
*   **Implementation:** Let the vision model read the photo and auto-generate structural descriptions instantly:
    *   *Prompt:* `"Describe this property image for a blind user. Use high-end architectural and travel terms."`
    *   *Result:* `"Sunlit bedroom interior of a boutique mountain resort in Rishikesh featuring hand-crafted hardwood double bed, large canvas windows overlooking the Ganga River, and warm brass fixtures."`
    *   *Storage:* Automatically updates `media_assets.alt_text` and `media_assets.title`.

---

## 7. Serving Optimization: Dynamic Delivery Strategies

To ensure that guest screens render layouts instantly:
1.  **Dynamic WebP/AVIF Negotiation:** Cloudflare's Edge CDN is configured to translate image requests to superior lightweight formats (AVIF/WebP) based on browser Accept Headers automatically.
2.  **Low-Quality Image Placeholders (LQIP):** The database stores a base64 encoded lightweight hash (Blurhash) of `8x8` pixels. The React frontend renders this blurred gradient inline immediately, transitioning to full resolution opacity once the CDN resource fetching completes.
3.  **Responsive `<picture>` templates:**
    ```html
    <picture>
      <!-- Serving optimized vertical crop on mobiles to prevent massive load scales -->
      <source media="(max-width: 640px)" srcset="https://cdn.ubex.in/stays/prop-101/hero-mobile.webp" />
      <!-- Standard beautiful 16:9 landscape on desktop screens -->
      <source media="(min-width: 1024px)" srcset="https://cdn.ubex.in/stays/prop-101/hero-main.webp" />
      <img src="https://cdn.ubex.in/stays/prop-101/hero-main.jpg" alt="Luxury Villa Rishikesh" class="w-full h-auto object-cover" />
    </picture>
    ```
