/**
 * Client-side PWA utilities for service worker registration,
 * offline state detection, "Add to Home Screen" prompt management,
 * and on-demand road sign image pack downloading.
 */

// Storage keys
export const A2HS_DISMISSED_KEY = 'provisoire_a2hs_dismissed_time';
export const OFFLINE_ACTION_QUEUE_KEY = 'provisoire_offline_action_queue';
export const COMPLETED_SESSION_KEY = 'provisoire_completed_session_v1';

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
    __pwaIsInstalled?: boolean;
    __pwaSwUpdateReady?: boolean;
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

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const networkListeners = new Set<NetworkStatusCallback>();
let pwaClientInitialized = false;

/**
 * Capture install prompt events as early as possible (before page scripts race).
 */
export function initPwaClient(): void {
  if (typeof window === 'undefined') return;
  if (window.__pwaInstallPrompt && !deferredPrompt) {
    deferredPrompt = window.__pwaInstallPrompt;
  }
  if (pwaClientInitialized) return;
  pwaClientInitialized = true;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.__pwaInstallPrompt = deferredPrompt;
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.__pwaInstallPrompt = null;
    window.__pwaIsInstalled = true;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
    console.log('[PWA] Application installed successfully.');
  });
}

/**
 * Register Service Worker in browser
 */
export function registerServiceWorker(): void {
  initPwaClient();

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const register = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Handle updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            window.__pwaSwUpdateReady = true;
            window.dispatchEvent(new CustomEvent('pwa-sw-update-ready'));
            console.log('[PWA] New version ready for activation.');
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      console.log('[PWA] Service Worker registered successfully.');

      const precacheShell = () => {
        if (typeof window === 'undefined') return;
        const urls = [
          window.location.pathname,
          '/en/practice',
          '/fr/practice',
          '/rw/practice',
          '/en/exam',
          '/fr/exam',
          '/rw/exam',
          '/en/questions',
          '/fr/questions',
          '/rw/questions',
          '/data/questions.json',
          '/manifest.webmanifest',
          '/favicon.ico',
          '/favicon.svg',
        ];
        precacheUrls(urls);
      };

      if (navigator.serviceWorker.controller) {
        precacheShell();
      } else {
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => {
            precacheShell();
          },
          { once: true },
        );
      }

      await navigator.serviceWorker.ready;
      precacheShell();
    } catch (err) {
      console.warn('[PWA] Service Worker registration failed:', err);
    }
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
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

/** iOS Safari does not fire beforeinstallprompt — manual Add to Home Screen only. */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Show install buttons and panels whenever the app is not already running in standalone PWA mode. */
export function shouldShowInstallButton(): boolean {
  if (typeof window === 'undefined') return false;
  return !isStandalone();
}

/** Post-session Add to Home Screen card on the results screen (shown after a completed session). */
export function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    !isStandalone() && hasCompletedSession() && !isInstallPromptDismissed()
  );
}

/** User finished at least one practice/exam session — gate install prompts. */
export function hasCompletedSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(COMPLETED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function markCompletedSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPLETED_SESSION_KEY, '1');
    window.dispatchEvent(new CustomEvent('pwa-session-completed'));
  } catch {
    // ignore
  }
}

/** Ask SW to cache practice shell URLs for offline use after first online visit. */
export function precacheUrls(urls: string[]): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  const controller = navigator.serviceWorker.controller;
  if (!controller) return;
  controller.postMessage({ type: 'PRECACHE_URLS', urls });
}

export function activateSwUpdate(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  const controller = navigator.serviceWorker.controller;
  if (controller) {
    controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function isSwUpdateReady(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.__pwaSwUpdateReady);
}

export function subscribeSwUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('pwa-sw-update-ready', handler);
  return () => window.removeEventListener('pwa-sw-update-ready', handler);
}

export type InstallGuideLang = 'en' | 'fr' | 'rw';

const installGuideCopy: Record<
  InstallGuideLang,
  {
    title: string;
    subtitle: string;
    phoneTitle: string;
    phoneSteps: string[];
    laptopTitle: string;
    laptopSteps: string[];
    close: string;
  }
> = {
  en: {
    title: 'Install Provisoire App',
    subtitle:
      'Save the app directly to your phone or computer to practice offline anytime.',
    phoneTitle: 'On Android Phone (Chrome)',
    phoneSteps: [
      '1. Tap the three dots menu (⋮) in the top-right corner of Chrome',
      '2. Tap “Install app” or “Add to Home screen”',
      '3. Tap “Install” — the app will appear on your Home screen & App drawer',
      'For iPhone / iPad (Safari): Tap Share (↑) → “Add to Home Screen”',
    ],
    laptopTitle: 'On Laptop / Desktop (Chrome / Edge)',
    laptopSteps: [
      '1. Click the Install icon (⊕) on the right side of the address bar',
      '2. Or click the browser menu (⋮) → “Save and share” → “Install Provisoire...”',
      '3. Click “Install” to open Provisoire as a desktop app',
    ],
    close: 'Got it',
  },
  fr: {
    title: 'Installer l’application Provisoire',
    subtitle:
      'Enregistrez l’application sur votre téléphone ou ordinateur pour réviser hors-ligne.',
    phoneTitle: 'Sur téléphone Android (Chrome)',
    phoneSteps: [
      '1. Touchez le menu à trois points (⋮) en haut à droite de Chrome',
      '2. Touchez « Installer l’application » ou « Ajouter à l’écran d’accueil »',
      '3. Touchez « Installer » — l’icône apparaîtra sur votre écran d’accueil',
      'Pour iPhone / iPad (Safari) : Touchez Partager (↑) → « Sur l’écran d’accueil »',
    ],
    laptopTitle: 'Sur ordinateur (Chrome / Edge)',
    laptopSteps: [
      '1. Cliquez sur l’icône Installer (⊕) à droite de la barre d’adresse',
      '2. Ou ouvrez le menu (⋮) → « Enregistrer et partager » → « Installer Provisoire... »',
      '3. Cliquez sur « Installer » pour ouvrir l’application sur le bureau',
    ],
    close: 'Compris',
  },
  rw: {
    title: 'Shyiramo Porogaramu ya Provisoire',
    subtitle:
      'Bika iyi porogaramu muri terefone cyangwa mudasobwa yawe kugira ngo wige nta interineti.',
    phoneTitle: 'Kuri terefone ya Android (Chrome)',
    phoneSteps: [
      '1. Kanda ku bumenyetso butatu (⋮) hejuru iburyo muri Chrome',
      '2. Hitamo “Shyiramo porogaramu” (Install app) cyangwa “Ongeraho kuri home screen”',
      '3. Kanda “Install” — ikimenyetso kizaza muri terefone yawe ako kanya',
      'Kuri iPhone / iPad (Safari): Kanda Share (↑) → “Add to Home Screen”',
    ],
    laptopTitle: 'Kuri mudasobwa (Chrome / Edge)',
    laptopSteps: [
      '1. Kanda ku kimenyetso (⊕) kiri mu barre y’aderesi hejuru iburyo',
      '2. Cyangwa kanda (⋮) muri Chrome → “Save and share” → “Install Provisoire...”',
      '3. Kanda “Install” kugira ngo ifunguke nk’akaporogaramu ka mudasobwa',
    ],
    close: 'Byumvikanye',
  },
};

export function getInstallGuide(lang: InstallGuideLang = 'en') {
  return installGuideCopy[lang] || installGuideCopy.en;
}

export async function promptInstall(): Promise<
  'accepted' | 'dismissed' | 'unavailable'
> {
  if (typeof window === 'undefined') return 'unavailable';

  // 1. Capture prompt immediately within active user gesture
  const prompt =
    deferredPrompt ||
    (window.__pwaInstallPrompt ? window.__pwaInstallPrompt : null);

  // If native prompt is supported and ready, trigger native OS installation immediately!
  if (prompt) {
    try {
      const promptPromise = prompt.prompt();
      await promptPromise;
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        window.__pwaInstallPrompt = null;
        window.__pwaIsInstalled = true;
        window.dispatchEvent(new CustomEvent('pwa-installed'));
        console.log('[PWA] User accepted installation prompt.');
      }
      return choice.outcome;
    } catch (err) {
      console.warn('[PWA] Install prompt failed:', err);
      return 'dismissed';
    }
  }

  return 'unavailable';
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
    const handleOnline = () => {
      flushOfflineActionQueue();
      callback(true);
    };
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

export type OfflineActionType =
  'SAVE_SESSION' | 'SAVE_HISTORY' | 'CLEAR_SESSION';

export interface OfflineAction {
  type: OfflineActionType;
  payload?: string;
  ts: number;
}

function readOfflineActionQueue(): OfflineAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_ACTION_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineAction[]) : [];
  } catch {
    return [];
  }
}

function writeOfflineActionQueue(queue: OfflineAction[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (queue.length === 0) {
      localStorage.removeItem(OFFLINE_ACTION_QUEUE_KEY);
    } else {
      localStorage.setItem(OFFLINE_ACTION_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch {
    // ignore quota errors
  }
}

/** Queue a locally persisted action while offline (progress, history, session clear). */
export function enqueueOfflineAction(
  type: OfflineActionType,
  payload?: string,
): void {
  if (typeof window === 'undefined' || isOnline()) return;

  const queue = readOfflineActionQueue();
  const withoutType = queue.filter((item) => item.type !== type);
  withoutType.push({ type, payload, ts: Date.now() });
  writeOfflineActionQueue(withoutType);
  window.dispatchEvent(
    new CustomEvent('pwa-offline-queue-updated', {
      detail: { count: withoutType.length },
    }),
  );
}

export function getOfflineActionQueueCount(): number {
  return readOfflineActionQueue().length;
}

/**
 * Re-apply queued local writes after reconnect, then clear the queue.
 * Returns how many queued actions were flushed.
 */
export function flushOfflineActionQueue(): number {
  if (typeof window === 'undefined') return 0;

  const queue = readOfflineActionQueue();
  if (queue.length === 0) return 0;

  let flushed = 0;
  for (const action of queue) {
    try {
      if (action.type === 'SAVE_SESSION' && action.payload) {
        localStorage.setItem('provisoire_practice_session_v1', action.payload);
        flushed++;
      } else if (action.type === 'SAVE_HISTORY' && action.payload) {
        localStorage.setItem('provisoire_practice_history_v1', action.payload);
        flushed++;
      } else if (action.type === 'CLEAR_SESSION') {
        localStorage.removeItem('provisoire_practice_session_v1');
        flushed++;
      }
    } catch {
      // keep item in queue if write fails
    }
  }

  writeOfflineActionQueue([]);
  window.dispatchEvent(
    new CustomEvent('pwa-offline-queue-flushed', { detail: { flushed } }),
  );
  return flushed;
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
    const controller =
      typeof navigator !== 'undefined' && 'serviceWorker' in navigator
        ? navigator.serviceWorker.controller
        : null;

    if (controller) {
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
        controller.postMessage({
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
