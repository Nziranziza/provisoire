// Provisoire Service Worker v1.0.0
const CACHE_VERSION = 'v1';
const SHELL_CACHE = `provisoire-shell-${CACHE_VERSION}`;
const DATA_CACHE = `provisoire-data-${CACHE_VERSION}`;
const IMAGE_CACHE = `provisoire-images-${CACHE_VERSION}`;

const CURRENT_CACHES = [SHELL_CACHE, DATA_CACHE, IMAGE_CACHE];

// Core app shell pages to precache immediately on first load
const SHELL_ASSETS = [
  '/',
  '/en/practice',
  '/fr/practice',
  '/rw/practice',
  '/en/exam',
  '/fr/exam',
  '/rw/exam',
  '/en/questions',
  '/fr/questions',
  '/rw/questions',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
];

// Pre-rendered search indexes and question data
const DATA_ASSETS = [
  '/q-index/en',
  '/q-index/fr',
  '/q-index/rw',
  '/en/search-index.json',
  '/fr/search-index.json',
  '/rw/search-index.json',
];

// 1. Install Event: Precache App Shell & Question Datasets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Precache app shell
      const shell = await caches.open(SHELL_CACHE);
      try {
        await shell.addAll(SHELL_ASSETS);
      } catch (err) {
        console.warn('[SW] Non-fatal shell caching warning:', err);
      }

      // Precache data payloads
      const data = await caches.open(DATA_CACHE);
      try {
        await data.addAll(DATA_ASSETS);
      } catch (err) {
        console.warn('[SW] Non-fatal data caching warning:', err);
      }

      // Activate worker immediately
      await self.skipWaiting();
    })(),
  );
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (!CURRENT_CACHES.includes(name)) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
          return Promise.resolve();
        }),
      );
      await self.clients.claim();
    })(),
  );
});

// 3. Fetch Event Routing
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // A. Navigation Requests (HTML Pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Network first for navigations when online to get freshest updates
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Offline navigation fallback: Check exact path, then localized practice shell
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          // Attempt matching language fallback
          const pathname = url.pathname;
          const match = pathname.match(/^\/(en|fr|rw)/);
          const lang = match ? match[1] : 'en';

          if (pathname.includes('/exam')) {
            const examFallback = await caches.match(`/${lang}/exam`);
            if (examFallback) return examFallback;
          }

          if (pathname.includes('/questions')) {
            const questionsFallback = await caches.match(`/${lang}/questions`);
            if (questionsFallback) return questionsFallback;
          }

          const practiceFallback = await caches.match(`/${lang}/practice`);
          if (practiceFallback) return practiceFallback;

          const defaultFallback = await caches.match('/en/practice');
          if (defaultFallback) return defaultFallback;

          throw err;
        }
      })(),
    );
    return;
  }

  // B. Road Sign Images (/images/*)
  if (url.pathname.startsWith('/images/') || request.destination === 'image') {
    event.respondWith(
      (async () => {
        // Cache-first for images
        const cachedImage =
          (await caches.match(request)) ||
          (await (await caches.open(IMAGE_CACHE)).match(request));
        if (cachedImage) return cachedImage;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const imageCache = await caches.open(IMAGE_CACHE);
            imageCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Return cached if available
          if (cachedImage) return cachedImage;
          throw err;
        }
      })(),
    );
    return;
  }

  // C. Question Data / Search Index Endpoints (/q-index/*, *.json)
  if (
    url.pathname.startsWith('/q-index/') ||
    url.pathname.endsWith('.json') ||
    url.pathname.includes('search-index')
  ) {
    event.respondWith(
      (async () => {
        const cachedData = await caches.match(request);
        if (cachedData) {
          // Revalidate in background if online
          fetch(request)
            .then(async (response) => {
              if (response && response.ok) {
                const dataCache = await caches.open(DATA_CACHE);
                dataCache.put(request, response);
              }
            })
            .catch(() => {});
          return cachedData;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const dataCache = await caches.open(DATA_CACHE);
            dataCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          if (cachedData) return cachedData;
          throw err;
        }
      })(),
    );
    return;
  }

  // D. Static Assets (Scripts, Styles, Fonts, Icons)
  event.respondWith(
    (async () => {
      const cachedAsset = await caches.match(request);
      if (cachedAsset) return cachedAsset;

      try {
        const networkResponse = await fetch(request);
        if (
          networkResponse &&
          networkResponse.ok &&
          (url.pathname.startsWith('/_astro/') ||
            url.pathname.startsWith('/icons/') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css'))
        ) {
          const shellCache = await caches.open(SHELL_CACHE);
          shellCache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        if (cachedAsset) return cachedAsset;
        throw err;
      }
    })(),
  );
});

// 4. Message Event Handling (On-Demand Image Precache & Cache Status)
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  // A. Download All Road Sign Images on Demand
  if (data.type === 'DOWNLOAD_ALL_IMAGES' && Array.isArray(data.images)) {
    const imagesToCache = data.images;
    const total = imagesToCache.length;
    let downloaded = 0;
    const imageCache = await caches.open(IMAGE_CACHE);

    // Notify clients that download started
    broadcast({
      type: 'IMAGE_DOWNLOAD_PROGRESS',
      downloaded: 0,
      total,
      percent: 0,
    });

    const batchSize = 6;
    for (let i = 0; i < imagesToCache.length; i += batchSize) {
      const batch = imagesToCache.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (imgUrl) => {
          const normalizedUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
          const existing = await imageCache.match(normalizedUrl);
          if (existing) {
            downloaded++;
            return;
          }
          try {
            const resp = await fetch(normalizedUrl);
            if (resp && resp.ok) {
              await imageCache.put(normalizedUrl, resp);
            }
          } catch (err) {
            console.warn('[SW] Failed to precache image:', normalizedUrl, err);
          }
          downloaded++;
        }),
      );

      const percent = Math.min(100, Math.round((downloaded / total) * 100));
      broadcast({
        type: 'IMAGE_DOWNLOAD_PROGRESS',
        downloaded,
        total,
        percent,
      });
    }

    broadcast({
      type: 'IMAGE_DOWNLOAD_COMPLETE',
      total,
    });
  }

  // B. Check Image Cache Status
  if (data.type === 'CHECK_IMAGE_CACHE_STATUS' && Array.isArray(data.images)) {
    const imagesToCheck = data.images;
    const totalCount = imagesToCheck.length;
    const imageCache = await caches.open(IMAGE_CACHE);
    let cachedCount = 0;

    for (const imgUrl of imagesToCheck) {
      const normalizedUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
      const existing = await imageCache.match(normalizedUrl);
      if (existing) cachedCount++;
    }

    if (event.source) {
      event.source.postMessage({
        type: 'IMAGE_CACHE_STATUS',
        cachedCount,
        totalCount,
        isComplete: cachedCount >= totalCount && totalCount > 0,
      });
    }
  }

  // C. Clear Image Cache
  if (data.type === 'CLEAR_IMAGE_CACHE') {
    await caches.delete(IMAGE_CACHE);
    await caches.open(IMAGE_CACHE);
    if (event.source) {
      event.source.postMessage({ type: 'IMAGE_CACHE_CLEARED' });
    }
  }

  // D. Skip Waiting
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function broadcast(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage(message);
  }
}
