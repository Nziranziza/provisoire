import { useEffect, useState } from 'react';
import type { Lang, Question } from '../lib/quiz';
import questionBank from '../../questions.json';
import {
  checkImagePackStatus,
  downloadImagePack,
  clearImagePack,
} from '../lib/pwa';

interface OfflinePackManagerProps {
  lang?: Lang;
}

const copy = {
  en: {
    cardTitle: 'Offline Learning Pack',
    cardDesc:
      'The entire question bank is ready offline. Download road sign images to study with zero mobile data usage.',
    textReady: 'Question Bank & Tests',
    textReadyBadge: '✓ Ready Offline',
    imagesStatus: 'Road Sign Images',
    downloadBtn: '📥 Download 105 Road Signs for Offline Study (~15 MB)',
    downloading: 'Downloading road signs...',
    allSaved: '✓ All 105 Road Signs Saved for Offline Study',
    freeSpace: 'Clear image pack to free space',
    confirmClear: 'Are you sure you want to remove offline images?',
  },
  fr: {
    cardTitle: 'Pack d’Étude Hors-Ligne',
    cardDesc:
      'Toutes les questions sont disponibles hors-ligne. Téléchargez les panneaux pour réviser sans consommer de données.',
    textReady: 'Banque de questions & Examens',
    textReadyBadge: '✓ Prêt hors-ligne',
    imagesStatus: 'Images des panneaux',
    downloadBtn:
      '📥 Télécharger les 105 panneaux pour révision hors-ligne (~15 Mo)',
    downloading: 'Téléchargement des panneaux...',
    allSaved: '✓ 105 panneaux enregistrés pour révision hors-ligne',
    freeSpace: 'Supprimer les images pour libérer de l’espace',
    confirmClear: 'Voulez-vous vraiment supprimer les images hors-ligne ?',
  },
  rw: {
    cardTitle: 'Ibyo Kwigiraho Bidasaba Interineti',
    cardDesc:
      'Ibibazo byose biboneka nta interineti. Manura amafoto y’ibyapa wige udahenzwe na interineti.',
    textReady: 'Ibibazo byose n’ibizamini',
    textReadyBadge: '✓ Biriteguye',
    imagesStatus: 'Amafoto y’ibyapa',
    downloadBtn: '📥 Manura amafoto 105 y’ibyapa wige nta interineti (~15 MB)',
    downloading: 'Turimo kumanura ibyapa...',
    allSaved: '✓ Amafoto yose 105 yabitswe neza kuri terefone',
    freeSpace: 'Siba amafoto ngo ufungure umwanya',
    confirmClear: 'Uremeza ko ushaka gusiba amafoto yabitswe?',
  },
};

export default function OfflinePackManager({
  lang = 'en',
}: OfflinePackManagerProps) {
  const [cachedCount, setCachedCount] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadedCount, setDownloadedCount] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const t = copy[lang] || copy.en;

  // Extract all unique image URLs from questions
  const allImages = Array.from(
    new Set(
      ((questionBank.questions || []) as Question[])
        .map((q) => q.image_url)
        .filter((url): url is string => Boolean(url)),
    ),
  );

  const totalImages = allImages.length;
  const isComplete = cachedCount >= totalImages && totalImages > 0;

  useEffect(() => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      setIsSupported(false);
      return;
    }

    let isMounted = true;
    checkImagePackStatus(allImages).then((res) => {
      if (isMounted) {
        setCachedCount(res.cachedCount);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownload = async () => {
    if (isDownloading || isComplete) return;
    setIsDownloading(true);
    setProgressPercent(0);
    setDownloadedCount(0);

    const success = await downloadImagePack(
      allImages,
      (percent, downloaded) => {
        setProgressPercent(percent);
        setDownloadedCount(downloaded);
      },
    );

    if (success) {
      setCachedCount(totalImages);
    }
    setIsDownloading(false);
  };

  const handleClear = async () => {
    if (window.confirm(t.confirmClear)) {
      await clearImagePack();
      setCachedCount(0);
      setProgressPercent(0);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">📦</span>
          <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase sm:text-sm">
            {t.cardTitle}
          </h3>
        </div>
        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
          {t.textReadyBadge}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
        {t.cardDesc}
      </p>

      {/* Status items */}
      <div className="mt-3.5 space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700">
          <span>{t.textReady}</span>
          <span className="text-emerald-700">100% Offline</span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700">
          <span>{t.imagesStatus}</span>
          <span
            className={
              isComplete
                ? 'font-bold text-emerald-700'
                : 'font-medium text-slate-500'
            }
          >
            {cachedCount} / {totalImages}
          </span>
        </div>
      </div>

      {/* Progress bar during download */}
      {isDownloading && (
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-blue-900">
            <span>{t.downloading}</span>
            <span>
              {downloadedCount} / {totalImages} ({progressPercent}%)
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        {!isComplete ? (
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex min-h-[40px] flex-1 cursor-pointer touch-manipulation items-center justify-center rounded-full bg-blue-700 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-blue-800 active:scale-95 disabled:opacity-50"
          >
            {isDownloading
              ? `${t.downloading} (${progressPercent}%)`
              : t.downloadBtn}
          </button>
        ) : (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <span>{t.allSaved}</span>
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-semibold text-slate-400 underline-offset-2 hover:text-rose-600 hover:underline"
            >
              {t.freeSpace}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
