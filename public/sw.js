// Provisoire Service Worker — bump CACHE_VERSION on deploy to bust caches
const CACHE_VERSION = 'v4';
const SHELL_CACHE = `provisoire-shell-${CACHE_VERSION}`;
const DATA_CACHE = `provisoire-data-${CACHE_VERSION}`;
const IMAGE_CACHE = `provisoire-images-${CACHE_VERSION}`;

const CURRENT_CACHES = [SHELL_CACHE, DATA_CACHE, IMAGE_CACHE];

// App shell: HTML entry points + icons (precached on install)
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
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
];

// Question text + search indexes (precached on install; images are opt-in)
const DATA_ASSETS = [
  '/data/questions.json',
  '/q-index/en',
  '/q-index/fr',
  '/q-index/rw',
  '/en/search-index.json',
  '/fr/search-index.json',
  '/rw/search-index.json',
];

async function cacheUrls(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.allSettled(
    urls.map(async (rawUrl) => {
      const url = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
      try {
        const existing = await cache.match(url);
        if (existing) return;
        const response = await fetch(url);
        if (response && response.ok) {
          if (response.redirected) {
            await cache.put(response.url, response.clone());
          }
          await cache.put(url, response);
        }
      } catch {
        // Silently catch in case browser is offline during install
      }
    }),
  );
}

// 1. Install: precache shell + question data immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      await cacheUrls(SHELL_CACHE, SHELL_ASSETS);
      await cacheUrls(DATA_CACHE, DATA_ASSETS);
    })(),
  );
});

// 2. Activate: delete outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (!CURRENT_CACHES.includes(name)) {
            return caches.delete(name);
          }
          return Promise.resolve();
        }),
      );
      await self.clients.claim();
    })(),
  );
});

// 3. Fetch routing
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Bypass live Vite HMR websocket pings
  if (
    url.pathname.includes('hot-update') ||
    url.pathname.includes('__vite_ping')
  ) {
    return;
  }

  // A. Navigation (HTML) — network-first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request.url, {
            headers: request.headers,
            credentials: 'same-origin',
            redirect: 'follow',
          });

          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(SHELL_CACHE);
            if (networkResponse.redirected) {
              cache.put(networkResponse.url, networkResponse.clone());
              return new Response(networkResponse.body, {
                status: networkResponse.status,
                statusText: networkResponse.statusText,
                headers: networkResponse.headers,
              });
            }
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch {
          // Network failed, proceed to cache fallback
        }

        const cachedPage =
          (await caches.match(request, { ignoreSearch: true })) ||
          (await caches.match(url.pathname, { ignoreSearch: true }));
        if (cachedPage) return cachedPage;

        const pathname = url.pathname;
        const match = pathname.match(/^\/(en|fr|rw)/);
        const lang = match ? match[1] : 'en';

        if (pathname.includes('/exam')) {
          const examFallback = await caches.match(`/${lang}/exam`, {
            ignoreSearch: true,
          });
          if (examFallback) return examFallback;
        }

        if (pathname.includes('/questions')) {
          const questionsFallback = await caches.match(`/${lang}/questions`, {
            ignoreSearch: true,
          });
          if (questionsFallback) return questionsFallback;
        }

        const practiceFallback = await caches.match(`/${lang}/practice`, {
          ignoreSearch: true,
        });
        if (practiceFallback) return practiceFallback;

        const defaultFallback =
          (await caches.match('/en/practice', { ignoreSearch: true })) ||
          (await caches.match('/en/questions', { ignoreSearch: true }));
        if (defaultFallback) return defaultFallback;

        try {
          return await fetch(request);
        } catch {
          return new Response(
            'Offline — open Practice from your home screen.',
            {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            },
          );
        }
      })(),
    );
    return;
  }

  // B. Road sign images — cache-first (opt-in bulk download or on-demand)
  if (url.pathname.startsWith('/images/') || request.destination === 'image') {
    event.respondWith(
      (async () => {
        const imageCache = await caches.open(IMAGE_CACHE);
        const cachedImage =
          (await caches.match(request, { ignoreSearch: true })) ||
          (await imageCache.match(request, { ignoreSearch: true }));
        if (cachedImage) return cachedImage;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            imageCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          if (cachedImage) return cachedImage;
          return new Response('', {
            status: 404,
            statusText: 'Image not cached',
          });
        }
      })(),
    );
    return;
  }

  // C. Question data / search indexes — cache-first + background revalidate
  if (
    url.pathname.startsWith('/data/') ||
    url.pathname.startsWith('/q-index/') ||
    url.pathname.endsWith('.json') ||
    url.pathname.includes('search-index')
  ) {
    event.respondWith(
      (async () => {
        const dataCache = await caches.open(DATA_CACHE);
        const cachedData =
          (await caches.match(request, { ignoreSearch: true })) ||
          (await dataCache.match(request, { ignoreSearch: true }));

        if (cachedData) {
          fetch(request)
            .then(async (response) => {
              if (response && response.ok) {
                dataCache.put(request, response);
              }
            })
            .catch(() => {});
          return cachedData;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            dataCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          if (cachedData) return cachedData;
          throw new Error('Data unavailable offline');
        }
      })(),
    );
    return;
  }

  // D. Static assets, scripts, stylesheets, fonts, icons, manifests & modules — cache-first
  event.respondWith(
    (async () => {
      const shellCache = await caches.open(SHELL_CACHE);
      const cachedAsset =
        (await caches.match(request, { ignoreSearch: true })) ||
        (await caches.match(url.pathname, { ignoreSearch: true })) ||
        (await shellCache.match(request, { ignoreSearch: true }));
      if (cachedAsset) return cachedAsset;

      try {
        const networkResponse = await fetch(request);
        if (
          networkResponse &&
          (networkResponse.ok || networkResponse.type === 'opaque')
        ) {
          if (networkResponse.redirected) {
            shellCache.put(networkResponse.url, networkResponse.clone());
            return new Response(networkResponse.body, {
              status: networkResponse.status,
              statusText: networkResponse.statusText,
              headers: networkResponse.headers,
            });
          }
          shellCache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        if (cachedAsset) return cachedAsset;
        const fallback =
          (await caches.match(request.url, { ignoreSearch: true })) ||
          (await caches.match(url.pathname, { ignoreSearch: true }));
        if (fallback) return fallback;

        // If manifest requested while offline
        if (url.pathname.includes('manifest')) {
          const manifestFallback = await caches.match('/manifest.webmanifest');
          if (manifestFallback) return manifestFallback;
        }

        return new Response('', {
          status: 503,
          statusText: 'Asset unavailable offline',
        });
      }
    })(),
  );
});

// 4. Messages: image pack, precache URLs, skip waiting
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'PRECACHE_URLS' && Array.isArray(data.urls)) {
    await cacheUrls(SHELL_CACHE, data.urls);
    if (event.source) {
      event.source.postMessage({ type: 'PRECACHE_COMPLETE' });
    }
  }

  if (data.type === 'DOWNLOAD_ALL_IMAGES' && Array.isArray(data.images)) {
    const imagesToCache = data.images;
    const total = imagesToCache.length;
    let downloaded = 0;
    const imageCache = await caches.open(IMAGE_CACHE);

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

  if (data.type === 'CLEAR_IMAGE_CACHE') {
    await caches.delete(IMAGE_CACHE);
    await caches.open(IMAGE_CACHE);
    if (event.source) {
      event.source.postMessage({ type: 'IMAGE_CACHE_CLEARED' });
    }
  }

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
