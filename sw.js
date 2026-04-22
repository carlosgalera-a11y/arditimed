// Service Worker - Área II Cartagena PWA v112
// Estrategias:
// - Network-first con timeout 3s para HTML/navegación (caché como fallback).
// - Stale-while-revalidate para assets estáticos versionados.
// - Bypass de Firebase Firestore/Auth/Functions/Storage (siempre online).
// - skipWaiting + clients.claim para update inmediato.

const CACHE_NAME = 'area2-v112';
const HTML_TIMEOUT_MS = 3000;

const PRECACHE = [
  '/',
  '/index.html',
  '/app-main.js',
  '/app-modules.js',
  '/api-config.js',
  '/ai-client.js',
  '/firebase-init.js',
  '/triaje-ia.js',
  '/escalas-clinicas.js',
  '/guardia-notas.js',
  '/supabase-plantillas.js',
  '/turnos-guardia.js',
  '/manifest.json',
  '/hero-bg.jpg',
  '/visados-ai.js',
  '/docs/guia-visado-prescriptores-457-2023.txt',
  '/sections/page-scan-ia.html',
  '/sections/page-urgencias.html',
  '/sections/page-enfermeria.html',
  '/documents.json',
  '/proa.html',
  '/fuentes-recursos.html',
  '/fichas-consulta-rapida.html',
  '/consejos-salud.html',
  '/prepara-consulta.html',
  '/recursos-comunitarios.html',
  '/offline.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(PRECACHE.map(url =>
        cache.add(url).catch(() => {})
      ));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Firebase endpoints: siempre network, nunca cache.
function bypassCache(url) {
  return url.includes('firestore.googleapis.com')
      || url.includes('googleapis.com/identitytoolkit')
      || url.includes('cloudfunctions.net')
      || url.includes('firebasestorage.googleapis.com')
      || url.includes('securetoken.googleapis.com')
      || url.includes('firebaseinstallations.googleapis.com')
      || url.startsWith('chrome-extension://');
}

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(request).then(r => { clearTimeout(t); resolve(r); }, err => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (bypassCache(event.request.url)) return;

  const isNavigation = event.request.mode === 'navigate'
    || event.request.destination === 'document';

  if (isNavigation) {
    // Network-first con timeout — caché como fallback si red lenta o offline.
    event.respondWith(
      fetchWithTimeout(event.request, HTML_TIMEOUT_MS)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => {
          if (cached) return cached;
          return caches.match('/offline.html')
            .then(off => off || new Response('Offline', { status: 503 }));
        }))
    );
    return;
  }

  // Assets: stale-while-revalidate.
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
