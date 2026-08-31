import { useEffect, useState } from 'react';
import type { Lang } from '../lib/quiz';
import {
  initPwaClient,
  canInstall,
  promptInstall,
  dismissInstallPrompt,
  isInstallPromptDismissed,
  isStandalone,
  shouldShowInstallButton,
} from '../lib/pwa';

interface InstallAppPromptProps {
  lang?: Lang;
  onInstalled?: () => void;
}

const copy = {
  en: {
    badge: '📱 Phone & Laptop',
    title: 'Install on your phone or laptop',
    desc: 'Download Provisoire to practice offline anywhere — open from your home screen or desktop app.',
    installBtn: 'Install App',
    notNowBtn: 'Not now',
  },
  fr: {
    badge: '📱 Application Hors-Ligne',
    title: 'Installer Provisoire sur votre téléphone',
    desc: 'Révisez votre permis partout sans connexion et sans frais de données. S’installe directement depuis votre navigateur.',
    installBtn: 'Installer l’application',
    notNowBtn: 'Plus tard',
  },
  rw: {
    badge: '📱 Porogaramu ya Terefone',
    title: 'Shyira Provisoire kuri terefone yawe',
    desc: 'Itoze ibibazo by’agateganyo aho waba uri hose udahenzwe na interineti. Yishyire muri terefone ako kanya.',
    installBtn: 'Yishyire muri terefone',
    notNowBtn: 'Nyuma',
  },
};

export default function InstallAppPrompt({
  lang = 'en',
  onInstalled,
}: InstallAppPromptProps) {
  const [installable, setInstallable] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  const t = copy[lang] || copy.en;

  useEffect(() => {
    initPwaClient();

    if (isStandalone() || isInstallPromptDismissed()) {
      return;
    }

    setInstallable(canInstall() || shouldShowInstallButton());

    const handleInstallable = () => {
      if (!isStandalone() && !isInstallPromptDismissed()) {
        setInstallable(canInstall() || shouldShowInstallButton());
      }
    };

    const handleInstalled = () => {
      setInstallable(false);
      if (onInstalled) onInstalled();
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, [onInstalled]);

  if (!installable || dismissed) return null;

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstallable(false);
      window.dispatchEvent(new CustomEvent('pwa-installed'));
      if (onInstalled) onInstalled();
    } else if (outcome === 'unavailable') {
      window.dispatchEvent(new CustomEvent('pwa-install-instruction'));
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    dismissInstallPrompt();
  };

  return (
    <div className="rounded-2xl border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50/80 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <span className="inline-flex items-center rounded-full bg-blue-700 px-2.5 py-0.5 text-[11px] font-extrabold text-white uppercase">
            {t.badge}
          </span>
          <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
            {t.title}
          </h3>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
            {t.desc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex min-h-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full bg-blue-700 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 active:scale-95 sm:text-sm"
          >
            {t.installBtn}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex min-h-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full border border-stone-300 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-stone-100 active:scale-95 sm:text-sm"
          >
            {t.notNowBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
