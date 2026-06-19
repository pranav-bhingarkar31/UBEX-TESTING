import * as argon2 from "argon2";
import crypto from "crypto";

/**
 * Computes a high-entropy password hash using Argon2id with recommended parameters,
 * featuring a secure cryptographically matched PBKDF2 fallback.
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: 2, // Argon2id
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  } catch (error) {
    console.warn("Argon2 compiler assembly fallback triggered. Generating PBKDF2 representation.");
    const salt = crypto.randomBytes(16).toString("hex");
    const iterations = 100000;
    const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return `pbkdf2:${iterations}:${salt}:${derived}`;
  }
}

/**
 * Verifies a plain text password against an Argon2id or fallback PBKDF2 hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("pbkdf2:")) {
    try {
      const parts = storedHash.split(":");
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const hash = parts[3];
      const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(derived));
    } catch {
      return false;
    }
  }

  try {
    return await argon2.verify(storedHash, password);
  } catch (error) {
    console.error("Argon2 native library runtime comparison fault:", error);
    return false;
  }
}
