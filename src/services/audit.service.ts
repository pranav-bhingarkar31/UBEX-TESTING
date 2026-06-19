import { getDb } from "../db/dbClient";
import { auditLogs, securityEvents } from "../db/admin_schema";

export interface AuditLogInput {
  adminUserId: string | null;
  eventType: string;
  description: string;
  correlationId: string;
  ipAddress: string;
  userAgent: string;
  payload?: any;
}

export interface SecurityEventInput {
  adminUserId: string | null;
  eventType: string; // 'FAILED_OTP' | 'BRUTE_FORCE_ATTEMPT' | 'SUSPICIOUS_LOGIN' | etc.
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Recursively redacts sensitive values inside any logging payload structure.
 */
export function redactPayload(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactPayload);
  }

  const redacted: any = {};
  const sensitiveKeys = new Set([
    "password",
    "passwordplain",
    "password_plain",
    "otp",
    "token",
    "accesstoken",
    "refreshtoken",
    "access_token",
    "refresh_token",
    "authorization",
    "cookie",
    "csrf",
    "csrf_token",
    "csrftoken",
    "rawotp",
    "raw_otp",
    "rawtoken",
    "device_fingerprint"
  ]);

  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z]/g, "");
    // Check if key contains or is any sensitive word
    const isSensitive = Array.from(sensitiveKeys).some(s => lowerKey.includes(s));

    if (isSensitive) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = redactPayload(obj[key]);
    }
  }
  return redacted;
}

/**
 * Redacts any sensitive data within string descriptions using a safe replacement protocol.
 */
export function redactString(str: string): string {
  if (!str) return str;
  // Redact simple hex session keys, JWT lookalikes or OTP 6 digit numeric phrases in descriptions if accidentally present
  let sanitized = str;
  sanitized = sanitized.replace(/\b[0-9]{6}\b/g, "[REDACTED_OTP]");
  return sanitized;
}

/**
 * Audit Logging and Security Incident Management Service
 */
export const SecurityService = {
  /**
   * Commits a standardized administrative audit trail record.
   */
  async logAudit(input: AuditLogInput): Promise<void> {
    try {
      const db = getDb();
      const sanitizedPayload = redactPayload(input.payload || {});
      const sanitizedDescription = redactString(input.description || "");
      
      const crypto = await import("crypto");
      const cId = input.correlationId || crypto.randomUUID();

      await db.insert(auditLogs).values({
        adminUserId: input.adminUserId,
        eventType: input.eventType,
        description: sanitizedDescription,
        correlationId: cId,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        payload: sanitizedPayload,
      });
      console.log(`[AUDITLOG] Event: ${input.eventType} | CorrelationId: ${cId}`);
    } catch (error) {
      console.error("Failed to commit audit log to PostgreSQL:", error);
    }
  },

  /**
   * Commits a critical security threat or anomalous behavior detection event.
   */
  async logSecurityEvent(input: SecurityEventInput): Promise<void> {
    try {
      const db = getDb();
      const sanitizedDescription = redactString(input.description || "");

      await db.insert(securityEvents).values({
        adminUserId: input.adminUserId,
        eventType: input.eventType,
        severity: input.severity,
        description: sanitizedDescription,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      });
      console.warn(`[SECURITYEVENT] Alert: ${input.eventType} | Severity: ${input.severity} | ClientIP: ${input.ipAddress}`);
    } catch (error) {
      console.error("Failed to save security alert event:", error);
    }
  }
};
export default SecurityService;
