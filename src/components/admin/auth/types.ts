export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  permissions: string[];
}

export type AuthMode = "LOGIN" | "EMAIL_OTP" | "PHONE_OTP" | "PASSWORD_RESET" | "LOCKED" | "ROTATE_PASSWORD";

export interface AdminAuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  currentUser: AdminUser | null;
  roles: string[];
  permissions: string[];
  mode: AuthMode;
  emailForOtp: string | null;
  otpExpirySeconds: number;
  devOtpHint: string | null;
  login: (email: string, password: string) => Promise<void>;
  verifyEmailOtp: (otp: string) => Promise<void>;
  verifyPhoneOtp: (challengeId: string, otp: string) => Promise<boolean>;
  rotatePassword: (email: string, currentPlain: string, newPlain: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissionsList: string[]) => boolean;
  hasAllPermissions: (permissionsList: string[]) => boolean;
  setMode: (mode: AuthMode) => void;
  setEmailForOtp: (email: string | null) => void;
  bypassLogin?: () => Promise<void> | void;
}
