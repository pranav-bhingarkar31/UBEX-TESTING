import crypto from "crypto";
import { getDb } from "../db/dbClient";
import { sessions } from "../db/admin_schema";
import { eq, and, isNull } from "drizzle-orm";
import { SecurityService } from "./audit.service";
import { ApiError, ApiErrorCode } from "../utils/apiResponse";

export interface SessionConfig {
  adminUserId: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId: string;
}

/**
 * Parses user agent string into browser, platform, and device parameters.
 */
export function parseUserAgent(ua: string) {
  let browser = "Unknown Browser";
  let platform = "Unknown Platform";
  let deviceName = "Unknown Device";

  if (!ua) return { browser, platform, deviceName };

  const uaLower = ua.toLowerCase();

  // Browser detection
  if (uaLower.includes("firefox/")) browser = "Firefox";
  else if (uaLower.includes("chrome/")) browser = "Chrome";
  else if (uaLower.includes("safari/") && !uaLower.includes("chrome/")) browser = "Safari";
  else if (uaLower.includes("edge/") || uaLower.includes("edg/")) browser = "Edge";
  else if (uaLower.includes("msie ") || uaLower.includes("trident/")) browser = "Internet Explorer";

  // Platform detection
  if (uaLower.includes("windows nt")) platform = "Windows";
  else if (uaLower.includes("macintosh") || uaLower.includes("mac os x")) platform = "macOS";
  else if (uaLower.includes("linux") && !uaLower.includes("android")) platform = "Linux";
  else if (uaLower.includes("android")) platform = "Android";
  else if (uaLower.includes("iphone os") || uaLower.includes("ipad")) platform = "iOS";

  // Device type detection
  if (uaLower.includes("mobile") || uaLower.includes("iphone") || uaLower.includes("android")) {
    deviceName = "Mobile Device";
  } else if (uaLower.includes("tablet") || uaLower.includes("ipad")) {
    deviceName = "Tablet Device";
  } else {
    deviceName = "Desktop Workstation";
  }

  return { browser, platform, deviceName };
}

/**
 * Service managing cryptographically secure administrator sessions.
 */
export const SessionService = {
  /**
   * Spawns a new administrative session with rotating SHA-256 Refresh Token details.
   */
  async createSession(config: SessionConfig): Promise<{ sessionId: string; rawRefreshToken: string; expiresAt: Date }> {
    const db = getDb();
    
    // Cryptographically secure refresh token
    const rawRefreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours absolute duration

    const { browser, platform, deviceName } = parseUserAgent(config.userAgent || "");

    // Commit Session record to matching admin_users
    const [inserted] = await db.insert(sessions).values({
      adminUserId: config.adminUserId,
      refreshTokenHash,
      deviceFingerprint: config.deviceFingerprint || null,
      ipAddress: config.ipAddress || null,
      deviceName,
      browser,
      platform,
      isSuspicious: false,
      expiresAt,
      lastActivityAt: now,
    }).returning({ id: sessions.id });

    // Save success audit log
    await SecurityService.logAudit({
      adminUserId: config.adminUserId,
      eventType: "SESSION_CREATED",
      description: `New administrator session spawned (ID: ${inserted.id}).`,
      correlationId: config.correlationId,
      ipAddress: config.ipAddress || "",
      userAgent: config.userAgent || "",
      payload: { sessionId: inserted.id, deviceFingerprint: config.deviceFingerprint, browser, platform, deviceName },
    });

    return {
      sessionId: inserted.id,
      rawRefreshToken,
      expiresAt,
    };
  },

  /**
   * Resolves a session using its raw refresh token (hash match), doing rotation, idle check, and anomaly evaluation.
   */
  async rotateSession(
    rawRefreshToken: string,
    correlationId: string,
    ipAddress: string,
    userAgent: string,
    deviceFingerprint?: string
  ): Promise<{ sessionId: string; newRawRefreshToken: string; adminUserId: string }> {
    const db = getDb();
    const hash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

    const results = await db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, hash))
      .limit(1);

    const session = results[0];
    if (!session) {
      throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Invalid or unrecognized refresh token.");
    }

    const now = new Date();

    // 1. Check absolute revocation status
    if (session.revokedAt) {
      await SecurityService.logSecurityEvent({
        adminUserId: session.adminUserId,
        eventType: "SUSPICIOUS_LOGIN",
        severity: "CRITICAL",
        description: `Stale refresh token replayed for revoked session (ID: ${session.id}). Potential token theft attempt.`,
        ipAddress,
        userAgent,
      });
      throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Session has been explicitly revoked.");
    }

    // 2. Check absolute lifetime expiry (12 Hours max duration Limit)
    if (now > new Date(session.expiresAt)) {
      await db.update(sessions).set({ revokedAt: now }).where(eq(sessions.id, session.id));
      throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Session absolute lifetime (12 hours) expired.");
    }

    // 3. Check idle session timeout (60 Minutes inactive trigger limit)
    const lastActivity = new Date(session.lastActivityAt).getTime();
    if (now.getTime() - lastActivity > 60 * 60 * 1000) {
      await db.update(sessions).set({ revokedAt: now }).where(eq(sessions.id, session.id));
      throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Session invalidated due to in-activity for 60 minutes.");
    }

    // 4. Session Anomaly Detection (IP tracking, device fingerprint mismatch, geographic velocity)
    let isSuspicious = false;
    let anomalyDescription = "";

    if (session.ipAddress && session.ipAddress !== ipAddress) {
      isSuspicious = true;
      anomalyDescription += `IP address changed from '${session.ipAddress}' to '${ipAddress}'. `;
      
      const oldSubnet = session.ipAddress.split(".")[0];
      const newSubnet = ipAddress.split(".")[0];
      if (oldSubnet !== newSubnet && oldSubnet !== "127" && newSubnet !== "127") {
        anomalyDescription += `Geographic velocity anomaly detected: subnet difference detected. `;
      }
    }

    if (deviceFingerprint && session.deviceFingerprint && session.deviceFingerprint !== deviceFingerprint) {
      isSuspicious = true;
      anomalyDescription += `Device fingerprint mismatch: recorded '${session.deviceFingerprint}', received '${deviceFingerprint}'. `;
    }

    if (isSuspicious) {
      await SecurityService.logSecurityEvent({
        adminUserId: session.adminUserId,
        eventType: "SESSION_ANOMALY",
        severity: "HIGH",
        description: `Session anomaly warning for session ID ${session.id}: ${anomalyDescription}`,
        ipAddress,
        userAgent,
      });
    }

    // 5. Perform Refresh Token Rotation (RTR) - Issue new token, hash and commit to avoid replays
    const newRawRefreshToken = crypto.randomBytes(64).toString("hex");
    const newHash = crypto.createHash("sha256").update(newRawRefreshToken).digest("hex");

    const { browser, platform, deviceName } = parseUserAgent(userAgent);

    await db
      .update(sessions)
      .set({
        refreshTokenHash: newHash,
        lastActivityAt: now,
        isSuspicious: isSuspicious ? true : session.isSuspicious,
        ipAddress: ipAddress, // Auto-update to latest IP
        deviceFingerprint: deviceFingerprint || session.deviceFingerprint,
        deviceName: deviceName || session.deviceName,
        browser: browser || session.browser,
        platform: platform || session.platform,
        updatedAt: now,
      })
      .where(eq(sessions.id, session.id));

    return {
      sessionId: session.id,
      newRawRefreshToken,
      adminUserId: session.adminUserId,
    };
  },

  /**
   * Fetches active sessions for a target administrator user footprint.
   */
  async getActiveUserSessions(adminUserId: string): Promise<any[]> {
    const db = getDb();
    return db
      .select()
      .from(sessions)
      .where(and(eq(sessions.adminUserId, adminUserId), isNull(sessions.revokedAt)))
      .orderBy(sessions.createdAt);
  },

  /**
   * Graceful explicit remote termination of session UUID trigger.
   */
  async revokeSession(sessionId: string, currentAdminUserId: string, correlationId: string, ipAddress: string, userAgent: string): Promise<void> {
    const db = getDb();
    const now = new Date();

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) {
      throw new ApiError(404, ApiErrorCode.AUTH_INVALID_REQUEST, "Session ID not found.");
    }

    // Verify session belongs to the current user or check SUPER_ADMIN privilege in controller
    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(eq(sessions.id, sessionId));

    await SecurityService.logAudit({
      adminUserId: currentAdminUserId,
      eventType: "SESSION_REVOKED",
      description: `Session tracking ID ${sessionId} revoked successfully.`,
      correlationId,
      ipAddress,
      userAgent,
      payload: { revokedSessionId: sessionId },
    });
  },

  /**
   * Override block: invalidates all active session flows of target admin user profile.
   */
  async revokeAllUserSessions(adminUserId: string, correlationId: string, ipAddress: string, userAgent: string): Promise<void> {
    const db = getDb();
    const now = new Date();

    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(and(eq(sessions.adminUserId, adminUserId), isNull(sessions.revokedAt)));

    await SecurityService.logAudit({
      adminUserId,
      eventType: "SESSION_REVOKED_ALL",
      description: `All active administrative instances terminated cleanly for ID ${adminUserId}`,
      correlationId,
      ipAddress,
      userAgent,
    });
  }
};
export default SessionService;
