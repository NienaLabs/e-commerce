// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// NOTE: Replace the placeholders below with the values from your .env file.
firebase.initializeApp({
  apiKey: 'YOUR_EXPO_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'YOUR_EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'YOUR_EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'YOUR_EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'YOUR_EXPO_PUBLIC_FIREBASE_APP_ID',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Received background message ', payload);
  const title = payload.notification?.title || 'New Notification';
  const options = {
    body: payload.notification?.body || '',
    icon: payload.notification?.image || '/favicon.png',
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});
