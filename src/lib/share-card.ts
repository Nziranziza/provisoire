import type { Lang } from './quiz';

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export interface ResultCardData {
  score: number;
  total: number;
  isPassed: boolean;
  rulesScore: number;
  rulesTotal: number;
  signsScore: number;
  signsTotal: number;
  timeSpent: number; // in seconds
  mode: 'practice' | 'mock_exam';
  locale: Lang;
}

const COPY: Record<
  Lang,
  {
    examMode: string;
    practiceMode: string;
    passedBadge: string;
    failedBadge: string;
    passRequirement: string;
    rulesLabel: string;
    signsLabel: string;
    timeLabel: string;
    footerCta: string;
    shareTextPassed: (score: number, total: number, pct: number) => string;
    shareTextFailed: (score: number, total: number, pct: number) => string;
  }
> = {
  rw: {
    examMode: '⏱️ IKIZAMINI CY’IKITEGERERZO',
    practiceMode: '💡 UBURYO BW’IMYITOZO',
    passedBadge: '✓ WATSINZE IKIZAMINI!',
    failedBadge: '✗ KOMEZA WIMENYEREZE',
    passRequirement: 'Amanota asabwa gutsinda: 12/20 (60%)',
    rulesLabel: '⚖️ Amategeko',
    signsLabel: '🛑 Ibyapa',
    timeLabel: '⏱️ Igihe',
    footerCta: 'Kwitegura no kwimenyereza ku buntu kuri: umuhanda.rw',
    shareTextPassed: (s, t, pct) =>
      `🎉 Natsinze ikizamini cy'ikitegererezo cy'uruhushya rw'agateganyo kuri Provisoire n'amanota ${s}/${t} (${pct}%)!\n\nWowe watsinda? Gerageza hano ku buntu:`,
    shareTextFailed: (s, t, pct) =>
      `📝 Nakoze imyitozo y'ikizamini cy'uruhushya rw'agateganyo kuri Provisoire: ${s}/${t} (${pct}%).\n\nKwimenyereza ibibazo 200+ by'amategeko n'ibyapa ku buntu:`,
  },
  en: {
    examMode: '⏱️ MOCK EXAM SIMULATION',
    practiceMode: '💡 PRACTICE MODE',
    passedBadge: '✓ PASSED — CONGRATULATIONS!',
    failedBadge: '✗ NEEDS MORE PRACTICE',
    passRequirement: 'Official passing score: 12/20 (60%)',
    rulesLabel: '⚖️ Traffic Rules',
    signsLabel: '🛑 Road Signs',
    timeLabel: '⏱️ Time Taken',
    footerCta: 'Free official driving test preparation at: umuhanda.rw',
    shareTextPassed: (s, t, pct) =>
      `🎉 I scored ${s}/${t} (${pct}%) on the Rwanda Provisional Driving Mock Exam on Provisoire!\n\nCan you beat my score? Try it free here:`,
    shareTextFailed: (s, t, pct) =>
      `📝 Practicing for the Rwanda provisional driving test on Provisoire: ${s}/${t} (${pct}%).\n\nPractice official questions and road signs free:`,
  },
  fr: {
    examMode: '⏱️ EXAMEN BLANC',
    practiceMode: '💡 MODE ENTRAÎNEMENT',
    passedBadge: '✓ TEST RÉUSSI — BRAVO !',
    failedBadge: '✗ EN COURS D’APPRENTISSAGE',
    passRequirement: 'Seuil officiel de réussite : 12/20 (60%)',
    rulesLabel: '⚖️ Code de la route',
    signsLabel: '🛑 Panneaux',
    timeLabel: '⏱️ Temps écoulé',
    footerCta: 'Entraînement officiel gratuit sur : umuhanda.rw',
    shareTextPassed: (s, t, pct) =>
      `🎉 J'ai réussi l'examen blanc du permis provisoire rwandais sur Provisoire avec ${s}/${t} (${pct}%) !\n\nTestez vos connaissances gratuitement :`,
    shareTextFailed: (s, t, pct) =>
      `📝 Entraînement au permis provisoire rwandais sur Provisoire : ${s}/${t} (${pct}%).\n\nRévisez gratuitement 200+ questions et panneaux :`,
  },
};

/**
 * Polyfill-safe rounded rectangle drawer for Canvas 2D context.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

/**
 * Renders the high-resolution 1200x675 result card onto a Canvas.
 */
export function drawResultCardCanvas(
  canvas: HTMLCanvasElement,
  data: ResultCardData,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 1200;
  const height = 675;
  canvas.width = width;
  canvas.height = height;

  const {
    score,
    total,
    isPassed,
    rulesScore,
    rulesTotal,
    signsScore,
    signsTotal,
    timeSpent,
    mode,
    locale,
  } = data;

  const c = COPY[locale] || COPY.rw;
  const pct = Math.round((score / Math.max(1, total)) * 100);
  const rulesPct = Math.round((rulesScore / Math.max(1, rulesTotal)) * 100);
  const signsPct = Math.round((signsScore / Math.max(1, signsTotal)) * 100);

  const FONT_FAMILY =
    "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif";

  // 1. Background Base Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#070b14');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#172554');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient Glows
  const topGlow = ctx.createRadialGradient(
    width * 0.85,
    height * 0.15,
    10,
    width * 0.85,
    height * 0.15,
    width * 0.5,
  );
  topGlow.addColorStop(
    0,
    isPassed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.22)',
  );
  topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, width, height);

  const bottomGlow = ctx.createRadialGradient(
    width * 0.15,
    height * 0.85,
    10,
    width * 0.15,
    height * 0.85,
    width * 0.45,
  );
  bottomGlow.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
  bottomGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. Subtle grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 60; x < width; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 60; y < height; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 4. Main Glassmorphism Card Frame
  const cardX = 40;
  const cardY = 35;
  const cardW = width - 80;
  const cardH = height - 70;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.beginPath();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.stroke();

  // 5. Top Rwandan Flag Bar Accent
  const flagGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
  flagGrad.addColorStop(0, '#0284c7');
  flagGrad.addColorStop(0.45, '#0284c7');
  flagGrad.addColorStop(0.5, '#f59e0b');
  flagGrad.addColorStop(0.55, '#f59e0b');
  flagGrad.addColorStop(0.6, '#10b981');
  flagGrad.addColorStop(1, '#10b981');

  ctx.save();
  ctx.fillStyle = flagGrad;
  ctx.beginPath();
  drawRoundedRect(ctx, cardX, cardY, cardW, 6, 3);
  ctx.fill();
  ctx.restore();

  // 6. Header: Brand on Left
  const hX = cardX + 35;
  const hY = cardY + 32;

  // P Logo Box
  const logoGrad = ctx.createLinearGradient(hX, hY, hX + 46, hY + 46);
  logoGrad.addColorStop(0, '#38bdf8');
  logoGrad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = logoGrad;
  ctx.beginPath();
  drawRoundedRect(ctx, hX, hY, 46, 46, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 28px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', hX + 23, hY + 24);

  // Logo Text
  ctx.textAlign = 'left';
  ctx.font = `900 26px ${FONT_FAMILY}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PROVISOIRE', hX + 58, hY + 23);
  const provWidth = ctx.measureText('PROVISOIRE').width;
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('.RW', hX + 58 + provWidth, hY + 23);

  // Header: Mode Badge on Right
  const modeText = mode === 'mock_exam' ? c.examMode : c.practiceMode;
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  const modeMetrics = ctx.measureText(modeText);
  const badgeW = modeMetrics.width + 36;
  const badgeH = 38;
  const badgeX = cardX + cardW - badgeW - 35;
  const badgeY = hY + 4;

  ctx.fillStyle =
    mode === 'mock_exam'
      ? 'rgba(239, 68, 68, 0.16)'
      : 'rgba(56, 189, 248, 0.16)';
  ctx.strokeStyle =
    mode === 'mock_exam' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 19);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = mode === 'mock_exam' ? '#fca5a5' : '#38bdf8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(modeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

  // 7. Passed / Failed Status Banner in Center
  const statusY = cardY + 105;
  const statusText = isPassed ? c.passedBadge : c.failedBadge;
  ctx.font = `900 24px ${FONT_FAMILY}`;
  const statusMetrics = ctx.measureText(statusText);
  const statusW = Math.max(statusMetrics.width + 50, 360);
  const statusH = 50;
  const statusX = (width - statusW) / 2;

  const statusGrad = ctx.createLinearGradient(
    statusX,
    statusY,
    statusX + statusW,
    statusY,
  );
  if (isPassed) {
    statusGrad.addColorStop(0, '#059669');
    statusGrad.addColorStop(1, '#10b981');
  } else {
    statusGrad.addColorStop(0, '#e11d48');
    statusGrad.addColorStop(1, '#f43f5e');
  }

  ctx.save();
  ctx.shadowColor = isPassed
    ? 'rgba(16, 185, 129, 0.4)'
    : 'rgba(244, 63, 94, 0.4)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = statusGrad;
  ctx.beginPath();
  drawRoundedRect(ctx, statusX, statusY, statusW, statusH, 25);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(statusText, statusX + statusW / 2, statusY + statusH / 2 + 1);

  // 8. Big Score Display
  const scoreY = statusY + 115;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Big Score Numbers
  ctx.font = `900 84px ${FONT_FAMILY}`;
  ctx.fillStyle = '#ffffff';
  const scoreStr = `${score}`;
  const totalStr = ` / ${total}`;

  ctx.font = `900 84px ${FONT_FAMILY}`;
  const sWidth = ctx.measureText(scoreStr).width;
  ctx.font = `bold 42px ${FONT_FAMILY}`;
  const tWidth = ctx.measureText(totalStr).width;
  const totalScoreBlockWidth = sWidth + tWidth + 120; // plus percent badge

  const scoreStartX = (width - totalScoreBlockWidth) / 2;

  // Draw Score
  ctx.font = `900 84px ${FONT_FAMILY}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(scoreStr, scoreStartX, scoreY);

  // Draw / total
  ctx.font = `bold 44px ${FONT_FAMILY}`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(totalStr, scoreStartX + sWidth, scoreY + 4);

  // Draw Percentage Badge
  const pctBadgeX = scoreStartX + sWidth + tWidth + 24;
  const pctBadgeY = scoreY - 26;
  const pctText = `${pct}%`;
  ctx.font = `bold 22px ${FONT_FAMILY}`;
  const pctW = ctx.measureText(pctText).width + 24;
  const pctH = 44;

  ctx.fillStyle = isPassed
    ? 'rgba(16, 185, 129, 0.2)'
    : 'rgba(244, 63, 94, 0.2)';
  ctx.strokeStyle = isPassed
    ? 'rgba(16, 185, 129, 0.5)'
    : 'rgba(244, 63, 94, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, pctBadgeX, pctBadgeY, pctW, pctH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isPassed ? '#34d399' : '#fb7185';
  ctx.textAlign = 'center';
  ctx.fillText(pctText, pctBadgeX + pctW / 2, pctBadgeY + pctH / 2 + 1);

  // Pass requirement note
  ctx.font = `500 15px ${FONT_FAMILY}`;
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText(c.passRequirement, width / 2, scoreY + 54);

  // 9. Three Category Breakdown Cards Side-by-Side
  const statsY = scoreY + 95;
  const statsGap = 20;
  const statsCardW = (cardW - 70 - statsGap * 2) / 3;
  const statsCardH = 110;

  const renderStatCard = (
    x: number,
    title: string,
    valStr: string,
    subStr: string,
    color: string,
    barPct: number,
  ) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    drawRoundedRect(ctx, x, statsY, statsCardW, statsCardH, 16);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 20, statsY + 28);

    // Value
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 24px ${FONT_FAMILY}`;
    ctx.fillText(valStr, x + 20, statsY + 62);

    // Subtext
    ctx.fillStyle = color;
    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText(subStr, x + statsCardW - 20, statsY + 62);

    // Progress Bar Track
    const barX = x + 20;
    const barY = statsY + 82;
    const barW = statsCardW - 40;
    const barH = 6;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    drawRoundedRect(ctx, barX, barY, barW, barH, 3);
    ctx.fill();

    // Progress Bar Fill
    const fillW = Math.max(6, Math.min(barW, (barW * barPct) / 100));
    ctx.fillStyle = color;
    ctx.beginPath();
    drawRoundedRect(ctx, barX, barY, fillW, barH, 3);
    ctx.fill();
  };

  const stat1X = cardX + 35;
  const stat2X = stat1X + statsCardW + statsGap;
  const stat3X = stat2X + statsCardW + statsGap;

  renderStatCard(
    stat1X,
    c.rulesLabel,
    `${rulesScore} / ${rulesTotal}`,
    `${rulesPct}%`,
    rulesPct >= 60 ? '#34d399' : '#fbbf24',
    rulesPct,
  );
  renderStatCard(
    stat2X,
    c.signsLabel,
    `${signsScore} / ${signsTotal}`,
    `${signsPct}%`,
    signsPct >= 60 ? '#38bdf8' : '#fbbf24',
    signsPct,
  );
  renderStatCard(
    stat3X,
    c.timeLabel,
    formatTime(timeSpent),
    '20 min max',
    '#cbd5e1',
    Math.min(100, (timeSpent / 1200) * 100),
  );

  // 10. Bottom Footer CTA / Ad Banner
  const footerY = cardY + cardH - 35;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 35, footerY - 18);
  ctx.lineTo(cardX + cardW - 35, footerY - 18);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 16px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.footerCta, cardX + 35, footerY + 4);

  // Official badge on bottom right
  ctx.fillStyle = '#38bdf8';
  ctx.font = `bold 15px ${FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText(
    '🇷🇼 Rwanda #1 Driving Test Bank',
    cardX + cardW - 35,
    footerY + 4,
  );
}

/**
 * Generates an image Blob from ResultCardData.
 */
export async function generateResultCardBlob(
  data: ResultCardData,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  drawResultCardCanvas(canvas, data);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/png',
      0.95,
    );
  });
}

/**
 * Generates a data URL for real-time preview in the browser.
 */
export function generateResultCardDataUrl(data: ResultCardData): string {
  const canvas = document.createElement('canvas');
  drawResultCardCanvas(canvas, data);
  return canvas.toDataURL('image/png', 0.92);
}

/**
 * Builds the viral shareable text for WhatsApp / Social.
 */
export function getShareMessage(data: ResultCardData): string {
  const c = COPY[data.locale] || COPY.rw;
  const pct = Math.round((data.score / Math.max(1, data.total)) * 100);
  const builder = data.isPassed ? c.shareTextPassed : c.shareTextFailed;
  const prefix = builder(data.score, data.total, pct);
  const examUrl = `https://umuhanda.rw/${data.locale}/exam`;
  return `${prefix}\n${examUrl}`;
}

/**
 * Returns direct WhatsApp share URL with pre-filled viral text and link.
 */
export function getWhatsAppShareUrl(data: ResultCardData): string {
  const text = getShareMessage(data);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Primary Web Share API handler with fallbacks.
 */
export async function shareResultCard(
  data: ResultCardData,
  cachedBlob?: Blob | null,
): Promise<{
  status: 'shared' | 'downloaded' | 'copied' | 'error';
  message?: string;
}> {
  if (typeof window === 'undefined') {
    return { status: 'error', message: 'Window is not defined' };
  }

  const shareText = getShareMessage(data);
  const shareTitle = `Provisoire.rw Result: ${data.score}/${data.total}`;
  const shareUrl = `https://umuhanda.rw/${data.locale}/exam`;

  try {
    const blob = cachedBlob || (await generateResultCardBlob(data));
    const fileName = `provisoire-result-${data.score}outOf${data.total}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    // 1. Try Native Web Share API with image file
    if (
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
        return { status: 'shared' };
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return { status: 'shared' }; // user closed the share dialog
        }
        // If file sharing rejected by platform, fall through to text share / download
      }
    }

    // 2. Try Native Web Share API with text & URL only
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return { status: 'shared' };
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return { status: 'shared' };
        }
      }
    }

    // 3. Fallback: Trigger instant download of the image file
    downloadResultCardImage(data, blob);

    // 4. Also copy text link to clipboard (best-effort; rejection does not fail download)
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }

    return { status: 'downloaded' };
  } catch (err) {
    return {
      status: 'error',
      message: (err as Error)?.message || 'Failed to share result card',
    };
  }
}

/**
 * Downloads the card as a PNG image file.
 */
export function downloadResultCardImage(
  data: ResultCardData,
  cachedBlob?: Blob | null,
): void {
  const fileName = `provisoire-result-${data.score}outOf${data.total}.png`;
  const a = document.createElement('a');
  a.download = fileName;

  if (cachedBlob) {
    const url = URL.createObjectURL(cachedBlob);
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    const dataUrl = generateResultCardDataUrl(data);
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Copies the image directly to clipboard if supported, else copies the text link.
 */
export async function copyResultToClipboard(
  data: ResultCardData,
  cachedBlob?: Blob | null,
): Promise<'image' | 'text' | 'failure'> {
  try {
    const blob = cachedBlob || (await generateResultCardBlob(data));
    if (
      typeof ClipboardItem !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.write === 'function'
    ) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return 'image';
    }
  } catch {
    // ignore and fallback to text
  }

  const text = getShareMessage(data);
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return 'text';
    } catch {
      return 'failure';
    }
  }
  return 'failure';
}
