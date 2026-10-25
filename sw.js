/**
 * AuraPDF — Offline Service Worker (Network-First Strategy)
 * Always fetches the freshest files from network so code changes apply immediately.
 */

const CACHE_NAME = 'aurapdf-v8';

self.addEventListener('install', (event) => {
  // Force immediate activation of the new service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear all previous caches
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First: Fetch from network first, fall back to cache only when completely offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, clone and update cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fall back to cache if offline
        return caches.match(event.request);
      })
  );
});
