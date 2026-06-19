import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { ApiError, ApiErrorCode } from "../utils/apiResponse";

const getCsrfSecret = (): string => {
  return process.env.CSRF_SECRET || "ubex_default_security_csrf_secret_key_change_me_prod";
};

/**
 * Returns a cryptographically signed CSRF token tied to the user's active session.
 */
export const generateCsrfToken = (sessionId: string): string => {
  const secret = getCsrfSecret();
  return crypto.createHmac("sha256", secret).update(sessionId).digest("hex");
};

/**
 * Enterprise Double-Submit CSRF, Host, Referer, and Origin Verification Middleware.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // 1. Exempt safe standard HTTP query methods from token verification
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 2. Strict Origin / Referer parsing validation
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // Resolve host boundaries
  const expectedHost = process.env.APP_URL 
    ? new URL(process.env.APP_URL).host
    : req.headers.host;

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== expectedHost) {
        return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "CSRF security policy block: Origin host verification failed."));
      }
    } catch {
      return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "CSRF validation error: Malformed Origin header requested."));
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== expectedHost) {
        return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "CSRF security policy block: Referer host verification failed."));
      }
    } catch {
      return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "CSRF validation error: Malformed Referer header requested."));
    }
  }

  // 3. Double Submit Verification matching
  const requestCsrfToken = req.headers["x-csrf-token"] || req.body._csrf;
  const cookieCsrfToken = req.cookies.admin_csrf_token;

  if (!requestCsrfToken || !cookieCsrfToken) {
    return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "CSRF protection failure: Required verification tokens missing."));
  }

  try {
    // Timing-safe comparison to mitigate side-channel timing attacks
    const isMatched = crypto.timingSafeEqual(
      Buffer.from(String(requestCsrfToken)),
      Buffer.from(String(cookieCsrfToken))
    );

    if (!isMatched) {
      return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "CSRF protection failure: Token matching verified untrusted request sources."));
    }
  } catch {
    return next(new ApiError(403, ApiErrorCode.AUTH_FORBIDDEN, "CSRF validation error: token comparison computation failure."));
  }

  next();
};
export default csrfProtection;
