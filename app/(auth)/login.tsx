/**
 * app/(auth)/login.tsx — Sign-in screen
 *
 * The only interaction here is "Continue with Google".
 * Loading state covers both the browser-opening phase and the
 * post-OAuth session-resolve phase (handled by AuthContext).
 */

import { useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from "react-native";

import { Redirect, useRootNavigationState } from "expo-router";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth";

export default function LoginScreen() {
    const { session } = useAuth();
    const navigationState = useRootNavigationState();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Guard: if session already exists by the time this screen mounts, redirect
    if (!navigationState?.key) return null;
    if (session) return <Redirect href="/(tabs)" />;

    async function handleGoogleSignIn() {
        setError(null);
        setIsLoading(true);
        try {
            await signInWithGoogle();
            // After the browser session closes, AuthContext's onAuthStateChange
            // fires and updates the session — the root index gate will redirect.
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Sign-in failed. Please try again.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                {/* Branding area */}
                <View style={styles.hero}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>✦</Text>
                    </View>
                    <Text style={styles.appName}>YourApp</Text>
                    <Text style={styles.tagline}>
                        Sign in to get started
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {error && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <Button
                        title="Continue with Google"
                        onPress={handleGoogleSignIn}
                        isLoading={isLoading}
                        variant="primary"
                    />

                    <Text style={styles.disclaimer}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    container: {
        flex: 1,
        paddingHorizontal: 28,
        justifyContent: "space-between",
        paddingBottom: 32,
    },

    // Hero
    hero: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: "#f2f2f2",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    logoText: {
        fontSize: 36,
    },
    appName: {
        fontSize: 30,
        fontWeight: "800",
        color: "#1a1a1a",
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 16,
        color: "#6b6b6b",
        textAlign: "center",
    },

    // Actions
    actions: {
        gap: 16,
    },
    errorBanner: {
        backgroundColor: "#fff0f0",
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: "#ffcccc",
    },
    errorText: {
        color: "#cc0000",
        fontSize: 13,
        textAlign: "center",
    },
    disclaimer: {
        fontSize: 12,
        color: "#aaaaaa",
        textAlign: "center",
        lineHeight: 18,
    },
});
