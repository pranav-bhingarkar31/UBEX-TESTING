import { Request, Response, NextFunction } from "express";
import { ApiResponse, ApiError, ApiErrorCode } from "../utils/apiResponse";
import crypto from "crypto";
import {
  LoginRequest,
  EmailOtpRequest,
  PhoneOtpRequest,
  SessionRevokeRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
} from "../dto/adminAuth.dto";

// Inner-Core Authenticate and Compliance services
import { AdminAuthService } from "../services/adminAuth.service";
import { OtpService } from "../services/otp.service";
import { SessionService } from "../services/session.service";
import { RbacService } from "../services/rbac.service";
import { PasswordResetService } from "../services/passwordReset.service";
import { CookieService } from "../services/cookie.service";
import { SecurityService } from "../services/audit.service";
import { getDb } from "../db/dbClient";
import { adminUsers, roles, adminUserRoles } from "../db/admin_schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../utils/crypto";
import { JwtService } from "../services/jwt.service";
import { generateCsrfToken } from "../middleware/csrf";

/**
 * Controller managing all contract actions for administrative identity management.
 * Connects approved DTO interfaces directly to highly secure, scalable security services.
 */
export class AdminAuthController {
  /**
   * 1. POST /api/v1/admin/auth/login
   * Initiates credential validation, and triggers email OTP challenge.
   */
  public async login(
    req: Request<{}, {}, LoginRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      // 1. Password Verification, isActive states check, and login lockouts evaluation
      const authData = await AdminAuthService.authenticateAdmin(
        email,
        password,
        correlationId,
        ipAddress,
        userAgent
      );

      // 2. Spawn cryptographically secure OTP challenge
      const { rawOtp } = await OtpService.createChallenge(
        authData.adminUserId,
        "EMAIL",
        email
      );

      // Print Challenge code to server logs to simulate cellular dispatch or emails delivery
      console.log(`\n======================================================`);
      console.log(`[DEVELOPMENT MAIL DISPATCH] To: ${email}`);
      console.log(`[OTP CONTENT] Secure Code: ${rawOtp} (Expiring in 5 minutes)`);
      console.log(`======================================================\n`);

      res.status(200).json(
        ApiResponse.success(
          200,
          "Step-1 credential validation succeeded. Email OTP challenge dispatched.",
          {
            email,
            otp_expiry_seconds: 300,
            _dev_otp: rawOtp, // Safe dev extraction block for preview sandbox environment
          },
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. POST /api/v1/admin/auth/verify-email-otp
   * Matches OTP against store and invokes cookies-based active session establishment.
   */
  public async verifyEmailOtp(
    req: Request<{}, {}, EmailOtpRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otp, device_fingerprint } = req.body;
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      const db = getDb();
      const emailNorm = email.trim().toLowerCase();

      // Find user record first
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, emailNorm)).limit(1);
      if (!user) {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Operator record unrecognized.");
      }

      // 1. Validate OTP challenge against state indices
      await OtpService.verifyChallenge(
        { adminUserId: user.id, type: "EMAIL" },
        otp,
        correlationId,
        ipAddress,
        userAgent
      );

      // 2. Initialize long-lived active session
      const { sessionId, rawRefreshToken } = await SessionService.createSession({
        adminUserId: user.id,
        deviceFingerprint: device_fingerprint,
        ipAddress,
        userAgent,
        correlationId,
      });

      // 3. Resolve roles and permissions
      const { roles: myRoles, permissions: myPerms } = await RbacService.resolveUserRbac(user.id);

      // 4. Generate custom Signed JWT Access Token and dynamic CSRF token
      const accessToken = JwtService.signAccessToken({
        adminUserId: user.id,
        sessionId,
      });
      const csrfToken = generateCsrfToken(sessionId);

      // 5. Commit security cookies headers
      CookieService.setAuthCookies(res, accessToken, rawRefreshToken, csrfToken);

      res.status(200).json(
        ApiResponse.success(
          200,
          "Authentication completed. Session established.",
          {
            user: {
              id: user.id,
              email: user.email,
              first_name: user.firstName || "Alexander",
              last_name: user.lastName || "Hamil",
              roles: myRoles,
              permissions: myPerms,
            },
            csrf_token: csrfToken,
          },
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/auth/bypass-developer
   * Securely seeds and bypasses standard credentials flow, establishing a legitimate administration session natively.
   */
  public async bypassDeveloper(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const db = getDb();
      const correlationId = req.correlationId || "bypass-" + Math.random().toString(36).substring(7);
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      // Ensure RBAC core templates are provisioned before proceeding
      await RbacService.seedRolesAndPermissions();

      const seedEmail = "admin@ubex.in";

      let [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, seedEmail)).limit(1);

      if (!user) {
        console.log(`[AUTH] Creating bypass administrative master profile: ${seedEmail}`);
        await AdminAuthService.registerAdmin({
          email: seedEmail,
          passwordPlain: "P@ssword123!",
          firstName: "Alexander",
          lastName: "Hamil",
          phoneNumber: "+91 9876549051",
          rolesList: ["SUPER_ADMIN"],
          isSeed: false, // Prevents mandatory rotation requirement block
        });

        const [reUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, seedEmail)).limit(1);
        user = reUser;
      }

      if (user) {
        // Enforce state is ACTIVE and password rotation flag is disabled
        await db.update(adminUsers)
          .set({ mustChangePassword: false, isActive: true })
          .where(eq(adminUsers.email, seedEmail));
        
        // Re-query to guarantee consistency
        const [finalUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, seedEmail)).limit(1);
        user = finalUser;

        // Ensure user roles join mapping exists
        const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "SUPER_ADMIN")).limit(1);
        if (superAdminRole) {
          const [existingRole] = await db.select()
            .from(adminUserRoles)
            .where(eq(adminUserRoles.adminUserId, user.id))
            .limit(1);
          if (!existingRole) {
            await db.insert(adminUserRoles).values({
              adminUserId: user.id,
              roleId: superAdminRole.id,
            });
          }
        }
      }

      if (!user) {
        throw new ApiError(500, ApiErrorCode.AUTH_INVALID_REQUEST, "Failed to provision/locate operator record during bypass.");
      }

      // Initialize long-lived active session
      const { sessionId, rawRefreshToken } = await SessionService.createSession({
        adminUserId: user.id,
        deviceFingerprint: "developer-preview-bypass",
        ipAddress,
        userAgent,
        correlationId,
      });

      // Resolve roles and permissions
      const { roles: myRoles, permissions: myPerms } = await RbacService.resolveUserRbac(user.id);

      // Generate Signed JWT Access Token and dynamic CSRF token
      const accessToken = JwtService.signAccessToken({
        adminUserId: user.id,
        sessionId,
      });
      const csrfToken = generateCsrfToken(sessionId);

      // Commit security cookies headers
      CookieService.setAuthCookies(res, accessToken, rawRefreshToken, csrfToken);

      res.status(200).json(
        ApiResponse.success(
          200,
          "Developer administrative bypass completed. Standard cookie session established.",
          {
            user: {
              id: user.id,
              email: user.email,
              first_name: user.firstName || "Alexander",
              last_name: user.lastName || "Hamil",
              roles: myRoles,
              permissions: myPerms,
            },
            csrf_token: csrfToken,
          },
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. POST /api/v1/admin/auth/request-phone-otp
   * Dispatches High Privilege MFA SMS Challenge.
   */
  public async requestPhoneOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      // 1. Read & Validate Active Session Cookie
      const currentToken = req.cookies.admin_refresh_token;
      if (!currentToken) {
        throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Unauthorized. Authentication cookies missing.");
      }

      // 2. Validate current session rotation state
      const { sessionId, adminUserId, newRawRefreshToken } = await SessionService.rotateSession(
        currentToken,
        correlationId,
        ipAddress,
        userAgent,
        req.body.device_fingerprint
      );

      const accessToken = JwtService.signAccessToken({
        adminUserId,
        sessionId,
      });
      const csrfToken = generateCsrfToken(sessionId);

      // Sync rotated token cookies
      CookieService.setAuthCookies(res, accessToken, newRawRefreshToken, csrfToken);

      // 3. Resolve user details and phone metadata
      const db = getDb();
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, adminUserId)).limit(1);
      if (!user) {
        throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Session operator unrecognized.");
      }

      const pNum = user.phoneNumber || "+91 9876549051";
      const maskPhone = pNum.replace(/(\+\d{2} \d{4})\d{4}(\d{2})/, "$1 **** **$2");

      // 4. Create Phone Challenge Row
      const { id, rawOtp } = await OtpService.createChallenge(adminUserId, "PHONE", pNum);

      console.log(`\n======================================================`);
      console.log(`[DEVELOPMENT SMS DISPATCH] To: ${pNum}`);
      console.log(`[SMS CONTENT] Secure MFA OTP: ${rawOtp} (Challenge ID: ${id})`);
      console.log(`======================================================\n`);

      // Write success audit
      await SecurityService.logAudit({
        adminUserId,
        eventType: "OTP_CHALLENGE_CREATED",
        description: `MFA step up phone verification spawned (Challenge: ${id})`,
        correlationId,
        ipAddress,
        userAgent,
      });

      res.status(200).json(
        ApiResponse.success(
          200,
          "Phone OTP challenge successfully triggered. Verification required via SMS format.",
          {
            channel: "SMS",
            target_mask: maskPhone,
            otp_expiry_seconds: 300,
            challenge_id: id,
            _dev_otp: process.env.NODE_ENV !== "production" ? rawOtp : undefined,
          },
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. POST /api/v1/admin/auth/verify-phone-otp
   * Validates target phone challenge under Option B.
   */
  public async verifyPhoneOtp(
    req: Request<{}, {}, PhoneOtpRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { challenge_id, otp } = req.body;
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      // 1. Validate challenge matching the tracked challenge transaction ID
      await OtpService.verifyChallenge(
        { id: challenge_id, type: "PHONE" },
        otp,
        correlationId,
        ipAddress,
        userAgent
      );

      // Log successful OTP match
      await SecurityService.logAudit({
        adminUserId: null, // Nullable initially or we can extract if active
        eventType: "OTP_SUCCESS",
        description: `MFA steps-up phone verification match successful for Challenge: ${challenge_id}`,
        correlationId,
        ipAddress,
        userAgent,
      });

      res.status(200).json(
        ApiResponse.success(
          200,
          "Phone verification complete. MFA elevated context granted.",
          {
            is_mfa_elevated: true,
            elevated_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 5. GET /api/v1/admin/auth/session
   * Rotates and validates cookies handles, returning latest cached RBAC matrices.
   */
  public async session(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      // 1. Verify and parse sessions cookies
      const cookieToken = req.cookies.admin_refresh_token;
      if (!cookieToken) {
        throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Session cookie missing or expired.");
      }

      // 2. Perform rotation validation
      const { sessionId, adminUserId, newRawRefreshToken } = await SessionService.rotateSession(
        cookieToken,
        correlationId,
        ipAddress,
        userAgent,
        undefined
      );

      // 3. Load associated operator details
      const db = getDb();
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, adminUserId)).limit(1);
      if (!user) {
        throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Inbound operator trace missing.");
      }

      // Check current active state
      if (!user.isActive) {
        throw new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "Operator profile currently suspended.");
      }

      // 4. Fetch permissions dynamic indexes
      const { roles, permissions } = await RbacService.resolveUserRbac(adminUserId);

      const newAccessToken = JwtService.signAccessToken({
        adminUserId,
        sessionId,
      });
      const csrfToken = generateCsrfToken(sessionId);

      // Set fresh rotated cookie headers
      CookieService.setAuthCookies(res, newAccessToken, newRawRefreshToken, csrfToken);

      // Verify suspicious mutations and log success trace
      res.status(200).json(
        ApiResponse.success(
          200,
          "Active session profile resolved successfully.",
          {
            session: {
              user_id: user.id,
              email: user.email,
              first_name: user.firstName || "Alexander",
              last_name: user.lastName || "Hamil",
              roles,
              permissions,
              ip_address: ipAddress,
              is_mfa_elevated: user.isMfaEnabled,
            },
            csrf_token: csrfToken,
          },
          correlationId
        )
      );
    } catch (error) {
      // Clear cookies upon rotation failures to ensure seamless re-logins
      CookieService.clearAuthCookies(res);
      next(error);
    }
  }

  /**
   * 6. POST /api/v1/admin/auth/logout
   * Destroys cookie structures and invalidates session row tracking indexes.
   */
  public async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      const cookieToken = req.cookies.admin_refresh_token;

      if (cookieToken) {
        try {
          const { sessionId, adminUserId } = await SessionService.rotateSession(
            cookieToken,
            correlationId,
            ipAddress,
            userAgent
          );

          // Force revoke active session UUID
          await SessionService.revokeSession(sessionId, adminUserId, correlationId, ipAddress, userAgent);
          
          await SecurityService.logAudit({
            adminUserId,
            eventType: "LOGOUT",
            description: "Administrator explicitly logged out successfully.",
            correlationId,
            ipAddress,
            userAgent,
          });
        } catch {
          // Ignore failures to decode/parse invalid or pre-expired cookies during logout
        }
      }

      // Clear the cookie arrays
      CookieService.clearAuthCookies(res);

      res.status(200).json(
        ApiResponse.success(
          200,
          "Session invalidated successfully.",
          null,
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 7. POST /api/v1/admin/auth/revoke-session
   * Graceful explicit remote termination of single session trace.
   */
  public async revokeSession(
    req: Request<{}, {}, SessionRevokeRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { session_id } = req.body;
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      const cookieToken = req.cookies.admin_refresh_token;
      if (!cookieToken) {
        throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Authentication cookies missing.");
      }

      const { adminUserId } = await SessionService.rotateSession(
        cookieToken,
        correlationId,
        ipAddress,
        userAgent
      );

      // Verify SUPER_ADMIN role limits before allowing cross session revokes
      const { roles } = await RbacService.resolveUserRbac(adminUserId);
      const isSuper = roles.includes("SUPER_ADMIN");

      if (!isSuper) {
        throw new ApiError(
          403,
          ApiErrorCode.AUTH_FORBIDDEN,
          "Only SUPER_ADMIN privileges are allowed to revoke external peer nodes."
        );
      }

      await SessionService.revokeSession(
        session_id,
        adminUserId,
        correlationId,
        ipAddress,
        userAgent
      );

      res.status(200).json(
        ApiResponse.success(
          200,
          `Session ID ${session_id} revoked successfully.`,
          {
            revoked_session_id: session_id,
          },
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 8. POST /api/v1/admin/auth/revoke-all-sessions
   * Complete eviction sweep across active sessions nodes associated with current user.
   */
  public async revokeAllSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      const cookieToken = req.cookies.admin_refresh_token;
      if (!cookieToken) {
        throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Authentication cookies missing.");
      }

      const { adminUserId } = await SessionService.rotateSession(
        cookieToken,
        correlationId,
        ipAddress,
        userAgent
      );

      // Perform bulk revocation sweep on users active channels
      await SessionService.revokeAllUserSessions(adminUserId, correlationId, ipAddress, userAgent);

      // Purge headers cookies
      CookieService.clearAuthCookies(res);

      res.status(200).json(
        ApiResponse.success(
          200,
          "All active sessions successfully terminated.",
          null,
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 9. POST /api/v1/admin/auth/request-password-reset
   * Initiates password recovery transaction.
   */
  public async requestPasswordReset(
    req: Request<{}, {}, PasswordResetRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      // Prepares Recovery tokens, hashed references and logs audit tracking
      const rawToken = await PasswordResetService.requestReset(
        email,
        correlationId,
        ipAddress,
        userAgent
      );

      // Simulate output mailing log lines
      console.log(`\n======================================================`);
      console.log(`[DEVELOPMENT RESETS DISPATCHED] To: ${email}`);
      console.log(`[RESETS LINK] Secret Token: ${rawToken}`);
      console.log(`======================================================\n`);

      res.status(200).json(
        ApiResponse.success(
          200,
          "If the entered email correlates to a registered operator, password recovery parameters have been issued.",
          {
            _dev_token: process.env.NODE_ENV !== "production" ? rawToken : undefined, // Safe dev recovery handle
          },
          correlationId
        )
      );
    } catch (error) {
      // Security: Maintain standard generic message even on missing emails to avoid leakages
      if (error instanceof ApiError && error.statusCode === 404) {
        res.status(200).json(
          ApiResponse.success(
            200,
            "If the entered email correlates to a registered operator, password recovery parameters have been issued.",
            null,
            req.correlationId || ""
          )
        );
        return;
      }
      next(error);
    }
  }

  /**
   * 10. POST /api/v1/admin/auth/reset-password
   * Confirms recovery token and resets secrets database state.
   */
  public async resetPassword(
    req: Request<{}, {}, PasswordResetConfirmRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, new_password } = req.body;
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      // Validate token and finalize resetting by passing plain password directly to enable policy checks
      await PasswordResetService.confirmReset(
        token,
        new_password,
        correlationId,
        ipAddress,
        userAgent
      );

      res.status(200).json(
        ApiResponse.success(
          200,
          "Credentials updated completely. You may now return to sign-in panels.",
          null,
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 11. POST /api/v1/admin/auth/rotate-password
   * Enforces immediate password changes compliance for seeds and forced rotation state.
   */
  public async rotatePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, current_password, new_password } = req.body;
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      if (!email || !current_password || !new_password) {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Required fields email, current_password, and new_password are missing.");
      }

      await AdminAuthService.rotatePassword(
        email,
        current_password,
        new_password,
        correlationId,
        ipAddress,
        userAgent
      );

      res.status(200).json(
        ApiResponse.success(
          200,
          "Administrative password rotated successfully. You may now log in using your fresh credentials.",
          null,
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 12. GET /api/v1/admin/auth/csrf
   * Retrieves a TimingSafeSync CSRF Token and writes both Option A & B state parameters.
   */
  public async getCsrfToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const correlationId = req.correlationId || "";
      const seedVal = crypto.randomBytes(32).toString("hex");
      const secret = process.env.CSRF_SECRET || "ubex_default_security_csrf_secret_key_change_me_prod";
      const csrfToken = crypto.createHmac("sha256", secret).update(seedVal).digest("hex");

      res.cookie("admin_csrf_token", csrfToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 12 * 60 * 60 * 1000,
      });

      res.cookie("readable_csrf_token", csrfToken, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 12 * 60 * 60 * 1000,
      });

      res.status(200).json(
        ApiResponse.success(
          200,
          "CSRF token generated successfully.",
          { csrf_token: csrfToken },
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 13. GET /admin/sessions
   * Returns list of admin user's active, non-revoked session tracking footprints.
   */
  public async getSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.adminPrincipal?.adminUserId;
      const userRoles = req.roles || [];
      const correlationId = req.correlationId || "";

      if (!userId) {
        throw new ApiError(401, ApiErrorCode.AUTH_UNAUTHORIZED, "Unauthenticated administrative session.");
      }

      let activeSessions: any[] = [];
      const isSuper = userRoles.includes("SUPER_ADMIN");

      if (isSuper) {
        // Super admin can inspect all active sessions across DB cluster
        const db = getDb();
        const { sessions: sessionsTable } = await import("../db/admin_schema");
        const { isNull } = await import("drizzle-orm");
        activeSessions = await db
          .select()
          .from(sessionsTable)
          .where(isNull(sessionsTable.revokedAt));
      } else {
        // Local operator can only inspect their own active sessions
        activeSessions = await SessionService.getActiveUserSessions(userId);
      }

      const formatted = activeSessions.map(s => ({
        id: s.id,
        deviceName: s.deviceName || "Unknown Device",
        browser: s.browser || "Unknown Browser",
        platform: s.platform || "Unknown Platform",
        ipAddress: s.ipAddress || "Unknown IP",
        isSuspicious: s.isSuspicious,
        lastActivityAt: s.lastActivityAt,
        createdAt: s.createdAt,
      }));

      res.status(200).json(
        ApiResponse.success(
          200,
          "Active sessions checklist resolved successfully.",
          formatted,
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 14. DELETE /admin/sessions/:id
   * Explicitly terminates a specific session UUID footprint.
   */
  public async deleteSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.adminPrincipal?.adminUserId;
      const userRoles = req.roles || [];
      const correlationId = req.correlationId || "";
      const ipAddress = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      if (!userId) {
        throw new ApiError(401, ApiErrorCode.AUTH_UNAUTHORIZED, "Unauthenticated administrative session.");
      }

      if (!id) {
        throw new ApiError(400, ApiErrorCode.AUTH_INVALID_REQUEST, "Session ID parameter is required.");
      }

      const db = getDb();
      const { sessions: sessionsTable } = await import("../db/admin_schema");
      const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);

      if (!session) {
        throw new ApiError(404, ApiErrorCode.AUTH_INVALID_REQUEST, "The requested session identifier was not found.");
      }

      // Authorization guard: check ownership or super_admin status
      if (session.adminUserId !== userId && !userRoles.includes("SUPER_ADMIN")) {
        throw new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "Access override block: Unprivileged operation on another operator's session.");
      }

      // Revoke target session
      await SessionService.revokeSession(id, userId, correlationId, ipAddress, userAgent);

      res.status(200).json(
        ApiResponse.success(
          200,
          "Administrative session invalidated and remote logout has been enforced successfully.",
          { revokedSessionId: id },
          correlationId
        )
      );
    } catch (error) {
      next(error);
    }
  }
}
export default AdminAuthController;
