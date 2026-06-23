const CACHE_NAME = 'narrow-aisle-v1';
const urlsToCache = [
  '/Service-Application/',
  '/Service-Application/login.html',
  '/Service-Application/portal-hub-professional.html',
  '/Service-Application/parts-ordering.html',
  '/Service-Application/van-stock.html',
  '/Service-Application/stores.html',
  '/Service-Application/ac3-instructions.html',
  '/Service-Application/h2b-instructions.html',
  '/Service-Application/gen1-instructions.html',
  '/Service-Application/gen2-instructions.html',
  '/Service-Application/mast.html',
  '/Service-Application/flexi-logo.png',
  '/Service-Application/flexi-homepage-isolated.png',
  '/Service-Application/lines.svg',
  '/Service-Application/manifest.json'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Continue even if some files fail to cache
        console.log('Some files failed to cache during install');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and API calls
  if (!event.request.url.includes(location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache successful responses
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Offline - try to return a cached version or offline page
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Could return an offline page here if needed
            throw new Error('offline');
          });
        });
    })
  );
});

// Message event - for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
