/**
 * components/ui/LoadingScreen.tsx
 *
 * Full-screen loading indicator used as a route-level gate while
 * auth state is resolving. Prevents layout flashes during redirects.
 */

import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export function LoadingScreen() {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#1a1a1a" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
    },
});
