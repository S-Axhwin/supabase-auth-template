/**
 * app/(auth)/callback.tsx — OAuth deep-link callback handler
 *
 * This screen is the landing point for the OAuth redirect:
 *   supabaseonboarding://auth/callback?code=...
 *
 * It extracts the `code` from the URL, exchanges it for a Supabase session,
 * then lets the root index gate redirect the user to the right place.
 */

import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackScreen() {
    const params = useLocalSearchParams<{ code?: string }>();

    useEffect(() => {
        async function exchangeCode() {
            const code = params.code;
            if (!code) return;

            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error("[AuthCallback] Failed to exchange code:", error.message);
                // Even on failure, the onAuthStateChange listener in AuthContext will
                // fire (with null session) and the root gate will redirect to /login.
            }

            // On success, AuthContext.onAuthStateChange fires SIGNED_IN,
            // fetches the profile, and the root index gate handles the redirect.
        }

        exchangeCode();
    }, [params.code]);

    // Show a full-screen loader while the exchange is in progress.
    return <LoadingScreen />;
}
