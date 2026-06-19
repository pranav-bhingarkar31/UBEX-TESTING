# UbEx Platform Route Map & Navigation Architecture Audit
---

## 1. REACT CLIENT SPA NAVIGATION & ROUTING
The parent application operates on a state-receptive **Single Page Application (SPA)** architecture. Navigation transitions are driven by changing the `activeView` state in the main `App.tsx` entry component rather than using structural browser-level browser history push states, ensuring high responsiveness.

Additionally, the **Administrative OS Dashboard Overlay** is guarded behind private routing constraints and accessible through localized URL parameters or hash tags.

### Complete Client Virtual Route Inventory

| URL Hash / Virtual Route | View Identifier | UI Component | Layout Frame | Authentication Required | Roles / Context Required | Visible In Navigation Menu | Route Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` (Blank or Hashless) | `home` | `<App>` Hero Section | Main Shell | No | Any | Yes (as "Home") | **Active** |
| `#stays` or selection | `stays` | `<StaysPage>` | CURATED RENTALS Grid | No | Any | Yes (as "Stays") | **Active** |
| `#experiences` | `experiences` | `<ExperiencesPage>` | ACTIVE SPOTS Grid | No | Any | Yes (as "Experiences") | **Active** |
| `#community` | `community` | `<CommunityPage>` | COLLABORATIVE HUB | Yes (Firebase Auth) | Registered Guest | Yes (as "Community") | **Active** |
| `#corporate` | `corporate` | `<CorporatePage>` | EXECUTIVE B2B | No | Corporate Representative | Yes (as "Corporate") | **Active** |
| `#passport` | `passport` | `<PassportDashboard>` | GAMIFIED REWARDS HUD | Yes (Firebase Auth) | Registered Guest | Yes (as "Passport") | **Active** |
| `#checkout` | `checkout` | `<CheckoutPage>` | PAYMENT / CART PANEL | No | Cart Holder | Yes (if Cart is Active) | **Active** |
| `#share-your-story` | `share-your-story` | `<ShareYourStoryPage>` | CONTENT WRITER | Yes (Firebase Auth) | Active Guest Account | Yes (under Footer/Mega Menu) | **Active** |
| `#about` | `about` | `<AboutUsPage>` | STATIC INFOCUS | No | Corporate Public | Yes (under Footer/Mega Menu) | **Active** |
| `#blog` | `blog` | `<BlogPage>` | CURATED STORIES | No | Corporate Public | Yes (under Footer/Mega Menu) | **Active** |
| `#careers` | `careers` | `<CareersPage>` | TALENT GRID | No | Applicant | Yes (under Footer/Mega Menu) | **Active** |
| `#partner` | `partner` | `<PartnerPage>` | B2C ONBOARDING | No | Host Partner | Yes (under Footer/Mega Menu) | **Active** |
| `#faqs` | `faqs` | `<FaqsPage>` | STATIC FAQS ACCORDION | No | Corporate Public | Yes (under Footer/Mega Menu) | **Active** |
| `#contact` | `contact` | `<ContactPage>` | SECURE INTAKE PANEL | No | Corporate Public | Yes (under Footer/Mega Menu) | **Active** |
| `#admin` (or `?admin=true`) | `admin` | `<AdminOSDashboard>` | ADMIN OS FULL OVERLAY | Yes (Multi-Factor Admin Auth) | Registered RBAC Admin Operator | Hidden (Button reveals upon hash) | **Active & Sealed** |

---

## 2. BACKEND API EXPOSE MAP (EXPRESS SERVER)
The Express Node server exposes two primary REST routers at `/api/v1/admin/auth/*` and `/api/v1/admin/os/*`. All requests execute under deep CSRF verification, CORS validation, security trace audit streams, and cookie session validation.

### Administrative Multi-Factor Authenticator Router (`/api/v1/admin/auth`)

| Endpoint Path | Method | Purpose / Action | Protection Layer / Middlewares |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/auth/login` | `POST` | Validates admin credentials (first challenge phase) | `loginRateLimiter`, Body Schema Validation |
| `/api/v1/admin/auth/verify-email-otp` | `POST` | Verifies secondary email OTP challenge (signs session token) | Body Schema Validation |
| `/api/v1/admin/auth/request-phone-otp` | `POST` | Sends Twilio-delivered Phone SMS OTP code | Require JWT Session |
| `/api/v1/admin/auth/verify-phone-otp` | `POST` | Validates step-up SMS OTP code (unlocks operational payload) | Require JWT Session, Body Schema Validation |
| `/api/v1/admin/auth/session` | `GET` | Resolves active Admin user state, device footprint, and roles | Double-Submit CSRF check, Session cookie decode |
| `/api/v1/admin/auth/logout` | `POST` | Invalidates current cookie session and signs user off | None |
| `/api/v1/admin/auth/revoke-session` | `POST` | Remotely raw kills a specific Session footprint | Require JWT Session, Body Schema Validation |
| `/api/v1/admin/auth/revoke-all-sessions` | `POST` | Full-kill revoke of all active logins except current | Require JWT Session |
| `/api/v1/admin/auth/request-password-reset` | `POST` | Submits reset request and dispatches Reset link and Token via email | Body Schema Validation |
| `/api/v1/admin/auth/reset-password` | `POST` | Validates password reset token and writes replacement credentials | Body Schema Validation |
| `/api/v1/admin/auth/rotate-password` | `POST` | Handles forced first-login password updates | Require JWT Session |
| `/api/v1/admin/auth/csrf` | `GET` | Fetches a new CSRF Token | None |
| `/api/v1/admin/auth/sessions` | `GET` | Pulls all active physical sessions for the active User | Require JWT Session |

---

### Back-Office Operational CMS Router (`/api/v1/admin/os`)
All endpoints are guarded by physical Admin Session Verification (`/middleware/adminJwtAuth`) and specific Role-Level Permission checking.

| Endpoint Path | Method | Operation Scope | Permission Level / Checks Applied |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/os/dashboard/stats` | `GET` | Fetch executive visual metrics | `analytics:view` |
| `/api/v1/admin/os/users` | `GET` | Query internal developer accounts | `admin:create` |
| `/api/v1/admin/os/users/:id/suspend` | `POST` | Toggle administrative suspension | `admin:create` |
| `/api/v1/admin/os/users/:id/ban` | `POST` | Ban/isolate a target account | `admin:create` |
| `/api/v1/admin/os/users/:id/verify` | `POST` | Manually mark account as fully verified | `admin:create` |
| `/api/v1/admin/os/users/:id/reset-password` | `POST` | Inject random admin replacement password | `admin:create` |
| `/api/v1/admin/os/roles` | `GET` | Query system role designations and scopes | `role:modify` |
| `/api/v1/admin/os/roles/assign` | `POST` | Grant specific role designation to user | `role:modify` |
| `/api/v1/admin/os/roles/remove` | `POST` | Strip role designation from user | `role:modify` |
| `/api/v1/admin/os/audit/logs` | `GET` | Stream system security activity logs | `audit:read` |
| `/api/v1/admin/os/audit/export` | `GET` | Export cryptographic CSV copy of logs | `audit:export` |
| `/api/v1/admin/os/security/events` | `GET` | Query system level alerts, bans, locks, and failures | `audit:read` |
| `/api/v1/admin/os/notifications` | `GET` | Internal messaging dispatch center | None (Requires Admin authentication) |
| `/api/v1/admin/os/health` | `GET` | Real-time CPU, RAM, Postgres and external endpoint status | `audit:read` |
| `/api/v1/admin/os/stays` | `GET` | Read all room rates and details | None (Requires Admin authentication) |
| `/api/v1/admin/os/stays` | `POST` | Open new rental room / location | `admin:create` |
| `/api/v1/admin/os/stays/:id` | `PUT` | Edit rates, description, images or occupancy thresholds | `admin:create` |
| `/api/v1/admin/os/stays/:id/archive` | `POST` | Hide stay from consumer marketplace page | `admin:create` |
| `/api/v1/admin/os/stays/:id/inventory`| `POST` | Lock/unlock block of dates from booking | `admin:create` |
| `/api/v1/admin/os/experiences` | `GET` | Query active tours and retreats catalog | None (Requires Admin authentication) |
| `/api/v1/admin/os/experiences` | `POST` | Design new tours and adventures | `admin:create` |
| `/api/v1/admin/os/experiences/:id` | `PUT` | Adjust descriptions, highlights, prices, and locations | `admin:create` |
| `/api/v1/admin/os/experiences/:id/archive` | `POST` | Un-publish experience | `admin:create` |
| `/api/v1/admin/os/experiences/:id/schedule` | `POST` | Override time slots and reservation bounds | `admin:create` |
| `/api/v1/admin/os/bookings` | `GET` | Get reservations and checkouts database | None (Requires Admin authentication) |
| `/api/v1/admin/os/bookings/:id` | `PUT` | Reschedule check-in dates and occupancy sizes | `admin:create` |
| `/api/v1/admin/os/bookings/refund` | `POST` | Issue instant refund and invalidate transaction reference | Require SMS Step-Up verification (Dynamic) |
| `/api/v1/admin/os/system-settings` | `GET` | Retrieve super-admin toggles, global limits, & sync keys | Super Admin Authenticated |
| `/api/v1/admin/os/system-settings` | `POST` | Toggle global sync, emergency locks, and SMS limits | Super Admin Authenticated |
