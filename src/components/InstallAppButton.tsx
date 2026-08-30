import { useEffect, useState } from 'react';
import type { Lang } from '../lib/quiz';
import {
  initPwaClient,
  promptInstall,
  shouldShowInstallButton,
} from '../lib/pwa';

const labels: Record<Lang, string> = {
  en: 'Install App',
  fr: 'Installer l’app',
  rw: 'Shyiramo App',
};

interface InstallAppButtonProps {
  lang?: Lang;
  className?: string;
  variant?: 'default' | 'on-dark';
}

export default function InstallAppButton({
  lang = 'en',
  className = '',
  variant = 'default',
}: InstallAppButtonProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [installed, setInstalled] = useState(false);
  const label = labels[lang] || labels.en;

  useEffect(() => {
    initPwaClient();

    const updateVisibility = () => {
      setVisible(shouldShowInstallButton());
    };

    const handleInstalled = () => {
      setInstalled(true);
      setTimeout(() => setVisible(false), 2000);
    };

    updateVisibility();
    window.addEventListener('pwa-installable', updateVisibility);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', updateVisibility);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        setInstalled(true);
        setTimeout(() => setVisible(false), 2000);
      } else if (outcome === 'unavailable') {
        window.dispatchEvent(new CustomEvent('pwa-open-install-guide'));
      }
    } finally {
      setLoading(false);
    }
  };

  const buttonClass =
    variant === 'on-dark'
      ? 'inline-flex min-h-[40px] cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[11px] font-bold whitespace-nowrap text-blue-800 shadow-xs transition hover:bg-blue-50 active:scale-95 sm:min-h-[36px] sm:text-xs'
      : `inline-flex min-h-[40px] cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3.5 py-2 text-[11px] font-bold whitespace-nowrap text-slate-900 shadow-2xs transition hover:bg-stone-100 active:scale-95 sm:min-h-[36px] sm:text-xs ${className}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || installed}
      className={buttonClass}
      title={label}
      aria-label={label}
    >
      <span aria-hidden="true">{installed ? '✅' : loading ? '⏳' : '📲'}</span>
      <span>{installed ? 'Saved to Device' : label}</span>
    </button>
  );
}
