// firebase-messaging-sw.js

// Import the scripts needed for Firebase Messaging (compat version works in a service worker)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase app with the same config as the web client. These values are read
// from the environment at build time, so we reference them directly.
// NOTE: The 'EXPO_PUBLIC_' prefix makes them available in the web bundle.
firebase.initializeApp({
  apiKey: self.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: self.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: self.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: self.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: self.EXPO_PUBLIC_FIREBASE_APP_ID,
  // The VAPID key is not needed in the service worker registration call; it is
  // passed when you request the token on the client side.
});

const messaging = firebase.messaging();

// Optional: Handle background messages (when the app is not in focus).
// This will show a notification using the data payload.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.image || '/favicon.png',
    data: payload.data,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
