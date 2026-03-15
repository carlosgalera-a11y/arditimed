// Service Worker — Área II Cartagena v3 (March 2026)
const CACHE_NAME = 'area2-v5';
const OFFLINE_URL = '/Cartagenaeste/offline.html';

const PRECACHE_URLS = [
  '/Cartagenaeste/',
  '/Cartagenaeste/index.html',
  '/Cartagenaeste/styles.css',
  '/Cartagenaeste/app-main.js',
  '/Cartagenaeste/app-modules.js',
  '/Cartagenaeste/calculadoras.html',
  '/Cartagenaeste/chatbot-medicacion.html',
  '/Cartagenaeste/citas.html',
  '/Cartagenaeste/agenda-guardia.html',
  '/Cartagenaeste/mapa.html',
  '/Cartagenaeste/casos-clinicos.html',
  '/Cartagenaeste/generador-qr.html',
  '/Cartagenaeste/dashboard.html',
  '/Cartagenaeste/pacientes.html',
  '/Cartagenaeste/triaje-ai.html',
  '/Cartagenaeste/producto.html',
  '/Cartagenaeste/offline.html',
];

// Install - precache core pages
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('Precache partial fail:', err);
      });
    })
  );
});

// Activate - delete ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network first, cache fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request).then(response => {
      // Cache good responses
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(() => {
      // Offline: try cache
      return caches.match(event.request).then(cached => {
        return cached || caches.match(OFFLINE_URL);
      });
    })
  );
});

// Listen for skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
