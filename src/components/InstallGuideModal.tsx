import { useState } from 'react';
import type { Lang } from '../lib/quiz';
import {
  getInstallGuide,
  type InstallGuideLang,
  promptInstall,
} from '../lib/pwa';

interface InstallGuideModalProps {
  lang: Lang;
  open: boolean;
  onClose: () => void;
}

export default function InstallGuideModal({
  lang,
  open,
  onClose,
}: InstallGuideModalProps) {
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!open) return null;

  const guide = getInstallGuide(lang as InstallGuideLang);

  const handleDirectInstall = async () => {
    setLoading(true);
    try {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        onClose();
      } else if (outcome === 'unavailable') {
        setShowFeedback(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-xs sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-guide-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="install-guide-title"
            className="text-lg font-extrabold text-slate-900"
          >
            {guide.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-slate-500 hover:bg-stone-200 hover:text-slate-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">
          {guide.subtitle}
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <h3 className="text-xs font-extrabold tracking-wide text-slate-800 uppercase">
              {guide.phoneTitle}
            </h3>
            <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-700 sm:text-sm">
              {guide.phoneSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <h3 className="text-xs font-extrabold tracking-wide text-slate-800 uppercase">
              {guide.laptopTitle}
            </h3>
            <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-700 sm:text-sm">
              {guide.laptopSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>

        {showFeedback && (
          <div className="mt-3 rounded-xl border-2 border-blue-600 bg-blue-50 p-3 text-xs text-blue-950">
            <p className="font-extrabold text-blue-900">
              👉 Browser Install Action:
            </p>
            <p className="mt-1 font-medium text-slate-700">
              In Chrome/Edge, click the <strong>Install icon (⊕ / 🖵)</strong> in
              your address bar above, or tap{' '}
              <strong>Menu (⋮) → &ldquo;Install app&rdquo;</strong>.
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleDirectInstall}
            className="flex min-h-[44px] flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800 active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? '⏳' : '📲'}</span>
            <span>
              {loading ? 'Opening Installer...' : 'Try Direct Install'}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-stone-100"
          >
            {guide.close}
          </button>
        </div>
      </div>
    </div>
  );
}
