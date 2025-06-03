// Service Worker for NextWatch App
const CACHE_NAME = 'nextwatch-cache-v1';
const ASSETS_TO_CACHE = [
  '/app/',
  '/app/index.html',
  '/app/manifest.json',
  '/app/css/reset.css',
  '/app/css/variables.css',
  '/app/css/main.css',
  '/app/css/components.css',
  '/app/css/animations.css',
  '/app/js/config.js',
  '/app/js/utils.js',
  '/app/js/storage.js',
  '/app/js/ui.js',
  '/app/js/api.js',
  '/app/js/search.js',
  '/app/js/watchlist.js',
  '/app/js/recommendations.js',
  '/app/js/detail.js',
  '/app/js/settings.js',
  '/app/js/app.js',
  '/app/assets/icon-192.png',
  '/app/assets/icon-512.png',
  '/app/assets/no-poster.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests
  if (event.request.url.includes('omdbapi.com') || 
      event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Don't cache non-successful responses or non-GET requests
          if (!response || response.status !== 200 || event.request.method !== 'GET') {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/app/index.html');
        }
      })
  );
});
