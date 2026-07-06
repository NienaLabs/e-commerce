// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// NOTE: Replace the placeholders below with the values from your .env file.
firebase.initializeApp({
  apiKey: "AIzaSyB8TmubkjGN0DMdtzFx7qumGFZhMt8Uh88",
  authDomain: "niena-f0339.firebaseapp.com",
  projectId: "niena-f0339",
  storageBucket: "niena-f0339.firebasestorage.app",
  messagingSenderId: "137439028204",
  appId: "1:137439028204:web:c2c0bae77e6433900116c9",
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

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const action_url = event.notification.data?.action_url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        // If it's open, just focus it
        if (client.url.includes(action_url) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(action_url);
      }
    })
  );
});
