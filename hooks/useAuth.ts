/**
 * hooks/useAuth.ts
 *
 * Convenience hook to consume AuthContext.
 * Throws a clear error if used outside of <AuthProvider>.
 */

import { useAuthContext } from "@/context/AuthContext";

export const useAuth = useAuthContext;
