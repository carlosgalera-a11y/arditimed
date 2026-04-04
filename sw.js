// Service Worker - Área II Cartagena PWA v26 - network only + auto-update
const CACHE_NAME = 'area2-v26';

self.addEventListener('install', event => {
  // Skip waiting immediately — new SW takes control right away
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network only — never cache, always fresh
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Listen for SKIP_WAITING message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
