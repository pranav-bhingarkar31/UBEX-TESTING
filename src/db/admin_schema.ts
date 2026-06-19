import { pgSchema, text, timestamp, boolean, integer, uuid, unique, index, jsonb } from "drizzle-orm/pg-core";

// ==========================================
// CUSTOM POSTGRESQL SCHEMAS
// ==========================================
export const authSchema = pgSchema("auth");
export const coreSchema = pgSchema("core");
export const auditSchema = pgSchema("audit");

// ==========================================
// AUTH SCHEMA TABLES
// ==========================================

// auth.admin_users
export const adminUsers = authSchema.table(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    phoneNumber: text("phone_number").unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    passwordHash: text("password_hash").notNull(), // Argon2id hash storage
    isActive: boolean("is_active").default(true).notNull(),
    isMfaEnabled: boolean("is_mfa_enabled").default(false).notNull(),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until", { precision: 6, withTimezone: true }),
    lastFailedLoginAt: timestamp("last_failed_login_at", { precision: 6, withTimezone: true }),
    passwordChangedAt: timestamp("password_changed_at", { precision: 6, withTimezone: true }),
    mustChangePassword: boolean("must_change_password").default(false).notNull(),
    lastLoginAt: timestamp("last_login_at", { precision: 6, withTimezone: true }),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_users_email_idx").on(table.email),
    index("admin_users_phone_number_idx").on(table.phoneNumber),
    index("admin_users_last_login_idx").on(table.lastLoginAt),
  ]
);

// auth.sessions
export const sessions = authSchema.table(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    deviceFingerprint: text("device_fingerprint"),
    ipAddress: text("ip_address"),
    deviceName: text("device_name"),
    browser: text("browser"),
    platform: text("platform"),
    isSuspicious: boolean("is_suspicious").default(false).notNull(),
    revokedAt: timestamp("revoked_at", { precision: 6, withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("sessions_admin_user_id_idx").on(table.adminUserId),
    index("sessions_refresh_token_hash_idx").on(table.refreshTokenHash),
    index("sessions_revoked_at_idx").on(table.revokedAt),
  ]
);

// auth.otp_challenges
export const otpChallenges = authSchema.table(
  "otp_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(), // 'EMAIL' | 'PHONE'
    destination: text("destination").notNull(), // Recipient's email or phone number
    otpHash: text("otp_hash").notNull(), // Securely hashed OTP code
    retryCount: integer("retry_count").default(0).notNull(),
    maxRetries: integer("max_retries").default(3).notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("otp_challenges_user_used_idx").on(table.adminUserId, table.isUsed),
    index("otp_challenges_expires_at_idx").on(table.expiresAt),
  ]
);

// auth.password_reset_requests
export const passwordResetRequests = authSchema.table(
  "password_reset_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: text("token_hash").notNull(), // Securely hashed reset token
    isUsed: boolean("is_used").default(false).notNull(),
    expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("password_reset_requests_user_used_idx").on(table.adminUserId, table.isUsed),
    index("password_reset_requests_token_hash_idx").on(table.tokenHash),
  ]
);

// ==========================================
// CORE SCHEMA TABLES (RBAC)
// ==========================================

// core.roles
export const roles = coreSchema.table(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(), // 'SUPER_ADMIN' | 'OPERATIONS_ADMIN' | 'BOOKING_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN'
    description: text("description"),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("roles_name_idx").on(table.name),
  ]
);

// core.permissions
export const permissions = coreSchema.table(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(), // e.g., 'refund:execute', 'admin:create', 'price:bulk_update'
    description: text("description"),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("permissions_name_idx").on(table.name),
  ]
);

// core.role_permissions
export const rolePermissions = coreSchema.table(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    permissionId: uuid("permission_id")
      .references(() => permissions.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("role_id_permission_id_unq").on(table.roleId, table.permissionId),
    index("role_permissions_role_id_idx").on(table.roleId),
    index("role_permissions_permission_id_idx").on(table.permissionId),
  ]
);

// core.admin_user_roles
export const adminUserRoles = coreSchema.table(
  "admin_user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("admin_user_id_role_id_unq").on(table.adminUserId, table.roleId),
    index("admin_user_roles_user_id_idx").on(table.adminUserId),
    index("admin_user_roles_role_id_idx").on(table.roleId),
  ]
);

// ==========================================
// AUDIT SCHEMA TABLES (COMPLIANCE & IR)
// ==========================================

// audit.audit_logs
export const auditLogs = auditSchema.table(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "set null" }), // Nullable for events before final verification
    eventType: text("event_type").notNull(), // 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'OTP_SUCCESS' | 'ROLE_CHANGE' | etc.
    description: text("description").notNull(),
    correlationId: uuid("correlation_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    payload: jsonb("payload"), // Encoded metadata, modified parameters
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_event_type_created_at_idx").on(table.eventType, table.createdAt),
    index("audit_logs_user_id_idx").on(table.adminUserId),
    index("audit_logs_correlation_id_idx").on(table.correlationId),
  ]
);

// audit.security_events
export const securityEvents = auditSchema.table(
  "security_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(), // 'FAILED_OTP' | 'BRUTE_FORCE_ATTEMPT' | 'SUSPICIOUS_LOGIN' | etc.
    severity: text("severity").notNull(), // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    description: text("description").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("security_events_severity_idx").on(table.severity),
    index("security_events_ip_created_at_idx").on(table.ipAddress, table.createdAt),
    index("security_events_user_id_idx").on(table.adminUserId),
  ]
);

// auth.password_history
export const passwordHistory = authSchema.table(
  "password_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("password_history_admin_user_id_idx").on(table.adminUserId),
  ]
);

// audit.notifications
export const notifications = auditSchema.table(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .references(() => adminUsers.id, { onDelete: "cascade" }), // Nullable for global/system-wide notifications
    type: text("type").notNull(), // 'booking' | 'vendor' | 'security' | 'refund' | 'error'
    title: text("title").notNull(),
    content: text("content").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_admin_user_id_idx").on(table.adminUserId),
    index("notifications_type_idx").on(table.type),
    index("notifications_is_read_idx").on(table.isRead),
  ]
);

