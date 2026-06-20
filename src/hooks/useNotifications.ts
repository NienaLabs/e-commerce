import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAuth } from '../context/AuthContext';
import { useNotificationStore } from '../store/notificationStore';
import { registerFcmToken } from '../api/auth';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Configure foreground notification behavior for Native
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Firebase Web config (only initialize on Web)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const FCM_TOKEN_STORAGE_KEY = 'registered_fcm_token';

/** Read the previously-registered FCM token from local storage. */
async function getStoredFcmToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  return AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
}

/** Persist the registered FCM token so we don't re-send it on every login. */
async function storeRegisteredFcmToken(fcmToken: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
    return;
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
}

export function useNotifications() {
  const { token, user } = useAuth();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const webMessageUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    let isMounted = true;

    async function setupNotifications() {
      try {
        let fcmToken: string | undefined;

        if (Platform.OS === 'web') {
          // --- WEB SETUP ---
          if (!firebaseConfig.apiKey) {
            console.warn('Firebase config missing on Web. Push notifications disabled.');
            return;
          }

          // Don't auto-prompt on web — browsers require a user gesture.
          // If already denied, skip silently. If 'default' (never asked), skip too —
          // the app should call Notification.requestPermission() in response to a tap.
          if (typeof Notification === 'undefined') return;
          if (Notification.permission === 'denied') return;
          if (Notification.permission !== 'granted') {
            // Not yet granted — skip for now, will work once the user grants it
            // via a user gesture elsewhere in the app.
            return;
          }

          // Permission is already granted — safe to proceed without prompting.
          const { getApps, getApp } = await import('firebase/app');
          const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
          const messaging = getMessaging(app);

          fcmToken = await getToken(messaging, {
            vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY,
          });

          // Listen for foreground messages on Web
          webMessageUnsubscribe.current = onMessage(messaging, (payload) => {
            console.log('Foreground Web Push received:', payload);
            if (payload.notification) {
              addNotification({
                id: payload.messageId ?? String(Date.now()),
                title: payload.notification.title ?? 'New Notification',
                body: payload.notification.body ?? '',
                data: payload.data,
              });
            }
          });
        } else {
          // --- NATIVE SETUP (iOS/Android) ---
          if (!Device.isDevice) {
            console.log('Must use physical device for native Push Notifications');
            return;
          }

          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
          }

          // Important: getDevicePushTokenAsync() gets the raw FCM/APNs token
          // Since our backend uses Firebase Admin SDK natively, this is correct for Android.
          // Note: On iOS, this returns an APNs token. If you want FCM on iOS without react-native-firebase,
          // you would typically need to upload APNs auth keys to Firebase and let Firebase map them.
          const tokenData = await Notifications.getDevicePushTokenAsync();
          fcmToken = tokenData.data;

          if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
            });
          }

          // Native Foreground Listeners
          notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            const req = notification.request;
            addNotification({
              id: req.identifier,
              title: req.content.title ?? 'New Notification',
              body: req.content.body ?? '',
              data: req.content.data,
            });
          });

          responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('User tapped notification:', response);
          });
        }

        // Only register with the backend if the token is new or has rotated.
        if (fcmToken && isMounted && token) {
          const storedToken = await getStoredFcmToken();
          if (storedToken === fcmToken) {
            console.log('FCM token unchanged — skipping backend registration.');
          } else {
            console.log('Registering FCM Token with backend:', fcmToken);
            await registerFcmToken(fcmToken, token);
            await storeRegisteredFcmToken(fcmToken);
          }
        }
      } catch (e: any) {
        if (e?.name === 'AbortError' || e?.message?.includes('Registration failed')) {
          console.warn('Web Push Notifications are not supported or properly configured:', e.message);
        } else {
          console.warn('Error setting up notifications:', e);
        }
      }
    }

    setupNotifications();

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (webMessageUnsubscribe.current) {
        webMessageUnsubscribe.current();
      }
    };
  }, [token, user]);
}
