import React, { useState, useEffect, useRef } from "react";
import { useAdminAuth } from "./AdminAuthProvider";
import { Sliders, Key, RefreshCw, AlertTriangle, Lightbulb, ArrowLeft } from "lucide-react";
import { FEATURES } from "../../../config/features";

// Email masking helper: admin@ubex.com -> adm***@ubex.com
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 3) {
    return `${local[0] || ""}***@${domain}`;
  }
  return `${local.substring(0, 3)}***@${domain}`;
}

export const AdminEmailOtp: React.FC = () => {
  if (!FEATURES.ADMIN_OS_ENABLED) {
    return null;
  }
  const { verifyEmailOtp, emailForOtp, otpExpirySeconds, devOtpHint, logout } = useAdminAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(otpExpirySeconds || 300);

  const mountedRef = useRef<boolean>(true);

  // Manage unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Secure countdown timer: stops at exactly zero and prevents interval leak
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      if (mountedRef.current) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft <= 0) {
      setError("This security session has expired. Please request a new passcode.");
      return;
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please input a valid 6-digit numeric passcode.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await verifyEmailOtp(otp);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "OTP verification failed. Access denied.";
      if (mountedRef.current) {
        setError(errMsg);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleReturnToLogin = () => {
    logout(); // Resets authentication states and moves mode back to LOGIN
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const isExpired = timeLeft <= 0;
  const isInputDisabled = loading || isExpired;
  const isVerifyDisabled = loading || otp.length !== 6 || isExpired;

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      {/* Ambient background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-scale-up text-left">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
          <div className="p-3 bg-emerald-500 rounded-2xl text-slate-950 shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wider uppercase text-emerald-400">Step-2 Verification</h3>
            <p className="text-xs text-slate-400 font-mono">Dynamic Operator Dispatch</p>
          </div>
        </div>

        {/* Security Alert Content */}
        <div className="mb-6 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 p-4 text-xs text-slate-300 leading-relaxed font-mono">
          <p className="text-emerald-400 font-bold mb-1">Passcode Dispatched Successfully</p>
          <p className="text-slate-400">
            A one-time passcode has been sent to your email details: <strong className="text-slate-200">{maskEmail(emailForOtp || "")}</strong>. Check your inbox.
          </p>
        </div>

        {/* Developer OTP Helper Hint Overlay - Guarded strictly in Dev mode only */}
        {devOtpHint && (
          <div className="mb-6 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 p-4 text-xs text-indigo-200 font-mono flex items-start gap-2.5">
            <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-300">Local Environment Dev OTP Mode</p>
              <p className="text-[11px] text-indigo-400 mt-1">
                Your extracted code is: <strong className="text-indigo-200 font-black tracking-widest text-sm bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-800">{devOtpHint}</strong>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-slate-400 mb-1.5 font-mono">
              6-Digit One-Time Code
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                maxLength={6}
                pattern="\d{6}"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={isInputDisabled}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 pl-10 pr-4 text-lg text-slate-100 outline-none transition-all placeholder:text-slate-700 font-mono tracking-[0.4em] font-black disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Time Remaining Counter / Return to Login Trigger */}
          <div className="flex items-center justify-between text-xs font-mono">
            {!isExpired ? (
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping items-center"></span>
                Expires in {formatTime(timeLeft)}
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                Session Expired!
              </span>
            )}

            <button
              type="button"
              onClick={handleReturnToLogin}
              disabled={loading}
              className="border-0 bg-transparent text-xs font-black p-1 hover:underline text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <ArrowLeft className="w-3 h-3" />
              Return to Login
            </button>
          </div>

          {/* Error Notice block */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-400 font-sans leading-relaxed">
              <strong>Verification Failure:</strong> {error}
            </div>
          )}

          {/* Action layout */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleReturnToLogin}
              disabled={loading}
              className="flex-1 bg-transparent hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono text-center"
            >
              Cancel Auth
            </button>

            <button
              type="submit"
              disabled={isVerifyDisabled}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-2 border-0 shadow-lg shadow-emerald-500/10"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Establish Session</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEmailOtp;
