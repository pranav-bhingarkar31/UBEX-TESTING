import { getDb } from "../db/dbClient";
import { adminUsers, passwordHistory } from "../db/admin_schema";
import { eq, desc } from "drizzle-orm";
import { verifyPassword, hashPassword } from "../utils/crypto";
import { SecurityService } from "./audit.service";
import { SessionService } from "./session.service";
import { RbacService } from "./rbac.service";
import { ApiError, ApiErrorCode } from "../utils/apiResponse";
import crypto from "crypto";

/**
 * Standard password policy strength verification.
 */
export function validatePasswordStrength(password: string): void {
  if (password.length < 12) {
    throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Password must be at least 12 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Password must contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Password must contain at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Password must contain at least one number.");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Password must contain at least one special character.");
  }
}

/**
 * Enterprise Admin User Authentication & Lockout state orchestration engine.
 */
export const AdminAuthService = {
  /**
   * Registers a new administrator user profile (primarily for provisioning and seeding).
   */
  async registerAdmin(input: {
    email: string;
    passwordPlain: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    rolesList: string[];
    isSeed?: boolean;
    isTemporary?: boolean;
  }): Promise<any> {
    const db = getDb();
    const emailNorm = input.email.trim().toLowerCase();

    // Verify uniqueness
    const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, emailNorm)).limit(1);
    if (existing) {
      throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "An administrator with this email already exists.");
    }

    // Force strict strength enforcement on user creations
    validatePasswordStrength(input.passwordPlain);

    const passwordHash = await hashPassword(input.passwordPlain);
    const now = new Date();

    // Set passwordChangedAt to null for seeds of bootstrap to trigger forced first-session rotation
    const passwordChangedAt = input.isSeed ? null : now;
    const mustChangePassword = (input.isSeed || input.isTemporary) ? true : false;

    const [inserted] = await db.insert(adminUsers).values({
      email: emailNorm,
      passwordHash,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
      phoneNumber: input.phoneNumber || null,
      isActive: true,
      failedLoginAttempts: 0,
      passwordChangedAt,
      mustChangePassword,
    }).returning();

    // Attach role identities
    for (const roleName of input.rolesList) {
      await RbacService.assignRoleToUser(inserted.id, roleName);
    }

    // Capture initial password into the reuse history index tracking
    await db.insert(passwordHistory).values({
      adminUserId: inserted.id,
      passwordHash,
      createdAt: now,
    });

    return inserted;
  },

  /**
   * Authenticates caller, verifying locking bounds, increments failed trials and triggers security logs on lockout.
   */
  async authenticateAdmin(
    email: string,
    passwordPlain: string,
    correlationId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ adminUserId: string; email: string; roles: string[]; permissions: string[] }> {
    const db = getDb();
    const emailNorm = email.trim().toLowerCase();

    let [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, emailNorm)).limit(1);

    if (!user) {
      // Lazy-seed check: if no administrator records exist at all, auto-provision default super-admin
      const allAdmins = await db.select().from(adminUsers).limit(1);
      
      const seedEmail = (process.env.ADMIN_SEED_EMAIL || "").trim().toLowerCase();
      const seedPassword = (process.env.ADMIN_SEED_PASSWORD || "").trim();

      if (process.env.NODE_ENV === "production" && (!seedEmail || !seedPassword)) {
        throw new ApiError(500, ApiErrorCode.AUTH_FORBIDDEN, "Critical configuration mismatch: Production ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be configured.");
      }

      if (allAdmins.length === 0 && seedEmail !== "" && emailNorm === seedEmail) {
        if (process.env.NODE_ENV === "production" && (seedEmail === "admin@ubex.com" || seedPassword === "P@ssword123!")) {
          throw new ApiError(500, ApiErrorCode.AUTH_FORBIDDEN, "Production security policy block: Default initial credentials 'admin@ubex.com' or 'P@ssword123!' are prohibited in production.");
        }

        console.log(`[AUTH] Seed active: Provisioning administrative master bootstrap profile: ${seedEmail}`);
        // Ensure RBAC core templates are provisioned first
        await RbacService.seedRolesAndPermissions();

        await this.registerAdmin({
          email: seedEmail,
          passwordPlain: seedPassword,
          firstName: "Alexander",
          lastName: "Hamil",
          phoneNumber: "+91 9876549051",
          rolesList: ["SUPER_ADMIN"],
          isSeed: true, // Forces first-login password rotation flow
        });

        // Re-query database record
        const [reUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, emailNorm)).limit(1);
        user = reUser;
      }
    }

    if (!user) {
      // Zero leakage: Disclose nothing to potential scan/enumeration attempts
      await SecurityService.logAudit({
        adminUserId: null,
        eventType: "LOGIN_FAILURE",
        description: `Failed credentials check for unknown administrative identity: ${emailNorm}`,
        correlationId,
        ipAddress,
        userAgent,
      });
      throw new ApiError(401, ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid administrator email or password.");
    }

    const now = new Date();

    // 1. Evaluate Lockout Bounds
    if (user.lockedUntil && now < new Date(user.lockedUntil)) {
      await SecurityService.logAudit({
        adminUserId: user.id,
        eventType: "LOGIN_FAILURE",
        description: `Credentials match rejected due to ongoing administrative security lockout (expires: ${user.lockedUntil.toISOString()}).`,
        correlationId,
        ipAddress,
        userAgent,
      });
      throw new ApiError(401, ApiErrorCode.AUTH_ACCOUNT_LOCKED, `Account locked due to multiple failed access attempts. Try again after ${user.lockedUntil.toLocaleTimeString()}`);
    }

    // 2. State verification check
    if (!user.isActive) {
      await SecurityService.logAudit({
        adminUserId: user.id,
        eventType: "LOGIN_FAILURE",
        description: "Credentials matched but target profile is suspended / flagged as active=false.",
        correlationId,
        ipAddress,
        userAgent,
      });
      throw new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "This administrator account is currently suspended.");
    }

    // 3. Cryptographic Verification
    const isMatched = await verifyPassword(passwordPlain, user.passwordHash);

    if (!isMatched) {
      const updatedFailCount = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (updatedFailCount >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lockout lock
        
        await SecurityService.logSecurityEvent({
          adminUserId: user.id,
          eventType: "ACCOUNT_LOCKED",
          severity: "CRITICAL",
          description: `Administrator account ${emailNorm} locked out for 30 minutes after 5 continuous failed attempts.`,
          ipAddress,
          userAgent,
        });

        await SecurityService.logAudit({
          adminUserId: user.id,
          eventType: "ACCOUNT_LOCKED",
          description: `Security Lockout Triggered: profile disabled for 30 minutes. failed_count: ${updatedFailCount}`,
          correlationId,
          ipAddress,
          userAgent,
        });
      } else if (updatedFailCount >= 3) {
        await SecurityService.logSecurityEvent({
          adminUserId: user.id,
          eventType: "MULTIPLE_FAILED_LOGINS",
          severity: "MEDIUM",
          description: `Multiple failed logins on administrative account slot ${emailNorm} (Failed: ${updatedFailCount}/5).`,
          ipAddress,
          userAgent,
        });
      }

      await db
        .update(adminUsers)
        .set({
          failedLoginAttempts: updatedFailCount,
          lockedUntil,
          lastFailedLoginAt: now,
          updatedAt: now,
        })
        .where(eq(adminUsers.id, user.id));

      await SecurityService.logAudit({
        adminUserId: user.id,
        eventType: "LOGIN_FAILURE",
        description: `Invalid password specified for identifier: ${emailNorm}. Continuous failed: ${updatedFailCount}`,
        correlationId,
        ipAddress,
        userAgent,
      });

      throw new ApiError(401, ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid administrator email or password.");
    }

    // 4. Force First Login Password Rotation Policy checks (including seeds, temporary, and password reset recovery logins)
    if (user.passwordChangedAt === null || user.mustChangePassword === true) {
      // Record failed counter reset but keep lockout clear
      await db
        .update(adminUsers)
        .set({
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: now,
        })
        .where(eq(adminUsers.id, user.id));

      await SecurityService.logAudit({
        adminUserId: user.id,
        eventType: "LOGIN_FAILURE",
        description: `Credentials checked successfully for ${emailNorm} but blocked: Forced password rotation compliance required (mustChangePassword: ${user.mustChangePassword || "false"}).`,
        correlationId,
        ipAddress,
        userAgent,
      });

      throw new ApiError(403, ApiErrorCode.AUTH_PASSWORD_CHANGE_REQUIRED, "Administrative security rotation required. Please perform secure password rotation.");
    }

    // 5. Clean up failed metrics upon successful login matches
    await db
      .update(adminUsers)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(adminUsers.id, user.id));

    // 6. Fetch privileges list (RBAC)
    const { roles: userRoles, permissions: userPerms } = await RbacService.resolveUserRbac(user.id);

    await SecurityService.logAudit({
      adminUserId: user.id,
      eventType: "LOGIN_SUCCESS",
      description: `Administrator ${emailNorm} signed in successfully. Session cookies established.`,
      correlationId,
      ipAddress,
      userAgent,
      payload: { assignedRoles: userRoles },
    });

    return {
      adminUserId: user.id,
      email: user.email,
      roles: userRoles,
      permissions: userPerms,
    };
  },

  /**
   * First-login password rotation flow. Matches current credentials, validates strength, checks previous 5 reuses.
   */
  async rotatePassword(
    email: string,
    currentPlain: string,
    newPlain: string,
    correlationId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const db = getDb();
    const emailNorm = email.trim().toLowerCase();

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, emailNorm)).limit(1);
    if (!user) {
      throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Operator record unrecognized.");
    }

    // 1. Verify current credentials match first
    const isMatched = await verifyPassword(currentPlain, user.passwordHash);
    if (!isMatched) {
      throw new ApiError(401, ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid current administrative credentials provided.");
    }

    // 2. Validate strength of the target password selection (12 chars, upper, lower, num, symbol)
    validatePasswordStrength(newPlain);

    // 3. Prevent reuse across previous 5 password entries
    const previousEntries = await db
      .select()
      .from(passwordHistory)
      .where(eq(passwordHistory.adminUserId, user.id))
      .orderBy(desc(passwordHistory.createdAt))
      .limit(5);

    for (const old of previousEntries) {
      const match = await verifyPassword(newPlain, old.passwordHash);
      if (match) {
        throw new ApiError(400, ApiErrorCode.AUTH_PASSWORD_REUSE_PROHIBITED, "Security policy violation: Password cannot match any of your last 5 previous passwords.");
      }
    }

    // Assert mismatch with actual current active password hash directly as well
    const matchCurrent = await verifyPassword(newPlain, user.passwordHash);
    if (matchCurrent) {
      throw new ApiError(400, ApiErrorCode.AUTH_PASSWORD_REUSE_PROHIBITED, "Security policy violation: Password cannot match any of your last 5 previous passwords.");
    }

    // 4. Update the DB credentials records
    const newHash = await hashPassword(newPlain);
    const now = new Date();

    await db
      .update(adminUsers)
      .set({
        passwordHash: newHash,
        passwordChangedAt: now,
        mustChangePassword: false, // User has executed rotation guidelines compliance successfully
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: now,
      })
      .where(eq(adminUsers.id, user.id));

    // 5. Commit hash to security history indexes
    await db.insert(passwordHistory).values({
      adminUserId: user.id,
      passwordHash: newHash,
      createdAt: now,
    });

    await SecurityService.logAudit({
      adminUserId: user.id,
      eventType: "PASSWORD_ROTATION",
      description: `Administrative password rotated successfully on first-login protocol compliance.`,
      correlationId,
      ipAddress,
      userAgent,
    });
  }
};
export default AdminAuthService;
