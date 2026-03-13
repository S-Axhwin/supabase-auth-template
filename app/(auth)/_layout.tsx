/**
 * app/(auth)/_layout.tsx — Auth group layout
 *
 * A headerless Stack navigator containing:
 *   - login    → Sign-in screen
 *   - callback → OAuth deep-link handler
 */

import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    );
}
