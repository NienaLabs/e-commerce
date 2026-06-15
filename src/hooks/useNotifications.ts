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

export function useNotifications() {
  const { token, user } = useAuth();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const webMessageUnsubscribe = useRef<() => void>();

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
          const app = initializeApp(firebaseConfig);
          const messaging = getMessaging(app);

          // Request Web Permission
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Web push permission not granted.');
            return;
          }

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

        // Register token with backend
        if (fcmToken && isMounted) {
          console.log('Registering FCM Token:', fcmToken);
          await registerFcmToken(fcmToken, token);
        }
      } catch (e) {
        console.error('Error setting up notifications:', e);
      }
    }

    setupNotifications();

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      if (webMessageUnsubscribe.current) {
        webMessageUnsubscribe.current();
      }
    };
  }, [token, user]);
}
