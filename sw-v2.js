// Service Worker — Área II Cartagena v5 (March 2026)
// NETWORK-FIRST: Always fetch from network, cache is only for offline
const CACHE_NAME = 'area2-v6';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => {
        console.log('[SW] Deleting cache:', k);
        return caches.delete(k);
      }))
    ).then(() => {
      // Force all tabs to reload with new SW
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({type: 'window'});
    }).then(clients => {
      clients.forEach(client => {
        console.log('[SW] Forcing reload on client');
        client.navigate(client.url);
      });
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // ALWAYS network first - no cache reads for HTML/JS/CSS
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('<html><body><h1>Sin conexión</h1><p>Comprueba tu conexión a internet y recarga.</p></body></html>', 
        {headers: {'Content-Type': 'text/html'}});
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
