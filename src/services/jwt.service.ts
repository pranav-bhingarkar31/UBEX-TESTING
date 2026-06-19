import jwt from "jsonwebtoken";
import { ApiError, ApiErrorCode } from "../utils/apiResponse";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PRODUCTION CONFIGURATION VIOLATION: JWT_SECRET variable must be set in production.");
    }
    return "ubex_default_security_jwt_secret_key_change_me_must_be_64_characters_long_or_more_ideal";
  }
  return secret;
};

export interface AdminJwtPayload {
  adminUserId: string;
  sessionId: string;
}

export const JwtService = {
  /**
   * Signs a short-lived administrative authorization token containing state identifiers.
   */
  signAccessToken(payload: AdminJwtPayload): string {
    const secret = getJwtSecret();
    return jwt.sign(payload, secret, {
      expiresIn: "15m", // 15 minutes TTL
      algorithm: "HS256",
    });
  },

  /**
   * Verifies, validates expiration and decodes the JWT access token.
   */
  verifyAccessToken(token: string): AdminJwtPayload {
    const secret = getJwtSecret();
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
      });
      return decoded as AdminJwtPayload;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Access token has expired.");
      }
      throw new ApiError(401, ApiErrorCode.AUTH_SESSION_EXPIRED, "Access token is invalid or signature matched poorly.");
    }
  },
};
export default JwtService;
