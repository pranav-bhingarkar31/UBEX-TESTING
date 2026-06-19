import { Request, Response, NextFunction } from "express";
import { SecurityService } from "../services/audit.service";

/**
 * Global HTTP response interceptor middleware.
 * Records precise system metrics including request metadata, final HTTP codes, execution duration, and failure reasons.
 */
export const expressAuditLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime();
  const correlationId = req.correlationId || "";
  const ipAddress = req.ip || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "";
  const requestPath = req.originalUrl || req.path;
  const method = req.method;

  // Intercept the response completion
  res.on("finish", async () => {
    // Skip logging common quiet internal requests to keep the database tidy
    if (requestPath.includes("/api/health") || requestPath.includes("/api/v1/admin/auth/session") && res.statusCode === 200) {
      return;
    }

    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e9 + diff[1]) / 1e6;
    const statusCode = res.statusCode;

    const isSuccess = statusCode < 400;
    
    // Attempt to grab error explanation caught in Central Error Handler
    const failureReason = (res as any).failureReason || (isSuccess ? undefined : `HTTP Fail Code ${statusCode}`);

    // Retrieve verified admin ID from JWT session context if logged in
    const adminUserId = req.adminPrincipal?.adminUserId || null;

    // Sanitize inbound body inputs to prevent storing credentials in audit payloads
    let sanitizedBody: any = undefined;
    if (req.body) {
      sanitizedBody = { ...req.body };
      const sensitiveKeys = ["password", "passwordPlain", "new_password", "otp", "token"];
      sensitiveKeys.forEach(k => {
        if (sanitizedBody[k]) {
          sanitizedBody[k] = "[REDACTED]";
        }
      });
    }

    await SecurityService.logAudit({
      adminUserId,
      eventType: isSuccess ? "API_REQUEST_SUCCESS" : "API_REQUEST_FAILURE",
      description: `${method} ${requestPath} returned statusCode ${statusCode} in ${durationMs.toFixed(2)}ms.`,
      correlationId,
      ipAddress,
      userAgent,
      payload: {
        path: requestPath,
        method,
        statusCode,
        durationMs: parseFloat(durationMs.toFixed(2)),
        failureReason,
        query: req.query,
        body: sanitizedBody,
      },
    });
  });

  next();
};
export default expressAuditLogger;
