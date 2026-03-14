// Service Worker — Área II Cartagena v2
const CACHE_NAME = 'area2-cartagena-v2';
const OFFLINE_URL = '/Cartagenaeste/offline.html';

const PRECACHE_URLS = [
  '/Cartagenaeste/',
  '/Cartagenaeste/index.html',
  '/Cartagenaeste/calculadoras.html',
  '/Cartagenaeste/chatbot-medicacion.html',
  '/Cartagenaeste/citas.html',
  '/Cartagenaeste/agenda-guardia.html',
  '/Cartagenaeste/mapa.html',
  '/Cartagenaeste/casos-clinicos.html',
  '/Cartagenaeste/generador-qr.html',
  '/Cartagenaeste/dashboard.html',
  '/Cartagenaeste/dietas.html',
  '/Cartagenaeste/ejercicios.html',
  '/Cartagenaeste/vacunas.html',
  '/Cartagenaeste/dejar-fumar.html',
  '/Cartagenaeste/recursos-sociales.html',
  '/Cartagenaeste/violencia-genero.html',
];

// Install - precache core pages
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('Precache partial fail:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip non-local requests (APIs, CDNs)
  if (url.origin !== location.origin) return;
  
  event.respondWith(
    fetch(event.request).then(response => {
      // Cache successful responses
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(() => {
      // Offline - try cache
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        // If HTML page, show offline page
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nueva actualización disponible',
    icon: '/Cartagenaeste/icons/icon-192x192.png',
    badge: '/Cartagenaeste/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/Cartagenaeste/' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || '🏥 Área II Cartagena', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/Cartagenaeste/')
  );
});
