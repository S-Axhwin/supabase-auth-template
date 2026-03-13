/**
 * app/(onboarding)/index.tsx — First-time user onboarding
 *
 * Calls saveProfile() from AuthContext which upserts the profiles row
 * and re-fetches it — no manual supabase calls needed here.
 */

import { Redirect, router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingScreen() {
    const { profile, loading, saveProfile } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (loading) return <LoadingScreen />;
    if (profile) return <Redirect href="/(tabs)" />;

    async function handleContinue() {
        const name = displayName.trim();
        if (!name) {
            setError("Please enter your name to continue.");
            return;
        }

        setError(null);
        setIsSaving(true);

        const err = await saveProfile(name);

        if (err) {
            setError(err);
            setIsSaving(false);
            return;
        }

        router.replace("/(tabs)");
    }
    // if (loading) return <LoadingScreen />;

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.kav}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.step}>1 of 1</Text>
                        <Text style={styles.title}>What's your name?</Text>
                        <Text style={styles.subtitle}>
                            This is how you'll appear to others in the app.
                        </Text>
                    </View>

                    {/* Input */}
                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Display name"
                            placeholderTextColor="#aaaaaa"
                            value={displayName}
                            onChangeText={(t) => {
                                setDisplayName(t);
                                if (error) setError(null);
                            }}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={handleContinue}
                            maxLength={50}
                        />

                        {error && (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                    </View>

                    {/* CTA */}
                    <Button
                        title="Continue"
                        onPress={handleContinue}
                        isLoading={isSaving}
                        disabled={displayName.trim().length === 0}
                        variant="primary"
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#ffffff" },
    kav: { flex: 1 },
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 48,
        paddingBottom: 32,
        gap: 28,
    },
    header: { gap: 8 },
    step: {
        fontSize: 12,
        fontWeight: "600",
        color: "#aaaaaa",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1a1a1a",
        letterSpacing: -0.5,
    },
    subtitle: { fontSize: 15, color: "#6b6b6b", lineHeight: 22 },
    form: { flex: 1, gap: 12 },
    input: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#e0e0e0",
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#1a1a1a",
        backgroundColor: "#fafafa",
    },
    errorBanner: {
        backgroundColor: "#fff0f0",
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: "#ffcccc",
    },
    errorText: { color: "#cc0000", fontSize: 13 },
});
