import crypto from "crypto";
import { getDb } from "../db/dbClient";
import { otpChallenges } from "../db/admin_schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { SecurityService } from "./audit.service";
import { ApiError, ApiErrorCode } from "../utils/apiResponse";

/**
 * Service managing cryptographically secure OTP generation, storage hashing, and retry policies.
 */
export const OtpService = {
  /**
   * Generates a 6-digit code, hashes it, commits challenge state, and returns raw code.
   */
  async createChallenge(
    adminUserId: string,
    type: "EMAIL" | "PHONE",
    destination: string
  ): Promise<{ id: string; rawOtp: string }> {
    const rawOtp = crypto.randomInt(100000, 1000000).toString(); // Secure 6-digit OTP
    const otpHash = crypto.createHash("sha256").update(rawOtp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    const db = getDb();
    const [inserted] = await db.insert(otpChallenges).values({
      adminUserId,
      type,
      destination,
      otpHash,
      isUsed: false,
      retryCount: 0,
      maxRetries: 5,
      expiresAt,
    }).returning({ id: otpChallenges.id });

    if (type === "EMAIL") {
      try {
        const { EmailService } = await import("./email.service");
        // Centralized SMTP-backed OTP email launch
        const success = await EmailService.sendOtpEmail(destination, rawOtp);
        if (success) {
          console.log(`[BETA MONITOR - OTP SUCCESS] OTP challenge generated and sent to ${destination} successfully.`);
        } else {
          console.error(`[BETA MONITOR - OTP FAILURE] Failed to deliver OTP challenge to ${destination} via SMTP.`);
        }
      } catch (err) {
        console.error("[BETA MONITOR - OTP FAILURE] Exception caught during OTP dispatch process:", err);
      }
    }

    return { id: inserted.id, rawOtp };
  },

  /**
   * Validates OTP checking expiration, used status, and remaining retry limits.
   */
  async verifyChallenge(
    searchContext: { id?: string; adminUserId?: string; destination?: string; type: "EMAIL" | "PHONE" },
    otp: string,
    correlationId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const db = getDb();
    let challenge: any = null;

    if (searchContext.id) {
      // Find challenge by specific transaction challenge ID (Option B transaction pinning)
      const results = await db
        .select()
        .from(otpChallenges)
        .where(eq(otpChallenges.id, searchContext.id))
        .limit(1);
      challenge = results[0];
    } else if (searchContext.adminUserId) {
      // Find latest unexpired, unused challenge for the administrator
      const results = await db
        .select()
        .from(otpChallenges)
        .where(
          and(
            eq(otpChallenges.adminUserId, searchContext.adminUserId),
            eq(otpChallenges.type, searchContext.type),
            eq(otpChallenges.isUsed, false)
          )
        )
        .orderBy(desc(otpChallenges.createdAt))
        .limit(1);
      challenge = results[0];
    } else if (searchContext.destination) {
      // Find challenge matching the administrative address target
      const results = await db
        .select()
        .from(otpChallenges)
        .where(
          and(
            eq(otpChallenges.destination, searchContext.destination),
            eq(otpChallenges.type, searchContext.type),
            eq(otpChallenges.isUsed, false)
          )
        )
        .orderBy(desc(otpChallenges.createdAt))
        .limit(1);
      challenge = results[0];
    }

    if (!challenge) {
      throw new ApiError(400, ApiErrorCode.AUTH_OTP_INVALID, "Challenge not found or already invalidated.");
    }

    const { id, adminUserId, otpHash, retryCount, maxRetries, expiresAt, isUsed } = challenge;

    // 1. Is used check (Replay prevention)
    if (isUsed) {
      throw new ApiError(400, ApiErrorCode.AUTH_OTP_INVALID, "verification code already consumed.");
    }

    // 2. Is expired check
    if (new Date() > new Date(expiresAt)) {
      throw new ApiError(400, ApiErrorCode.AUTH_OTP_EXPIRED, "verification code expired. Please request a new one.");
    }

    // 3. Retry limits checks
    if (retryCount >= maxRetries) {
      // Trigger brute-force or failed trial escalation alerts
      await SecurityService.logSecurityEvent({
        adminUserId,
        eventType: "BRUTE_FORCE_ATTEMPT",
        severity: "HIGH",
        description: `Multiple failed validation attempts on OTP ID ${id} exceeding max retry ceiling (${maxRetries}).`,
        ipAddress,
        userAgent,
      });
      throw new ApiError(400, ApiErrorCode.AUTH_OTP_EXPIRED, "Too many failed attempts. Code locks permanently.");
    }

    // 4. Hash verification comparison
    const inputHash = crypto.createHash("sha256").update(otp).digest("hex");
    const isMatched = crypto.timingSafeEqual(Buffer.from(otpHash), Buffer.from(inputHash));

    if (!isMatched) {
      const updatedRetry = retryCount + 1;
      await db
        .update(otpChallenges)
        .set({ retryCount: updatedRetry })
        .where(eq(otpChallenges.id, id));

      await SecurityService.logSecurityEvent({
        adminUserId,
        eventType: "FAILED_OTP",
        severity: updatedRetry >= maxRetries ? "HIGH" : "LOW",
        description: `Inbound matching failure on verification OTP code. Attemp count: ${updatedRetry}/${maxRetries}`,
        ipAddress,
        userAgent,
      });

      if (updatedRetry >= maxRetries) {
        throw new ApiError(400, ApiErrorCode.AUTH_OTP_EXPIRED, "Too many validation errors. Code invalidated.");
      }

      throw new ApiError(400, ApiErrorCode.AUTH_OTP_INVALID, `Verification code mismatch. Retries remaining: ${maxRetries - updatedRetry}`);
    }

    // 4. Update row status to used on success
    await db
      .update(otpChallenges)
      .set({ isUsed: true })
      .where(eq(otpChallenges.id, id));

    return true;
  }
};
