# UbEx Admin Authentication Specification & Security Contracts (Phase 1B)

This document contains the complete production-grade specifications and behavioral contracts for the Phase 1B API layer of the UbEx Admin system. It remains completely decoupled from physical controllers, routers, or underlying engine implementations.

---

## 1. Authentication State Diagram

The lifecycle of an administrative identity transitioning from an anonymous client to a high-privilege verified session follows a rigid state-machine flow, strictly requiring Multi-Factor Authentication (MFA) step-up.

```text
       ┌───────────────┐
       │   ANONYMOUS   │
       └───────┬───────┘
               │ 
               │ POST /api/v1/admin/auth/login
               │ (Validate Email + Password)
               ▼
   ┌───────────────────────┐
   │  CREDENTIAL_VERIFIED  │ <─── [OTP Generated & Emailed]
   └───────────┬───────────┘
               │
               │ POST /api/v1/admin/auth/verify-email-otp
               │ (Validate OTP + Register Session)
               ▼
       ┌───────────────┐
       │  SESSION_LIVE │ ───► [Grants Standard Operations Access]
       └───────┬───────┘
               │
               │ [Trigger Sensitive Action] (Refund, Admin Write, Price Matrix Update)
               │ (Session state escalated to stepped-up evaluation)
               ▼
    ┌─────────────────────┐
    │ PHONE_OTP_CHALLENGE │ <─── POST /api/v1/admin/auth/request-phone-otp
    └──────────┬──────────┘
               │
               │ POST /api/v1/admin/auth/verify-phone-otp
               │ (MFA Step-Up Cleansed)
               ▼
      ┌──────────────────┐
      │ ELEVATED_SESSION │ ───► [Restricted Operations Unlocked]
      └──────────────────┘
```

---

## 2. Session Lifecycle Diagram

Admin sessions are backed by secure, multi-layered tokens (`id_token` / `access_token` stored in memory, and cryptographically structured, HTTP-only, secure, SameSite `refresh_token` stored in cookies).

```text
 ┌─────────┐               ┌───────────────┐                ┌─────────────┐
 │ CLIENT  │               │ EXPRESS STATE │                │ POSTGRESQL  │
 └────┬────┘               └───────┬───────┘                └──────┬──────┘
      │                            │                               │
      │ ── [1. Submit OTP] ───────►│                               │
      │                            │ ─ [2. Save session payload] ─►│ (session saved,
      │                            │◄─ [3. Return DB session raw] ─│  refresh_token_hash)
      │◄── [4. HttpOnly Cookie] ───│                               │
      │    (SameSite=Strict, Secure)                               │
      │                                                            │
      │                       --- PERIODIC INTERVALS ---           │
      │                                                            │
      │ ── [5. Call API Session] ─►│                               │
      │                            │ ─ [6. Match Refresh Hash] ───►│ (Query valid,
      │                            │◄─ [7. Return alive state] ───│  revoked_at IS NULL)
      │◄── [8. Session is valid] ──│                               │
      │                                                            │
      │                       --- REVOCATION ACTION ---            │
      │                                                            │
      │ ── [9. Call Logout] ──────►│                               │
      │                            │ ─ [10. Clear revoked_at] ────►│ (Set revoked_at = NOW)
      │◄── [11. Delete Cookie] ────│                               │
```

---

## 3. OTP Lifecycle Diagram

OTP states are single-use, finite mechanisms secured behind tight rate-limiting checks and expiration windows.

```text
 ┌─────────────┐             ┌─────────────────────┐             ┌─────────────┐
 │ INITIATION  │ ──────────► │ ACTIVE_EXPIRED_SWIN │ ──────────► │ TERMINATED  │
 └──────┬──────┘             └──────────┬──────────┘             └──────┬──────┘
        │                               │                               │
        ▼                               ▼                               ▼
 [Trigger Challenge]           [Time Exceeds 5 Min]            [Successful Verify]
  - Create row in DB            - Validate checks return            - Set `is_used` = true
  - Hash original OTP             "AUTH_OTP_EXPIRED"                - Close authorization
  - Send channel dial           - Sweep system cleanup                OR [Max Retries Hit]
  - Increment attempts                                              - Trigger High Security Alert
                                                                    - Invalidate token row
```

---

## 4. Error Standardization Document

Every error returned by the UbEx Admin system complies with a standard JSON envelope pattern:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid password or email address provided.",
    "details": {}
  },
  "correlation_id": "3b29c5ac-6ff1-4bc6-8be3-a1ebfd0f2526"
}
```

### Standardized Error Codes & Mappings

| Error Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `AUTH_INVALID_CREDENTIALS` | 401 | Email or Password does not match database entries. |
| `AUTH_ACCOUNT_LOCKED` | 423 | User has exceeded max login failures. Resource locked. |
| `AUTH_OTP_EXPIRED` | 410 | OTP challenge validation limit timeframe has expired. |
| `AUTH_OTP_INVALID` | 400 | The typed verification digits do not align with stored hash. |
| `AUTH_OTP_RETRY_LIMIT` | 429 | Exceeded retry limit bounds (max 3 counts). |
| `AUTH_SESSION_EXPIRED` | 401 | Stored access/refresh tokens are expired. |
| `AUTH_UNAUTHORIZED` | 401 | Session missing, malformed, or revoked. |
| `AUTH_FORBIDDEN` | 403 | Principal lacks specific RBAC role/permissions required. |
| `AUTH_RATE_LIMITED` | 429 | IP, User-Agent or Email endpoint threshold exceeded. |
| `AUTH_PASSWORD_RESET_EXPIRED`| 410 | Token expires after 15 minutes of request emission. |
| `VALIDATION_FAILED` | 400 | Request parameters did not satisfy JSON Validation schemas. |

---

## 5. COMPLETE API ENDPOINT SPECIFICATIONS

### Global Requirements

* **Correlation Identifier**: All requests MUST transmit or receive an `X-Correlation-ID` header. If absent, the gateway generates a UUIDv4 context ID.
* **CSRF Protection**: All state-modifying endpoints (`POST`, `PUT`, `DELETE`) require a valid validation code in headers (`X-CSRF-Token`).
* **Session Cookies**: Active session identifiers are returned exclusively as `HttpOnly`, `Secure`, `SameSite=Strict` cookies.

---

### Endpoint 1: Initiate Admin Authentication Flow
* **Path**: `POST /api/v1/admin/auth/login`
* **Purpose**: First-phase credential validation. If password is verified, triggers dynamic OTP dispatch.
* **Authorization Requirements**: Publicly visible, unauthenticated.
* **Request Schema**:
  ```json
  {
    "email": "admin@ubex.com",
    "password": "SecureStringPassword123!"
  }
  ```
* **Request Validation Rules**:
  * `email`: String, valid email format, mandatory.
  * `password`: String, character length 12-128, mandatory.
* **Success Response Schema**:
  * **HTTP Status**: `200 OK`
  * **Payload**:
    ```json
    {
      "success": true,
      "message": "Step-1 validation succeeded. Email OTP challenge dispatched.",
      "correlation_id": "3b29c5ac-6ff1-4bc6-8be3-a1ebfd0f2526"
    }
    ```
* **Error Response Example**:
  * **HTTP Status**: `401 Unauthorized`
  * **Payload**:
    ```json
    {
      "success": false,
      "error": {
        "code": "AUTH_INVALID_CREDENTIALS",
        "message": "Invalid password or email address provided."
      },
      "correlation_id": "3b29c5ac-6ff1-4bc6-8be3-a1ebfd0f2526"
    }
    ```
* **Rate Limits**: Max 5 requests per minute per IP interface.
* **Audit Events**: `LOGIN_FAILURE` (on verification fail).
* **Security Events**: `MULTIPLE_FAILED_LOGINS` (after 3 fails), `ACCOUNT_LOCKOUT` (on reaching 5 failed password entries).
* **RBAC Limits**: Checked post verification.
* **Session Effects**: None. Access tokens are not created yet.

---

### Endpoint 2: Verify Email OTP & Finalize Session
* **Path**: `POST /api/v1/admin/auth/verify-email-otp`
* **Purpose**: Match current MFA Email OTP, record device markers, issue session identifiers.
* **Authorization Requirements**: Unauthenticated. User identity verified via temporary secure tracking context.
* **Request Schema**:
  ```json
  {
    "email": "admin@ubex.com",
    "otp": "950481",
    "device_fingerprint": "browser-chrome-mac-fingerprint"
  }
  ```
* **Request Validation Rules**:
  * `email`: Valid email format, mandatory.
  * `otp`: 6-digit numeric string, mandatory.
  * `device_fingerprint`: Optional device metrics payload.
* **Success Response Schema**:
  * **HTTP Status**: `200 OK`
  * **Headers**: `Set-Cookie: __Host-ub-rt=HashedSessionString; Secure; HttpOnly; SameSite=Strict; Path=/`
  * **Payload**:
    ```json
    {
      "success": true,
      "message": "Authentication completed.",
      "user": {
        "id": "e0a6d0c7-1a42-4f7f-8c3b-74b2605f6bdc",
        "email": "admin@ubex.com",
        "first_name": "Alexander",
        "last_name": "Hamil",
        "roles": ["SUPER_ADMIN"]
      },
      "correlation_id": "3b29c5ac-6ff1-4bc6-8be3-a1ebfd0f2526"
    }
    ```
* **Error Response Example**:
  * **HTTP Status**: `400 Bad Request`
  * **Payload**:
    ```json
    {
      "success": false,
      "error": {
        "code": "AUTH_OTP_INVALID",
        "message": "The entered checkcode did not match or has expired."
      },
      "correlation_id": "3b29c5ac-6ff1-4bc6-8be3-a1ebfd0f2526"
    }
    ```
* **Rate Limits**: Max 3 verify attempts per session challenge.
* **Audit Events**: `LOGIN_SUCCESS` (on success), `OTP_EXPIRED`, `OTP_FAILURE` (on mismatch).
* **Security Events**: `FAILED_OTP` (on error), `NEW_DEVICE_LOGIN` (when device signature does not match profile metadata records).
* **RBAC Limits**: Role collection compiled dynamically.
* **Session Effects**: Row registered in `auth.sessions`, `last_login_at` refreshed.

---

### Endpoint 3: Request Phone OTP (Sensitive Step-Up Authorization)
* **Path**: `POST /api/v1/admin/auth/request-phone-otp`
* **Purpose**: Generates dynamic verification SMS to user's registered smartphone as a protective hurdle before critical administrative decisions.
* **Authorization Requirements**: Standard active session required.
* **Request Schema**: `Empty` (Reads validated configuration metrics straight from session identifiers).
* **Success Response Schema**:
  * **HTTP Status**: `200 OK`
  * **Payload**:
    ```json
    {
      "success": true,
      "message": "Phone OTP challenge successfully triggered. Verification required via target format suffix ...-9051.",
      "correlation_id": "7a35da7b-5813-441d-b8ea-8b43bd105b41"
    }
    ```
* **Error Response Example**:
  * **HTTP Status**: `401 Unauthorized`
  * **Payload**:
    ```json
    {
      "success": false,
      "error": {
        "code": "AUTH_UNAUTHORIZED",
        "message": "Authentication session missing or revoked."
      },
      "correlation_id": "7a35da7b-5813-441d-b8ea-8b43bd105b41"
    }
    ```
* **Rate Limits**: Max 2 OTP retry triggers per minute.
* **Audit Events**: `OTP_CHALLENGE_CREATED`.
* **Security Events**: None.
* **RBAC Limits**: Session must contain standard verification markers.
* **Session Effects**: Generates row elements in `auth.otp_challenges`.

---

### Endpoint 4: Verify Phone OTP (MFA Step Up)
* **Path**: `POST /api/v1/admin/auth/verify-phone-otp`
* **Purpose**: Elevates authority criteria of session token.
* **Authorization Requirements**: Standard session context required.
* **Request Schema**:
  ```json
  {
    "otp": "205934"
  }
  ```
* **Request Validation Rules**:
  * `otp`: Exactly 6 digits, mandatory.
* **Success Response Schema**:
  * **HTTP Status**: `200 OK`
  * **Payload**:
    ```json
    {
      "success": true,
      "message": "Phone verification complete. MFA elevated context granted.",
      "correlation_id": "7a35da7b-5813-441d-b8ea-8b43bd105b41"
    }
    ```
* **Rate Limits**: Max 3 verification sequences.
* **Audit Events**: `OTP_SUCCESS` (escalation completed on audit records).
* **Security Events**: `FAILED_OTP` (on code mismatch).
* **RBAC Limits**: Dynamic update on temporary privilege elevation records.
* **Session Effects**: Associated authorization tokens are signed with temporary privilege tags.

---

### Endpoint 5: Get Current Session Profile
* **Path**: `GET /api/v1/admin/auth/session`
* **Purpose**: Principal validation of active credentials.
* **Authorization Requirements**: Valid session identifier token mandatory.
* **Request Schema**: `None`
* **Success Response Schema**:
  * **HTTP Status**: `200 OK`
  * **Payload**:
    ```json
    {
      "success": true,
      "session": {
        "user_id": "e0a6d0c7-1a42-4f7f-8c3b-74b2605f6bdc",
        "email": "admin@ubex.com",
        "first_name": "Alexander",
        "last_name": "Hamil",
        "roles": ["SUPER_ADMIN"],
        "permissions": ["admin:create", "refund:execute", "security:modify_settings"],
        "ip_address": "203.0.113.195",
        "is_mfa_elevated": false
      },
      "correlation_id": "9a38bd23-6441-4191-8bfb-a9be8ac1bc28"
    }
    ```
* **Rate Limits**: Max 100 requests per minute.
* **Audit Events**: None (Low verbosity metadata profiling).
* **Security Events**: `SUSPICIOUS_LOGIN` (triggered if current client network interface deviates drastically from the session origin profile bounds).
* **Session Effects**: Keeps `last_activity_at` timestamp synchronized inside postgres schema.

---

### Endpoint 6: Client Request Logout
* **Path**: `POST /api/v1/admin/auth/logout`
* **Purpose**: Clear active host cookies and update active DB session.
* **Authorization Requirements**: Active session.
* **Request Schema**: `None`
* **Success Response Schema**:
  * **HTTP Status**: `200 OK`
  * **Headers**: `Set-Cookie: __Host-ub-rt=; Secure; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  * **Payload**:
    ```json
    {
      "success": true,
      "message": "Session invalidated successfully."
    }
    ```
* **Rate Limits**: Max 5 requests per minute.
* **Audit Events**: `LOGOUT` (Recorded to append-only database logs).
* **Session Effects**: Sets `revoked_at` to `CURRENT_TIMESTAMP` inside `auth.sessions`.

---

### Endpoint 7: Revoke Specific session
* **Path**: `POST /api/v1/admin/auth/revoke-session`
* **Purpose**: Allows administrators to force remote sign-outs of suspect compromised devices.
* **Authorization Requirements**: Standard active session.
* **Request Schema**:
  ```json
  {
    "session_id": "ff000000-0000-0000-0000-000000001095"
  }
  ```
* **Request Validation Rules**:
  * `session_id`: Unique database tracking identifier, valid UUID formats.
* **Success Response Schema**:
  * **HTTP Status**: `200 OK`
  * **Payload**:
    ```json
    {
      "success": true,
      "message": "Session ID ff000000-0000-0000-0000-000000001095 revoked successfully."
    }
    ```
* **Audit Events**: `SESSION_REVOKED`.
* **RBAC Limits**: Users may terminate their own active rows freely. Terminating rows belonging to other administrative peers is restricted to `SUPER_ADMIN` identity mappings.

---

### Endpoint 8: Revoke All Sessions
* **Path**: `POST /api/v1/admin/auth/revoke-all-sessions`
* **Purpose**: Emergency nuclear option to instantly terminate multiple sessions for an admin identity.
* **Authorization Requirements**: Authenticated session required.
* **Request Schema**: `None`
* **Success Response Schema**:
  * **HTTP Status**: `200 OK`
  * **Payload**:
    ```json
    {
      "success": true,
      "message": "All existing active sessions successfully terminated."
    }
    ```
* **Audit Events**: `SESSION_REVOKED_ALL`.
* **Session Effects**: Modifies `revoked_at` status records on all matches within physical DB schemas.

---

### Endpoint 9: Initiate Password Recovery Flow
* **Path**: `POST /api/v1/admin/auth/request-password-reset`
* **Purpose**: Issues a cryptographically hashed token if structural checks pass. Triggers email recovery pipeline.
* **Authorization Requirements**: Public, unauthenticated.
* **Request Schema**:
  ```json
  {
    "email": "admin@ubex.com"
  }
  ```
* **Request Validation Rules**:
  * `email`: Standard format validation criteria, mandatory.
* **Success Response Schema**:
  * **HTTP Status**: `200 OK`
  * **Payload**:
    ```json
    {
      "success": true,
      "message": "If the entered email correlates to a registered operator, password recovery parameters have been issued."
    }
    ```
* **Rate Limits**: Maximum 2 queries per hour per email address parameter.
* **Audit Events**: `PASSWORD_RESET_REQUESTED`.
* **Security Events**: `BRUTE_FORCE_ATTEMPT` (if targeted against multiple emails in rapid loops).

---

### Endpoint 10: Complete Password Reset
* **Path**: `POST /api/v1/admin/auth/reset-password`
* **Purpose**: Validate recovery tracking code and save new password hashing data.
* **Authorization Requirements**: Public, token based.
* **Request Schema**:
  ```json
  {
    "token": "raw-uuidv4-reset-token-string",
    "new_password": "NewBrilliantSecurePasswordFormula106!"
  }
  ```
* **Request Validation Rules**:
  * `token`: Mandatory, non-empty.
  * `new_password`: Min 12 symbols, contains alphanumeric and special characters. Refer to global strength checks.
* **Success Response**:
  * **HTTP Status**: `200 OK`
  * **Payload**:
    ```json
    {
      "success": true,
      "message": "Credentials updated completely. You may now return to sign-in panels."
    }
    ```
* **Error Response Example**:
  * **HTTP Status**: `410 Gone`
  * **Payload**:
    ```json
    {
      "success": false,
      "error": {
        "code": "AUTH_PASSWORD_RESET_EXPIRED",
        "message": "Reset request link time boundary has elapsed."
      }
    }
    ```
* **Audit Events**: `PASSWORD_RESET_COMPLETED`.
* **Session Effects**: Wipes associated tokens from reset request databases. Invalidates all active session rows.

---

## 6. Audit & Security Event Matrix

| Action | Target Table | Type | Severity Level | Security Escalation Event Triggers |
| :--- | :--- | :--- | :---: | :--- |
| **Credential Verification Fail** | `audit.audit_logs` | `LOGIN_FAILURE` | - | Increment count towards brute-force locks. |
| **Account Lockout Hit** | `audit.security_events` | `ACCOUNT_LOCKOUT` | **HIGH** | Freezes identity verification capabilities. |
| **MFA Challenge Mismatch** | `audit.security_events` | `FAILED_OTP` | **MEDIUM** | Block challenge progression if attempts > 3. |
| **Network IP Incongruence** | `audit.security_events`| `SUSPICIOUS_LOGIN`| **HIGH** | Mark active session row as suspicious. |
| **Unauthorized Action Hit** | `audit.security_events`| `ROLE_ESCALATION` | **CRITICAL**| Immediate supervisor notification pipeline. |

---

## 7. Rate Limiting Strategy
We implement a multi-tiered rate limiter to defend against denial-of-service and brute-force scans:
1. **IP-Based Global Limit**: Defends general application resources, routing.
   * *Limit*: Max 300 queries / 5 minutes / IP.
2. **Credential Authentication Route Layer Limit**:
   * *Limit*: Max 5 attempts / 15 minutes / IP / Email Address.
3. **MFA Delivery Triggers Limit**: Defends integration SMS gateway costs against automated attacks.
   * *Limit*: Max 2 OTP code dispatches / 15 minutes.

---

## 8. Versioning Strategy
API versioning adheres to structural URI path prefixes (`/api/v1/...`). Changes to schemas or API boundaries will deprecate `v1` while preserving production assets.
All endpoints adhere to SemVer conventions. Backward-compatible changes maintain minor prefixes on API schemas, while high-level state changes trigger progression to validation namespace paths `/api/v2/`.
