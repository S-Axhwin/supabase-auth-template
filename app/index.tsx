/**
 * app/index.tsx
 *
 * This screen acts merely as a mounting point while `useProtectedRoute`
 * handles the actual redirection globally in `_layout.tsx`.
 * We show a loading screen here to prevent any flash of content before
 * the router kicks the user to `/(auth)` or `/(tabs)`.
 */

import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function Index() {
  return <LoadingScreen />;
}
