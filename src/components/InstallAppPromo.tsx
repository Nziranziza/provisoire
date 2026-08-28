import { useEffect, useState } from 'react';
import type { Lang } from '../lib/quiz';
import { initPwaClient, shouldShowInstallButton } from '../lib/pwa';
import InstallAppButton from './InstallAppButton';

const copy: Record<Lang, string> = {
  en: 'Get the app — works on phone & laptop',
  fr: 'Installer l’app — téléphone & ordinateur',
  rw: 'Shyiramo app — terefone & mudasobwa',
};

interface InstallAppPromoProps {
  lang?: Lang;
}

/** Sticky install promo shown site-wide when not already installed. */
export default function InstallAppPromo({ lang = 'en' }: InstallAppPromoProps) {
  const [visible, setVisible] = useState(false);
  const text = copy[lang] || copy.en;

  useEffect(() => {
    initPwaClient();
    const update = () => setVisible(shouldShowInstallButton());
    update();
    window.addEventListener('pwa-installable', update);
    window.addEventListener('pwa-installed', () => setVisible(false));
    return () => {
      window.removeEventListener('pwa-installable', update);
      window.removeEventListener('pwa-installed', () => setVisible(false));
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-40 border-t-2 border-slate-900 bg-blue-700 px-4 py-2.5 shadow-lg sm:right-4 sm:bottom-4 sm:left-auto sm:max-w-sm sm:rounded-2xl sm:border-2"
      role="region"
      aria-label="Install app"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-snug font-bold text-white sm:text-sm">
          {text}
        </p>
        <InstallAppButton lang={lang} variant="on-dark" />
      </div>
    </div>
  );
}
