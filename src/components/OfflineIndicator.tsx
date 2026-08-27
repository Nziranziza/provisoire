import { useEffect, useState } from 'react';
import type { Lang } from '../lib/quiz';
import { isOnline, subscribeNetworkStatus } from '../lib/pwa';

interface OfflineIndicatorProps {
  lang?: Lang;
}

const copy = {
  en: {
    offline: 'Offline Mode · Full question bank & tests are available offline',
    backOnline: 'Back Online · Connection restored',
  },
  fr: {
    offline:
      'Mode Hors-ligne · Banque de questions et tests disponibles sans connexion',
    backOnline: 'En ligne · Connexion rétablie',
  },
  rw: {
    offline: 'Uburyo budakenera interineti · Ibibazo n’ibizamini birakora neza',
    backOnline: 'Interineti yagarutse · Muri kumwe na interineti',
  },
};

export default function OfflineIndicator({
  lang = 'en',
}: OfflineIndicatorProps) {
  const [online, setOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const t = copy[lang] || copy.en;

  useEffect(() => {
    setMounted(true);
    setOnline(isOnline());

    const unsubscribe = subscribeNetworkStatus((isNowOnline) => {
      setOnline(isNowOnline);
      if (isNowOnline) {
        setShowReconnected(true);
        const timer = setTimeout(() => {
          setShowReconnected(false);
        }, 3500);
        return () => clearTimeout(timer);
      } else {
        setShowReconnected(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!mounted) return null;
  if (online && !showReconnected) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={online ? t.backOnline : t.offline}
      className={`fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all duration-300 sm:right-6 sm:bottom-6 ${
        online
          ? 'animate-bounce border-emerald-300 bg-emerald-50/95 text-emerald-900 shadow-emerald-900/10'
          : 'border-amber-300 bg-amber-50/95 text-amber-950 shadow-amber-900/10'
      }`}
    >
      <span className="flex h-2.5 w-2.5 flex-none items-center justify-center">
        <span
          className={`h-2 w-2 rounded-full ${
            online ? 'bg-emerald-600' : 'animate-pulse bg-amber-600'
          }`}
        />
      </span>
      <p className="flex-1 leading-snug">{online ? t.backOnline : t.offline}</p>
    </aside>
  );
}
