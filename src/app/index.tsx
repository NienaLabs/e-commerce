import { Redirect } from 'expo-router';

// Route routing is handled by AuthProvider in _layout.tsx.
// We redirect to /(tabs) initially, and AuthProvider will intercept if not logged in.
export default function RootIndex() {
  return <Redirect href="/(tabs)" />;
}