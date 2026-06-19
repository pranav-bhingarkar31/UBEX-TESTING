import React, { useState, useEffect, useRef } from "react";
import { useAdminAuth } from "./AdminAuthProvider";
import { Sliders, Lock, CheckCircle2, XCircle, ArrowLeft, RefreshCw, KeyRound, ShieldAlert } from "lucide-react";
import { FEATURES } from "../../../config/features";

export const AdminRotatePassword: React.FC = () => {
  if (!FEATURES.ADMIN_OS_ENABLED) {
    return null;
  }
  const { rotatePassword, emailForOtp, setMode } = useAdminAuth();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Password rules validation helper
  const rules = {
    length: newPassword.length >= 12,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword === confirmPassword && confirmPassword.length > 0,
  };

  const isFormValid = 
    rules.length && 
    rules.uppercase && 
    rules.lowercase && 
    rules.number && 
    rules.special && 
    rules.match &&
    currentPassword.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError("Please ensure all security password parameters are green.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await rotatePassword(emailForOtp || "admin@ubex.in", currentPassword, newPassword);
      if (mountedRef.current) {
        setSuccess("Administrative password rotated successfully! You can now access the gateway log.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Password rotation failed. Check current credentials.";
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
    setMode("LOGIN");
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      {/* Background ambient decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative z-10 animate-scale-up text-left">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-5">
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 shrink-0">
            <KeyRound className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wider uppercase text-red-400">Security Rotation Enforced</h3>
            <p className="text-xs text-slate-400 font-mono">Administrative Password Compliance</p>
          </div>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 font-mono text-xs leading-relaxed space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Rotation Standard Finalized</span>
              </div>
              <p>{success}</p>
              <p className="text-[10px] text-emerald-500">All session files re-anchored on active local database storage.</p>
            </div>

            <button
              onClick={handleReturnToLogin}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black py-4 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-2 border-0 shadow-lg shadow-emerald-500/15"
            >
              <span>Return to Login Gate</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operator Target Guard */}
            <div className="mb-2 rounded-2xl bg-slate-950 border border-slate-800/80 p-4 flex gap-3 text-xs leading-relaxed font-mono">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-300">
                  Account <strong className="text-emerald-400 select-all font-bold">{emailForOtp || "admin@ubex.in"}</strong> requires password change guidelines compliance prior to OTP step validation.
                </p>
              </div>
            </div>

            {/* Current Passcode field */}
            <div>
              <label className="block text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1.5 font-mono">
                Current Passcode
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Insert current passcode..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-red-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 outline-none transition-all placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            {/* Split layout for new entry / checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {/* New Passcode field */}
                <div>
                  <label className="block text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1.5 font-mono">
                    New Cryptographic Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="At least 12 characters..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 outline-none transition-all placeholder:text-slate-600 font-mono"
                    />
                  </div>
                </div>

                {/* Confirm Passcode field */}
                <div>
                  <label className="block text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1.5 font-mono">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Repeat selection..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 outline-none transition-all placeholder:text-slate-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Security policy compliance scorecard */}
              <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-2xl space-y-2.5 font-mono text-[10px]">
                <p className="text-slate-400 font-black tracking-wide uppercase border-b border-slate-800 pb-1.5 mb-2">Policy Criteria Scorecard</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {rules.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    <span className={rules.length ? "text-emerald-400" : "text-slate-500"}>Minimum 12 characters long</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rules.uppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    <span className={rules.uppercase ? "text-emerald-400" : "text-slate-500"}>Uppercase operator letter [A-Z]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rules.lowercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    <span className={rules.lowercase ? "text-emerald-400" : "text-slate-500"}>Lowercase operator letter [a-z]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rules.number ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    <span className={rules.number ? "text-emerald-400" : "text-slate-500"}>At least one numeric digit [0-9]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rules.special ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    <span className={rules.special ? "text-emerald-400" : "text-slate-500"}>At least one symbol string token</span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-800/60 pt-1.5 mt-1">
                    {rules.match ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    <span className={rules.match ? "text-emerald-400 font-bold" : "text-slate-500"}>Passwords match perfectly</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error messaging state */}
            {error && (
              <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-400 font-sans leading-relaxed">
                <strong>Policy Rejection:</strong> {error}
              </div>
            )}

            {/* Form actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleReturnToLogin}
                disabled={loading}
                className="flex-1 bg-transparent hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono text-center"
              >
                Cancel Change
              </button>
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-2 border-0 shadow-lg shadow-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 text-slate-950" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Submit Rotation &amp; Change</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminRotatePassword;
