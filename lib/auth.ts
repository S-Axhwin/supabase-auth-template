/**
 * lib/auth.ts
 *
 * Pure helper functions for authentication actions.
 * Keep side-effects here, not inside components or context.
 */

import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "@/lib/supabase";

// Tell expo-web-browser to dismiss the auth session when the app resumes
WebBrowser.maybeCompleteAuthSession();

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------

/**
 * Opens the Google OAuth consent page in an in-app browser.
 * After the user authenticates, Google redirects to:
 *   supabaseonboarding://auth/callback?code=...
 *
 * That deep link is caught by `app/(auth)/callback.tsx`, which exchanges
 * the code for a Supabase session.
 */
export async function signInWithGoogle(): Promise<void> {
    const redirectTo = makeRedirectUri({
        scheme: "supabaseonboarding",
        path: "auth/callback",
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo,
            skipBrowserRedirect: true, // We open the browser manually below
        },
    });

    if (error) throw error;
    if (!data.url) throw new Error("No OAuth URL returned from Supabase");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === "cancel" || result.type === "dismiss") {
        // User cancelled — not an error, just return silently
        return;
    }
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

/** Signs the current user out and clears the stored session. */
export async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
