import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { ApiError, ApiErrorCode } from "../utils/apiResponse";

let ipLimiter: any = null;
let emailLimiter: any = null;
let combinedLimiter: any = null;

async function initLimiterProviders() {
  const mode = process.env.RATE_LIMITER_MODE || "memory";

  if (mode === "redis") {
    console.log("[RATE LIMITER] Activating production-grade Redis distributed provider...");
    try {
      // @ts-ignore
      const { default: Redis } = await import("ioredis");
      // @ts-ignore
      const { RateLimiterRedis } = await import("rate-limiter-flexible");

      const redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
      });

      redisClient.on("error", (err: any) => {
        console.error("[RATE LIMITER] Redis transport socket fault:", err);
      });

      ipLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: "rl:ip:",
        points: 100,
        duration: 15 * 60,
      });

      emailLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: "rl:email:",
        points: 5,
        duration: 5 * 60,
      });

      combinedLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: "rl:combined:",
        points: 3,
        duration: 2 * 60,
      });
      console.log("[RATE LIMITER] Redis rate limiting engine active and synchronized.");
      return;
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        console.error("[CRITICAL SHUTDOWN] Redis rate limiting requested, but ioredis drivers/endpoint failed:", error);
        process.exit(1);
      } else {
        console.warn("[RATE LIMITER] Redis unavailable in development. Falling back to local Memory limiting:", error.message);
      }
    }
  }

  // Local Memory Limiter Fallback (Default for Dev)
  ipLimiter = new RateLimiterMemory({
    points: 100,
    duration: 15 * 60,
  });

  emailLimiter = new RateLimiterMemory({
    points: 5,
    duration: 5 * 60,
  });

  combinedLimiter = new RateLimiterMemory({
    points: 3,
    duration: 2 * 60,
  });
  console.log("[RATE LIMITER] Standard Local Memory rate limiting engine active.");
}

// Spark lazy provider initialization
initLimiterProviders();

export const loginRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || "127.0.0.1";
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return next();
  }

  const emailNorm = email.trim().toLowerCase();
  const emailAndIpKey = `${ip}:${emailNorm}`;

  // If providers are still in dynamic resolution phase, resolve in memory
  const activeIpLimiter = ipLimiter || new RateLimiterMemory({ points: 100, duration: 15 * 60 });
  const activeEmailLimiter = emailLimiter || new RateLimiterMemory({ points: 5, duration: 5 * 60 });
  const activeCombinedLimiter = combinedLimiter || new RateLimiterMemory({ points: 3, duration: 2 * 60 });

  try {
    // 1. IP Throttle
    await activeIpLimiter.consume(ip, 1);
  } catch (rej) {
    return next(new ApiError(429, ApiErrorCode.AUTH_RATE_LIMITED, "Too many login attempts from this network destination. Try again in 15 minutes."));
  }

  try {
    // 2. Email Throttle
    await activeEmailLimiter.consume(emailNorm, 1);
  } catch (rej) {
    return next(new ApiError(429, ApiErrorCode.AUTH_RATE_LIMITED, "Too many login attempts for this admin account email. Try again in 5 minutes."));
  }

  try {
    // 3. Combined Throttle
    await activeCombinedLimiter.consume(emailAndIpKey, 1);
  } catch (rej) {
    return next(new ApiError(429, ApiErrorCode.AUTH_RATE_LIMITED, "Suspicious login pattern detected. Credential attempts capped. Try again in 2 minutes."));
  }

  next();
};
