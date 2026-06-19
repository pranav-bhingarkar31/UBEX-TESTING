# UbEx Secure Admin Authentication — Database Reference Architecture (Phase 1A Revised)

This document represents the complete production-ready reference architecture and implementation blueprint for **Phase 1A (Database Foundation)** of the UbEx Admin system. It houses the updated layout schemas, migrations, composite indexing choices, rollback operations, and data-integrity security configurations.

---

## 1. Folder Structure
The administrative infrastructure files are neatly structured inside `/src/db/` as follows:

```text
src/
└── db/
    ├── admin_schema.ts           # Drizzle schema definitions for 'auth', 'core' & 'audit'
    ├── index.ts                  # Main client-side / Node fallback database logic
    ├── schema.ts                 # Main public guest/user bookings schema
    ├── README_PHASE1A.md         # Updated reference documentation & security review audit
    ├── migrations/
    │   └── 0000_admin_auth_init.sql   # Complete revised PostgreSQL DDL provisioning script
    └── seeds/
        └── seed_admin_roles.sql       # Seed SQL script configuring SUPER_ADMIN & other roles safely
```

---

## 2. Entity-Relationship Diagram (ERD)
The schema split spans across three namespaces (`auth`, `core`, and `audit`) to guarantee logical segregation of highly critical tables.

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                 AUTH SCHEMA                                 │
 └─────────────────────────────────────────────────────────────────────────────┘
          ┌───────────────────────────┐
          │     auth.admin_users      │
          ├───────────────────────────┤
          │ PK │ id (UUID)            │
          │    │ email (UNIQUE)       │
          │    │ phone_number (UNIQUE)│ <--- Added for multi-channel MFA support
          │    │ first_name           │ <--- Added for admin profile management
          │    │ last_name            │ <--- Added for admin profile management
          │    │ password_hash        │
          │    │ is_active            │
          │    │ is_mfa_enabled       │
          │    │ failed_login_attempts│
          │    │ locked_until         │
          │    │ password_changed_at  │ <--- Added for password expiration checks
          │    │ last_login_at        │ <--- Added for login history monitoring
          └────┬──────┬──────┬──────┬─┘
               │      │      │      │
      1:N      │      │      │      │ 1:N
  ┌────────────┘      │      │      └────────────┐
  ▼                   │      │                   ▼
┌──────────────────┐  │      │  ┌──────────────────────────────────┐
│  auth.sessions   │  │      │  │       auth.otp_challenges        │
├──────────────────┤  │      │  ├──────────────────────────────────┤
│ PK │ id (UUID)   │  │      │  │ PK │ id (UUID)                   │
│ FK │ user_id     │◄─┘      │  │ FK │ admin_user_id               │
│    │ token_hash  │         │  │    │ type (EMAIL/PHONE)          │ [CHECK: chk_otp_type]
│    │ device_fp   │         │  │    │ destination                 │
│    │ ip_address  │         │  │    │ otp_hash                    │
│    │ expires_at  │         │  │    │ retry_count / max_retries   │
│    │ suspicious  │         │  │    │ is_used                     │
│    │ revoked_at  │◄────────┘  │    │ expires_at                  │
│    │ last_activity_at         └──────────────────────────────────┘
└──────────────────┘         │ 1:N
                             ▼
            ┌──────────────────────────────────┐
            │   auth.password_reset_requests   │
            ├──────────────────────────────────┤
            │ PK │ id (UUID)                   │
            │ FK │ admin_user_id               │
            │    │ token_hash                  │
            │    │ is_used                     │
            │    │ expires_at                  │
            └──────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                 CORE SCHEMA                                 │
 └─────────────────────────────────────────────────────────────────────────────┘
  ┌──────────────────┐                  ┌────────────────────────┐
  │    core.roles    │                  │    core.permissions    │
  ├──────────────────┤                  ├────────────────────────┤
  │ PK │ id (UUID)   │                  │ PK │ id (UUID)         │
  │    │ name        │                  │    │ name              │
  │    │ description │                  │    │ description       │
  └─────┬────────────┘                  └───────────┬────────────┘
        │                                           │
        │ 1:N                                       │ 1:N
        ▼                                           ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                    core.role_permissions                     │
  ├──────────────────────────────────────────────────────────────┤
  │ PK │ id (UUID)                                               │
  │ FK │ role_id  (Cascade)                                      │
  │ FK │ permission_id (Cascade)                                 │
  │ UQ │ Unique(role_id, permission_id)                          │
  └──────────────────────────────────────────────────────────────┘
        ▲
        │ 1:N
        │
  ┌──────────────────────────────────────────────────────────────┐
  │                    core.admin_user_roles                     │
  ├──────────────────────────────────────────────────────────────┤
  │ PK │ id (UUID)                                               │
  │ FK │ admin_user_id (Cascade)                                 │
  │ FK │ role_id (Cascade)                                       │
  │ UQ │ Unique(admin_user_id, role_id)                          │
  └──────────────────────────────────────────────────────────────┘
        ▲
        │ 1:N (From auth.admin_users)
        │

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                AUDIT SCHEMA                                 │
 └─────────────────────────────────────────────────────────────────────────────┘
  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐
  │         audit.audit_logs         │  │      audit.security_events       │
  ├──────────────────────────────────┤  ├──────────────────────────────────┤
  │ PK │ id (UUID)                   │  │ PK │ id (UUID)                   │
  │ FK │ admin_user_id (Set Null)    │  │ FK │ admin_user_id (Set Null)    │
  │    │ event_type                  │  │    │ event_type                  │
  │    │ description                 │  │    │ severity (LOW/MED/HIGH/CRIT)│
  │    │ correlation_id (UUID)       │◄─┼───┐ ip_address                  │
  │    │ ip_address                  │  │   │ user_agent                  │
  │    │ user_agent                  │  │   └─────────────────────────────┘
  │    │ payload (JSONB)             │  │   
  └──────────────────────────────────┘  └──────────────────────────────────┘
```

---

## 3. Index Strategy
Indexes are strategically provisioned to ensure fast query times and robust lookups:

1. **`auth.admin_users`**:
   - `idx_admin_users_email` (B-Tree on `email`): Accelerates login credentials scanning.
   - `idx_admin_users_phone` (B-Tree on `phone_number`): Accelerates unique checks and SMS MFA lookups.
   - `idx_admin_users_last_login` (B-Tree on `last_login_at`): Maximizes scanning speeds of stale accounts/auditing.
2. **`auth.sessions`**:
   - `idx_sessions_user` (B-Tree on `admin_user_id`): Enables fast active session lists or revocations per user.
   - `idx_sessions_refresh_hash` (B-Tree on `refresh_token_hash`): Accelerates session continuation and verification checks.
   - `idx_sessions_revoked_at` (B-Tree on `revoked_at`): Instantly filters active/revoked identifiers.
3. **`auth.otp_challenges`**:
   - `idx_otp_challenges_user_state` (Composite on `admin_user_id, is_used`): Retreival optimization of valid verification challenges.
   - `idx_otp_challenges_expiry` (B-Tree on `expires_at`): Fast cleanup sweeps.
4. **`auth.password_reset_requests`**:
   - `idx_pwd_resets_token_hash` (B-Tree on `token_hash`): Speeds up validation of password recovery forms.
5. **`core.role_permissions` & `core.admin_user_roles`**:
   - Foreign key indexing compiles active permissions instantly during session launch.
6. **`audit.audit_logs` & `audit.security_events`**:
   - `idx_audit_logs_correlation_id` (B-Tree on `correlation_id`): Links session sign-in, MFA generation, validation, and actions together within a single request context lifecycle.
   - Composite indices on event severity, types, IPs, and creation dates simplify fast threat detection lookups.

---

## 4. Rollback Strategy
If any issues arise during deployment, execution of the following idempotent query tears down the database structures:

```sql
-- ROLLBACK SCHEMA FOR ADMIN ENTIRE STRUCTURE
DROP TABLE IF EXISTS audit.security_events CASCADE;
DROP TABLE IF EXISTS audit.audit_logs CASCADE;
DROP TABLE IF EXISTS core.admin_user_roles CASCADE;
DROP TABLE IF EXISTS core.role_permissions CASCADE;
DROP TABLE IF EXISTS core.permissions CASCADE;
DROP TABLE IF EXISTS core.roles CASCADE;
DROP TABLE IF EXISTS auth.password_reset_requests CASCADE;
DROP TABLE IF EXISTS auth.otp_challenges CASCADE;
DROP TABLE IF EXISTS auth.sessions CASCADE;
DROP TABLE IF EXISTS auth.admin_users CASCADE;

DROP SCHEMA IF EXISTS audit CASCADE;
DROP SCHEMA IF EXISTS core CASCADE;
DROP SCHEMA IF EXISTS auth CASCADE;
```

---

## 5. Security & SaaS Database Review Report (Phase 1A Audit Completed)
The database structure has been fully audited against high-level financial and multi-tenant security priorities:
- **Foreign Key Actions**: Deleting user accounts deletes associated secret components cascadedly (`ON DELETE CASCADE`), while corporate audit logs are safely kept via `ON DELETE SET NULL` to preserve historical integrity.
- **Constraints Hardening**: Added explicit database check constraint `chk_otp_type` confirming that `type` values can *only* be `'EMAIL'` or `'PHONE'`.
- **Role Permission Integrity**: Verified that Super Admin receives authentic and all-encompassing system access permissions, resolving the incorrect mapping leakage from the initial prototype seed data.
- **Correlation Engine**: The `correlation_id` uuid maps actions across the microservices landscape, facilitating accurate investigations during incidents.
- **Risk-Based Security**: Sensitive operations (price changes, refunds, settings) prompt phone OTP verification, and net changes do not automatically clear sessions but log security alerts.
