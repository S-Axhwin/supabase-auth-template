/**
 * components/ui/Button.tsx
 *
 * A loading-aware, accessible button component.
 * Props:
 *   title      — Button label
 *   onPress    — Action handler
 *   isLoading  — Replaces label with ActivityIndicator and disables presses
 *   disabled   — Explicitly disables the button
 *   variant    — 'primary' (filled) | 'outline' | 'ghost'
 */

import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    type PressableProps
} from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Variant = "primary" | "outline" | "ghost";

interface ButtonProps extends Omit<PressableProps, "style" | "disabled"> {
    title: string;
    isLoading?: boolean;
    disabled?: boolean;
    variant?: Variant;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Button({
    title,
    onPress,
    isLoading = false,
    disabled = false,
    variant = "primary",
    ...rest
}: ButtonProps) {
    const isDisabled = disabled || isLoading;

    return (
        <Pressable
            {...rest}
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.base,
                styles[variant],
                pressed && !isDisabled && styles.pressed,
                isDisabled && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: isLoading }}
        >
            {isLoading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === "primary" ? "#fff" : "#000"}
                />
            ) : (
                <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
            )}
        </Pressable>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    base: {
        height: 52,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },

    // Variants
    primary: {
        backgroundColor: "#1a1a1a",
    },
    outline: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: "#1a1a1a",
    },
    ghost: {
        backgroundColor: "transparent",
    },

    // Labels
    label: {
        fontSize: 15,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    primaryLabel: {
        color: "#ffffff",
    },
    outlineLabel: {
        color: "#1a1a1a",
    },
    ghostLabel: {
        color: "#1a1a1a",
    },

    // States
    pressed: {
        opacity: 0.75,
    },
    disabled: {
        opacity: 0.4,
    },
});
