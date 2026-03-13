/**
 * context/AuthContext.tsx
 *
 * Single source of truth for auth state.
 * Google OAuth uses the implicit flow: tokens come back in the
 * URL fragment (samfront://#access_token=...&refresh_token=...).
 * No callback screen needed — openAuthSessionAsync intercepts the redirect.
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import { type Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

// Tell the system browser to close itself after OAuth redirect
WebBrowser.maybeCompleteAuthSession();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextValue {
    session: Session | null;
    profile: Profile | null;
    /** True while the initial session + profile is restoring (splash gate) */
    loading: boolean;
    /** True while the Google OAuth browser is open */
    googleLoading: boolean;
    /** Email + password sign-in. Returns an error message or null on success. */
    signIn: (email: string, password: string) => Promise<string | null>;
    /** Email + password registration. Returns an error message or null on success. */
    signUp: (email: string, password: string) => Promise<string | null>;
    signInWithGoogle: () => Promise<void>;
    /** Upserts the display_name for a new user (call after onboarding form) */
    saveProfile: (displayName: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue>({
    session: null,
    profile: null,
    loading: true,
    googleLoading: false,
    signIn: async () => null,
    signUp: async () => null,
    signInWithGoogle: async () => { },
    saveProfile: async () => null,
    signOut: async () => { },
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Track state changes
    useEffect(() => {
        console.log(`[AuthTrace] State Update -> loading: ${loading}, session: ${!!session}, profile: ${!!profile}`);
    }, [loading, session, profile]);

    // ----- Profile fetcher ---------------------------------------------------

    const fetchProfile = useCallback(async (userId: string) => {
        console.log(`[AuthTrace] fetchProfile started for userId: ${userId}`);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .maybeSingle();

            if (error) {
                console.error("[AuthTrace] fetchProfile error:", error);
            } else {
                console.log(`[AuthTrace] fetchProfile success, profile found: ${!!data}`);
            }

            setProfile(data ?? null);
        } finally {
            console.log("[AuthTrace] fetchProfile finally block, setting loading=false");
            setLoading(false);
        }
    }, []);

    // ----- Session restore + auth listener ----------------------------------

    useEffect(() => {
        let mounted = true;
        console.log("[AuthTrace] AuthProvider mounted. Calling getSession()...");

        // 1. Initial manual check to jump-start the process if needed.
        // (Sometimes onAuthStateChange INITIAL_SESSION event takes a split second)
        supabase.auth.getSession().then(({ data: { session: s }, error }) => {
            console.log(`[AuthTrace] getSession resolved. Session exists: ${!!s}, error: ${error?.message}`);
            if (!mounted) return;
            // We just set the session here. We DO NOT fetch profile — 
            // we leave that exclusively to `onAuthStateChange` to prevent race conditions.
            setSession(s);
            if (!s?.user) {
                console.log("[AuthTrace] No user in getSession. Setting loading=false");
                setLoading(false);
            }
        });

        // 2. The single source of truth for auth state changes.
        // This fires automatically on mount with INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, etc.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, s) => {
            console.log(`[AuthTrace] onAuthStateChange event: ${event}. Session exists: ${!!s}`);
            if (!mounted) return;
            setSession(s);

            if (s?.user) {
                console.log("[AuthTrace] User exists in onAuthStateChange. Calling fetchProfile...");
                fetchProfile(s.user.id); // This internally calls setLoading(false) in finally{}
            } else {
                console.log("[AuthTrace] No user in onAuthStateChange. Setting profile=null, loading=false");
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            console.log("[AuthTrace] AuthProvider unmounting");
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // ----- Email / password ---------------------------------------------------

    const signIn = async (email: string, password: string): Promise<string | null> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
    };

    const signUp = async (email: string, password: string): Promise<string | null> => {
        const { error } = await supabase.auth.signUp({ email, password });
        return error?.message ?? null;
    };

    // ----- Google OAuth ------------------------------------------------------

    const signInWithGoogle = async () => {
        setGoogleLoading(true);
        try {
            // makeRedirectUri automatically figures out the correct URL for your environment
            // (e.g. exp://127... for Expo Go, samfront:// for native builds)
            const redirectUrl = makeRedirectUri({ scheme: "samfront" });
            console.log("OAuth Redirect URL (Whitelist this in Supabase!):", redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
            });

            if (error || !data.url) return;

            const result = await WebBrowser.openAuthSessionAsync(
                data.url,
                redirectUrl
            );

            if (result.type === "success") {
                // With implicit flow, Supabase puts tokens in the URL fragment:
                //   samfront://#access_token=...&refresh_token=...
                // iOS delivers this as a fragment; Android sometimes uses query params.
                // We try both to be safe.
                const url = result.url;
                const fragmentPart = url.split("#")[1] ?? "";
                const queryPart = url.split("?")[1]?.split("#")[0] ?? "";

                // Prefer fragment (iOS / standard implicit flow)
                const params = new URLSearchParams(fragmentPart || queryPart);
                const access_token = params.get("access_token");
                const refresh_token = params.get("refresh_token");

                if (access_token && refresh_token) {
                    // setSession persists the tokens; onAuthStateChange fires SIGNED_IN
                    await supabase.auth.setSession({ access_token, refresh_token });
                } else {
                    console.warn(
                        "[Auth] OAuth redirect received but no tokens found.\n" +
                        "URL: " + url + "\n" +
                        "Ensure flowType:'implicit' is set in lib/supabase.ts and " +
                        "'samfront://' is whitelisted in Supabase → Auth → Redirect URLs."
                    );
                }
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    // ----- Profile save (onboarding) -----------------------------------------

    const saveProfile = async (displayName: string): Promise<string | null> => {
        if (!session) return "Not authenticated";

        const { error } = await supabase.from("profiles").upsert({
            id: session.user.id,
            display_name: displayName,
        });

        if (!error) await fetchProfile(session.user.id);
        return error?.message ?? null;
    };

    // ----- Sign out ----------------------------------------------------------

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    // ----- Derived state -----------------------------------------------------

    const isNewUser = !loading && !!session && profile === null;

    return (
        <AuthContext.Provider
            value={{
                session,
                profile,
                loading,
                googleLoading,
                signIn,
                signUp,
                signInWithGoogle,
                saveProfile,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAuth = () => useContext(AuthContext);
