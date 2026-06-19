# UBEX PUBLIC BETA — ADMIN OS FEATURE FLAG REPORT

As the Principal Software Architect and Release Engineer, I have successfully prepared the UbEx platform for its Public Beta launch by establishing a centralized feature-flag architecture that cleanly hides and protects the entire **Admin OS** suite from public exposure while keeping it 100% structurally intact for future expansion.

---

## 1. Centralized Feature Flag

The entire release gating is controlled by a single configuration parameter located in:
`src/config/features.ts`

```typescript
export const FEATURES = {
  ADMIN_OS_ENABLED: false, // Set to true to fully restore Admin OS
};
```

---

## 2. Disabled Components
To protect the client-side bundle, the following components are fully gated using the required conditional evaluation pattern. If `FEATURES.ADMIN_OS_ENABLED` is `false`, they immediately return `null`:

*   **AdminOSDashboard** (`/src/components/AdminOSDashboard.tsx`): The main workspace with administrative analytics, log sweeps, and sheets synchronization controls.
*   **AdminLogin** (`/src/components/admin/auth/AdminLogin.tsx`): The secure operational console login portal.
*   **AdminEmailOtp** (`/src/components/admin/auth/AdminEmailOtp.tsx`): Second-factor email OTP prompt.
*   **AdminPhoneOtp** (`/src/components/admin/auth/AdminPhoneOtp.tsx`): Elevating-rights Twilio SMS OTP gateway.
*   **AdminRotatePassword** (`/src/components/admin/auth/AdminRotatePassword.tsx`): Security-compliant mandatory password rotation utility.
*   **ProtectedAdminRoute** (`/src/components/admin/auth/ProtectedAdminRoute.tsx`): Route-guard wrapper that secures children assets against unauthenticated requests.
*   **AdminAuthProvider** (`/src/components/admin/auth/AdminAuthProvider.tsx`): Cryptographic JWT and sessions state machine.

---

## 3. Disabled Routes
Any attempt to access administrative routes or trigger hidden UI consoles will instantly redirect or 404:

*   **hash `#admin` and query string `admin=true`**: App.tsx listens to route changes. If the flag is disabled, it automatically prunes the hash or query parameter, replaces the history state to mask directories, and denies entry.
*   **Admin Overlays & Launcher Modals**: Hidden dashboard modals are completely stripped out from rendering.

---

## 4. Disabled APIs
An elegant, future-proof Express routing middleware was mounted inside the high-concurrency API server (`/server.ts`). This router shield intercepts and returns a clean **HTTP 404** for any administrative entry points when disabled:

*   **Admin Authentication API**: `/api/v1/admin/auth/*`
*   **Admin OS Operations API**: `/api/v1/admin/os/*`
*   **Adventure Passport Definitions API**: `/api/admin/passport-defs` (GET)
*   **Passport Badges Moderation**: `/api/admin/badges` (POST)
*   **Passport Achievements Moderation**: `/api/admin/achievements` (POST)
*   **Passport Rewards Moderation**: `/api/admin/rewards` (POST)
*   **System Integrity Tests**: `/api/admin/system/tests` (GET)
*   **Story & Review Moderation**: `/api/admin/reviews/action` (POST)
*   **Operational Log Database Purge**: `/api/all-bookings` (GET)
*   **Development Simulation Endpoints**: `/api/passport/simulate` (POST)

---

## 5. Disabled Navigation Items
All visual hints or entry-points related to administrative consoles are removed:

*   **Desktop Header CMS Launcher**: Gated out in the global transparent navbar inner button tray.
*   **Mobile Sidebar CMS Launcher**: Removed from the mobile drawer layout.

---

## 6. Remaining Public Routes & Functions
The entire guest-facing experience remains fully active with high-fidelity components, complete with localized language translations (English, Hindi, Russian, Chinese, French, etc.) and currency conversions (INR, USD, EUR, GBP, etc.):

*   **Home & Interactive Search**: Dynamic filtering of tours with visual categories.
*   **Stays Module**: Live listings of Luxury Hill Villas, Workation pods, and Bunk Hostels, complete with Google Sheets dynamic pricing sync support for checkout.
*   **Experiences Module**: Detailed previews of Rafting, Bungee jumps, and spiritual Ganga Aarti walks.
*   **Adventure Passport Dashboard**: Live client-side gamification levels, earned badges, and unlocked reward vouchers.
*   **Verified Review & Share Your Story**: Content upload forms with automated content toxicity checks (using sever-side Gemini AI API or secure local regex checks).
*   **About Us, Careers, Contact Us, Partner, FAQs, and Blog pages**.

---

## 7. Operational Integrity & Security (Unchanged Systems)
In compliance with strict architectural requirements, **no security systems, database schema, or administrative tools have been removed or refactored**. The following backend modules remain completely operational under the hood, ready to load instantly upon activation:
*   Standard RBAC logic and operational roles.
*   Database retention cleanup and webhook purges on server startup/cron intervals.
*   Audit loggers, CSRF validation tokens, and cryptographic utility services.

---

## 8. Reactivation Procedure
Restoring the full Admin OS to 100% capability requires changing only **one line of code** inside `src/config/features.ts`:

```typescript
export const FEATURES = {
  ADMIN_OS_ENABLED: true, // Restores Admin OS globally
};
```

No additional files need to be modified, and all endpoints, UI widgets, launchers, and MFA gates will immediately resume functionality.

---

## 9. Build and Lint Verification Results

*   **Build Compilation test**: `SUCCESS` — Vite compiler and full Bundler build passes green.
*   **TypeScript static typechecks**: `SUCCESS` — Compilation output returned no unresolved type parameters.
*   **Dev Ingress Server bindings**: `SUCCESS` — Express dev process successfully maps to Local Port 3000 inside its virtual loop.
