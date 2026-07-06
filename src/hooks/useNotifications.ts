import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type * as ExpoNotifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAuth } from '../context/AuthContext';
import { registerFcmToken } from '../api/auth';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Only load expo-notifications on native or client-side web to avoid SSR errors
let Notifications: any = null;
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const FCM_TOKEN_STORAGE_KEY = 'registered_fcm_token';

async function getStoredFcmToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem(FCM_TOKEN_STORAGE_KEY) : null;
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  return AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
}

async function storeRegisteredFcmToken(fcmToken: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
    return;
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
}

/** Gets a web FCM token — permission must already be granted */
async function getWebFcmToken(): Promise<string | undefined> {
  if (typeof Notification === 'undefined') {
    console.warn('[FCM] Notification API not available (SSR?)');
    return;
  }
  if (Notification.permission !== 'granted') {
    console.warn('[FCM] Permission not granted, status:', Notification.permission);
    return;
  }
  if (!firebaseConfig.apiKey) {
    console.error('[FCM] Firebase config missing. Check EXPO_PUBLIC_FIREBASE_* env vars.');
    return;
  }

  try {
    const { getApps, getApp } = await import('firebase/app');
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // Register the service worker
    await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });

    // CRITICAL: Wait until the service worker is fully activated.
    // navigator.serviceWorker.ready blocks until there is an active (not just installing) SW.
    // Without this, getToken throws "no active Service Worker".
    const swRegistration = await navigator.serviceWorker.ready;
    console.log('[FCM] Service worker is active at scope:', swRegistration.scope);

    const fcmToken = await getToken(messaging, {
      vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (fcmToken) {
      console.log('[FCM] Token obtained:', fcmToken.slice(0, 20) + '...');
      // Handle foreground (in-app) messages
      onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground message:', payload);
        // Show native notification even when app is in foreground
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'New Notification', {
            body: payload.notification?.body || '',
            icon: '/favicon.png',
          });
        }
      });
    } else {
      console.error('[FCM] getToken returned empty token — check VAPID key in Firebase console');
    }
    return fcmToken || undefined;
  } catch (err: any) {
    // Brave browser specifically blocks FCM by default and throws an AbortError.
    // We catch it here and use console.warn instead of console.error so it doesn't crash
    // the Expo app with a red screen for users on Brave.
    if (err.name === 'AbortError' || (err.message && err.message.includes('push service error'))) {
      console.warn('[FCM] Push notifications are blocked by this browser (e.g., Brave). Please enable Google Push Services in browser settings if you want notifications.');
    } else {
      console.error('[FCM] Failed to get FCM token:', err);
    }
    return undefined;
  }
}

export function usePushNotificationsSetup() {
  const { token: sessionToken } = useAuth();
  const notificationListener = useRef<ExpoNotifications.Subscription | null>(null);
  const responseListener = useRef<ExpoNotifications.Subscription | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('default');

  // Read initial permission status on mount
  useEffect(() => {
    if (Platform.OS === 'web' && typeof Notification !== 'undefined') {
      const status = Notification.permission;
      console.log('[FCM] Initial browser permission status:', status);
      setPermissionStatus(status);
    } else if (Platform.OS !== 'web' && Device.isDevice) {
      Notifications?.getPermissionsAsync().then(({ status }: any) => {
        console.log('[FCM] Initial native permission status:', status);
        setPermissionStatus(status);
      });
    }
  }, []);

  // When BOTH permission is granted AND user is logged in, register the token
  useEffect(() => {
    if (permissionStatus !== 'granted' || !sessionToken) {
      if (permissionStatus === 'granted' && !sessionToken) {
        console.log('[FCM] Permission granted but user not logged in yet — will register after login.');
      }
      return;
    }

    console.log('[FCM] Ready to register token (permission=granted, logged in).');

    if (Platform.OS === 'web') {
      getWebFcmToken().then(async (fcmToken) => {
        if (!fcmToken || !sessionToken) return;
        const stored = await getStoredFcmToken();
        if (stored !== fcmToken) {
          console.log('[FCM] Registering new token with backend...');
          await registerFcmToken(fcmToken, sessionToken);
          await storeRegisteredFcmToken(fcmToken);
          console.log('[FCM] ✅ Token registered with backend!');
        } else {
          console.log('[FCM] Token unchanged, skipping backend registration.');
        }
      });
    } else if (Device.isDevice) {
      (async () => {
        try {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          const fcmToken = tokenData?.data;
          if (fcmToken && sessionToken) {
            const stored = await getStoredFcmToken();
            if (stored !== fcmToken) {
              await registerFcmToken(fcmToken, sessionToken);
              await storeRegisteredFcmToken(fcmToken);
              console.log('[FCM] ✅ Native token registered with backend!');
            }
          }
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
            });
          }
          notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
            console.log('[FCM] Foreground Native Push:', notification);
          });
          responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
            console.log('[FCM] User tapped notification:', response);
          });
        } catch (e) {
          console.error('[FCM] Native registration failed:', e);
        }
      })();
    }

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [permissionStatus, sessionToken]);

  /**
   * Show the OS permission prompt. Safe to call before user is logged in.
   * Token registration happens automatically once the user logs in.
   */
  const requestPermission = async (): Promise<boolean> => {
    console.log('[FCM] requestPermission() called');
    try {
      if (Platform.OS === 'web') {
        if (typeof Notification === 'undefined') {
          console.error('[FCM] Notification API unavailable.');
          return false;
        }
        if (Notification.permission === 'denied') {
          console.warn('[FCM] Permission DENIED — user must reset it manually in browser settings (🔒 in address bar).');
          return false;
        }
        const result = await Notification.requestPermission();
        console.log('[FCM] Browser permission result:', result);
        setPermissionStatus(result);
        return result === 'granted';
      } else {
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('[FCM] Native permission result:', status);
        setPermissionStatus(status);
        return status === 'granted';
      }
    } catch (e) {
      console.error('[FCM] requestPermission error:', e);
      return false;
    }
  };

  return { permissionStatus, requestPermission };
}
