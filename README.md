# Supabase Google OAuth — Expo Router Template

A production-ready authentication template for Expo Router apps using Supabase Google OAuth. Features secure session storage, automatic new-user onboarding detection, and a clean `(auth)/(onboarding)/(tabs)` route structure.

---

## Features

- ✅ **Google OAuth** via Supabase (deep-link callback, no manual token handling)
- ✅ **LargeSecureStore** — sessions stored encrypted on device (SecureStore + AsyncStorage hybrid)
- ✅ **New-user detection** — checks `public.profiles` for a row; routes to onboarding if absent
- ✅ **Loading state management** — splash screen held until auth resolves, route gates prevent flashes
- ✅ **TypeScript** — fully typed Supabase client and database schema
- ✅ **Expo SDK 54 / Expo Router v6**

---

## Project Structure

```
app/
├── _layout.tsx            Root layout — AuthProvider + splash gate
├── index.tsx              Smart redirect gate (auth → onboarding → tabs)
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx          Google sign-in screen
│   └── callback.tsx       OAuth deep-link handler
├── (onboarding)/
│   ├── _layout.tsx
│   └── index.tsx          Display name collection (extend as needed)
└── (tabs)/
    ├── _layout.tsx        Tab navigator
    └── index.tsx          Home screen placeholder

context/
└── AuthContext.tsx        Session, user, profile, isLoading, isNewUser

hooks/
└── useAuth.ts             useAuth() hook

lib/
├── supabase.ts            Supabase client (LargeSecureStore adapter)
└── auth.ts                signInWithGoogle(), signOut()

types/
└── database.ts            Database & Profile types

components/ui/
├── Button.tsx             Loading-aware button (primary / outline / ghost)
└── LoadingScreen.tsx      Full-screen activity indicator

supabase/
└── migrations/
    └── 20240101000000_create_profiles.sql
```

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Expo CLI](https://docs.expo.dev/more/expo-cli/) (`bun install -g expo-cli`)
- A [Supabase](https://supabase.com) project
- A [Google Cloud Console](https://console.cloud.google.com) project with OAuth configured

---

## Setup Guide

### 1. Clone and install

```bash
git clone <your-repo-url>
cd supabase-onboarding
bun install
```

### 2. Environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Find these in your Supabase Dashboard → **Settings → API**.

### 3. Run the database migration

In your Supabase project, go to **SQL Editor** and run the contents of:

```
supabase/migrations/20240101000000_create_profiles.sql
```

Or with the Supabase CLI (if your project is linked):

```bash
bunx supabase db push
```

This creates `public.profiles` with Row-Level Security enabled.

### 4. Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard → **Authentication → Providers → Google**
2. Enable it and paste in your **Google Client ID** and **Client Secret**
3. Click **Save**

### 5. Set up Google Cloud Console

You need three OAuth 2.0 Client IDs:

| Type | Required for |
|---|---|
| **Web application** | Supabase server-side exchange |
| **iOS** | Native iOS OAuth |
| **Android** | Native Android OAuth |

#### Web application client
1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Type: **Web application**
3. Under **Authorized redirect URIs**, add your Supabase callback URL:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
4. Copy the **Client ID** and **Client Secret** into Supabase (step 4 above)

#### iOS client
1. Create another credential → Type: **iOS**
2. Bundle ID: your app's bundle identifier (e.g. `com.yourcompany.yourapp`)
3. Copy the resulting **Client ID** into Supabase Google provider (comma-separated with web)

#### Android client
1. Create another credential → Type: **Android**
2. Package name + SHA-1 fingerprint (get it via `keytool -keystore ~/.android/debug.keystore -list -v`)
3. Copy the resulting **Client ID** into Supabase Google provider

### 6. Add redirect URL to Supabase

In Supabase Dashboard → **Authentication → URL Configuration → Redirect URLs**, add:

```
supabaseonboarding://auth/callback
```

> This matches the `scheme` in `app.json` and the `makeRedirectUri` call in `lib/auth.ts`.

### 7. Run the app

```bash
# iOS
bun run ios

# Android
bun run android
```

---

## Auth Flow

```
App opens
   │
   ▼
isLoading = true (splash held)
   │
   ├─ Restores session from SecureStore
   │
   ▼
isLoading = false
   │
   ├─ No session ──────────────────► (auth)/login
   │                                      │
   │                                 User taps Google
   │                                      │
   │                                 Browser opens
   │                                      │
   │                               OAuth completes
   │                                      │
   │                           Deep link fires callback
   │                           Code exchanged for session
   │                                      │
   ├─ Session + no profile ────────► (onboarding)/index
   │                                      │
   │                              User enters display name
   │                                Profile upserted
   │                                      │
   └─ Session + profile ───────────► (tabs) ◄──────────────┘
```

---

## Customisation Guide

### Rename the app scheme
1. `app.json` → update `scheme`
2. `lib/auth.ts` → update the `scheme` in `makeRedirectUri`
3. Supabase Dashboard → update the redirect URL to match

### Add onboarding fields
Edit `app/(onboarding)/index.tsx` — add more `TextInput` fields and include them in the `supabase.from("profiles").upsert(...)` call. Add the corresponding columns to the SQL migration.

### Add multi-step onboarding
Create additional screens inside `app/(onboarding)/` (e.g. `step2.tsx`, `step3.tsx`). Use `router.push("/(onboarding)/step2")` to navigate between them. Only call `refreshProfile()` after the final step.

### Add more tabs
Add a new file to `app/(tabs)/` (e.g. `settings.tsx`) and register it with a `<Tabs.Screen>` in `app/(tabs)/_layout.tsx`.

### Add more profile columns
1. Update the SQL migration (or create a new migration file)
2. Update `types/database.ts` to reflect the new columns
3. The `Profile` type will automatically include the new fields

### Use Supabase CLI for migrations
```bash
bunx supabase init          # first time only
bunx supabase db push       # apply migrations to remote project
bunx supabase gen types typescript --local > types/database.ts  # regenerate types
```

---

## How "New User" Detection Works

1. On `SIGNED_IN`, `AuthContext` queries `public.profiles` for a row matching `auth.uid()`
2. If **no row exists** → `isNewUser = true` → the root gate redirects to `/(onboarding)`
3. After the onboarding upsert, `refreshProfile()` is called → `isNewUser` flips to `false`
4. The router navigates to `/(tabs)`

The auto-trigger in the migration is **commented out by design** — leaving it disabled preserves this pattern. If you enable the trigger, you'll need a different flag (e.g. `onboarding_complete boolean`) to distinguish new vs. returning users.

---

## Session Storage (LargeSecureStore)

Supabase session tokens can exceed the 2 KB per-item limit of `expo-secure-store` on iOS.

`lib/supabase.ts` implements a **LargeSecureStore** adapter:

| Value size | Storage | Encryption |
|---|---|---|
| ≤ 1.8 KB | `expo-secure-store` | OS-level (Keychain / Keystore) |
| > 1.8 KB | `AsyncStorage` | XOR cipher; key stored in SecureStore |

To upgrade to AES-256, install `aes-js` and swap the `_encrypt`/`_decrypt` methods in `lib/supabase.ts`.

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | ^2.x | Supabase client |
| `expo-auth-session` | ~7.x | `makeRedirectUri` helper |
| `expo-web-browser` | ~15.x | In-app browser for OAuth |
| `expo-secure-store` | ~15.x | Hardware-encrypted storage |
| `@react-native-async-storage/async-storage` | ^2.x | Large-value storage in LargeSecureStore |
| `react-native-url-polyfill` | ^3.x | URL API polyfill for supabase-js |
