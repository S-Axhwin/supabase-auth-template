/**
 * hooks/useProtectedRoute.ts
 *
 * Global routing gate. Runs whenever the auth state changes.
 * Ensures the user is always on the correct screen based on their session/profile.
 */

import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

export function useProtectedRoute() {
    const { session, profile, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inOnboardingGroup = segments[0] === "(onboarding)";
        const inTabsGroup = segments[0] === "(tabs)";

        if (!session) {
            // No session? Kick to login
            if (!inAuthGroup) {
                router.replace("/(auth)/login");
            }
        } else if (!profile) {
            // Session but no profile? Kick to onboarding
            if (!inOnboardingGroup) {
                router.replace("/(onboarding)");
            }
        } else {
            // Session AND profile? Kick to tabs
            if (!inTabsGroup) {
                router.replace("/(tabs)");
            }
        }
    }, [session, profile, loading, segments, router]);
}
