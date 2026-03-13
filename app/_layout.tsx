/**
 * app/_layout.tsx — Root layout
 *
 * Responsibilities:
 *   1. Wraps the entire app in <AuthProvider>
 *   2. Holds the splash screen open until auth state resolves (isLoading = false)
 *   3. Declares the top-level <Stack> with all route groups
 */

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";

// Keep the splash screen visible until we've resolved auth state
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// Inner layout — must be inside AuthProvider to access useAuth
// ---------------------------------------------------------------------------

function RootLayoutInner() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Smart redirect gate — decides where to send the user */}
        <Stack.Screen name="index" />

        {/* Auth group: login, callback */}
        <Stack.Screen name="(auth)" />

        {/* Onboarding group: first-time user flow */}
        <Stack.Screen name="(onboarding)" />

        {/* Main app group: tab navigator */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
