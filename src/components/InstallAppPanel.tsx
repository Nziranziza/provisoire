import { useEffect, useState } from 'react';
import type { Lang } from '../lib/quiz';
import { initPwaClient, shouldShowInstallButton } from '../lib/pwa';
import InstallAppButton from './InstallAppButton';

const copy: Record<Lang, { badge: string; title: string; desc: string }> = {
  en: {
    badge: '📲 Phone & Laptop',
    title: 'Download the app',
    desc: 'Install Provisoire on your phone or computer. Open it from your home screen or desktop — practice offline after one visit.',
  },
  fr: {
    badge: '📲 Téléphone & ordinateur',
    title: 'Installer l’application',
    desc: 'Installez Provisoire sur votre téléphone ou votre ordinateur. Ouvrez depuis l’écran d’accueil — révisez hors-ligne après une visite.',
  },
  rw: {
    badge: '📲 Terefone & mudasobwa',
    title: 'Shyiramo porogaramu',
    desc: 'Shyiramo Provisoire kuri terefone cyangwa mudasobwa. Fungura uhereye kuri home screen — ukora offline nyuma yo kugera rimwe.',
  },
};

interface InstallAppPanelProps {
  lang?: Lang;
}

export default function InstallAppPanel({ lang = 'en' }: InstallAppPanelProps) {
  const [visible, setVisible] = useState(false);
  const t = copy[lang] || copy.en;

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
    <div className="rounded-2xl border-2 border-slate-900 bg-gradient-to-br from-blue-50 to-white p-5 shadow-xs sm:p-6">
      <span className="inline-flex rounded-full bg-blue-700 px-2.5 py-0.5 text-[11px] font-extrabold text-white uppercase">
        {t.badge}
      </span>
      <h3 className="mt-2 text-base font-extrabold text-slate-900 sm:text-lg">
        {t.title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
        {t.desc}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <InstallAppButton lang={lang} />
      </div>
    </div>
  );
}
