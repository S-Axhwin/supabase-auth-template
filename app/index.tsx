/**
 * app/index.tsx — Auth gate / smart redirect
 *
 * This screen acts purely as a routing gate. It never renders meaningful UI;
 * it just reads auth state and immediately redirects to the correct group.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  isLoading  →  Show LoadingScreen (splash still up anyway)  │
 * │  no session →  /(auth)/login                                │
 * │  session + no profile → /(onboarding)                       │
 * │  session + profile    → /(tabs)                             │
 * └─────────────────────────────────────────────────────────────┘
 */

import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
