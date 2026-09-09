import type { Lang, Question } from './quiz';
import {
  ANSWER_LABEL,
  LOCALES,
  PAGE_SIZE,
  categoryHubHref,
  correctAnswerText,
  imageSrc,
  questionExplanation,
  questionHref,
  questionOptions,
  questionsListHref,
  questionText,
  totalQuestionPages,
} from './quiz';
import { getCategoryContent } from './category-content';

export type HreflangLink = {
  lang: string;
  href: string;
};

export function absoluteUrl(
  pathOrUrl: string,
  site: string | URL | undefined,
): string {
  return new URL(pathOrUrl, site).href;
}

export function truncateMeta(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Build hreflang alternates for the same logical page across locales (ISO 639-1: en, fr, rw). */
export function hreflangAlternates(
  hrefForLocale: (lang: Lang) => string,
  site: string | URL | undefined,
): HreflangLink[] {
  const links: HreflangLink[] = LOCALES.map((lang) => ({
    lang,
    href: absoluteUrl(hrefForLocale(lang), site),
  }));
  links.push({
    lang: 'x-default',
    href: absoluteUrl(hrefForLocale('en'), site),
  });
  return links;
}

export function listPageAlternates(
  page: number,
  site: string | URL | undefined,
  categoryId?: number | null,
): HreflangLink[] {
  return hreflangAlternates(
    (lang) => questionsListHref(lang, page, categoryId),
    site,
  );
}

export function questionPageAlternates(
  number: number,
  site: string | URL | undefined,
): HreflangLink[] {
  return hreflangAlternates((lang) => questionHref(lang, number), site);
}

export function categoryHubAlternates(
  slugOrId: string | number,
  site: string | URL | undefined,
): HreflangLink[] {
  return hreflangAlternates((lang) => categoryHubHref(lang, slugOrId), site);
}

export function ogLocale(lang: Lang): string {
  if (lang === 'fr') return 'fr_FR';
  if (lang === 'rw') return 'rw_RW';
  return 'en_US';
}

/** Generates descriptive, localized alt text for question and sign images. */
export function questionImageAlt(
  question: Question,
  lang: Lang,
  number?: number,
): string {
  const qText = questionText(question, lang);
  const isRoadSign = question.category_id === 2;
  const numStr = number ? ` #${number}` : '';

  if (lang === 'fr') {
    return isRoadSign
      ? `Illustration du panneau routier${numStr} : ${qText}`
      : `Illustration de la question${numStr} : ${qText}`;
  }
  if (lang === 'rw') {
    return isRoadSign
      ? `Ifoto y’icyapa cyo mu muhanda${numStr} : ${qText}`
      : `Ifoto y’ikibazo cyo mu muhanda${numStr} : ${qText}`;
  }
  return isRoadSign
    ? `Road sign diagram${numStr}: ${qText}`
    : `Driving test question illustration${numStr}: ${qText}`;
}

export interface QuestionPageMetadataOptions {
  lang: Lang;
  question: Question;
  number: number;
  total?: number;
  site: string | URL | undefined;
  imageBase?: string;
}

export interface PageMetadataResult {
  title: string;
  description: string;
  lang: Lang;
  canonical: string;
  alternates: HreflangLink[];
  image: string | null;
  imageAlt?: string;
  prev: string | null;
  next: string | null;
  robots: string;
  jsonLd: Record<string, unknown>[];
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: 'website' | 'article';
    siteName: string;
    locale: string;
    alternateLocales: string[];
    image: string | null;
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    image: string | null;
  };
}

/**
 * Builds unique per-locale metadata for question detail pages.
 * Title and description are dynamically derived from question text and correct answer.
 */
export function getQuestionPageMetadata(
  options: QuestionPageMetadataOptions,
): PageMetadataResult {
  const { lang, question, number, total, site, imageBase = '/' } = options;
  const qText = questionText(question, lang);
  const answer = correctAnswerText(question, lang);
  const answerLabel = ANSWER_LABEL[lang] ?? 'Correct answer:';

  const title =
    lang === 'fr'
      ? `Question ${number} : ${truncateMeta(qText, 65)} — Provisoire`
      : lang === 'rw'
        ? `Ikibazo cya ${number}: ${truncateMeta(qText, 65)} — Provisoire`
        : `Question ${number}: ${truncateMeta(qText, 65)} — Provisoire`;

  const description = truncateMeta(
    `${qText} ${answerLabel} ${answer}`.trim(),
    155,
  );

  const canonical = absoluteUrl(questionHref(lang, number), site);
  const alternates = questionPageAlternates(number, site);
  const hasPrev = number > 1;
  const hasNext = typeof total === 'number' ? number < total : true;
  const prev = hasPrev
    ? absoluteUrl(questionHref(lang, number - 1), site)
    : null;
  const next = hasNext
    ? absoluteUrl(questionHref(lang, number + 1), site)
    : null;

  const image = question.image_url
    ? absoluteUrl(imageSrc(imageBase, question.image_url), site)
    : null;
  const imageAlt = questionImageAlt(question, lang, number);

  const breadcrumbLabels: Record<
    Lang,
    { home: string; list: string; item: string }
  > = {
    en: { home: 'Provisoire', list: 'Questions', item: 'Question' },
    fr: { home: 'Provisoire', list: 'Questions', item: 'Question' },
    rw: { home: 'Provisoire', list: 'Ibibazo', item: 'Ikibazo' },
  };
  const bLabels = breadcrumbLabels[lang];

  const jsonLd = [
    questionJsonLd({
      lang,
      question,
      number,
      site,
      imageBase,
    }),
    breadcrumbJsonLd(
      [
        { name: bLabels.home, path: '/' },
        { name: bLabels.list, path: questionsListHref(lang) },
        { name: `${bLabels.item} ${number}`, path: questionHref(lang, number) },
      ],
      site,
    ),
  ];

  return {
    title,
    description,
    lang,
    canonical,
    alternates,
    image,
    imageAlt,
    prev,
    next,
    robots: 'index,follow',
    jsonLd,
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      siteName: 'Provisoire',
      locale: ogLocale(lang),
      alternateLocales: LOCALES.filter((l) => l !== lang).map(ogLocale),
      image,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      image,
    },
  };
}

export interface ListPageMetadataOptions {
  lang: Lang;
  page?: number;
  totalPages: number;
  categoryId?: number | null;
  site: string | URL | undefined;
  isHome?: boolean;
}

/**
 * Builds unique per-locale metadata for question list and pagination pages.
 */
export function getListPageMetadata(
  options: ListPageMetadataOptions,
): PageMetadataResult {
  const {
    lang,
    page = 1,
    totalPages,
    categoryId,
    site,
    isHome = false,
  } = options;

  let baseTitle = '';
  let baseDescription = '';

  if (isHome) {
    if (lang === 'fr') {
      baseTitle =
        'Provisoire — Préparation à l’examen du permis provisoire au Rwanda';
      baseDescription =
        'Révisez et réussissez le permis de conduire provisoire au Rwanda : questions officielles du code de la route, panneaux routiers, explications et examens blancs.';
    } else if (lang === 'rw') {
      baseTitle =
        "Provisoire — Kwitegura ikizamini cy'uruhushya rw'agateganyo mu Rwanda";
      baseDescription =
        "Batsinda ikizamini cy'uruhushya rwo gutwara rw'agateganyo mu Rwanda: ibibazo n'ibisubizo by'amategeko n'ibyapa, ibisobanuro n'ibizamini by'ikitegererezo.";
    } else {
      baseTitle =
        'Provisoire — Rwanda Provisional Driving Test Preparation & Question Bank';
      baseDescription =
        'Pass your Rwanda provisional driving test with official question bank quizzes, traffic rules, road signs, explanations, and timed mock exams.';
    }
  } else if (categoryId === 1) {
    // Traffic Rules list
    if (lang === 'fr') {
      baseTitle = 'Code de la route — Questions du permis provisoire rwandais';
      baseDescription =
        'Questions du code de la route du permis provisoire au Rwanda avec bonnes réponses et explications détaillées.';
    } else if (lang === 'rw') {
      baseTitle = "Amategeko y'umuhanda — Ibibazo by'uruhushya rw'agateganyo";
      baseDescription =
        "Ibibazo n'ibisubizo by'amategeko y'umuhanda mu kizamini cy'agateganyo mu Rwanda n'ibisobanuro byose.";
    } else {
      baseTitle = 'Traffic Rules Questions — Rwanda Provisional Driving Test';
      baseDescription =
        'Practice Rwanda traffic rules questions with instant answers and legal explanations for the provisional driving test.';
    }
  } else if (categoryId === 2) {
    // Road Signs list
    if (lang === 'fr') {
      baseTitle =
        'Panneaux de signalisation — Questions du permis provisoire rwandais';
      baseDescription =
        'Questions sur les panneaux et signaux routiers du permis provisoire rwandais avec illustrations et réponses.';
    } else if (lang === 'rw') {
      baseTitle = "Ibyapa byo mu muhanda — Ibibazo by'uruhushya rw'agateganyo";
      baseDescription =
        "Ibibazo byose by'ibyapa byo mu muhanda n'amafoto yabyo mu kizamini cy'agateganyo mu Rwanda n'ibisubizo by'ukuri.";
    } else {
      baseTitle = 'Road Signs Questions — Rwanda Provisional Driving Test';
      baseDescription =
        'Practice Rwanda road sign questions with full-color diagrams and answers for the provisional driving test.';
    }
  } else {
    // All Questions list
    if (lang === 'fr') {
      baseTitle = 'Banque de questions du permis provisoire rwandais';
      baseDescription =
        'Entraînez-vous avec les questions et réponses du permis de conduire provisoire au Rwanda en français.';
    } else if (lang === 'rw') {
      baseTitle = "Ibibazo by'ikizamini cy'uruhushya rw'agateganyo mu Rwanda";
      baseDescription =
        "Ibibazo n'ibisubizo byose by'ikizamini cy'uruhushya rw'agateganyo mu Rwanda mu Kinyarwanda.";
    } else {
      baseTitle = 'Rwanda Provisional Driving-Test Question Bank';
      baseDescription =
        'Practice Rwanda provisional driving-test questions and answers in English. Traffic rules and road signs with correct answers.';
    }
  }

  const title = isHome
    ? baseTitle
    : page > 1
      ? lang === 'fr'
        ? `${baseTitle} · Page ${page} | Provisoire`
        : lang === 'rw'
          ? `${baseTitle} · Paji ya ${page} | Provisoire`
          : `${baseTitle} · Page ${page} | Provisoire`
      : `${baseTitle} | Provisoire`;

  const description =
    page > 1
      ? lang === 'fr'
        ? truncateMeta(`${baseDescription} Page ${page} sur ${totalPages}.`)
        : lang === 'rw'
          ? truncateMeta(
              `${baseDescription} Paji ya ${page} kuri ${totalPages}.`,
            )
          : truncateMeta(`${baseDescription} Page ${page} of ${totalPages}.`)
      : truncateMeta(baseDescription);

  const canonicalPath = questionsListHref(lang, page, categoryId);
  const canonical = absoluteUrl(canonicalPath, site);
  const alternates = listPageAlternates(page, site, categoryId);

  const prev =
    page > 1
      ? absoluteUrl(questionsListHref(lang, page - 1, categoryId), site)
      : null;
  const next =
    page < totalPages
      ? absoluteUrl(questionsListHref(lang, page + 1, categoryId), site)
      : null;

  return {
    title,
    description,
    lang,
    canonical,
    alternates,
    image: null,
    prev,
    next,
    robots: 'index,follow',
    jsonLd: [],
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: 'Provisoire',
      locale: ogLocale(lang),
      alternateLocales: LOCALES.filter((l) => l !== lang).map(ogLocale),
      image: null,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      image: null,
    },
  };
}

export interface CategoryHubMetadataOptions {
  lang: Lang;
  categorySlug: 'traffic-rules' | 'road-signs';
  site: string | URL | undefined;
}

/**
 * Builds metadata for Category Hub pages (/traffic-rules, /road-signs).
 */
export function getCategoryHubMetadata(
  options: CategoryHubMetadataOptions,
): PageMetadataResult {
  const { lang, categorySlug, site } = options;
  const content = getCategoryContent(lang, categorySlug);
  const canonical = absoluteUrl(categoryHubHref(lang, categorySlug), site);
  const alternates = categoryHubAlternates(categorySlug, site);

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    lang,
    canonical,
    alternates,
    image: null,
    prev: null,
    next: null,
    robots: 'index,follow',
    jsonLd: [],
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: canonical,
      type: 'website',
      siteName: 'Provisoire',
      locale: ogLocale(lang),
      alternateLocales: LOCALES.filter((l) => l !== lang).map(ogLocale),
      image: null,
    },
    twitter: {
      card: 'summary',
      title: content.metaTitle,
      description: content.metaDescription,
      image: null,
    },
  };
}

export interface PracticePageMetadataOptions {
  lang: Lang;
  mode?: 'practice' | 'mock_exam';
  site: string | URL | undefined;
}

/**
 * Builds metadata for interactive Practice and Mock Exam pages.
 */
export function getPracticePageMetadata(
  options: PracticePageMetadataOptions,
): PageMetadataResult {
  const { lang, mode = 'practice', site } = options;
  const isExam = mode === 'mock_exam';
  const routeSlug = isExam ? 'exam' : 'practice';

  const meta: Record<Lang, { title: string; description: string }> = {
    en: {
      title: isExam
        ? 'Mock Exam (20 Questions, 20 Min) — Rwanda Provisional Driving Test'
        : 'Practice Mode (Instant Feedback) — Rwanda Provisional Driving Test',
      description: isExam
        ? 'Official 20-minute timed mock exam simulation for the Rwanda provisional driving license. 20 questions, 12/20 pass mark, official score breakdown.'
        : 'Interactive 20-question practice mode for the Rwanda provisional driving test with immediate answer feedback, detailed explanations, and scoring.',
    },
    fr: {
      title: isExam
        ? 'Examen Blanc (20 Questions, 20 Min) — Permis Provisoire Rwandais'
        : 'Mode Entraînement (Correction Immédiate) — Permis Provisoire Rwandais',
      description: isExam
        ? 'Simulation officielle d’examen blanc chronométré de 20 questions en 20 minutes pour le permis provisoire rwandais. Note de passage 12/20.'
        : 'Entraînement interactif de 20 questions pour le permis provisoire rwandais avec correction immédiate et explications détaillées.',
    },
    rw: {
      title: isExam
        ? 'Ikizamini cy’Ikitegererezo (Ibibazo 20, Iminota 20) — Uruhushya rw’Agateganyo'
        : 'Uburyo bw’Imyitozo (Ibisubizo Ako Kanya) — Uruhushya rw’Agateganyo',
      description: isExam
        ? 'Ikizamini nyakuri cy’ikitegererezo cy’iminota 20 n’ibibazo 20 by’uruhushya rw’agateganyo mu Rwanda. Amanota 12/20 asabwa gutsinda.'
        : 'Imyitozo y’ibibazo 20 by’uruhushya rw’agateganyo mu Rwanda: guhita ubona ibisubizo n’ibisobanuro kuri buri kibazo.',
    },
  };

  const { title, description } = meta[lang];
  const canonical = absoluteUrl(`/${lang}/${routeSlug}`, site);
  const alternates = hreflangAlternates((l) => `/${l}/${routeSlug}`, site);

  return {
    title,
    description,
    lang,
    canonical,
    alternates,
    image: null,
    prev: null,
    next: null,
    robots: 'noindex,nofollow',
    jsonLd: [],
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: 'Provisoire',
      locale: ogLocale(lang),
      alternateLocales: LOCALES.filter((l) => l !== lang).map(ogLocale),
      image: null,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      image: null,
    },
  };
}

export type PageType = 'question' | 'list' | 'category-hub' | 'practice';

export type PageMetadataOptions =
  | ({ type: 'question' } & QuestionPageMetadataOptions)
  | ({ type: 'list' } & ListPageMetadataOptions)
  | ({ type: 'category-hub' } & CategoryHubMetadataOptions)
  | ({ type: 'practice' } & PracticePageMetadataOptions);

/**
 * Unified metadata helper that any page can call.
 */
export function getPageMetadata(
  options: PageMetadataOptions,
): PageMetadataResult {
  switch (options.type) {
    case 'question':
      return getQuestionPageMetadata(options);
    case 'list':
      return getListPageMetadata(options);
    case 'category-hub':
      return getCategoryHubMetadata(options);
    case 'practice':
      return getPracticePageMetadata(options);
  }
}

export interface ListJsonLdOptions {
  lang: Lang;
  page: number;
  totalPages: number;
  questions: Question[];
  startIndex: number;
  site: string | URL | undefined;
  categoryId?: number | null;
  /** Global 1-based question numbers (bank order). Defaults to startIndex + i + 1. */
  questionNumbers?: number[];
}

export function listJsonLd(options: ListJsonLdOptions) {
  const {
    lang,
    page,
    totalPages,
    questions,
    startIndex,
    site,
    categoryId,
    questionNumbers,
  } = options;
  const pageUrl = absoluteUrl(questionsListHref(lang, page, categoryId), site);

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage' as const,
    name:
      page > 1
        ? `Rwanda provisional driving-test question bank — page ${page}`
        : 'Rwanda provisional driving-test question bank',
    inLanguage: lang,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite' as const,
      name: 'Provisoire',
      url: absoluteUrl('/', site),
    },
    mainEntity: {
      '@type': 'ItemList' as const,
      numberOfItems: questions.length,
      itemListElement: questions.map((q, i) => {
        const number = questionNumbers?.[i] ?? startIndex + i + 1;
        return {
          '@type': 'ListItem' as const,
          position: i + 1,
          url: absoluteUrl(questionHref(lang, number), site),
          name: truncateMeta(questionText(q, lang), 110),
        };
      }),
    },
    ...(page > 1 ? { pagination: `${page}/${totalPages}` } : {}),
  };
}

export interface QuizJsonLdOptions {
  lang: Lang;
  question: Question;
  number: number;
  site: string | URL | undefined;
  imageBase?: string;
}

export function questionJsonLd(options: QuizJsonLdOptions) {
  const { lang, question, number, site, imageBase = '/' } = options;
  const url = absoluteUrl(questionHref(lang, number), site);
  const text = questionText(question, lang);
  const answer = correctAnswerText(question, lang);
  const explanation = questionExplanation(question, lang);
  const optionsList = questionOptions(question, lang);
  const img = question.image_url
    ? absoluteUrl(imageSrc(imageBase, question.image_url), site)
    : undefined;

  const suggestedAnswers = optionsList
    .map((optText, idx) => ({ optText, idx }))
    .filter(({ idx }) => idx !== question.correct_index)
    .map(({ optText, idx }) => ({
      '@type': 'Answer' as const,
      text: optText,
      inLanguage: lang,
      position: idx + 1,
    }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz' as const,
    name: truncateMeta(text, 110),
    description: truncateMeta(
      `${text} ${ANSWER_LABEL[lang] ?? 'Correct answer:'} ${answer}`,
      155,
    ),
    inLanguage: lang,
    url,
    ...(img ? { image: img } : {}),
    hasPart: [
      {
        '@type': 'Question' as const,
        name: truncateMeta(text, 110),
        text,
        inLanguage: lang,
        eduQuestionType: 'Multiple choice',
        ...(img ? { image: img } : {}),
        acceptedAnswer: {
          '@type': 'Answer' as const,
          text: answer,
          inLanguage: lang,
          position: question.correct_index + 1,
          ...(explanation
            ? {
                comment: {
                  '@type': 'Comment' as const,
                  text: explanation,
                },
              }
            : {}),
        },
        suggestedAnswer: suggestedAnswers,
      },
    ],
  };
}

export interface CategoryFaqJsonLdOptions {
  lang: Lang;
  questions: Question[];
  categoryName?: string;
  site: string | URL | undefined;
}

export function categoryFaqJsonLd(options: CategoryFaqJsonLdOptions) {
  const { lang, questions } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage' as const,
    inLanguage: lang,
    mainEntity: questions.map((q) => {
      const qText = questionText(q, lang);
      const answer = correctAnswerText(q, lang);
      const explanation = questionExplanation(q, lang);
      return {
        '@type': 'Question' as const,
        name: qText,
        inLanguage: lang,
        acceptedAnswer: {
          '@type': 'Answer' as const,
          text: answer,
          inLanguage: lang,
          ...(explanation
            ? {
                comment: {
                  '@type': 'Comment' as const,
                  text: explanation,
                },
              }
            : {}),
        },
      };
    }),
  };
}

export interface WebSiteJsonLdOptions {
  site: string | URL | undefined;
  name?: string;
  description?: string;
  inLanguage?: string | string[];
}

export function webSiteJsonLd(options?: WebSiteJsonLdOptions) {
  const site = options?.site;
  const siteUrl = absoluteUrl('/', site);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite' as const,
    name: options?.name ?? 'Provisoire',
    url: siteUrl,
    description:
      options?.description ??
      'Rwanda provisional driving test question bank, practice quizzes, and timed mock exam simulator in English, French, and Kinyarwanda.',
    inLanguage: options?.inLanguage ?? ['en', 'fr', 'rw'],
  };
}

export interface OrganizationJsonLdOptions {
  site: string | URL | undefined;
  name?: string;
  logoPath?: string;
}

export function organizationJsonLd(options?: OrganizationJsonLdOptions) {
  const site = options?.site;
  const siteUrl = absoluteUrl('/', site);
  const logo = absoluteUrl(
    options?.logoPath ?? '/icons/icon-192x192.png',
    site,
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization' as const,
    name: options?.name ?? 'Provisoire',
    url: siteUrl,
    logo,
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(
  items: BreadcrumbItem[],
  site: string | URL | undefined,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList' as const,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, site),
    })),
  };
}

export function siteListPageCount(questionCount: number) {
  return totalQuestionPages(questionCount, PAGE_SIZE);
}
