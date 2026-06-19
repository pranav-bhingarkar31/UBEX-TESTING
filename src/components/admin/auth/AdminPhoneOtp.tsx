import React, { useState, useEffect, useRef } from "react";
import { useAdminAuth, extractApiError } from "./AdminAuthProvider";
import { ShieldCheck, Key, RefreshCw, X } from "lucide-react";
import { FEATURES } from "../../../config/features";

interface AdminPhoneOtpProps {
  challengeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminPhoneOtp: React.FC<AdminPhoneOtpProps> = ({ challengeId, onSuccess, onCancel }) => {
  if (!FEATURES.ADMIN_OS_ENABLED) {
    return null;
  }
  const { verifyPhoneOtp } = useAdminAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);

  // Manage unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please input a valid 6-digit numeric SMS passcode.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const verified = await verifyPhoneOtp(challengeId, otp);
      if (verified) {
        if (mountedRef.current) onSuccess();
      } else {
        if (mountedRef.current) setError("Invalid step-up OTP passcode. Access elevated authority denied.");
      }
    } catch (err: unknown) {
      const errMsg = extractApiError(err, "Step-up verification call failed.");
      if (mountedRef.current) setError(errMsg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[10000] overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-scale-up text-left">
        
        {/* Cancel corner button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 border-0 bg-transparent cursor-pointer p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
          <div className="p-3 bg-amber-500 rounded-2xl text-slate-950 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wider uppercase text-amber-400">Step-Up Verified</h3>
            <p className="text-xs text-slate-400 font-mono">Sensitive Action Authorization</p>
          </div>
        </div>

        {/* Security Warning */}
        <div className="mb-6 rounded-2xl bg-amber-950/25 border border-amber-900/30 p-4 text-xs text-amber-200 leading-relaxed font-mono">
          <p className="font-bold mb-1">MFA Elevated Access Demanded</p>
          <p className="text-amber-400/80">You are requesting a sensitive privilege elevation (payment sync, RBAC modify, or audit clear). Enter the secondary SMS passcode dispatched to your register phone line.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-slate-400 mb-1.5 font-mono">
              6-Digit SMS Security Code
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
                disabled={loading}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl py-3 pl-10 pr-4 text-lg text-slate-100 outline-none transition-all placeholder:text-slate-700 font-mono tracking-[0.4em] font-black"
              />
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-400 font-sans leading-relaxed">
              <strong>Step-Up Denied:</strong> {error}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-transparent hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono"
            >
              Abort Elevation
            </button>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-2 border-0 shadow-lg shadow-amber-500/10"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Elevating...</span>
                </>
              ) : (
                <span>Authorize Access</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPhoneOtp;
