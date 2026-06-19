import { Request, Response, NextFunction } from "express";
import { JwtService, AdminJwtPayload } from "../services/jwt.service";
import { RbacService } from "../services/rbac.service";
import { ApiError, ApiErrorCode } from "../utils/apiResponse";
import { getDb } from "../db/dbClient";
import { sessions, adminUsers } from "../db/admin_schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      adminPrincipal?: AdminJwtPayload;
      roles?: string[];
      permissions?: string[];
    }
  }
}

/**
 * Access Token Verification Middleware with dynamic real-time DB privilege resolution.
 */
export const requireAdminJwt = async (req: Request, res: Response, next: NextFunction) => {
  let token = req.cookies.admin_access_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
    }
  }

  if (!token) {
    return next(new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Bearer authentication access token missing."));
  }

  try {
    const principal = JwtService.verifyAccessToken(token);
    req.adminPrincipal = principal;

    const db = getDb();

    // 1. Enforce Session Revocation Checks (blocked if session has been revoked or expired)
    const [statusRecord] = await db
      .select({ revokedAt: sessions.revokedAt, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(eq(sessions.id, principal.sessionId))
      .limit(1);

    if (!statusRecord) {
      return next(new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Session footprint missing in database."));
    }

    if (statusRecord.revokedAt) {
      return next(new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Administrative security warning: Session has been explicitly revoked."));
    }

    if (new Date() > new Date(statusRecord.expiresAt)) {
      return next(new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Administrative security session expired."));
    }

    // 2. Block Dashboard/API Access if password rotation is strictly required
    const [userRecord] = await db
      .select({ mustChangePassword: adminUsers.mustChangePassword })
      .from(adminUsers)
      .where(eq(adminUsers.id, principal.adminUserId))
      .limit(1);

    if (userRecord && userRecord.mustChangePassword) {
      return next(new ApiError(403, ApiErrorCode.AUTH_PASSWORD_CHANGE_REQUIRED, "Administrative security rotation required. Please perform secure first-login password rotation."));
    }

    // Fetch up-to-date roles and permissions directly from database to prevent stale client privilege escalation
    const { roles, permissions } = await RbacService.resolveUserRbac(principal.adminUserId);
    req.roles = roles;
    req.permissions = permissions;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware Guard enforcing role privilege matrices matching.
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminPrincipal || !req.permissions) {
      return next(new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Admin security context cannot be resolved."));
    }

    if (!req.permissions.includes(permission)) {
      return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, `Insufficient privileges. Missing required permission: ${permission}`));
    }
    next();
  };
};

/**
 * Middleware Guard enforcing specific administrative operational role matching.
 */
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminPrincipal || !req.roles) {
      return next(new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Admin security context cannot be resolved."));
    }

    if (!req.roles.includes(role)) {
      return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, `Access denied: missing required role privileges: ${role}`));
    }
    next();
  };
};

/**
 * Middleware Guard enforcing requirements: Only Admin or Super Admin may access.
 */
export const requireAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Execute JWT and session validation chain
    await requireAdminJwt(req, res, (err) => {
      if (err) {
        return next(err);
      }
      
      if (!req.adminPrincipal || !req.roles) {
        return next(new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Administrative security context is unresolved."));
      }

      // Valid admin roles block
      const hasAllowedRole = req.roles.some(role => 
        ["SUPER_ADMIN", "OPERATIONS_ADMIN", "BOOKING_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "ADMIN"].includes(role.toUpperCase())
      );

      if (!hasAllowedRole) {
        return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "Insufficient privilege. Action limited to Admin / Super Admin roles only."));
      }

      next();
    });
  };
};

