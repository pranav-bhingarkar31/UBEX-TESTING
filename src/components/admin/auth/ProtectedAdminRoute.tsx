import React from "react";
import { useAdminAuth } from "./AdminAuthProvider";
import { AdminLogin } from "./AdminLogin";
import { AdminEmailOtp } from "./AdminEmailOtp";
import { AdminRotatePassword } from "./AdminRotatePassword";
import { Sliders } from "lucide-react";
import { FEATURES } from "../../../config/features";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  if (!FEATURES.ADMIN_OS_ENABLED) {
    return null;
  }
  const { isAuthenticated, loading, mode } = useAdminAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 z-[99999]">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl text-emerald-400">
              <Sliders className="w-8 h-8 animate-spin" />
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl animate-pulse -z-10 scale-125 blur-sm"></div>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase text-slate-200 tracking-wider font-mono">Restoring Console Session</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Verifying encrypted cryptography state...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (mode === "EMAIL_OTP") {
      return <AdminEmailOtp />;
    }
    if (mode === "ROTATE_PASSWORD") {
      return <AdminRotatePassword />;
    }
    return <AdminLogin />;
  }

  // Authenticated successfully - let the operator view dashboard shell
  return <>{children}</>;
};

export default ProtectedAdminRoute;
