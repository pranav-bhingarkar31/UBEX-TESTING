-- ==========================================
-- PHASE 1A — INITIAL SEED DATA (REVISED & HARDENED)
-- DESCRIPTION: Seeds core administrator roles, permissions, and non-overlapping association mappings.
-- ==========================================

-- Clean-up existing relations first for reproducible states
TRUNCATE core.role_permissions CASCADE;
TRUNCATE core.admin_user_roles CASCADE;
TRUNCATE core.roles CASCADE;
TRUNCATE core.permissions CASCADE;

-- Insert core Roles
INSERT INTO core.roles (id, name, description) VALUES
('aa000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'Full system privilege with authorization configurations and security parameters reset capabilities.'),
('aa000000-0000-0000-0000-000000000002', 'OPERATIONS_ADMIN', 'Manage operations, outposts, stays, experiences and reviews moderation.'),
('aa000000-0000-0000-0000-000000000003', 'BOOKING_ADMIN', 'Manage client booking states, custom checkouts, and guest services.'),
('aa000000-0000-0000-0000-000000000004', 'FINANCE_ADMIN', 'Execute, review, and audit financial payments, invoices, currency configurations and processing refunds.'),
('aa000000-0000-0000-0000-000000000005', 'SUPPORT_ADMIN', 'Support ticket management, user logs inquiry, account support services.');

-- Insert specific permissions
INSERT INTO core.permissions (id, name, description) VALUES
-- System level high-securities
('bb000000-0000-0000-0000-000000000001', 'admin:create', 'Create and provision new administrative user identities.'),
('bb000000-0000-0000-0000-000000000002', 'role:modify', 'Assign, update, or rescind role mappings from administrators.'),
('bb000000-0000-0000-0000-000000000003', 'security:modify_settings', 'Modify structural security settings (lockouts, OTP rules, rate-limits).'),

-- Booking & Financials
('bb000000-0000-0000-0000-000000000004', 'refund:execute', 'Approve and execute payment refunds on financial processor rails.'),
('bb000000-0000-0000-0000-000000000005', 'price:bulk_update', 'Perform bulk adjustments to inventory pricing matrix across retreats.'),
('bb000000-0000-0000-0000-000000000006', 'booking:write', 'Create, update, cancel and override any active user bookings.'),
('bb000000-0000-0000-0000-000000000007', 'booking:read', 'Inquiry and view comprehensive Booking data elements.'),

-- Operations & Support
('bb000000-0000-0000-0000-000000000008', 'review:moderate', 'Inquire, approve, and filter reviews, diaries, and stories feed content.'),
('bb000000-0000-0000-0000-000000000009', 'inventory:write', 'Define, modify or suspend stay outposts, experience tours, details.'),
('bb000000-0000-0000-0000-000000000010', 'support:ticket_write', 'Manage, draft responses and close priority traveler support tickets.'),
('bb000000-0000-0000-0000-000000000011', 'audit:read', 'Retrieve, filter and analyze append-only logs and system security alerts.');


-- ==========================================
-- MAP PERMISSIONS TO ROLES
-- ==========================================

-- 1. SUPER_ADMIN: Gets ALL permissions
INSERT INTO core.role_permissions (role_id, permission_id) VALUES
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001'), -- admin:create
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000002'), -- role:modify (FIXED: correct Super Admin assignment mapping)
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000003'), -- security:modify_settings
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000004'), -- refund:execute
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000005'), -- price:bulk_update
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000006'), -- booking:write
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000007'), -- booking:read
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000008'), -- review:moderate
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000009'), -- inventory:write
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000010'), -- support:ticket_write
('aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000011'); -- audit:read

-- 2. OPERATIONS_ADMIN: Bookings, reviews, inventories, support-write
INSERT INTO core.role_permissions (role_id, permission_id) VALUES
('aa000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000006'), -- booking:write
('aa000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000007'), -- booking:read
('aa000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000008'), -- review:moderate
('aa000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000009'); -- inventory:write

-- 3. BOOKING_ADMIN: Write and read bookings, write support tickets
INSERT INTO core.role_permissions (role_id, permission_id) VALUES
('aa000000-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000006'), -- booking:write
('aa000000-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000007'), -- booking:read
('aa000000-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000010'); -- support:ticket_write

-- 4. FINANCE_ADMIN: Refunding, pricing matrices, booking inspection & audits
INSERT INTO core.role_permissions (role_id, permission_id) VALUES
('aa000000-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000004'), -- refund:execute
('aa000000-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000005'), -- price:bulk_update
('aa000000-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000007'), -- booking:read
('aa000000-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000011'); -- audit:read

-- 5. SUPPORT_ADMIN: Booking lookup, ticket response, logs lookup
INSERT INTO core.role_permissions (role_id, permission_id) VALUES
('aa000000-0000-0000-0000-000000000005', 'bb000000-0000-0000-0000-000000000007'), -- booking:read
('aa000000-0000-0000-0000-000000000005', 'bb000000-0000-0000-0000-000000000010'), -- support:ticket_write
('aa000000-0000-0000-0000-000000000005', 'bb000000-0000-0000-0000-000000000011'); -- audit:read
