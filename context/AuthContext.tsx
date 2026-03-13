/**
 * context/AuthContext.tsx
 *
 * Single source of truth for auth state across the app.
 *
 * Loading states:
 *   isLoading = true  → Initial session restore (splash screen stays up)
 *   isLoading = false → Ready; route gates can safely redirect
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { signOut as authSignOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
    /** The raw Supabase session (contains access + refresh tokens). */
    session: Session | null;
    /** Convenience shortcut for session.user. */
    user: User | null;
    /** The profile row from public.profiles. Null for new users. */
    profile: Profile | null;
    /** True while the initial session + profile fetch is in flight. */
    isLoading: boolean;
    /** True after loading completes and profile is still null. */
    isNewUser: boolean;
    /** Signs the user out and clears all state. */
    signOut: () => Promise<void>;
    /** Re-fetches the profile row (call after onboarding upsert). */
    refreshProfile: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthState | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ----- Profile fetcher ---------------------------------------------------

    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.warn("[AuthContext] fetchProfile error:", error.message);
        }

        setProfile(data ?? null);
    }, []);

    // ----- Initialise from stored session ------------------------------------

    useEffect(() => {
        let mounted = true;

        // 1. Restore any persisted session synchronously from storage
        supabase.auth.getSession().then(async ({ data: { session: s } }) => {
            if (!mounted) return;
            setSession(s);
            if (s?.user) await fetchProfile(s.user.id);
            setIsLoading(false);
        });

        // 2. Subscribe to subsequent auth state changes (sign-in / sign-out / token-refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                setSession(newSession);

                if (event === "SIGNED_IN" && newSession?.user) {
                    await fetchProfile(newSession.user.id);
                }

                if (event === "SIGNED_OUT") {
                    setProfile(null);
                }

                // TOKEN_REFRESHED, USER_UPDATED, etc. — leave profile as-is
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // ----- Actions -----------------------------------------------------------

    const handleSignOut = useCallback(async () => {
        setIsLoading(true);
        try {
            await authSignOut();
        } finally {
            setProfile(null);
            setSession(null);
            setIsLoading(false);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!session?.user) return;
        await fetchProfile(session.user.id);
    }, [session, fetchProfile]);

    // ----- Derived state -----------------------------------------------------

    const user = session?.user ?? null;
    const isNewUser = !isLoading && !!session && profile === null;

    // ----- Value -------------------------------------------------------------

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                profile,
                isLoading,
                isNewUser,
                signOut: handleSignOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Internal hook (used by the public useAuth hook)
// ---------------------------------------------------------------------------

export function useAuthContext(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an <AuthProvider>");
    }
    return ctx;
}
