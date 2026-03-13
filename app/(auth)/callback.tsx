/**
 * app/(auth)/callback.tsx
 *
 * This screen is no longer used in the current OAuth flow.
 * Tokens are extracted directly inside signInWithGoogle() via the
 * URL fragment (samfront://#access_token=...) — no code exchange needed.
 *
 * Keeping this file as a safety net redirect in case a stale deep link
 * ever lands here.
 */

import { Redirect } from "expo-router";

export default function CallbackScreen() {
    return <Redirect href="/(auth)/login" />;
}
