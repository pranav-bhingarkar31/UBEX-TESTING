/**
 * Secure Client Device Fingerprinting Utility
 * Gathers system characteristics and hashes them using standard SHA-256 Web Crypto API.
 */

function generateUUID(): string {
  try {
    if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
  } catch {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getFallbackFingerprint(): string {
  if (typeof window === "undefined") {
    return "admin_console_server_side_fallback";
  }
  try {
    const storageKey = "ubex_fallback_device_uuid";
    let stored = localStorage.getItem(storageKey);
    if (!stored) {
      stored = "fallback_" + generateUUID();
      localStorage.setItem(storageKey, stored);
    }
    return stored;
  } catch {
    return "fallback_ephemeral_" + generateUUID();
  }
}

export async function generateDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined" || !window.navigator || !window.crypto || !window.crypto.subtle) {
    return getFallbackFingerprint();
  }

  try {
    const segments = [
      navigator.userAgent || "unknown_ua",
      navigator.language || "unknown_lang",
      (navigator as any).platform || "unknown_platform",
      String(screen.width || 0),
      String(screen.height || 0),
    ];

    const sourceString = segments.join("|");
    const encoder = new TextEncoder();
    const data = encoder.encode(sourceString);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    
    // Convert ArrayBuffer to Hex String representation
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    console.error("Failed to generate dynamic browser digital signature:", err);
    return getFallbackFingerprint();
  }
}
