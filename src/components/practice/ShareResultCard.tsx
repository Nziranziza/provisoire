import { useState, useEffect, useRef } from 'react';
import type { Lang } from '../../lib/quiz';
import type { ResultCardData } from '../../lib/share-card';
import {
  drawResultCardCanvas,
  shareResultCard,
  downloadResultCardImage,
  copyResultToClipboard,
  getWhatsAppShareUrl,
} from '../../lib/share-card';

interface ShareResultCardProps {
  data: ResultCardData;
  locale: Lang;
}

const UI_COPY: Record<
  Lang,
  {
    shareHeading: string;
    shareSubtitle: string;
    shareBtn: string;
    whatsAppBtn: string;
    downloadBtn: string;
    copyImageBtn: string;
    copyLinkBtn: string;
    previewBtn: string;
    hidePreviewBtn: string;
    toastLinkCopied: string;
    toastImageCopied: string;
    toastDownloaded: string;
    sharePrompt: string;
  }
> = {
  rw: {
    shareHeading: 'Sangiza Amanota yawe mu Matsinda ya WhatsApp',
    shareSubtitle:
      'Abiga bafatanyije mu matsinda batsinda ikizamini vuba! Sangiza ifoto y’amanota yawe n’inshuti zawe.',
    shareBtn: '📤 Sangiza Ifoto y’Amanota',
    whatsAppBtn: '💬 Sangiza kuri WhatsApp',
    downloadBtn: '📥 Bika Ifoto (PNG)',
    copyImageBtn: '📋 Kopera Ifoto',
    copyLinkBtn: '🔗 Kopera Link',
    previewBtn: '👁️ Reba Ifoto yo Gusangiza',
    hidePreviewBtn: 'Hisha Ifoto',
    toastLinkCopied: '✓ Link yakopewe neza!',
    toastImageCopied: '✓ Ifoto yakopewe neza mu bubiko!',
    toastDownloaded: '✓ Ifoto y’amanota yabitswe neza!',
    sharePrompt: 'Kanda hano uhitemo uburyo usangizamo:',
  },
  en: {
    shareHeading: 'Share Your Score in WhatsApp Groups',
    shareSubtitle:
      'Learners who practice together in study groups pass faster! Share your official score card with friends.',
    shareBtn: '📤 Share Result Card',
    whatsAppBtn: '💬 Share to WhatsApp',
    downloadBtn: '📥 Download Card (PNG)',
    copyImageBtn: '📋 Copy Image',
    copyLinkBtn: '🔗 Copy Link',
    previewBtn: '👁️ Preview Card',
    hidePreviewBtn: 'Hide Preview',
    toastLinkCopied: '✓ Link copied to clipboard!',
    toastImageCopied: '✓ Result card image copied!',
    toastDownloaded: '✓ Result card image downloaded!',
    sharePrompt: 'Choose how to share your result:',
  },
  fr: {
    shareHeading: 'Partagez votre score sur WhatsApp',
    shareSubtitle:
      'Les apprenants qui révisent en groupe réussissent plus vite ! Partagez votre fiche de résultat avec vos amis.',
    shareBtn: '📤 Partager la fiche de score',
    whatsAppBtn: '💬 Partager sur WhatsApp',
    downloadBtn: '📥 Télécharger l’image (PNG)',
    copyImageBtn: '📋 Copier l’image',
    copyLinkBtn: '🔗 Copier le lien',
    previewBtn: '👁️ Voir l’aperçu de la fiche',
    hidePreviewBtn: 'Masquer l’aperçu',
    toastLinkCopied: '✓ Lien copié dans le presse-papiers !',
    toastImageCopied: '✓ Image de résultat copiée !',
    toastDownloaded: '✓ Image téléchargée avec succès !',
    sharePrompt: 'Choisissez comment partager votre résultat :',
  },
};

export default function ShareResultCard({
  data,
  locale,
}: ShareResultCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const t = UI_COPY[locale] || UI_COPY.rw;

  // Redraw canvas whenever data changes
  useEffect(() => {
    if (canvasRef.current) {
      drawResultCardCanvas(canvasRef.current, data);
    }
  }, [data, showPreview]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await shareResultCard(data);
      if (res.status === 'downloaded') {
        showToast(t.toastDownloaded);
      } else if (res.status === 'copied') {
        showToast(t.toastLinkCopied);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = () => {
    downloadResultCardImage(data);
    showToast(t.toastDownloaded);
  };

  const handleCopy = async () => {
    const res = await copyResultToClipboard(data);
    if (res === 'image') {
      showToast(t.toastImageCopied);
    } else {
      showToast(t.toastLinkCopied);
    }
  };

  const whatsAppUrl = getWhatsAppShareUrl(data);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 text-white shadow-md sm:p-7">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-emerald-300 uppercase">
              💬 WhatsApp Share Card
            </span>
          </div>
          <h2 className="mt-2 text-lg font-black tracking-tight text-white sm:text-xl">
            {t.shareHeading}
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
            {t.shareSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className="mt-1 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95 sm:mt-0"
        >
          {showPreview ? t.hidePreviewBtn : t.previewBtn}
        </button>
      </div>

      {/* Hidden or visible canvas for rendering */}
      <div
        className={`mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition-all ${
          showPreview ? 'block' : 'hidden'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="h-auto w-full max-w-full rounded-xl object-contain shadow-inner"
        />
      </div>

      {/* Main Action Buttons Grid */}
      <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Primary Web Share API button */}
        <button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className="flex min-h-[46px] flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-sm font-black text-slate-950 shadow-sm transition hover:from-emerald-400 hover:to-teal-400 active:scale-95 disabled:opacity-50"
        >
          <span>{t.shareBtn}</span>
        </button>

        {/* WhatsApp direct button */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[46px] cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-black text-slate-950 no-underline shadow-sm transition hover:bg-[#20bd5a] active:scale-95"
        >
          <span>{t.whatsAppBtn}</span>
        </a>

        {/* Download Card button */}
        <button
          type="button"
          onClick={handleDownload}
          className="flex min-h-[46px] cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-800/90 px-4 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-95 sm:text-sm"
        >
          <span>{t.downloadBtn}</span>
        </button>

        {/* Copy Image / Link button */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex min-h-[46px] cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-800/90 px-4 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-95 sm:text-sm"
        >
          <span>{t.copyImageBtn}</span>
        </button>
      </div>

      {/* Real-time Toast Feedback Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="animate-in fade-in slide-in-from-bottom-2 absolute right-4 bottom-4 z-20 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-2.5 text-xs font-bold text-emerald-200 shadow-xl backdrop-blur-md"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
