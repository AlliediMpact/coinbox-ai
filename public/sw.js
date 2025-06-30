// Service Worker for CoinBox AI PWA
const CACHE_NAME = 'coinbox-ai-v1.0.0';
const STATIC_CACHE = 'coinbox-static-v1';
const DYNAMIC_CACHE = 'coinbox-dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/auth',
  '/manifest.json',
  '/assets/coinbox-ai.png',
  '/assets/coinbox-ai.svg',
  // Add other static assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/.*$/,
  /^https:\/\/api\.paystack\.co\/.*$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different request types
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request));
  } else {
    // For non-GET requests, just pass through
    event.respondWith(fetch(request));
  }
});

// Handle GET requests with appropriate caching strategy
async function handleGetRequest(request) {
  const url = new URL(request.url);

  try {
    // Static assets - cache first
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request, STATIC_CACHE);
    }

    // API requests - network first with cache fallback
    if (isApiRequest(url.pathname)) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }

    // HTML pages - network first with cache fallback
    if (request.headers.get('accept')?.includes('text/html')) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }

    // Default to network first
    return await networkFirst(request, DYNAMIC_CACHE);
  } catch (error) {
    console.error('Service Worker: Error handling request:', error);
    
    // Fallback to offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const cache = await caches.open(STATIC_CACHE);
      const offlinePage = await cache.match('/offline.html');
      return offlinePage || new Response('Offline', { status: 503 });
    }

    return new Response('Network error', { status: 503 });
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Network request failed:', error);
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', error.message);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Helper functions
function isStaticAsset(pathname) {
  return pathname.includes('/assets/') || 
         pathname.includes('/_next/static/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.ico');
}

function isApiRequest(pathname) {
  return pathname.startsWith('/api/');
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Retry failed requests stored in IndexedDB
    console.log('Service Worker: Performing background sync');
    
    // In a real implementation, you would:
    // 1. Get failed requests from IndexedDB
    // 2. Retry them when online
    // 3. Update the UI with results
    
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from CoinBox AI',
    icon: '/assets/coinbox-ai.png',
    badge: '/assets/coinbox-ai.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/assets/coinbox-ai.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/coinbox-ai.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CoinBox AI', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection:', event.reason);
});

console.log('Service Worker: Script loaded successfully');
