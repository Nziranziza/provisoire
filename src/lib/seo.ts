import type { Lang, Question } from './quiz';
import {
  LOCALES,
  PAGE_SIZE,
  questionHref,
  questionsListHref,
  questionText,
  correctAnswerText,
  imageSrc,
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
) {
  return hreflangAlternates((lang) => questionsListHref(lang, page), site);
}

export function questionPageAlternates(
  number: number,
  site: string | URL | undefined,
) {
  return hreflangAlternates((lang) => questionHref(lang, number), site);
}

export function ogLocale(lang: Lang): string {
  if (lang === 'fr') return 'fr_FR';
  if (lang === 'rw') return 'rw_RW';
  return 'en_US';
}

export function listJsonLd(options: {
  lang: Lang;
  page: number;
  totalPages: number;
  questions: Question[];
  startIndex: number;
  site: string | URL | undefined;
}) {
  const { lang, page, totalPages, questions, startIndex, site } = options;
  const pageUrl = absoluteUrl(questionsListHref(lang, page), site);

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name:
      page > 1
        ? `Rwanda driving test questions (${lang.toUpperCase()}) — page ${page}`
        : `Rwanda driving test questions (${lang.toUpperCase()})`,
    inLanguage: lang,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Provisoire',
      url: absoluteUrl('/', site),
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: questions.length,
      itemListElement: questions.map((q, i) => {
        const number = startIndex + i + 1;
        return {
          '@type': 'ListItem',
          position: number,
          url: absoluteUrl(questionHref(lang, number), site),
          name: truncateMeta(questionText(q, lang), 110),
        };
      }),
    },
    ...(page > 1 ? { url: pageUrl, pagination: `${page}/${totalPages}` } : {}),
  };
}

export function questionJsonLd(options: {
  lang: Lang;
  question: Question;
  number: number;
  site: string | URL | undefined;
  imageBase?: string;
}) {
  const { lang, question, number, site, imageBase = '/' } = options;
  const url = absoluteUrl(questionHref(lang, number), site);
  const text = questionText(question, lang);
  const answer = correctAnswerText(question, lang);
  const img = question.image_url
    ? absoluteUrl(imageSrc(imageBase, question.image_url), site)
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: truncateMeta(text, 110),
      text,
      inLanguage: lang,
      url,
      ...(img ? { image: img } : {}),
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
        inLanguage: lang,
      },
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  site: string | URL | undefined,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, site),
    })),
  };
}

export function siteListPageCount(questionCount: number) {
  return totalQuestionPages(questionCount, PAGE_SIZE);
}
