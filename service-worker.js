// Smart Service Worker - Auto-updates HTML, manages cache
// Version: 2.0 - Auto-cleaning & update detection

const CACHE_VERSION = 'narrow-aisle-v3';
const CACHE_NAME = `${CACHE_VERSION}-${Date.now()}`;
const OLD_CACHES = [
  'narrow-aisle-v1',
  'narrow-aisle-v2',
  'narrow-aisle-v3'
];

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
    }).then(() => {
      // Clean up old caches immediately
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return OLD_CACHES.includes(cacheName) && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that's not current
          if (!cacheName.startsWith(CACHE_VERSION)) {
            console.log('[Service Worker] Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external domains (API calls, CDN, etc)
  if (!url.origin.includes(location.origin)) {
    return;
  }

  // Strategy 1: Network-first for HTML (always get latest)
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Cache the new version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Offline: serve from cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback page
            return caches.match('/Service-Application/login.html');
          });
        })
    );
  }
  // Strategy 2: Cache-first for assets (images, SVG, CSS, JS)
  else {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Check for updates in background
          fetch(request)
            .then((response) => {
              if (response && response.status === 200 && response.type !== 'error') {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {
              // Offline - cached version is fine
            });

          return cachedResponse;
        }

        return fetch(request)
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
            // Return cached version if available
            return caches.match(request);
          });
      })
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

console.log('[Service Worker] Loaded - Auto-update enabled');
