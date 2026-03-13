// Service Worker - Área II Cartagena PWA v9 - limpia TODAS las cachés
const CACHE_NAME = 'area2-cartagena-v9';

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

// Network only - sin caché para forzar siempre versión fresca
self.addEventListener('fetch', event => {
  // Dejar pasar todo sin interceptar
});
