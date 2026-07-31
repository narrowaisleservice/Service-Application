// Smart Service Worker - Auto-updates HTML, manages cache
// Version: 3.0 - Single stable cache, guaranteed cleanup of stale caches

const CACHE_NAME = 'narrow-aisle-v4';

const urlsToCache = [
  '/Service-Application/',
  '/Service-Application/index.html',
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
  '/Service-Application/fault-reporter.html',
  '/Service-Application/fault-tracker.html',
  '/Service-Application/contacts.html',
  '/Service-Application/customer-contacts.html',
  '/Service-Application/Equipment.html',
  '/Service-Application/flexi-logo-white.svg',
  '/Service-Application/flexi-homepage-isolated.png',
  '/Service-Application/lines.svg',
  '/Service-Application/manifest.json'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(urlsToCache).catch(() => {
        console.log('[Service Worker] Some files failed to cache during install (OK)');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - delete every cache except the current one, no exceptions
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting stale cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external domains (API calls, CDN, Supabase, etc)
  if (!url.origin.includes(location.origin)) {
    return;
  }

  // Strategy 1: Network-first for HTML (always get latest, never trust cache)
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Offline: serve from the current cache only - never an old one
          return caches.open(CACHE_NAME).then((cache) =>
            cache.match(request).then((cachedResponse) => {
              return cachedResponse || cache.match('/Service-Application/login.html');
            })
          );
        })
    );
  }
  // Strategy 2: Cache-first for assets (images, SVG, CSS, JS), revalidated in background
  else {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response && response.status === 200 && response.type !== 'error') {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        })
      )
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});

console.log('[Service Worker] Loaded v4 - single cache, network-first HTML');
