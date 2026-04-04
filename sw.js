// Service Worker - Área II Cartagena PWA v11 - network only, sin caché
const CACHE_NAME = 'area2-cartagena-v14';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network only — nunca cachear, siempre versión fresca del servidor
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
