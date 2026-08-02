import { Stack } from "expo-router";
import { SidebarProvider } from '../context/SidebarContext';
import { Sidebar } from '../components/Sidebar';
import "../../global.css";
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { OpenSans_400Regular, OpenSans_600SemiBold } from '@expo-google-fonts/open-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ThemeProvider } from '../theme/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { WebSocketProvider } from '../context/WebSocketContext';
import { EventTracker } from '../components/EventTracker';
import { VendorStatusSync } from '../components/VendorStatusSync';
import { useLocationStore } from '../store/locationStore';
import { NotificationProvider } from '../context/NotificationContext';


SplashScreen.preventAutoHideAsync();

// Must be created outside the component to avoid re-creation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {

  const [loaded, error] = useFonts({
    'Inter_400Regular': Inter_400Regular,
    'Inter_500Medium': Inter_500Medium,
    'Inter_600SemiBold': Inter_600SemiBold,
    'Inter_700Bold': Inter_700Bold,
    'OpenSans_400Regular': OpenSans_400Regular,
    'OpenSans_600SemiBold': OpenSans_600SemiBold,
  });

  useEffect(() => {
    // Start live location tracking globally on app load
    useLocationStore.getState().startTracking();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }


  return (
    <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <ToastProvider>
              <EventTracker />
              <VendorStatusSync />
              <NotificationProvider>
                <SidebarProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="suspended" />
                  </Stack>
                  <Sidebar />
                </SidebarProvider>
              </NotificationProvider>
            </ToastProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </SafeAreaProvider>
  );
}
