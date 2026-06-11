// public/sw.js - Enhanced service worker for offline support and performance
const CACHE_NAME = 'abbaa-carraa-v2';
const STATIC_CACHE = 'abbaa-carraa-static-v2';
const API_CACHE = 'abbaa-carraa-api-v2';
const IMAGE_CACHE = 'abbaa-carraa-images-v2';

// Files to cache on install
const urlsToCache = [
  '/',
  '/offline',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/listings',
  '/merkato-vip',
  '/cities'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return event.respondWith(fetch(request));
  }
  
  // Images - Cache first with stale-while-revalidate
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(IMAGE_CACHE).then(cache => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
  
  // API requests (Supabase) - Network first with cache fallback
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }
  
  // Static assets (JS, CSS, fonts) - Cache first
  if (url.pathname.match(/\.(js|css|woff2|woff|ttf)$/i) || url.pathname.includes('/_next/static/')) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request).then(response => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }
  
  // HTML pages - Network first with offline fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache the fetched page
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached version if available
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Background sync for offline newsletter subscriptions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-newsletter') {
    event.waitUntil(syncNewsletterSubscriptions());
  }
});

async function syncNewsletterSubscriptions() {
  console.log('Syncing newsletter subscriptions...');
  const cache = await caches.open('offline-newsletter');
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
        console.log('Synced newsletter subscription');
      }
    } catch (error) {
      console.log('Still offline, will retry later');
    }
  }
}

// Push notification handler
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : { title: 'Abbaa Carraa', body: 'New update available!' };
  } catch (e) {
    data = { title: 'Abbaa Carraa', body: 'Check out new prize pools and winners!' };
  }
  
  const options = {
    body: data.body,
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Abbaa Carraa', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Message handler for client communication
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
