/**
 * app/(tabs)/index.tsx — Home screen (placeholder)
 *
 * Replace this with your actual home content.
 * The user's profile and session are available via useAuth().
 */

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
    const { session, profile, signOut } = useAuth();
    const user = session?.user;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                {/* Greeting */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>
                        Hey, {profile?.display_name ?? user?.email ?? "there"} 👋
                    </Text>
                    <Text style={styles.subtitle}>You're all set. Build something great.</Text>
                </View>

                {/* Template hint */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🚀 Template ready</Text>
                    <Text style={styles.cardBody}>
                        This is your home screen. Replace this component with your app's
                        main content. Auth, sessions, and onboarding are fully wired up.
                    </Text>
                </View>

                {/* Sign out */}
                <Button
                    title="Sign Out"
                    onPress={signOut}
                    variant="outline"
                />
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
        paddingTop: 32,
        paddingBottom: 24,
        gap: 24,
    },
    header: {
        gap: 6,
    },
    greeting: {
        fontSize: 26,
        fontWeight: "800",
        color: "#1a1a1a",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: "#6b6b6b",
    },
    card: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#eeeeee",
        padding: 20,
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    cardBody: {
        fontSize: 14,
        color: "#6b6b6b",
        lineHeight: 21,
    },
});
