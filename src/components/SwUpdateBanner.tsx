import { useEffect, useState } from 'react';
import type { Lang } from '../lib/quiz';
import {
  activateSwUpdate,
  isSwUpdateReady,
  subscribeSwUpdate,
} from '../lib/pwa';

const copy = {
  en: {
    message: 'A new version is ready.',
    action: 'Update now',
  },
  fr: {
    message: 'Une nouvelle version est disponible.',
    action: 'Mettre à jour',
  },
  rw: {
    message: 'Verisiyo nshya irahari.',
    action: 'Vugurura ubu',
  },
};

interface SwUpdateBannerProps {
  lang?: Lang;
}

export default function SwUpdateBanner({ lang = 'en' }: SwUpdateBannerProps) {
  const [visible, setVisible] = useState(false);
  const t = copy[lang] || copy.en;

  useEffect(() => {
    if (isSwUpdateReady()) setVisible(true);
    return subscribeSwUpdate(() => setVisible(true));
  }, []);

  if (!visible) return null;

  return (
    <aside
      role="status"
      className="fixed top-4 right-4 left-4 z-[90] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-lg sm:right-6 sm:left-auto"
    >
      <p className="text-xs font-semibold text-blue-950 sm:text-sm">
        {t.message}
      </p>
      <button
        type="button"
        onClick={() => {
          activateSwUpdate();
          setVisible(false);
        }}
        className="flex min-h-[36px] shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 active:scale-95"
      >
        {t.action}
      </button>
    </aside>
  );
}
