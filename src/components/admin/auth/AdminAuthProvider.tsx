import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { AdminUser, AdminAuthContextType, AuthMode } from "./types";
import { generateDeviceFingerprint } from "./deviceFingerprint";
import { FEATURES } from "../../../config/features";

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Standalone standardized error extraction helper
export function extractApiError(json: unknown, fallback: string = "An unexpected secure network anomaly occurred."): string {
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (obj.error && typeof obj.error === "object") {
      const inner = obj.error as Record<string, unknown>;
      if (typeof inner.message === "string") return inner.message;
    }
    if (typeof obj.message === "string") return obj.message;
  }
  if (json instanceof Error) {
    return json.message;
  }
  return fallback;
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!FEATURES.ADMIN_OS_ENABLED) {
    return <>{children}</>;
  }
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [mode, setModeState] = useState<AuthMode>("LOGIN");
  const [emailForOtp, setEmailForOtpState] = useState<string | null>(null);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(300);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const csrfTokenRef = useRef<string | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Maintain unmount awareness
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Standard safe state-setting helpers
  const safeSetMode = (m: AuthMode) => {
    if (mountedRef.current) setModeState(m);
  };

  const safeSetEmailForOtp = (e: string | null) => {
    if (mountedRef.current) setEmailForOtpState(e);
  };

  // Helper to safely reset administrative session state
  const resetAuthState = () => {
    if (mountedRef.current) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setRoles([]);
      setPermissions([]);
      setEmailForOtpState(null);
      setDevOtpHint(null);
      setModeState("LOGIN");
    }
    csrfTokenRef.current = null;
  };

  // Double check client-side cryptographic uuid integrity
  const generateCorrelationId = (): string => {
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
  };

  // Helper to retrieve initial or stored CSRF token
  const fetchCsrfToken = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/v1/admin/auth/csrf", { method: "GET" });
      if (response.ok) {
        const json = await response.json();
        if (json && json.success && json.data && json.data.csrf_token) {
          csrfTokenRef.current = json.data.csrf_token;
          return json.data.csrf_token;
        }
      }
    } catch (err) {
      console.error("Failed to secure CSRF Token baseline:", err);
    }
    return null;
  };

  // Safe fetch helper that auto-applies correlation header, credentials, and CSRF token elements
  const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (!csrfTokenRef.current) {
      await fetchCsrfToken();
    }

    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    headers.set("X-Correlation-ID", generateCorrelationId());
    
    if (csrfTokenRef.current) {
      headers.set("x-csrf-token", csrfTokenRef.current);
    }

    const finalOptions: RequestInit = {
      ...options,
      credentials: "include",
      headers,
    };

    return fetch(url, finalOptions);
  };

  const refreshSession = async () => {
    try {
      if (mountedRef.current) setLoading(true);
      const response = await secureFetch("/api/v1/admin/auth/session", { method: "GET" });
      if (response.ok) {
        const json = await response.json();
        if (json && json.success && json.data && json.data.session) {
          const s = json.data.session;
          const userObj: AdminUser = {
            id: String(s.user_id),
            email: String(s.email),
            first_name: String(s.first_name || ""),
            last_name: String(s.last_name || ""),
            roles: Array.isArray(s.roles) ? (s.roles as string[]) : [],
            permissions: Array.isArray(s.permissions) ? (s.permissions as string[]) : [],
          };
          if (mountedRef.current) {
            setCurrentUser(userObj);
            setRoles(userObj.roles);
            setPermissions(userObj.permissions);
            setIsAuthenticated(true);
            setModeState("LOGIN"); // standard fallback if authenticated
          }

          if (json.data.csrf_token) {
            csrfTokenRef.current = json.data.csrf_token;
          }
        } else {
          resetAuthState();
        }
      } else {
        resetAuthState();
      }
    } catch (err) {
      console.error("Session refresh validation failure:", err);
      resetAuthState();
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (mountedRef.current) {
        setLoading(true);
        setDevOtpHint(null);
      }
      
      const response = await secureFetch("/api/v1/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        if (json && json.error && json.error.code === "AUTH_PASSWORD_CHANGE_REQUIRED") {
          if (mountedRef.current) {
            setEmailForOtpState(normalizedEmail);
            setModeState("ROTATE_PASSWORD");
          }
        }
        throw new Error(extractApiError(json, "Invalid operator credentials provided."));
      }

      if (mountedRef.current) {
        setEmailForOtpState(normalizedEmail);
        if (json.data && typeof json.data.otp_expiry_seconds === "number") {
          setOtpExpirySeconds(json.data.otp_expiry_seconds);
        }
        if (json.data && typeof json.data._dev_otp === "string") {
          setDevOtpHint(json.data._dev_otp);
        }
        setModeState("EMAIL_OTP");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const verifyEmailOtp = async (otp: string) => {
    if (!emailForOtp) {
      throw new Error("No active authentication email context found. Please re-login.");
    }
    try {
      if (mountedRef.current) setLoading(true);
      
      const fingerprint = await generateDeviceFingerprint();
      const response = await secureFetch("/api/v1/admin/auth/verify-email-otp", {
        method: "POST",
        body: JSON.stringify({
          email: emailForOtp,
          otp,
          device_fingerprint: fingerprint,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(extractApiError(json, "Invalid or expired verification code."));
      }

      if (json.data && json.data.user) {
        const u = json.data.user;
        const userObj: AdminUser = {
          id: String(u.id),
          email: String(u.email),
          first_name: String(u.first_name || ""),
          last_name: String(u.last_name || ""),
          roles: Array.isArray(u.roles) ? (u.roles as string[]) : [],
          permissions: Array.isArray(u.permissions) ? (u.permissions as string[]) : [],
        };
        if (mountedRef.current) {
          setCurrentUser(userObj);
          setRoles(userObj.roles);
          setPermissions(userObj.permissions);
          setIsAuthenticated(true);
        }
        if (json.data.csrf_token) {
          csrfTokenRef.current = json.data.csrf_token;
        }
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const verifyPhoneOtp = async (challengeId: string, otp: string): Promise<boolean> => {
    try {
      const response = await secureFetch("/api/v1/admin/auth/verify-phone-otp", {
        method: "POST",
        body: JSON.stringify({ challenge_id: challengeId, otp }),
      });
      const json = await response.json();
      return response.ok && !!json.success;
    } catch (err) {
      console.error("SMS Step-up MFA Verification failure:", err);
      return false;
    }
  };

  const rotatePassword = async (email: string, currentPlain: string, newPlain: string): Promise<void> => {
    try {
      if (mountedRef.current) setLoading(true);
      const response = await secureFetch("/api/v1/admin/auth/rotate-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          current_password: currentPlain,
          new_password: newPlain,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(extractApiError(json, "Password rotation policy validation failed."));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (mountedRef.current) setLoading(true);
      await secureFetch("/api/v1/admin/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout dispatch failure:", err);
    } finally {
      resetAuthState();
      if (mountedRef.current) setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionsList: string[]): boolean => {
    return permissionsList.some(p => permissions.includes(p));
  };

  const hasAllPermissions = (permissionsList: string[]): boolean => {
    return permissionsList.every(p => permissions.includes(p));
  };

  const bypassLogin = async () => {
    try {
      if (mountedRef.current) setLoading(true);
      const response = await secureFetch("/api/v1/admin/auth/bypass-developer", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Bypass backend setup failed.");
      }

      const json = await response.json();
      if (json && json.success && json.data && json.data.user) {
        const u = json.data.user;
        const userObj: AdminUser = {
          id: String(u.id),
          email: String(u.email),
          first_name: String(u.first_name || ""),
          last_name: String(u.last_name || ""),
          roles: Array.isArray(u.roles) ? (u.roles as string[]) : [],
          permissions: Array.isArray(u.permissions) ? (u.permissions as string[]) : [],
        };
        
        if (mountedRef.current) {
          setCurrentUser(userObj);
          setRoles(userObj.roles);
          setPermissions(userObj.permissions);
          setIsAuthenticated(true);
          setModeState("LOGIN");
        }
      }
    } catch (err) {
      console.error("Failed to execute administrative bypass:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Baseline initialization bootstrap
  useEffect(() => {
    const bootstrap = async () => {
      await fetchCsrfToken();
      await refreshSession();
    };
    bootstrap();
  }, []);

  // Wrap context in useMemo for optimal react render cycles
  const providerValue = useMemo<AdminAuthContextType>(() => ({
    isAuthenticated,
    loading,
    currentUser,
    roles,
    permissions,
    mode,
    emailForOtp,
    otpExpirySeconds,
    devOtpHint,
    login,
    verifyEmailOtp,
    verifyPhoneOtp,
    rotatePassword,
    logout,
    refreshSession,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    setMode: safeSetMode,
    setEmailForOtp: safeSetEmailForOtp,
    bypassLogin,
  }), [
    isAuthenticated,
    loading,
    currentUser,
    roles,
    permissions,
    mode,
    emailForOtp,
    otpExpirySeconds,
    devOtpHint,
  ]);

  return (
    <AdminAuthContext.Provider value={providerValue}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be resolved inside an AdminAuthProvider container.");
  }
  return context;
};
