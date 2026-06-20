import { z } from "zod";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Auto-detect production environment (e.g. Railway, container service)
if (process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_STATIC_URL) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
  }
}

// Log presence checks safely for Railway deployment debugging without leaking values
console.log("======================================================================");
console.log("[CONFIG CHECK] ENVIRONMENT INITIALIZATION DIAGNOSTICS:");
console.log(`[CONFIG CHECK] NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`[CONFIG CHECK] JWT_SECRET: ${process.env.JWT_SECRET ? "✓ Found" : "✗ Missing"}`);
console.log(`[CONFIG CHECK] CSRF_SECRET: ${process.env.CSRF_SECRET ? "✓ Found" : "✗ Missing"}`);
console.log(`[CONFIG CHECK] ADMIN_SEED_EMAIL: ${process.env.ADMIN_SEED_EMAIL ? "✓ Found" : "✗ Missing"}`);
console.log(`[CONFIG CHECK] ADMIN_SEED_PASSWORD: ${process.env.ADMIN_SEED_PASSWORD ? "✓ Found" : "✗ Missing"}`);
console.log(`[CONFIG CHECK] RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? "✓ Found" : "✗ Missing"}`);
console.log(`[CONFIG CHECK] RAZORPAY_KEY_SECRET: ${process.env.RAZORPAY_KEY_SECRET ? "✓ Found" : "✗ Missing"}`);
console.log("======================================================================\n");

// Apply smart development fallbacks using CRYPTOGRAPHICALLY SECURE runtime-generated values if they are not provided, weak, or set to static fallbacks
if (process.env.NODE_ENV !== "production") {
  const needsJwtGen = !process.env.JWT_SECRET || 
    process.env.JWT_SECRET.length < 64 || 
    process.env.JWT_SECRET === "ubex_production_jwt_signing_secret_key" ||
    process.env.JWT_SECRET.includes("ubex_development");
  
  if (needsJwtGen) {
    process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex"); // 64-character (256-bit) high-entropy hex string
    console.log(`[SECURITY] Generated secure high-entropy runtime development JWT_SECRET: ${process.env.JWT_SECRET}`);
  }

  const needsCsrfGen = !process.env.CSRF_SECRET || 
    process.env.CSRF_SECRET.length < 64 || 
    process.env.CSRF_SECRET === "ubex_production_double_submit_cookies_csrf_key" ||
    process.env.CSRF_SECRET.includes("ubex_development");
  
  if (needsCsrfGen) {
    process.env.CSRF_SECRET = crypto.randomBytes(32).toString("hex"); // 64-character (256-bit) high-entropy hex string
    console.log(`[SECURITY] Generated secure high-entropy runtime development CSRF_SECRET: ${process.env.CSRF_SECRET}`);
  }

  process.env.ADMIN_SEED_EMAIL = "admin@ubex.in";
  process.env.ADMIN_SEED_PASSWORD = "UbExDeveloper123!";
  console.log(`[SECURITY] Forced development ADMIN_SEED_EMAIL to admin@ubex.in`);
  console.log(`[SECURITY] Forced development ADMIN_SEED_PASSWORD to UbExDeveloper123!`);
}

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  JWT_SECRET: z
    .string()
    .min(64, { message: "JWT_SECRET must be at least 64 characters (512-bit) for strong signatures" }),
  CSRF_SECRET: z
    .string()
    .min(64, { message: "CSRF_SECRET must be at least 64 characters to guarantee high entropy token validation" }),
  ADMIN_SEED_EMAIL: z
    .string()
    .email({ message: "ADMIN_SEED_EMAIL must be a valid email address" }),
  ADMIN_SEED_PASSWORD: z
    .string()
    .min(12, { message: "ADMIN_SEED_PASSWORD must be at least 12 characters" })
    .regex(/[A-Z]/, "ADMIN_SEED_PASSWORD must contain at least one uppercase letter")
    .regex(/[a-z]/, "ADMIN_SEED_PASSWORD must contain at least one lowercase letter")
    .regex(/[0-9]/, "ADMIN_SEED_PASSWORD must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "ADMIN_SEED_PASSWORD must contain at least one special character"),
  SQL_HOST: z.string().default("localhost"),
  SQL_DB_NAME: z.string().default("postgres"),
  SQL_ADMIN_USER: z.string().default("postgres"),
  SQL_ADMIN_PASSWORD: z.string().default("postgres"),
  SQL_SSL: z.enum(["true", "false"]).default("false"),
  SQL_SSL_REJECT_UNAUTHORIZED: z.enum(["true", "false"]).default("true"),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production") {
    // Prohibit default credentials in production
    if (data.ADMIN_SEED_EMAIL === "admin@ubex.com") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Production security policy violation: Default ADMIN_SEED_EMAIL 'admin@ubex.com' is forbidden in production",
        path: ["ADMIN_SEED_EMAIL"],
      });
    }
    if (data.ADMIN_SEED_PASSWORD === "P@ssword123!") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Production security policy violation: Default ADMIN_SEED_PASSWORD 'P@ssword123!' is forbidden in production",
        path: ["ADMIN_SEED_PASSWORD"],
      });
    }
    // Enforce SSL database transport in production
    if (data.SQL_SSL !== "true") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Production security policy violation: SQL_SSL must be 'true' in production to guarantee data-in-transit encryption",
        path: ["SQL_SSL"],
      });
    }
  }
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("\n======================================================================");
    console.error("[CRITICAL SHUTDOWN] ENVIRONMENT VALIDATION FAILED:");
    result.error.issues.forEach((err) => {
      console.error(`  - [${err.path.join(".")}] ${err.message}`);
    });
    console.error("======================================================================\n");
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
