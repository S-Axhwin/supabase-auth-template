/**
 * app/(tabs)/_layout.tsx — Main app tab navigator
 *
 * Add more tabs here as the app grows.
 * Each tab should reference a screen file in this directory.
 */

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#1a1a1a",
                tabBarInactiveTintColor: "#aaaaaa",
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: "#f0f0f0",
                    backgroundColor: "#ffffff",
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
