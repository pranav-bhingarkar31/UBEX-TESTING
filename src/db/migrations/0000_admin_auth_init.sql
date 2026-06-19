-- ==========================================
-- PHASE 1A — DATABASE FOUNDATION MIGRATION (REVISED)
-- DESCRIPTION: Sets up 'auth', 'core', and 'audit' schemas with strict, highly secured table structures, parameters, constraints, and indices.
-- ==========================================

-- Create distinct namespace schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS audit;

-- Enable UUID extension globally if not active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. AUTH SCHEMA TABLES
-- ==========================================

-- auth.admin_users
CREATE TABLE IF NOT EXISTS auth.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(30) NULL UNIQUE, -- Supports future SMS/MFA verification
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    password_hash VARCHAR(255) NOT NULL, -- Securely hashed Argon2id password
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE NULL,
    password_changed_at TIMESTAMP WITH TIME ZONE NULL, -- Password expiration & policy tracking
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE NULL, -- Audit trail logging
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- auth.sessions
CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_fingerprint VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL, -- Supports both IPv4 and IPv6 string bounds
    is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE NULL, -- Revocation & force logout action
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Idle timeout tracker
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_admin_user FOREIGN KEY (admin_user_id) 
        REFERENCES auth.admin_users(id) ON DELETE CASCADE
);

-- auth.otp_challenges
CREATE TABLE IF NOT EXISTS auth.otp_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'EMAIL' | 'PHONE'
    destination VARCHAR(255) NOT NULL, -- Target address or phone dial
    otp_hash VARCHAR(255) NOT NULL, -- Secured Argon2id/salted OTP hash
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otp_challenges_admin_user FOREIGN KEY (admin_user_id) 
        REFERENCES auth.admin_users(id) ON DELETE CASCADE,
    CONSTRAINT chk_otp_type CHECK (type IN ('EMAIL', 'PHONE')) -- Database-level constraint hardening
);

-- auth.password_reset_requests
CREATE TABLE IF NOT EXISTS auth.password_reset_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL, -- Securely hashed token string
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_requests_admin_user FOREIGN KEY (admin_user_id) 
        REFERENCES auth.admin_users(id) ON DELETE CASCADE
);


-- ==========================================
-- 2. CORE SCHEMA TABLES (RBAC)
-- ==========================================

-- core.roles
CREATE TABLE IF NOT EXISTS core.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE, -- 'SUPER_ADMIN' | 'OPERATIONS_ADMIN' | 'BOOKING_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN'
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- core.permissions
CREATE TABLE IF NOT EXISTS core.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'refund:execute', 'admin:create', 'price:bulk_update'
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- core.role_permissions (Composite keys & unique constraints)
CREATE TABLE IF NOT EXISTS core.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) 
        REFERENCES core.roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) 
        REFERENCES core.permissions(id) ON DELETE CASCADE,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- core.admin_user_roles (Composite keys & unique mapping)
CREATE TABLE IF NOT EXISTS core.admin_user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_user_roles_user FOREIGN KEY (admin_user_id) 
        REFERENCES auth.admin_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_user_roles_role FOREIGN KEY (role_id) 
        REFERENCES core.roles(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_role UNIQUE (admin_user_id, role_id)
);


-- ==========================================
-- 3. AUDIT SCHEMA TABLES (COMPLIANCE & TRACING)
-- ==========================================

-- audit.audit_logs
CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NULL, -- Null if action occurred before session initialization/during failure
    event_type VARCHAR(100) NOT NULL, -- 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'OTP_SUCCESS', 'ROLE_CHANGE', etc.
    description TEXT NOT NULL,
    correlation_id UUID NULL, -- Groups related events in single execution block context
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload JSONB NULL, -- Flexible details (changed properties without secrets, metadata)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (admin_user_id) 
        REFERENCES auth.admin_users(id) ON DELETE SET NULL
);

-- audit.security_events
CREATE TABLE IF NOT EXISTS audit.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NULL,
    event_type VARCHAR(100) NOT NULL, -- 'FAILED_OTP', 'BRUTE_FORCE_ATTEMPT', 'SUSPICIOUS_LOGIN', etc.
    severity VARCHAR(20) NOT NULL, -- 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    description TEXT NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_security_events_user FOREIGN KEY (admin_user_id) 
        REFERENCES auth.admin_users(id) ON DELETE SET NULL,
    CONSTRAINT chk_security_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);


-- ==========================================
-- 4. PERFORMANCE & SECURITY INDEX STRATEGY
-- ==========================================

-- Users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON auth.admin_users (email);
CREATE INDEX IF NOT EXISTS idx_admin_users_phone ON auth.admin_users (phone_number);
CREATE INDEX IF NOT EXISTS idx_admin_users_last_login ON auth.admin_users (last_login_at);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth.sessions (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_hash ON auth.sessions (refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked_at ON auth.sessions (revoked_at);

-- OTP Challenges
CREATE INDEX IF NOT EXISTS idx_otp_challenges_user_state ON auth.otp_challenges (admin_user_id, is_used);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_expiry ON auth.otp_challenges (expires_at);

-- Password Resets
CREATE INDEX IF NOT EXISTS idx_pwd_resets_token_hash ON auth.password_reset_requests (token_hash);
CREATE INDEX IF NOT EXISTS idx_pwd_resets_user_state ON auth.password_reset_requests (admin_user_id, is_used);

-- RBAC Mappings
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON core.role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON core.role_permissions (permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON core.admin_user_roles (admin_user_id);

-- Logging & Security Tracing
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit.audit_logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit.audit_logs (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON audit.audit_logs (correlation_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON audit.security_events (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON audit.security_events (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON audit.security_events (admin_user_id);
