import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const outDir = resolve('public/og');
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FONT_FAMILY =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Helvetica, sans-serif";

function generateSvg({
  badge,
  badgeColor = '#38bdf8',
  badgeBg = 'rgba(56, 189, 248, 0.15)',
  badgeBorder = 'rgba(56, 189, 248, 0.35)',
  title,
  subtitle,
  tags = [],
  footerText = 'Rwanda Provisional Driving Test Prep',
  freeBadgeText = '100% KU BUNTU',
}) {
  const titleLines = Array.isArray(title) ? title : [title];
  const titleSvg = titleLines
    .map((line, i) => {
      const y = 230 + i * 56;
      return `<text x="75" y="${y}" font-family="${FONT_FAMILY}" font-size="44" font-weight="bold" fill="#ffffff" letter-spacing="-0.5px">${escapeXml(line)}</text>`;
    })
    .join('\n');

  const subtitleY = 230 + titleLines.length * 56 + 18;
  const tagsY = subtitleY + 46;

  const tagsSvg = tags
    .map((tag, i) => {
      const xOffset = 75 + i * 235;
      return `
      <g transform="translate(${xOffset}, ${tagsY})">
        <rect width="215" height="42" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
        <text x="107" y="26" font-family="${FONT_FAMILY}" font-size="16" font-weight="600" fill="#e2e8f0" text-anchor="middle">${escapeXml(tag)}</text>
      </g>`;
    })
    .join('\n');

  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b14" />
      <stop offset="60%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#172554" />
    </linearGradient>

    <!-- Ambient Glows -->
    <radialGradient id="glowTopRight" cx="85%" cy="15%" r="55%">
      <stop offset="0%" stop-color="${badgeColor}" stop-opacity="0.32" />
      <stop offset="100%" stop-color="${badgeColor}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowBottomLeft" cx="15%" cy="85%" r="50%">
      <stop offset="0%" stop-color="#059669" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#059669" stop-opacity="0" />
    </radialGradient>

    <!-- Rwandan flag subtle accent line -->
    <linearGradient id="rwandaLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="45%" stop-color="#0284c7" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="55%" stop-color="#f59e0b" />
      <stop offset="60%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>

    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="url(#bgGradient)" />
  <rect width="1200" height="630" fill="url(#glowTopRight)" />
  <rect width="1200" height="630" fill="url(#glowBottomLeft)" />

  <!-- Grid lines -->
  <g opacity="0.04" stroke="#ffffff" stroke-width="1">
    <line x1="75" y1="0" x2="75" y2="630" />
    <line x1="320" y1="0" x2="320" y2="630" />
    <line x1="600" y1="0" x2="600" y2="630" />
    <line x1="880" y1="0" x2="880" y2="630" />
    <line x1="1125" y1="0" x2="1125" y2="630" />
    <line x1="0" y1="110" x2="1200" y2="110" />
    <line x1="0" y1="315" x2="1200" y2="315" />
    <line x1="0" y1="520" x2="1200" y2="520" />
  </g>

  <!-- Main Card Container -->
  <rect x="40" y="40" width="1120" height="550" rx="20" fill="rgba(15, 23, 42, 0.72)" stroke="rgba(255, 255, 255, 0.14)" stroke-width="1.5" />

  <!-- Top Rwandan Flag Bar -->
  <rect x="40" y="40" width="1120" height="6" rx="3" fill="url(#rwandaLine)" />

  <!-- Brand Header -->
  <g transform="translate(75, 75)">
    <!-- Logo Icon -->
    <rect width="48" height="48" rx="12" fill="url(#logoGrad)" />
    <text x="24" y="34" font-family="${FONT_FAMILY}" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">P</text>

    <!-- Brand Name -->
    <text x="64" y="34" font-family="${FONT_FAMILY}" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="-0.5px">PROVISOIRE<tspan fill="#38bdf8">.RW</tspan></text>
  </g>

  <!-- Top Right Category Badge -->
  <g transform="translate(750, 78)">
    <rect width="375" height="42" rx="21" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="1.5" />
    <text x="187" y="26" font-family="${FONT_FAMILY}" font-size="14" font-weight="bold" fill="${badgeColor}" text-anchor="middle" letter-spacing="0.5px">${escapeXml(badge)}</text>
  </g>

  <!-- Title Lines -->
  ${titleSvg}

  <!-- Subtitle -->
  ${
    subtitle
      ? `<text x="75" y="${subtitleY}" font-family="${FONT_FAMILY}" font-size="21" font-weight="500" fill="#94a3b8">${escapeXml(subtitle)}</text>`
      : ''
  }

  <!-- Feature Chips / Tags -->
  ${tagsSvg}

  <!-- Bottom Bar Divider -->
  <line x1="75" y1="520" x2="1125" y2="520" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />

  <!-- Bottom Left: Official URL Badge -->
  <g transform="translate(75, 542)">
    <text x="0" y="18" font-family="${FONT_FAMILY}" font-size="19" font-weight="bold" fill="#38bdf8">umuhanda.rw</text>
    <text x="145" y="18" font-family="${FONT_FAMILY}" font-size="16" font-weight="500" fill="#64748b">• ${escapeXml(footerText)}</text>
  </g>

  <!-- Bottom Right: Free Badge -->
  <g transform="translate(985, 534)">
    <rect width="140" height="34" rx="8" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.35)" stroke-width="1" />
    <text x="70" y="22" font-family="${FONT_FAMILY}" font-size="13" font-weight="bold" fill="#34d399" text-anchor="middle">${escapeXml(freeBadgeText)}</text>
  </g>
</svg>
`;
}

export const OG_IMAGE_DEFINITIONS = [
  // 1. Home Pages & Default Fallback
  {
    fileName: 'og-default.png',
    badge: 'IKIZAMINI CY’AGATEGANYO',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ["Kwitegura Ikizamini cy'Uruhushya", "rw'Agateganyo mu Rwanda"],
    subtitle:
      "Ibibazo 200+ by'amategeko n'ibyapa, ibisobanuro n'ibizamini by'ikitegererezo.",
    tags: ['✓ 200+ Ibibazo', '✓ Iminota 20 Exam', '✓ Offline Ready'],
    footerText: 'Rwanda Driving Test Preparation',
    freeBadgeText: '100% KU BUNTU',
  },
  {
    fileName: 'og-rw-home.png',
    badge: 'IKIZAMINI CY’AGATEGANYO',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ["Kwitegura Ikizamini cy'Uruhushya", "rw'Agateganyo mu Rwanda"],
    subtitle:
      "Ibibazo 200+ by'amategeko n'ibyapa, ibisobanuro n'ibizamini by'ikitegererezo.",
    tags: ['✓ 200+ Ibibazo', '✓ Iminota 20 Exam', '✓ Offline Ready'],
    footerText: "Kwitegura Uruhushya rw'Agateganyo",
    freeBadgeText: '100% KU BUNTU',
  },
  {
    fileName: 'og-en-home.png',
    badge: 'PROVISIONAL DRIVING TEST',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ['Rwanda Provisional Driving Test', 'Preparation & Question Bank'],
    subtitle:
      'Pass your Rwanda provisional test with official quizzes, road signs, and timed mock exams.',
    tags: ['✓ 200+ Questions', '✓ Timed Mock Exam', '✓ 100% Free & Offline'],
    footerText: 'Rwanda Driving License Preparation',
    freeBadgeText: '100% FREE',
  },
  {
    fileName: 'og-fr-home.png',
    badge: 'PERMIS PROVISOIRE RWANDA',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ['Préparation à l’Examen du', 'Permis Provisoire au Rwanda'],
    subtitle:
      'Révisez avec la banque de questions officielles, panneaux routiers et examens blancs.',
    tags: ['✓ 200+ Questions', '✓ Examens Blancs', '✓ 100% Gratuit'],
    footerText: 'Préparation Permis de Conduire',
    freeBadgeText: '100% GRATUIT',
  },

  // 2. Traffic Rules Hubs
  {
    fileName: 'og-rw-traffic-rules.png',
    badge: 'AMATEGEKO Y’UMUHANDA',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    badgeBorder: 'rgba(251, 191, 36, 0.35)',
    title: ["Amategeko y'Umuhanda mu Rwanda", "Ibibazo n'Ibisobanuro Byose"],
    subtitle:
      "Ibibazo by'amategeko yo kugendera mu muhanda, gutambuka no kunyuranaho.",
    tags: [
      "✓ Amategeko y'Umuhanda",
      '✓ Ibisobanuro Byuzuye',
      '✓ Ibibazo byose',
    ],
    footerText: "Amategeko y'Umuhanda mu Rwanda",
    freeBadgeText: '100% KU BUNTU',
  },
  {
    fileName: 'og-en-traffic-rules.png',
    badge: 'TRAFFIC RULES',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    badgeBorder: 'rgba(251, 191, 36, 0.35)',
    title: ['Rwanda Traffic Rules — Practice', 'Questions & Road Regulations'],
    subtitle:
      'Official road rules, right of way, speed limits, overtaking and intersection rules.',
    tags: [
      '✓ Traffic Regulations',
      '✓ Instant Feedback',
      '✓ Full Explanations',
    ],
    footerText: 'Rwanda Traffic Rules & Regulations',
    freeBadgeText: '100% FREE',
  },
  {
    fileName: 'og-fr-traffic-rules.png',
    badge: 'CODE DE LA ROUTE',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    badgeBorder: 'rgba(251, 191, 36, 0.35)',
    title: ['Code de la Route au Rwanda —', 'Questions et Règles Officielles'],
    subtitle:
      'Questions du code de la route, priorités de passage, limitations de vitesse et carrefours.',
    tags: ['✓ Code de la Route', '✓ Règles Officielles', '✓ Réponses & Notes'],
    footerText: 'Code de la Route du Rwanda',
    freeBadgeText: '100% GRATUIT',
  },

  // 3. Road Signs Hubs & Glossaries
  {
    fileName: 'og-rw-road-signs.png',
    badge: 'IBYAPA BYO MU MUHANDA',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ['Ibyapa byo mu Muhanda mu Rwanda', "Amafoto n'Ibisobanuro Byose"],
    subtitle:
      "Ibyapa by'integuza, ibyo kubuza, ibyo gutegeka n'ibimenyetso byo mu muhanda.",
    tags: ['✓ Integuza & Kubuza', '✓ Gutegeka & Amakuru', '✓ Amafoto Asukuye'],
    footerText: 'Ibyapa byo mu Muhanda mu Rwanda',
    freeBadgeText: '100% KU BUNTU',
  },
  {
    fileName: 'og-en-road-signs.png',
    badge: 'ROAD SIGNS',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ['Rwanda Road Signs — Diagrams,', 'Meanings & Driver Actions'],
    subtitle:
      'Complete guide to warning, prohibitory, mandatory, and information road signs in Rwanda.',
    tags: ['✓ High-Res Diagrams', '✓ Driver Actions', '✓ Official Meanings'],
    footerText: 'Rwanda Road Signs Catalog',
    freeBadgeText: '100% FREE',
  },
  {
    fileName: 'og-fr-road-signs.png',
    badge: 'PANNEAUX ROUTIERS',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ['Panneaux Routiers du Rwanda —', 'Illustrations et Significations'],
    subtitle:
      'Signaux de danger, interdiction, obligation et indication routière avec conduite à tenir.',
    tags: [
      '✓ Panneaux Illustrés',
      '✓ Significations Claires',
      '✓ Permis Provisoire',
    ],
    footerText: 'Panneaux de Signalisation au Rwanda',
    freeBadgeText: '100% GRATUIT',
  },
  {
    fileName: 'og-rw-signs.png',
    badge: 'INCAMAKE Y’IBYAPA',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ["Incamake n'Ibisobanuro by'Ibyapa", 'byo mu Muhanda mu Rwanda'],
    subtitle:
      "Shakisha ibyapa byose n'icyo umushoferi agomba gukora iyo abibonye mu muhanda.",
    tags: ['✓ Ibyapa Byose', '✓ Icyo Umushoferi Akora', '✓ Ibisobanuro'],
    footerText: "Incamake y'Ibyapa byo mu Rwanda",
    freeBadgeText: '100% KU BUNTU',
  },
  {
    fileName: 'og-en-signs.png',
    badge: 'SIGNS GLOSSARY',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: [
      'Rwanda Road Signs Glossary —',
      'Official Meanings & Driver Actions',
    ],
    subtitle:
      'Browse all Rwanda road signs with official definitions and required driver responses.',
    tags: [
      '✓ Searchable Glossary',
      '✓ Action Guidance',
      '✓ Practice Questions',
    ],
    footerText: 'Rwanda Road Signs Glossary',
    freeBadgeText: '100% FREE',
  },
  {
    fileName: 'og-fr-signs.png',
    badge: 'GLOSSAIRE DES PANNEAUX',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ['Glossaire des Panneaux Routiers —', 'Significations au Rwanda'],
    subtitle:
      'Parcourez l’ensemble des panneaux de signalisation du Rwanda et les comportements attendus.',
    tags: ['✓ Glossaire Complet', '✓ Conduite à Tenir', '✓ Permis Provisoire'],
    footerText: 'Glossaire des Panneaux Routiers',
    freeBadgeText: '100% GRATUIT',
  },

  // 4. Question Bank Hubs
  {
    fileName: 'og-rw-questions.png',
    badge: 'UBUBIKO BW’IBIBAZO',
    badgeColor: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    title: ["Ububiko bw'Ibibazo byose", "by'Ikizamini cy'Agateganyo"],
    subtitle:
      "Ibibazo 200+ by'ikizamini cy'uruhushya rw'agateganyo mu Rwanda n'ibisubizo by'ukuri.",
    tags: ['✓ Ibibazo 200+', '✓ Ibisobanuro Byose', '✓ Gushakisha Ako Kanya'],
    footerText: "Ububiko bw'Ibibazo by'Ikizamini",
    freeBadgeText: '100% KU BUNTU',
  },
  {
    fileName: 'og-en-questions.png',
    badge: 'QUESTION BANK',
    badgeColor: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    title: ['Official Rwanda Provisional', 'Driving Test Question Bank'],
    subtitle:
      'Practice all 200+ official driving test questions with verified correct answers.',
    tags: ['✓ 200+ Questions', '✓ Instant Answers', '✓ Category Breakdown'],
    footerText: 'Provisional Driving Test Question Bank',
    freeBadgeText: '100% FREE',
  },
  {
    fileName: 'og-fr-questions.png',
    badge: 'BANQUE DE QUESTIONS',
    badgeColor: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    title: ['Banque de Questions Officielles', 'du Permis Provisoire Rwandais'],
    subtitle:
      'Entraînez-vous avec 200+ questions et réponses du permis provisoire rwandais.',
    tags: [
      '✓ 200+ Questions',
      '✓ Réponses Officielles',
      '✓ Filtre par Catégorie',
    ],
    footerText: 'Banque de Questions Permis Provisoire',
    freeBadgeText: '100% GRATUIT',
  },

  // 5. Practice Mode
  {
    fileName: 'og-rw-practice.png',
    badge: 'UBURYO BW’IMYITOZO',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    title: ["Uburyo bw'Imyitozo y'Ibibazo —", 'Ibisubizo Ako Kanya'],
    subtitle:
      "Ibibazo 20 byo kwimenyereza: guhita ubona igisubizo cy'ukuri n'ibisobanuro birambuye.",
    tags: [
      '✓ Ibisubizo Ako Kanya',
      '✓ Ibisobanuro Byuzuye',
      '✓ Nta Gitutu cy’Igihe',
    ],
    footerText: "Imyitozo y'Uruhushya rw'Agateganyo",
    freeBadgeText: '100% KU BUNTU',
  },
  {
    fileName: 'og-en-practice.png',
    badge: 'PRACTICE MODE',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    title: ['Interactive Practice Mode —', 'Instant Feedback & Explanations'],
    subtitle:
      'Practice 20 randomized questions with immediate answer reveals and legal notes.',
    tags: [
      '✓ Instant Feedback',
      '✓ Detailed Explanations',
      '✓ Untimed & Relaxed',
    ],
    footerText: 'Interactive Practice Mode',
    freeBadgeText: '100% FREE',
  },
  {
    fileName: 'og-fr-practice.png',
    badge: 'MODE ENTRAÎNEMENT',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    title: ['Mode Entraînement Interactif —', 'Correction Immédiate & Notes'],
    subtitle:
      '20 questions aléatoires avec correction instantanée et explications détaillées.',
    tags: [
      '✓ Correction Immédiate',
      '✓ Explications Claires',
      '✓ Sans Limite de Temps',
    ],
    footerText: 'Entraînement Permis Provisoire',
    freeBadgeText: '100% GRATUIT',
  },

  // 6. Mock Exam
  {
    fileName: 'og-rw-exam.png',
    badge: 'IKIZAMINI CY’IKITEGEREREZO',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: 'rgba(239, 68, 68, 0.35)',
    title: [
      "Ikizamini cy'Ikitegererezo cy'Iminota 20",
      'Amanota 12/20 yo Gutsinda',
    ],
    subtitle:
      "Ibibazo 20 by'ikizamini, iminota 20, amanota yo gutsinda 12/20. Reba niba watsinda!",
    tags: ['⏱️ Iminota 20', '📝 Ibibazo 20', '🎯 12/20 Gutsinda'],
    footerText: "Ikizamini cy'Ikitegererezo Provisoire",
    freeBadgeText: '100% KU BUNTU',
  },
  {
    fileName: 'og-en-exam.png',
    badge: 'MOCK EXAM SIMULATOR',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: 'rgba(239, 68, 68, 0.35)',
    title: [
      'Timed Rwanda Provisional Driving',
      'Mock Exam — 20 Questions, 20 Min',
    ],
    subtitle:
      'Realistic provisional exam simulation. 20 questions, 20-minute countdown, 12/20 pass mark.',
    tags: ['⏱️ 20-Minute Timer', '📝 20 Questions', '🎯 12/20 Pass Mark'],
    footerText: 'Official Mock Exam Simulation',
    freeBadgeText: '100% FREE',
  },
  {
    fileName: 'og-fr-exam.png',
    badge: 'EXAMEN BLANC CHRONOMÉTRÉ',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: 'rgba(239, 68, 68, 0.35)',
    title: ['Examen Blanc Chronométré —', '20 Questions en 20 Minutes'],
    subtitle:
      'Simulation réaliste de l’épreuve théorique. 20 questions, 20 minutes, 12/20 pour réussir.',
    tags: ['⏱️ 20 Minutes Chrono', '📝 20 Questions', '🎯 Note 12/20'],
    footerText: 'Examen Blanc Permis Provisoire',
    freeBadgeText: '100% GRATUIT',
  },

  // 7. About, Terms, Privacy
  {
    fileName: 'og-rw-about.png',
    badge: 'IBYEREKEYE PROVISOIRE',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ['Ibyerekeye Urubuga rwa Provisoire', 'Urufatiro rwo Kwiga Gutwara'],
    subtitle:
      "Intego yacu ni ugufasha abanyarwanda bose gutsinda ikizamini cy'agateganyo ku buntu.",
    tags: ['✓ 100% Ku Buntu', '✓ Amakuru Nyayo', '✓ Buri Munyarwanda'],
    footerText: 'Ibyerekeye Provisoire.rw',
    freeBadgeText: 'PROVISOIRE.RW',
  },
  {
    fileName: 'og-en-about.png',
    badge: 'ABOUT PROVISOIRE',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: ['About Provisoire — Rwanda', 'Provisional Test Study Platform'],
    subtitle:
      'Empowering every learner in Rwanda to prepare and pass their provisional driving test for free.',
    tags: ['✓ 100% Free Access', '✓ Official Syllabus', '✓ Modern PWA'],
    footerText: 'About Provisoire.rw',
    freeBadgeText: 'PROVISOIRE.RW',
  },
  {
    fileName: 'og-fr-about.png',
    badge: 'À PROPOS DE PROVISOIRE',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    title: [
      'À Propos de Provisoire — Plateforme',
      'de Révision du Permis au Rwanda',
    ],
    subtitle:
      'Permettre à chaque apprenant de réviser et réussir son permis de conduire gratuitement.',
    tags: ['✓ Accès 100% Gratuit', '✓ Programme Officiel', '✓ PWA Hors-ligne'],
    footerText: 'À Propos de Provisoire.rw',
    freeBadgeText: 'PROVISOIRE.RW',
  },
  {
    fileName: 'og-rw-privacy.png',
    badge: 'POLITIKI Y’IBANGA',
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    badgeBorder: 'rgba(100, 116, 139, 0.35)',
    title: ["Politiki y'Ibanga n'Uburenganzira", 'bwawe kuri Provisoire.rw'],
    subtitle:
      "Nta makuru bwite yawe tubika. Amakuru yose y'imyitozo abikwa muri terefoni yawe.",
    tags: [
      '✓ Nta Konti Isabwa',
      '✓ Umutekano w’Amakuru',
      '✓ Kubahiriza Ibanga',
    ],
    footerText: "Politiki y'Ibanga",
    freeBadgeText: 'IBANGA NYARYO',
  },
  {
    fileName: 'og-en-privacy.png',
    badge: 'PRIVACY POLICY',
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    badgeBorder: 'rgba(100, 116, 139, 0.35)',
    title: ['Privacy Policy & Data Security —', 'Provisoire Rwanda'],
    subtitle:
      'Zero personal data collection. Your quiz progress and scores stay private on your device.',
    tags: [
      '✓ No Account Required',
      '✓ Local Device Storage',
      '✓ Fully Private',
    ],
    footerText: 'Provisoire Privacy Policy',
    freeBadgeText: 'PRIVATE & SECURE',
  },
  {
    fileName: 'og-fr-privacy.png',
    badge: 'POLITIQUE DE CONFIDENTIALITÉ',
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    badgeBorder: 'rgba(100, 116, 139, 0.35)',
    title: ['Politique de Confidentialité —', 'Provisoire Rwanda'],
    subtitle:
      'Aucune donnée personnelle collectée. Vos scores et révisions restent privés sur votre appareil.',
    tags: ['✓ Sans Inscription', '✓ Données Locales', '✓ Sécurité Totale'],
    footerText: 'Politique de Confidentialité',
    freeBadgeText: 'CONFIDENTIALITÉ',
  },
  {
    fileName: 'og-rw-terms.png',
    badge: 'AMABWIRIZA N’AMATEGEKO',
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    badgeBorder: 'rgba(100, 116, 139, 0.35)',
    title: ['Amabwiriza agenga Imikoreshereze', "y'Urubuga rwa Provisoire.rw"],
    subtitle:
      "Amategeko n'amabwiriza agenga ikoreshwa ry'ububiko bw'ibibazo byo kwimenyereza.",
    tags: [
      '✓ Amabwiriza y’Urubuga',
      '✓ Kwimenyereza ku Buntu',
      '✓ Provisoire.rw',
    ],
    footerText: "Amabwiriza y'Imikoreshereze",
    freeBadgeText: 'AMABWIRIZA',
  },
  {
    fileName: 'og-en-terms.png',
    badge: 'TERMS OF USE',
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    badgeBorder: 'rgba(100, 116, 139, 0.35)',
    title: ['Terms of Use & Service Agreement —', 'Provisoire Rwanda'],
    subtitle:
      'Terms governing the access and usage of Provisoire driving test practice tools and materials.',
    tags: ['✓ Terms of Service', '✓ Free Educational Tool', '✓ Fair Use'],
    footerText: 'Provisoire Terms of Use',
    freeBadgeText: 'TERMS',
  },
  {
    fileName: 'og-fr-terms.png',
    badge: 'CONDITIONS D’UTILISATION',
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    badgeBorder: 'rgba(100, 116, 139, 0.35)',
    title: ['Conditions Générales d’Utilisation —', 'Provisoire Rwanda'],
    subtitle:
      'Modalités d’accès et d’utilisation des outils et ressources de préparation au permis.',
    tags: ['✓ Conditions d’Accès', '✓ Gratuit & Éducatif', '✓ Provisoire.rw'],
    footerText: 'Conditions d’Utilisation',
    freeBadgeText: 'CONDITIONS',
  },
];

export async function generateAllOgImages() {
  console.log(`Generating ${OG_IMAGE_DEFINITIONS.length} static OG images...`);
  const t0 = performance.now();

  await Promise.all(
    OG_IMAGE_DEFINITIONS.map(async (def) => {
      const svg = generateSvg(def);
      const outPath = resolve(outDir, def.fileName);
      await sharp(Buffer.from(svg))
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outPath);
    }),
  );

  const elapsed = (performance.now() - t0).toFixed(2);
  console.log(
    `✓ Generated ${OG_IMAGE_DEFINITIONS.length} OG images in ${elapsed}ms -> ${outDir}`,
  );
}

// If invoked directly from CLI
if (process.argv[1] && process.argv[1].endsWith('generate-og-images.mjs')) {
  generateAllOgImages().catch((err) => {
    console.error('Failed to generate OG images:', err);
    process.exit(1);
  });
}
