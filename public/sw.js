// ===================================================================
// CHAIZSTORE PWA SERVICE WORKER
// Enables offline resilience, instant native caching & app installability
// ===================================================================

const CACHE_NAME = 'chaizstore-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/chaizz.png',
  '/sounds/user-success.wav',
  '/sounds/notice.wav'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Jangan intercept localhost / dev server
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return;
  }
  // Hanya tangani request GET http/https
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Jangan cache API atau socket calls
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io') || url.port === '3001') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache hasil terbaru secara dinamis jika valid
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback dari cache saat offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
