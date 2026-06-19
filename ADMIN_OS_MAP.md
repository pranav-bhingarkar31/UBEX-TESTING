# UbEx Platform - Back-Office Administration (Admin OS) Map
---

The back-office interface of UbEx (titled **Admin OS Dashboard**) is hosted securely directly alongside the consumer interface. This overlay is activated by a secure URL parameter hash and guarded by cascading authentication steps.

## 1. ACCESS ENDPOINT SCHEMA

Administrators access each distinct Administrative Console module inside the dynamic UI container overlay (`<AdminOSDashboard>`). Since the platform is built on an unified React SPA, specific tabs are mapped internally to `activeTab` states.

| Module Screen | Target URL Access Qualifier | Rendered Sub-Component / State | Auth Role Requirement | Access Method / Description |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Login Gate** | `http://localhost:3000/#admin` | `<AdminLogin>` (First Phase Challenge) | DB Admin / Operator credentials | Displays Argon2id dual password challenges |
| **Admin Email Screen** | `http://localhost:3000/#admin` | `<AdminEmailOtp>` (Second Phase Challenge) | User Session Key (OTP generated) | Authenticates verification emailed OTP |
| **Admin SMS Gateway** | `http://localhost:3000/#admin` | `<AdminPhoneOtp>` (MFA Step-Up Challenge) | Master Operator phone access | OTP delivered to verified Operator phone |
| **Executive Analytics** | `http://localhost:3000/#admin` (`"dashboard"`) | Dashboard Charts & KPIs | `analytics:view` | Displays active occupancy trends and revenue analytics |
| **Audit Center** | `http://localhost:3000/#admin` (`"audit"`) | Audit Log Datatable | `audit:read` | Lists all administrative modifications |
| **Security Threat Center**| `http://localhost:3000/#admin` (`"security"`) | Threat Monitoring Datatable | `audit:read` | Reports brute-force, CSRF breaches, and locked IPs |
| **Notification Center** | `http://localhost:3000/#admin` (`"notifications"`) | Messaging Broadcast Center | Authenticated Admin | Allows sending push announcements and staff chats |
| **System Health** | `http://localhost:3000/#admin` (`"health"`) | Docker, RAM, & PostgreSQL stats | `audit:read` | Streams container vitals and socket network speeds |
| **Stays Management** | `http://localhost:3000/#admin` (`"stays"`) | Rooms Inventory Modifier | `admin:create` | Creates stays, adjusts price schedules, locks dates |
| **Experiences Manager** | `http://localhost:3000/#admin` (`"experiences"`) | Tours Catalog Manager | `admin:create` | Edits tour slots, manages waiting list, and overrides pricing |
| **Booking Center** | `http://localhost:3000/#admin` (`"bookings"`) | Reservations Ledger | Authenticated Admin | Reviews current stays check-ins, guest emails |
| **Super Admin Features** | `http://localhost:3000/#admin` (`"system_settings"`) | Master Configurations Panel | Super Admin Role Only | Toggles feature-gates, Google API OAuth keys & limits |
| **Refund Management** | `http://localhost:3000/#admin` (`"bookings"`) | Step-Up Triggered Instant Refund | Operator with Step-Up MFA | Issues instant Razorpay charge reversal directly via API |

---

## 2. THE MULTI-FACTOR AUTHENTICATION SECURITY TUNNEL (MFA RUNBOOK)

Access to any resource inside raw `ADMIN_OS` is protected by a 3-tiered Multi-Factor verification flow:

### Step 1: Physical Credential Verification (Layer 1)
*   **Action**: Administrator enters username (`email`) and master `password` inside the login form.
*   **Security Protocol**: Sent via POST to `/api/v1/admin/auth/login`. The server performs constant-time password comparisons using standard high-rounds **Argon2id** password hashing.
*   **Result**: If verified, a temporary session identifier cookie is cryptographically prepared and flagged as `HttpOnly`, `Secure`, and `SameSite=Strict`. An email-contained short-lived OTP verification challenge code is generated.

### Step 2: Out-of-Band Email OTP Handshake (Layer 2)
*   **Action**: Administrator checks their verified email inbox (sent via Resend SDK client) for a 6-digit numeric verification OTP.
*   **Security Protocol**: User enters code inside `<AdminEmailOtp>` challenge form. This is validated on the backend at `/api/v1/admin/auth/verify-email-otp`.
*   **Result**: If correct, the cookie is upgraded with administrative authorizations. The dashboard boots into default "dashboard" active console layout.

### Step 3: Hardware SMS Challenge-Response (Layer 3 - Step-Up MFA)
*   **Action**: Required to access destructive operations like booking refunds or full configuration overrides.
*   **Security Protocol**: Admin triggers operation, causing the backend server to dispatch a high-priority SMS OTP using Twilio APIs at `/api/v1/admin/auth/request-phone-otp`.
*   **Result**: The user enters the numeric SMS OTP to complete step-up validation, unlocking the transaction directly on Razorpay's API gateways.
