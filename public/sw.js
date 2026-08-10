// Konura service worker — PWA shell cache + FCM background messages.
//
// These two jobs MUST live in one file. A service worker registration is keyed
// by its scope, so registering a second script at scope '/' replaces the first.
// This app previously registered sw.js (from _layout) and firebase-messaging-sw.js
// (from getWebFcmToken) at the same scope, so whichever ran last evicted the
// other: opening the app killed background push, and granting notification
// permission killed the PWA fetch handler. One worker, one scope, both jobs.

// ── FCM background messages ──────────────────────────────────────────
//
// Wrapped so a gstatic outage can't fail SW installation and take the offline
// shell down with it. If these imports fail we simply have no background push;
// everything below still works.
let messaging = null;
try {
  importScripts('https://www.gstatic.com/firebasejs/12.17.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/12.17.0/firebase-messaging-compat.js');

  // Hardcoded on purpose: a service worker is not processed by Metro, so
  // process.env / self.EXPO_PUBLIC_* are always undefined in here. These are
  // public client identifiers, the same ones shipped in the web bundle.
  firebase.initializeApp({
    apiKey: "AIzaSyB9qIwhzOlXvHrJJpxI9fzKhvGjtRbN7ws",
    authDomain: "konura-4450d.firebaseapp.com",
    projectId: "konura-4450d",
    storageBucket: "konura-4450d.firebasestorage.app",
    messagingSenderId: "333244137876",
    appId: "1:333244137876:web:cbe408322a062e399d0f81",
  });

  messaging = firebase.messaging();

  // Fires only when no tab has focus. Foreground messages are handled by
  // onMessage() in src/hooks/useNotifications.ts.
  //
  // Reads title/body from either payload shape. A message with a `notification`
  // block is rendered by Chrome automatically AND delivered here, which double-
  // fires the banner; the fix for that is for the backend to send data-only
  // messages to web tokens, in which case only `data` is populated. Supporting
  // both means that backend change can land without touching this file.
  messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const title = payload.notification?.title || data.title || 'New Notification';
    const options = {
      body: payload.notification?.body || data.body || '',
      icon: payload.notification?.image || data.image || '/favicon.png',
      data,
    };
    self.registration.showNotification(title, options);
  });
} catch (err) {
  console.warn('[sw] Firebase messaging unavailable, push disabled:', err);
}

self.addEventListener('notificationclick', function (event) {
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

// ── PWA install criteria + offline shell ─────────────────────────────
const SHELL_CACHE = 'konura-pwa-cache';

self.addEventListener('install', (e) => {
  // Take over immediately rather than waiting for every tab to close. Without
  // this an installed PWA keeps running the previously-registered worker —
  // which is the one with no push handler — until the user fully quits the app.
  self.skipWaiting();
  e.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(['/']))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Navigations only — network-first, falling back to the cached shell offline.
//
// This used to call respondWith() for EVERY request, which put a cache lookup
// in front of every API call and every product image while only ever having
// '/' in the cache: all cost, no hit. It was also cache-FIRST, so the one thing
// it did cache — the app shell — was served stale forever and a deploy never
// reached anyone who had already installed the PWA.
//
// Everything that isn't a navigation is left alone now: no respondWith, so the
// browser fetches it directly with its own HTTP cache, exactly as it would
// with no service worker at all.
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate' || e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const copy = response.clone();
        e.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy)));
        return response;
      })
      .catch(() => caches.match('/').then((cached) => cached || Response.error()))
  );
});
