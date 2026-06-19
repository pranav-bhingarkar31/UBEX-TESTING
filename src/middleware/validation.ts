import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ApiResponse, ApiErrorCode } from "../utils/apiResponse";

/**
 * Universal validation middleware matching inbound body content with pre-defined Zod matrices.
 */
export const validateBody = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate is done with strict pruning for unspecified keys
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Collect Zod error descriptors
        const fieldErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json(
          ApiResponse.error(
            400,
            ApiErrorCode.AUTH_INVALID_REQUEST,
            "Request parameters did not pass schema constraints.",
            req.correlationId,
            fieldErrors
          )
        );
        return;
      }
      
      next(error);
    }
  };
};
