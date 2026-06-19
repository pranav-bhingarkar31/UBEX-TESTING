import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

// Extend Express Request namespace to cleanly attach the correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Middleware to track Correlation IDs across the microservices/routing landscape.
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Read optional inbound correlation ID (case insensitive matching)
  const incomingHeader = req.headers["x-correlation-id"];
  
  const correlationId = typeof incomingHeader === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(incomingHeader)
    ? incomingHeader
    : randomUUID();

  // Attach to current request object mapping context
  req.correlationId = correlationId;

  // Add back to outbound response headers for audit tracing
  res.setHeader("X-Correlation-ID", correlationId);

  next();
};
