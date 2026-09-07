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

/** Build hreflang alternates for the same logical page across locales. */
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
) {
  return hreflangAlternates(
    (lang) => questionsListHref(lang, page, categoryId),
    site,
  );
}

export function questionPageAlternates(
  number: number,
  site: string | URL | undefined,
) {
  return hreflangAlternates((lang) => questionHref(lang, number), site);
}

export function categoryHubAlternates(
  slugOrId: string | number,
  site: string | URL | undefined,
) {
  return hreflangAlternates((lang) => categoryHubHref(lang, slugOrId), site);
}

export function ogLocale(lang: Lang): string {
  if (lang === 'fr') return 'fr_FR';
  if (lang === 'rw') return 'rw_RW';
  return 'en_US';
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
