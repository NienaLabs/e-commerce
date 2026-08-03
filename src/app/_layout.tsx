import { Stack } from "expo-router";
import Head from "expo-router/head";
import { SidebarProvider } from '../context/SidebarContext';
import { Sidebar } from '../components/Sidebar';
import "../../global.css";
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { OpenSans_400Regular, OpenSans_600SemiBold } from '@expo-google-fonts/open-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
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

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // Store it globally so components can access it if they mount late
    (window as any).deferredPrompt = e;
  });
}

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
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
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
      <Head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon.png?v=2" />
      </Head>
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
