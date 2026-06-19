import { useAdminAuth } from "./AdminAuthProvider";

export function useAdminSession() {
  const { isAuthenticated, loading, currentUser, refreshSession } = useAdminAuth();

  return {
    isAuthenticated,
    loading,
    currentUser,
    refreshSession,
  };
}
export default useAdminSession;
