/**
 * Standard API error codes as specified in the UbEx Authentication API design.
 */
export enum ApiErrorCode {
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_ACCOUNT_LOCKED = "AUTH_ACCOUNT_LOCKED",
  AUTH_OTP_INVALID = "AUTH_OTP_INVALID",
  AUTH_OTP_EXPIRED = "AUTH_OTP_EXPIRED",
  AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED",
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",
  AUTH_FORBIDDEN = "AUTH_FORBIDDEN",
  AUTH_RATE_LIMITED = "AUTH_RATE_LIMITED",
  AUTH_PASSWORD_RESET_EXPIRED = "AUTH_PASSWORD_RESET_EXPIRED",
  AUTH_INVALID_REQUEST = "AUTH_INVALID_REQUEST",
  AUTH_PASSWORD_CHANGE_REQUIRED = "AUTH_PASSWORD_CHANGE_REQUIRED",
  AUTH_PASSWORD_REUSE_PROHIBITED = "AUTH_PASSWORD_REUSE_PROHIBITED",
}

/**
 * Custom operational error class to hold structural API error payloads.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ApiErrorCode;
  public readonly details: unknown;

  constructor(statusCode: number, errorCode: ApiErrorCode, message: string, details: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Standard success response envelope.
 */
export interface ApiResponseSuccess<T = unknown> {
  success: true;
  correlationId: string;
  timestamp: string;
  status: number;
  message: string;
  data: T;
}

/**
 * Standard error response envelope.
 */
export interface ApiResponseError {
  success: false;
  correlationId: string;
  timestamp: string;
  status: number;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Helper utility to construct consistent standard API responses.
 */
export const ApiResponse = {
  /**
   * Generates a standardized successful response.
   */
  success<T>(status: number, message: string, data: T, correlationId: string): ApiResponseSuccess<T> {
    return {
      success: true,
      correlationId,
      timestamp: new Date().toISOString(),
      status,
      message,
      data,
    };
  },

  /**
   * Generates a standardized error response.
   */
  error(status: number, code: string, message: string, correlationId: string, details: unknown = null): ApiResponseError {
    return {
      success: false,
      correlationId,
      timestamp: new Date().toISOString(),
      status,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    };
  }
};
