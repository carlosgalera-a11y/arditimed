// Service Worker — Área II Cartagena v6 (March 2026)
// NETWORK-FIRST: Always fetch from network, cache offline.html for fallback
const CACHE_NAME = 'area2-v7';
const OFFLINE_URL = '/Cartagenaeste/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.destination === 'document' || event.request.mode === 'navigate') {
        return caches.match(OFFLINE_URL);
      }
      return new Response('', {status: 408});
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
