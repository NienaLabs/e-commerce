// Minimal Service Worker to satisfy PWA install criteria
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('konura-pwa-cache').then((cache) => cache.addAll(['/']))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
