import { z } from "zod";

/**
 * 1. Login Request Schema (POST /api/v1/admin/auth/login)
 */
export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must not exceed 128 characters"),
}).strict();

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * 2. Email OTP Request Schema (POST /api/v1/admin/auth/verify-email-otp)
 */
export const EmailOtpRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().regex(/^\d{6}$/, "Email verification code must be exactly 6 digits"),
  device_fingerprint: z.string().optional(),
}).strict();

export type EmailOtpRequest = z.infer<typeof EmailOtpRequestSchema>;

/**
 * 3. Phone OTP Request Schema (POST /api/v1/admin/auth/verify-phone-otp)
 * Optimized via Option B: challenge_id binding for transaction pinning.
 */
export const PhoneOtpRequestSchema = z.object({
  challenge_id: z.string().uuid("Invalid challenge ID tracking UUID format"),
  otp: z.string().regex(/^\d{6}$/, "SMS verification code must be exactly 6 digits"),
}).strict();

export type PhoneOtpRequest = z.infer<typeof PhoneOtpRequestSchema>;

/**
 * 4. Session Revocation Request Schema (POST /api/v1/admin/auth/revoke-session)
 */
export const SessionRevokeRequestSchema = z.object({
  session_id: z.string().uuid("Invalid session tracking UUID format"),
}).strict();

export type SessionRevokeRequest = z.infer<typeof SessionRevokeRequestSchema>;

/**
 * 5. Password Reset Invitation Request Schema (POST /api/v1/admin/auth/request-password-reset)
 */
export const PasswordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
}).strict();

export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

/**
 * 6. Password Reset Affirmation Request Schema (POST /api/v1/admin/auth/reset-password)
 */
export const PasswordResetConfirmRequestSchema = z.object({
  token: z.string().min(1, "Reset authentication token is required"),
  new_password: z
    .string()
    .min(12, "New password must be at least 12 characters")
    .max(128, "New password must not exceed 128 characters"),
}).strict();

export type PasswordResetConfirmRequest = z.infer<typeof PasswordResetConfirmRequestSchema>;

