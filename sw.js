// Service Worker - Área II Cartagena PWA v44 - ECG: iframe a Cards-Lab (Yale) con fallback
const CACHE_NAME = 'area2-v74';

const PRECACHE = [
  '/Cartagenaeste/',
  '/Cartagenaeste/index.html',
  '/Cartagenaeste/app-main.js',
  '/Cartagenaeste/documents.json',
  '/Cartagenaeste/app-modules.js',
  '/Cartagenaeste/api-config.js',
  '/Cartagenaeste/triaje-ia.js',
  '/Cartagenaeste/escalas-clinicas.js',
  '/Cartagenaeste/guardia-notas.js',
  '/Cartagenaeste/supabase-plantillas.js',
  '/Cartagenaeste/turnos-guardia.js',
  '/Cartagenaeste/sections/page-scan-ia.html',
  '/Cartagenaeste/sections/page-urgencias.html',
  '/Cartagenaeste/sections/page-enfermeria.html',
  '/Cartagenaeste/manifest.json',
  '/Cartagenaeste/plantillas-informes.html',
  '/Cartagenaeste/sections/page-enfermeria.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW v67] Pre-caching', PRECACHE.length, 'files');
      return Promise.all(PRECACHE.map(url =>
        cache.add(url).catch(() => console.warn('[SW] Skip:', url))
      ));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW v39] Purging old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firestore.googleapis.com')) return;
  if (event.request.url.includes('googleapis.com/identitytoolkit')) return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/Cartagenaeste/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
