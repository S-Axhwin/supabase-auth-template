/**
 * lib/auth.ts
 *
 * Auth helpers. Google OAuth and sign-out logic lives in AuthContext
 * so it can carry loading state — no need to duplicate it here.
 *
 * Add any standalone auth utilities here (e.g. password reset, magic link).
 */

export { useAuth } from "@/context/AuthContext";
