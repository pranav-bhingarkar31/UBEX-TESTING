import { getPool } from "../db/dbClient";
import { createClient } from "redis";

let redisClient: any = null;
let redisInitialized = false;
let redisConnectFailed = false;

// Safe lazy Redis initializer to ensure we never crash on server starts
async function getRedisClient() {
  if (redisConnectFailed) return null;
  if (redisInitialized) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    redisConnectFailed = true;
    return null;
  }

  try {
    redisClient = createClient({ url });
    redisClient.on("error", (err: any) => {
      console.error("[RATE LIMIT] Redis local client error:", err);
    });
    await redisClient.connect();
    redisInitialized = true;
    console.log("[RATE LIMIT] Connected successfully to Redis.");
    return redisClient;
  } catch (err) {
    console.error("[RATE LIMIT] Redis initialization failed. Shifting permanently to SQL/Memory fallback.", err);
    redisConnectFailed = true;
    redisClient = null;
    return null;
  }
}

// In-memory rate limiting state fallback for local development or sandbox
interface RateLimitMemoryBucket {
  minuteCount: number;
  minuteResetAt: number;
  hourCount: number;
  hourResetAt: number;
}
const memoryStore = new Map<string, RateLimitMemoryBucket>();

// Cleanup stale memory profiles periodically (Memory leak prevention)
setInterval(() => {
  const now = Date.now();
  for (const [ip, store] of memoryStore.entries()) {
    if (now > store.hourResetAt) {
      memoryStore.delete(ip);
    }
  }
}, 5 * 60 * 1000); // every 5 minutes

export const RateLimitService = {
  /**
   * Evaluates rate limiting controls on incoming client IP blocks.
   * Constraints:
   * Max 5 inquiries per minute, max 30 inquiries per hour.
   */
  async isRateLimited(ip: string): Promise<boolean> {
    const clientIp = ip || "unknown-ip";

    // 1. Try Primary: Redis rate Limiter
    const redis = await getRedisClient();
    if (redis) {
      try {
        const minuteKey = `ubex:rate:${clientIp}:minute`;
        const hourKey = `ubex:rate:${clientIp}:hour`;

        // Atomically evaluate minute-level window
        const minuteCount = await redis.incr(minuteKey);
        if (minuteCount === 1) {
          await redis.expire(minuteKey, 60);
        }

        // Atomically evaluate hour-level window
        const hourCount = await redis.incr(hourKey);
        if (hourCount === 1) {
          await redis.expire(hourKey, 3600);
        }

        if (minuteCount > 5 || hourCount > 30) {
          return true;
        }
        return false;
      } catch (err) {
        console.error("[RATE LIMIT] Redis operations failed. Transitioning to database fallback.", err);
      }
    }

    // 2. Try Fallback: PostgreSQL rate limit table
    const pool = getPool();
    const isFallback = pool.fallbackMode;

    if (!isFallback) {
      try {
        // Enforce the rate limit table exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "ubex_rate_limits" (
            "ip" TEXT NOT NULL,
            "window_type" TEXT NOT NULL,
            "count" INTEGER DEFAULT 1,
            "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY ("ip", "window_type")
          );
        `);

        // Safely purge stale historical rate limits (Automatic database-backed cleanups)
        await pool.query(`
          DELETE FROM "ubex_rate_limits"
          WHERE ("window_type" = 'minute' AND "updated_at" < NOW() - INTERVAL '1 minute')
             OR ("window_type" = 'hour' AND "updated_at" < NOW() - INTERVAL '1 hour');
        `);

        // Check & Upsert Minute limit
        const minRes = await pool.query(`
          INSERT INTO "ubex_rate_limits" ("ip", "window_type", "count", "updated_at")
          VALUES ($1, 'minute', 1, NOW())
          ON CONFLICT ("ip", "window_type")
          DO UPDATE SET "count" = "ubex_rate_limits"."count" + 1, "updated_at" = NOW()
          RETURNING "count";
        `, [clientIp]);

        // Check & Upsert Hour limit
        const hrRes = await pool.query(`
          INSERT INTO "ubex_rate_limits" ("ip", "window_type", "count", "updated_at")
          VALUES ($1, 'hour', 1, NOW())
          ON CONFLICT ("ip", "window_type")
          DO UPDATE SET "count" = "ubex_rate_limits"."count" + 1, "updated_at" = NOW()
          RETURNING "count";
        `, [clientIp]);

        const minCount = minRes.rows[0]?.count || 1;
        const hrCount = hrRes.rows[0]?.count || 1;

        if (minCount > 5 || hrCount > 30) {
          return true;
        }
        return false;
      } catch (err) {
        console.error("[RATE LIMIT] PostgreSQL rate limiter failed. Sliding back to local memory store.", err);
      }
    }

    // 3. Fallback tertiary: Local high-precision memory mapping
    const now = Date.now();
    let bucket = memoryStore.get(clientIp);

    if (!bucket) {
      bucket = {
        minuteCount: 0,
        minuteResetAt: now + 60 * 1000,
        hourCount: 0,
        hourResetAt: now + 60 * 60 * 1000
      };
      memoryStore.set(clientIp, bucket);
    }

    // Reset minute calculations if window completed
    if (now > bucket.minuteResetAt) {
      bucket.minuteCount = 0;
      bucket.minuteResetAt = now + 60 * 1000;
    }

    // Reset hour calculations if window completed
    if (now > bucket.hourResetAt) {
      bucket.hourCount = 0;
      bucket.hourResetAt = now + 60 * 60 * 1000;
    }

    bucket.minuteCount += 1;
    bucket.hourCount += 1;

    if (bucket.minuteCount > 5 || bucket.hourCount > 30) {
      return true;
    }

    return false;
  }
};

export default RateLimitService;
