/**
 * app/(auth)/register.tsx — Registration screen
 *
 * Email + password sign-up. After success, Supabase sends a confirmation
 * email (if enabled). The user confirms, then returns to the login screen.
 *
 * Extend with additional fields (full name, etc.) as needed.
 */

import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/useAuth";

export default function RegisterScreen() {
    const router = useRouter();
    const { session, signUp } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    if (session) return <Redirect href="/(tabs)" />;

    const handleRegister = async () => {
        if (!email || !password || !confirm) {
            setError("Please fill in all fields.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        setError(null);
        const err = await signUp(email.trim(), password);
        setLoading(false);

        if (err) {
            setError(err);
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <SafeAreaView style={s.safe}>
                <View style={s.successContainer}>
                    <Text style={s.successIcon}>✉️</Text>
                    <Text style={s.successTitle}>Check your email</Text>
                    <Text style={s.successBody}>
                        We've sent a confirmation link to {email}. Open it to activate your
                        account, then sign in.
                    </Text>
                    <TouchableOpacity
                        style={s.btn}
                        onPress={() => router.replace("/(auth)/login")}
                        activeOpacity={0.85}
                    >
                        <Text style={s.btnTxt}>Back to Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.safe}>
            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={s.container}>
                    {/* Header */}
                    <Text style={s.title}>Create Account</Text>
                    <Text style={s.subtitle}>Sign up with your email and password</Text>

                    <View style={s.form}>
                        <Text style={s.label}>Email Address</Text>
                        <TextInput
                            style={s.input}
                            placeholder="you@example.com"
                            placeholderTextColor="#aaaaaa"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoCorrect={false}
                        />

                        <Text style={s.label}>Password</Text>
                        <TextInput
                            style={s.input}
                            placeholder="••••••••"
                            placeholderTextColor="#aaaaaa"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Text style={s.label}>Confirm Password</Text>
                        <TextInput
                            style={s.input}
                            placeholder="••••••••"
                            placeholderTextColor="#aaaaaa"
                            value={confirm}
                            onChangeText={setConfirm}
                            secureTextEntry
                        />

                        {error && <Text style={s.error}>{error}</Text>}

                        <TouchableOpacity
                            style={[s.btn, loading && s.btnDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={s.btnTxt}>Create Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={s.footer}>
                        <Text style={s.footerTxt}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={s.link}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#ffffff" },
    flex: { flex: 1 },
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1a1a1a",
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    subtitle: { fontSize: 14, color: "#6b6b6b", marginBottom: 32 },
    form: { gap: 12 },
    label: { fontSize: 13, fontWeight: "600", color: "#6b6b6b", marginTop: 4 },
    input: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#e0e0e0",
        paddingHorizontal: 16,
        fontSize: 15,
        color: "#1a1a1a",
        backgroundColor: "#fafafa",
    },
    error: { fontSize: 13, color: "#cc0000" },
    btn: {
        height: 52,
        borderRadius: 14,
        backgroundColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
    },
    btnTxt: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
    btnDisabled: { opacity: 0.45 },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "auto",
        paddingTop: 16,
    },
    footerTxt: { fontSize: 14, color: "#aaaaaa" },
    link: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },

    // Success state
    successContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
        gap: 16,
    },
    successIcon: { fontSize: 48 },
    successTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1a1a1a",
        letterSpacing: -0.5,
    },
    successBody: {
        fontSize: 15,
        color: "#6b6b6b",
        textAlign: "center",
        lineHeight: 22,
    },
});
