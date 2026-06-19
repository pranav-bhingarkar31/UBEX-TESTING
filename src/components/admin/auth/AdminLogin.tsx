import React, { useState, useEffect, useRef } from "react";
import { useAdminAuth } from "./AdminAuthProvider";
import { Sliders, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { FEATURES } from "../../../config/features";

interface AdminLoginProps {
  onCancel?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onCancel }) => {
  if (!FEATURES.ADMIN_OS_ENABLED) {
    return null;
  }
  const { login, bypassLogin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);

  const mountedRef = useRef<boolean>(true);

  // Manage unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cooldown countdown timer effect
  useEffect(() => {
    if (cooldownTime <= 0) return;
    const interval = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownTime > 0) {
      return;
    }
    if (!email || !password) {
      setError("Please fill in all security fields.");
      return;
    }
    setError(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await login(normalizedEmail, password);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to authenticate operator credentials.";
      if (mountedRef.current) {
        setError(errMsg);
        // Activate 3 seconds failed login cooldown lock
        setCooldownTime(3);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const isButtonDisabled = loading || cooldownTime > 0;

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      {/* Background ambient decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-scale-up text-left">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
          <div className="p-3 bg-emerald-500 rounded-2xl text-slate-950 shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wider uppercase text-emerald-400">UbEx Admin OS</h3>
            <p className="text-xs text-slate-400 font-mono">Gateway Security Layer</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mb-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4 flex gap-3 text-xs text-slate-300 leading-relaxed font-mono">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-200 font-bold">Encrypted Connection Active</p>
            <p className="text-[10px] text-slate-400 mt-1">This console demands credentials coupled with 2-Factor dynamic dispatch.</p>
          </div>
        </div>

        {/* Development Credentials Help Block */}
        <div className="mb-6 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 p-4 text-xs text-emerald-300 leading-relaxed font-mono">
          <p className="text-emerald-400 font-bold mb-1.5">Development Access Credentials:</p>
          <p className="text-[11px] text-slate-300">
            Email: <strong className="text-emerald-200 select-all font-bold">admin@ubex.in</strong>
          </p>
          <p className="text-[11px] text-slate-300 mt-1">
            Passcode: <strong className="text-emerald-200 select-all font-bold">UbExDeveloper123!</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email segment */}
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-slate-400 mb-1.5 font-mono">
              Operator Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="operator@ubex.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 font-mono"
              />
            </div>
          </div>

          {/* Password segment */}
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-slate-400 mb-1.5 font-mono">
              Authorized Passcode
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 pl-10 pr-12 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-slate-500 hover:text-slate-300 transition-all cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Password must be at least 12 characters</p>
          </div>

          {/* Error & Cooldown notice banner */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-400 font-sans leading-relaxed">
              <strong>Access Denied:</strong> {error}
            </div>
          )}

          {cooldownTime > 0 && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-900/60 rounded-xl text-xs text-amber-400 font-mono leading-relaxed">
              <strong>Login Blocked:</strong> Please wait {cooldownTime}s before retrying.
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-transparent hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`flex-1 ${onCancel ? "" : "w-full"} bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-2 border-0 shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : cooldownTime > 0 ? (
                <span>Cooldown Locked</span>
              ) : (
                <span>Validate &amp; Send OTP</span>
              )}
            </button>
          </div>

          {bypassLogin && (
            <div className="mt-4 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => bypassLogin()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-2 border-0 shadow-lg shadow-indigo-600/15"
              >
                <Sliders className="w-4 h-4 animate-pulse" />
                <span>Bypass Security (Direct Access)</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
