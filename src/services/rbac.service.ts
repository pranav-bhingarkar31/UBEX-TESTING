import { getDb } from "../db/dbClient";
import { roles, permissions, rolePermissions, adminUserRoles } from "../db/admin_schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Service managing Role-Based Access Control and Privilege mappings.
 */
export const RbacService = {
  /**
   * Safe-seeds roles and permissions structure to avoid cold start issues.
   */
  async seedRolesAndPermissions(): Promise<void> {
    try {
      const db = getDb();

      // Check if roles exist
      const existingRoles = await db.select().from(roles).limit(1);
      if (existingRoles.length > 0) return; // Seeding already performed

      console.log("[RBAC] Database is empty. Seeding roles and permissions...");

      // 1. Core operational roles
      const seededRoles = await db.insert(roles).values([
        { name: "SUPER_ADMIN", description: "Unrestricted operational configuration access master" },
        { name: "OPERATIONS_ADMIN", description: "Full inventory, booking controls and reviews moderation" },
        { name: "BOOKING_ADMIN", description: "Access limited exclusively to customer booking writes/reads" },
        { name: "FINANCE_ADMIN", description: "Audit trail reads, bulk prices tweaks, financial refund routines" },
        { name: "SUPPORT_ADMIN", description: "Interactive user assistance, support ticketing routines" }
      ]).returning();

      // 2. Define permission matrices (Standard operations and the future Analytics targets)
      const seededPermissions = await db.insert(permissions).values([
        { name: "admin:create", description: "Provision other internal operator profiles" },
        { name: "role:modify", description: "Edit roles privileges linkages and hierarchies" },
        { name: "security:modify_settings", description: "Change global security bounds, OTP, and session limits" },
        { name: "refund:execute", description: "Commit customer order reverse payments" },
        { name: "price:bulk_update", description: "Update stays & experiences bulk pricing variables" },
        { name: "booking:write", description: "Perform customer reservation overrides" },
        { name: "booking:read", description: "Inspect and query traveler reservations logs" },
        { name: "review:moderate", description: "Approve, hold, or reject guest reviews feeds" },
        { name: "inventory:write", description: "Edit properties, rooms, dynamic allocations info" },
        { name: "support:ticket_write", description: "Acknowledge and reply client support chats" },
        { name: "audit:read", description: "Inspect raw security event alerts and admin audit logs" },
        { name: "analytics:view", description: "View dashboard aggregate reports metrics" },
        { name: "analytics:revenue", description: "Inspect premium checkout billing and ledger data" },
        { name: "analytics:conversion", description: "Query analytics funnel ratios and dropoffs details" },
        { name: "analytics:export", description: "Download spreadsheet representations of systems indicators" }
      ]).returning();

      // Helper map roles mapping names -> database records
      const roleMap = new Map<string, string>(seededRoles.map(r => [r.name as string, r.id as string]));
      const permMap = new Map<string, string>(seededPermissions.map(p => [p.name as string, p.id as string]));

      // 3. Link permissions to roles
      const superAdminPermissions = Array.from(permMap.values());
      const operationsPermissions = [
        "booking:read", "booking:write", "review:moderate", "inventory:write", "support:ticket_write"
      ].map(n => permMap.get(n) as string).filter(Boolean);

      const bookingPermissions = [
        "booking:read", "booking:write", "support:ticket_write"
      ].map(n => permMap.get(n) as string).filter(Boolean);

      const financePermissions = [
        "refund:execute", "price:bulk_update", "booking:read", "audit:read"
      ].map(n => permMap.get(n) as string).filter(Boolean);

      const supportPermissions = [
        "booking:read", "support:ticket_write", "review:moderate"
      ].map(n => permMap.get(n) as string).filter(Boolean);

      // Build joint table links
      const rpLinks: Array<{ roleId: string; permissionId: string }> = [];

      const addLinks = (roleName: string, pIds: string[]) => {
        const roleId = roleMap.get(roleName);
        if (roleId) {
          pIds.forEach(permissionId => {
            rpLinks.push({ roleId, permissionId });
          });
        }
      };

      addLinks("SUPER_ADMIN", superAdminPermissions);
      addLinks("OPERATIONS_ADMIN", operationsPermissions);
      addLinks("BOOKING_ADMIN", bookingPermissions);
      addLinks("FINANCE_ADMIN", financePermissions);
      addLinks("SUPPORT_ADMIN", supportPermissions);

      await db.insert(rolePermissions).values(rpLinks);
      console.log("[RBAC] Verification tables seed complete!");
    } catch (error) {
      console.error("RBAC seed execution fault omitted:", error);
    }
  },

  /**
   * Resolves roles and privilege matrices associated with caller id.
   */
  async resolveUserRbac(adminUserId: string): Promise<{ roles: string[]; permissions: string[] }> {
    const db = getDb();
    
    // Ensure seeding is completed in case of cold start
    await this.seedRolesAndPermissions();

    // 1. Fetch user roles list
    const userRoleBindings = await db
      .select({
        roleName: roles.name,
        roleId: roles.id
      })
      .from(adminUserRoles)
      .innerJoin(roles, eq(adminUserRoles.roleId, roles.id))
      .where(eq(adminUserRoles.adminUserId, adminUserId));

    const roleNames = userRoleBindings.map(b => b.roleName as string);
    const roleIds = userRoleBindings.map(b => b.roleId as string);

    if (roleIds.length === 0) {
      return { roles: [], permissions: [] };
    }

    // 2. Fetch associated permissions list
    const resolvedPermissions = await db
      .select({
        permName: permissions.name
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds));

    const permissionNames: string[] = Array.from(new Set<string>(resolvedPermissions.map(p => p.permName as string)));

    return {
      roles: roleNames,
      permissions: permissionNames
    };
  },

  /**
   * Validates if caller userId maintains requisite permission target.
   */
  async hasPermission(adminUserId: string, requiredPermission: string): Promise<boolean> {
    const { permissions: userPerms } = await this.resolveUserRbac(adminUserId);
    return userPerms.includes(requiredPermission);
  },

  /**
   * Assigns a role to an administrator user.
   */
  async assignRoleToUser(adminUserId: string, roleName: string): Promise<void> {
    const db = getDb();
    const [matchedRole] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
    if (!matchedRole) {
      throw new Error(`Role name '${roleName}' is unknown to RBAC matrix.`);
    }

    await db.insert(adminUserRoles).values({
      adminUserId,
      roleId: matchedRole.id,
    }).onConflictDoNothing();
  }
};
