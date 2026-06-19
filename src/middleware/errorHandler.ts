import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiResponse";

/**
 * Production-ready centralized global error handler middleware.
 * Intercepts explicit ApiErrors as well as unexpected operational faults.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const correlationId = req.correlationId || "";
  const timestamp = new Date().toISOString();

  // Attach failure message to the response object for global audit logging capture
  const standardMessage = err instanceof Error ? err.message : "An unexpected server-side error occurred.";
  (res as any).failureReason = err instanceof ApiError ? err.message : standardMessage;

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      correlationId,
      timestamp,
      status: err.statusCode,
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Treat unexpected errors gracefully, masking internal crash stacks in production
  const errorMsg = err instanceof Error ? err.message : "An unexpected server-side error occurred.";
  
  res.status(500).json({
    success: false,
    correlationId,
    timestamp,
    status: 500,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: errorMsg,
    },
  });
};

export default errorHandler;
