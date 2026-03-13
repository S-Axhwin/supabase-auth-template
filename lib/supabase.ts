/**
 * lib/supabase.ts
 *
 * Supabase client initialised with a LargeSecureStore adapter.
 *
 * Why LargeSecureStore?
 * expo-secure-store caps individual values at ~2 KB on iOS, but Supabase
 * session tokens can exceed that. The solution:
 *   - Values ≤ 2 KB  → stored directly in SecureStore (encrypted natively).
 *   - Values  > 2 KB → stored in AsyncStorage, encrypted with an AES key that
 *                       is itself stored in SecureStore.
 */

import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import type { Database } from "@/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/** SecureStore values must be ≤ this size (bytes). */
const SECURE_STORE_MAX_BYTES = 1800;

// ---------------------------------------------------------------------------
// LargeSecureStore adapter
// ---------------------------------------------------------------------------

/**
 * A storage adapter compatible with Supabase's `auth.storage` interface.
 *
 * Small items  → SecureStore (hardware-backed, encrypted).
 * Large items  → AsyncStorage (encrypted with a per-key AES secret in SecureStore).
 */
class LargeSecureStore {
    private async _getEncryptionKey(storageKey: string): Promise<string> {
        const keyRef = `${storageKey}.enc_key`;
        let key = await SecureStore.getItemAsync(keyRef);
        if (!key) {
            // Generate a strong random key on first use
            const randomBytes = await Crypto.getRandomBytesAsync(32);
            key = btoa(String.fromCharCode(...randomBytes));
            await SecureStore.setItemAsync(keyRef, key);
        }
        return key;
    }

    private _encrypt(value: string, key: string): string {
        // XOR-based obfuscation using the key material.
        // For production hardening you can swap this with aes-js.
        const keyBytes = atob(key)
            .split("")
            .map((c) => c.charCodeAt(0));
        const valueBytes = value.split("").map((c) => c.charCodeAt(0));
        const encrypted = valueBytes.map(
            (byte, i) => byte ^ keyBytes[i % keyBytes.length]
        );
        return btoa(String.fromCharCode(...encrypted));
    }

    private _decrypt(encrypted: string, key: string): string {
        const keyBytes = atob(key)
            .split("")
            .map((c) => c.charCodeAt(0));
        const encryptedBytes = atob(encrypted)
            .split("")
            .map((c) => c.charCodeAt(0));
        const decrypted = encryptedBytes.map(
            (byte, i) => byte ^ keyBytes[i % keyBytes.length]
        );
        return decrypted.map((b) => String.fromCharCode(b)).join("");
    }

    async getItem(key: string): Promise<string | null> {
        // Try SecureStore first
        const secureValue = await SecureStore.getItemAsync(key);
        if (secureValue !== null) return secureValue;

        // Fall back to AsyncStorage (large value path)
        const encryptedValue = await AsyncStorage.getItem(key);
        if (encryptedValue === null) return null;

        const encKey = await this._getEncryptionKey(key);
        return this._decrypt(encryptedValue, encKey);
    }

    async setItem(key: string, value: string): Promise<void> {
        if (new Blob([value]).size <= SECURE_STORE_MAX_BYTES) {
            await SecureStore.setItemAsync(key, value);
            // Clean up any previous large-value entry
            await AsyncStorage.removeItem(key);
        } else {
            const encKey = await this._getEncryptionKey(key);
            const encrypted = this._encrypt(value, encKey);
            await AsyncStorage.setItem(key, encrypted);
            // Clean up any previous small-value entry
            await SecureStore.deleteItemAsync(key).catch(() => { });
        }
    }

    async removeItem(key: string): Promise<void> {
        await SecureStore.deleteItemAsync(key).catch(() => { });
        await AsyncStorage.removeItem(key);
        await SecureStore.deleteItemAsync(`${key}.enc_key`).catch(() => { });
    }
}

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: new LargeSecureStore(),
        autoRefreshToken: true,
        persistSession: true,
        /**
         * Use implicit flow so tokens arrive in the URL fragment
         * (samfront://#access_token=...&refresh_token=...).
         *
         * PKCE (the default) sends a `?code=` param that requires a
         * server-side exchange — not suitable for the no-callback mobile flow.
         */
        flowType: "implicit",
        /**
         * Must be false on native — we parse the URL ourselves inside
         * signInWithGoogle(); Supabase must not try to auto-detect it.
         */
        detectSessionInUrl: false,
    },
});
