import crypto from "crypto";
import { getDb } from "../db/dbClient";
import { passwordResetRequests, adminUsers, passwordHistory } from "../db/admin_schema";
import { eq, and, desc } from "drizzle-orm";
import { SecurityService } from "./audit.service";
import { SessionService } from "./session.service";
import { ApiError, ApiErrorCode } from "../utils/apiResponse";
import { validatePasswordStrength } from "./adminAuth.service";
import { verifyPassword, hashPassword } from "../utils/crypto";

/**
 * Service managing cryptographically isolated single-use administrator password reset requests.
 */
export const PasswordResetService = {
  /**
   * Generates a 32-byte security token, registers its SHA-256 representation, and returns raw token.
   */
  async requestReset(
    email: string,
    correlationId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    const db = getDb();
    
    // Find matching operator profile
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.trim().toLowerCase()))
      .limit(1);

    if (!user) {
      throw new ApiError(404, ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Administrator email address not found.");
    }

    // Spawn 32-byte secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lifetime

    await db.insert(passwordResetRequests).values({
      adminUserId: user.id,
      tokenHash,
      isUsed: false,
      expiresAt,
    });

    await SecurityService.logAudit({
      adminUserId: user.id,
      eventType: "PASSWORD_RESET_REQUESTED",
      description: `A password reset operation has been initiated for administrative seat: ${email}`,
      correlationId,
      ipAddress,
      userAgent,
    });

    return rawToken;
  },

  /**
   * Confirms token correctness, validates password strength, checks previous 5 reuses, updates credentials, and evicts sessions.
   */
  async confirmReset(
    rawToken: string,
    newPlainPassword: string,
    correlationId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const db = getDb();
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const [request] = await db
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.tokenHash, tokenHash))
      .limit(1);

    if (!request) {
      throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Password reset token is unrecognized or invalid.");
    }

    if (request.isUsed) {
      throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Password reset token has already been consumed.");
    }

    if (new Date() > new Date(request.expiresAt)) {
      throw new ApiError(400, ApiErrorCode.AUTH_OTP_EXPIRED, "Password reset token has expired.");
    }

    // Get target admin user
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, request.adminUserId))
      .limit(1);

    if (!user) {
      throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Target administrator profile not found.");
    }

    // 1. Validate password strength policies
    validatePasswordStrength(newPlainPassword);

    // 2. Prevent reuse of any matching last 5 passwords
    const oldEntries = await db
      .select()
      .from(passwordHistory)
      .where(eq(passwordHistory.adminUserId, user.id))
      .orderBy(desc(passwordHistory.createdAt))
      .limit(5);

    for (const old of oldEntries) {
      const match = await verifyPassword(newPlainPassword, old.passwordHash);
      if (match) {
        throw new ApiError(400, ApiErrorCode.AUTH_PASSWORD_REUSE_PROHIBITED, "Security policy violation: Password cannot match any of your last 5 previous passwords.");
      }
    }

    // Direct comparison against current password hash
    const matchCurrent = await verifyPassword(newPlainPassword, user.passwordHash);
    if (matchCurrent) {
      throw new ApiError(400, ApiErrorCode.AUTH_PASSWORD_REUSE_PROHIBITED, "Security policy violation: Password cannot match any of your last 5 previous passwords.");
    }

    const newPasswordHash = await hashPassword(newPlainPassword);

    // Mark token as used immediately to avoid double spend/replay operations
    await db
      .update(passwordResetRequests)
      .set({ isUsed: true })
      .where(eq(passwordResetRequests.id, request.id));

    // Commit password override and flag forced password change for next login validation
    const now = new Date();
    await db
      .update(adminUsers)
      .set({
        passwordHash: newPasswordHash,
        passwordChangedAt: now,
        mustChangePassword: true, // Forces password rotation on first login after recovery reset
        failedLoginAttempts: 0, // Reset lockout state variables
        lockedUntil: null,
        updatedAt: now,
      })
      .where(eq(adminUsers.id, request.adminUserId));

    // Commit password to reuse history indexes
    await db.insert(passwordHistory).values({
      adminUserId: request.adminUserId,
      passwordHash: newPasswordHash,
      createdAt: now,
    });

    // Trigger full session cleanup (Force immediate global reauthentication on all devices)
    await SessionService.revokeAllUserSessions(request.adminUserId, correlationId, ipAddress, userAgent);

    await SecurityService.logAudit({
      adminUserId: request.adminUserId,
      eventType: "PASSWORD_RESET_COMPLETED",
      description: "Password reset sequence executed successfully. Security context refreshed.",
      correlationId,
      ipAddress,
      userAgent,
    });
  }
};
export default PasswordResetService;
