// sw-v2.js — Self-destruct: kills itself and forces fresh content
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then(clients => clients.forEach(c => c.navigate(c.url)))
  );
});
// While alive, NEVER serve cache — always go to network
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
