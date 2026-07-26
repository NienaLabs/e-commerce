import { Redirect } from 'expo-router';

// This route has been superseded by the Discover tab which includes
// a full-featured vendor map with search, filters, and routing.
export default function MapDemoRedirect() {
  return <Redirect href="/(tabs)/discover" />;
}
