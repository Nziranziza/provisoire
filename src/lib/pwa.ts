/**
 * Client-side PWA utilities for service worker registration,
 * offline state detection, "Add to Home Screen" prompt management,
 * and on-demand road sign image pack downloading.
 */

// Storage keys
export const A2HS_DISMISSED_KEY = 'provisoire_a2hs_dismissed_time';
export const OFFLINE_ACTION_QUEUE_KEY = 'provisoire_offline_action_queue';

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
    __pwaIsInstalled?: boolean;
  }
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type NetworkStatusCallback = (online: boolean) => void;
export type DownloadProgressCallback = (
  percent: number,
  downloaded: number,
  total: number,
) => void;

let swRegistration: ServiceWorkerRegistration | null = null;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const networkListeners = new Set<NetworkStatusCallback>();

/**
 * Register Service Worker in browser
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      swRegistration = reg;

      // Handle updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            console.log('[PWA] New version ready for activation.');
          }
        });
      });

      console.log('[PWA] Service Worker registered successfully.');
    } catch (err) {
      console.warn('[PWA] Service Worker registration failed:', err);
    }
  });

  // Listen to beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.__pwaInstallPrompt = deferredPrompt;
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  // Track app installation
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.__pwaInstallPrompt = null;
    window.__pwaIsInstalled = true;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
    console.log('[PWA] Application installed successfully.');
  });
}

/**
 * Check if app is running in standalone PWA mode
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if the browser allows Add to Home Screen install prompt
 */
export function canInstall(): boolean {
  if (typeof window === 'undefined') return false;
  if (isStandalone()) return false;
  return Boolean(deferredPrompt || window.__pwaInstallPrompt);
}

/**
 * Trigger the Add to Home Screen prompt
 */
export async function promptInstall(): Promise<
  'accepted' | 'dismissed' | 'unavailable'
> {
  const prompt = deferredPrompt || window.__pwaInstallPrompt;
  if (!prompt) return 'unavailable';

  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    deferredPrompt = null;
    window.__pwaInstallPrompt = null;
    return choice.outcome;
  } catch (err) {
    console.warn('[PWA] Install prompt failed:', err);
    return 'dismissed';
  }
}

/**
 * Check if install prompt was recently dismissed by user (cooldown period of 7 days)
 */
export function isInstallPromptDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(A2HS_DISMISSED_KEY);
    if (!raw) return false;
    const dismissedTime = Number(raw);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedTime < sevenDaysMs;
  } catch {
    return false;
  }
}

/**
 * Mark install prompt as dismissed
 */
export function dismissInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(A2HS_DISMISSED_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

/**
 * Get current online/offline status
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Subscribe to browser network changes (online/offline events)
 */
export function subscribeNetworkStatus(
  callback: NetworkStatusCallback,
): () => void {
  networkListeners.add(callback);

  if (typeof window !== 'undefined') {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      networkListeners.delete(callback);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  return () => {
    networkListeners.delete(callback);
  };
}

/**
 * Query image cache status from Service Worker or local CacheStorage
 */
export async function checkImagePackStatus(
  images: string[],
): Promise<{ cachedCount: number; totalCount: number; isComplete: boolean }> {
  const totalCount = images.length;
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { cachedCount: 0, totalCount, isComplete: false };
  }

  try {
    const cacheNames = await caches.keys();
    const imageCacheName =
      cacheNames.find((name) => name.startsWith('provisoire-images')) ||
      'provisoire-images-v1';
    const cache = await caches.open(imageCacheName);

    let cachedCount = 0;
    for (const imgUrl of images) {
      const normalizedUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
      const match = await cache.match(normalizedUrl);
      if (match) cachedCount++;
    }

    return {
      cachedCount,
      totalCount,
      isComplete: cachedCount >= totalCount && totalCount > 0,
    };
  } catch (err) {
    console.warn('[PWA] Failed to check image cache status:', err);
    return { cachedCount: 0, totalCount, isComplete: false };
  }
}

/**
 * Request Service Worker to download all road sign images in background with progress
 */
export async function downloadImagePack(
  images: string[],
  onProgress?: DownloadProgressCallback,
): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    // If Service Worker controller is active, send message
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      return new Promise<boolean>((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          const data = event.data;
          if (!data || typeof data !== 'object') return;

          if (data.type === 'IMAGE_DOWNLOAD_PROGRESS' && onProgress) {
            onProgress(data.percent, data.downloaded, data.total);
          } else if (data.type === 'IMAGE_DOWNLOAD_COMPLETE') {
            navigator.serviceWorker.removeEventListener(
              'message',
              messageHandler,
            );
            if (onProgress) onProgress(100, data.total, data.total);
            resolve(true);
          }
        };

        navigator.serviceWorker.addEventListener('message', messageHandler);
        navigator.serviceWorker.controller.postMessage({
          type: 'DOWNLOAD_ALL_IMAGES',
          images,
        });

        // Fallback timeout in case SW gets terminated
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener(
            'message',
            messageHandler,
          );
          resolve(true);
        }, 60000);
      });
    }

    // Direct fetch & cache fallback if SW controller not ready
    const cacheNames = await caches.keys();
    const imageCacheName =
      cacheNames.find((name) => name.startsWith('provisoire-images')) ||
      'provisoire-images-v1';
    const cache = await caches.open(imageCacheName);

    let downloaded = 0;
    const total = images.length;

    for (let i = 0; i < total; i++) {
      const imgUrl = images[i]!;
      const normalizedUrl = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
      try {
        const existing = await cache.match(normalizedUrl);
        if (!existing) {
          const resp = await fetch(normalizedUrl);
          if (resp && resp.ok) {
            await cache.put(normalizedUrl, resp);
          }
        }
      } catch {
        // Continue downloading others
      }
      downloaded++;
      if (onProgress) {
        onProgress(Math.round((downloaded / total) * 100), downloaded, total);
      }
    }

    return true;
  } catch (err) {
    console.warn('[PWA] Image download failed:', err);
    return false;
  }
}

/**
 * Clear cached sign images to free up space
 */
export async function clearImagePack(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (name.startsWith('provisoire-images')) {
        await caches.delete(name);
      }
    }
  } catch {
    // ignore
  }
}
