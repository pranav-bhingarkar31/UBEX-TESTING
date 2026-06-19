import { Router } from "express";
import { AdminAuthController } from "../controllers/adminAuth.controller";
import { requireAdminJwt } from "../middleware/adminJwtAuth";
import { validateBody } from "../middleware/validation";
import { loginRateLimiter } from "../middleware/rateLimiter";
import {
  LoginRequestSchema,
  EmailOtpRequestSchema,
  PhoneOtpRequestSchema,
  SessionRevokeRequestSchema,
  PasswordResetRequestSchema,
  PasswordResetConfirmRequestSchema,
} from "../dto/adminAuth.dto";

const router = Router();
const controller = new AdminAuthController();

/**
 * 1. POST /api/v1/admin/auth/login
 * Initiates credential verification phase.
 */
router.post(
  "/login",
  loginRateLimiter,
  validateBody(LoginRequestSchema),
  controller.login.bind(controller)
);

/**
 * Developer session bypass endpoint. Seed roles, disable mandatory password rotation, and establish standard administrative cookies directly.
 */
router.post(
  "/bypass-developer",
  controller.bypassDeveloper.bind(controller)
);

/**
 * 2. POST /api/v1/admin/auth/verify-email-otp
 * Verifies email-delivered MFA OTP and returns user details + cookie session identifier.
 */
router.post(
  "/verify-email-otp",
  validateBody(EmailOtpRequestSchema),
  controller.verifyEmailOtp.bind(controller)
);

/**
 * 3. POST /api/v1/admin/auth/request-phone-otp
 * Dispatches an SMS verification OTP challenge.
 */
router.post(
  "/request-phone-otp",
  controller.requestPhoneOtp.bind(controller)
);

/**
 * 4. POST /api/v1/admin/auth/verify-phone-otp
 * Validates step-up authentication.
 */
router.post(
  "/verify-phone-otp",
  validateBody(PhoneOtpRequestSchema),
  controller.verifyPhoneOtp.bind(controller)
);

/**
 * 5. GET /api/v1/admin/auth/session
 * Resolves current administrative context and returns profile maps.
 */
router.get(
  "/session",
  controller.session.bind(controller)
);

/**
 * 6. POST /api/v1/admin/auth/logout
 * Destroys active session cookies and invalidates session row references.
 */
router.post(
  "/logout",
  controller.logout.bind(controller)
);

/**
 * 7. POST /api/v1/admin/auth/revoke-session
 * Remote terminates a specific session UUID.
 */
router.post(
  "/revoke-session",
  validateBody(SessionRevokeRequestSchema),
  controller.revokeSession.bind(controller)
);

/**
 * 8. POST /api/v1/admin/auth/revoke-all-sessions
 * Invalidates all session context associated with currently logged operator.
 */
router.post(
  "/revoke-all-sessions",
  controller.revokeAllSessions.bind(controller)
);

/**
 * 9. POST /api/v1/admin/auth/request-password-reset
 * Saves reset request parameters and triggers email dispatch.
 */
router.post(
  "/request-password-reset",
  validateBody(PasswordResetRequestSchema),
  controller.requestPasswordReset.bind(controller)
);

/**
 * 10. POST /api/v1/admin/auth/reset-password
 * Applies password replacement verification.
 */
router.post(
  "/reset-password",
  validateBody(PasswordResetConfirmRequestSchema),
  controller.resetPassword.bind(controller)
);

/**
 * 11. POST /api/v1/admin/auth/rotate-password
 * Triggers forced first-login administrative password rotation.
 */
router.post(
  "/rotate-password",
  controller.rotatePassword.bind(controller)
);

/**
 * 12. GET /api/v1/admin/auth/csrf
 * Explicitly generates/fetches a TimingSafeSync CSRF Token.
 */
router.get(
  "/csrf",
  controller.getCsrfToken.bind(controller)
);

/**
 * 13. GET /api/v1/admin/auth/sessions
 * Resolves list of admin user's active, non-revoked session tracking footprints.
 */
router.get(
  "/sessions",
  requireAdminJwt,
  controller.getSessions.bind(controller)
);

/**
 * 14. DELETE /api/v1/admin/auth/sessions/:id
 * Explicitly terminates a specific session UUID footprint.
 */
router.delete(
  "/sessions/:id",
  requireAdminJwt,
  controller.deleteSession.bind(controller)
);

export const adminAuthRouter = router;
export default adminAuthRouter;
