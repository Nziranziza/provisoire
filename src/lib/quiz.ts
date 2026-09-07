export type Lang = 'en' | 'fr' | 'rw';

export type QuestionTranslation = {
  question: string;
  options: string[];
  correct_answer?: string;
  explanation?: string;
};

export type Question = {
  id: string;
  category_id: number;
  category_name: string;
  image_url: string | null;
  correct_index: number;
  translations: Record<string, QuestionTranslation>;
};

export type Category = {
  id: number;
  name: string;
};

export type QuestionPayload = {
  id: string;
  correctIndex: number;
  image: string | null;
  t: Record<string, QuestionTranslation>;
};

export function questionPayload(q: Question): string {
  return JSON.stringify({
    id: q.id,
    correctIndex: q.correct_index,
    image: q.image_url,
    t: q.translations,
  } satisfies QuestionPayload);
}

export function imageSrc(imageBase: string, imageUrl: string | null): string {
  if (!imageUrl) return '';
  return `${imageBase}${imageUrl.replace(/^\//, '')}`;
}

export function questionText(q: Question, lang: Lang): string {
  return (
    q.translations[lang]?.question ??
    q.translations.en?.question ??
    'Question unavailable'
  );
}

export function questionOptions(q: Question, lang: Lang): string[] {
  return q.translations[lang]?.options ?? q.translations.en?.options ?? [];
}

export function correctAnswerText(q: Question, lang: Lang): string {
  const t = q.translations[lang] ?? q.translations.en;
  if (!t) return '';
  return t.correct_answer || t.options[q.correct_index] || '';
}

export function questionExplanation(q: Question, lang: Lang): string {
  const t = q.translations[lang] ?? q.translations.en;
  return t?.explanation ?? '';
}

export const ANSWER_LABEL: Record<Lang, string> = {
  en: 'Correct answer:',
  fr: 'Bonne réponse :',
  rw: 'Igisubizo cy’ukuri:',
};

export const EXPLANATION_LABEL: Record<Lang, string> = {
  en: 'Explanation',
  fr: 'Explication',
  rw: 'Ibisobanuro',
};

export const LOCALES: Lang[] = ['en', 'fr', 'rw'];

export function isLang(value: string | undefined): value is Lang {
  return value === 'en' || value === 'fr' || value === 'rw';
}

export function questionNumber(index: number): number {
  return index + 1;
}

export function questionHref(lang: Lang, number: number): string {
  return `/${lang}/questions/${number}`;
}

export const PAGE_SIZE = 20;

/** URL slugs for question categories. */
export const CATEGORY_SLUGS: Record<number, string> = {
  1: 'traffic-rules',
  2: 'road-signs',
};

export function categorySlug(categoryId: number): string | undefined {
  return CATEGORY_SLUGS[categoryId];
}

export function categoryIdFromSlug(slug: string): number | undefined {
  const match = Object.entries(CATEGORY_SLUGS).find(([, s]) => s === slug);
  return match ? Number(match[0]) : undefined;
}

/**
 * Category Hub URL:
 * - /[lang]/traffic-rules
 * - /[lang]/road-signs
 */
export function categoryHubHref(lang: Lang, slugOrId: string | number): string {
  const slug =
    typeof slugOrId === 'number' ? CATEGORY_SLUGS[slugOrId] : slugOrId;
  return `/${lang}/${slug}`;
}

/**
 * List URL:
 * - all: /[lang]/questions[/page/N]
 * - category: /[lang]/questions/category/[slug][/page/N]
 */
export function questionsListHref(
  lang: Lang,
  page = 1,
  categoryId?: number | null,
): string {
  const slug = categoryId ? CATEGORY_SLUGS[categoryId] : undefined;
  if (slug) {
    if (page <= 1) return `/${lang}/questions/category/${slug}`;
    return `/${lang}/questions/category/${slug}/page/${page}`;
  }
  if (page <= 1) return `/${lang}/questions`;
  return `/${lang}/questions/page/${page}`;
}

/** Slice the full bank for a page, then optionally keep one category. */
export function pageQuestionsFor(
  questions: Question[],
  page: number,
  categoryId?: number | null,
  pageSize = PAGE_SIZE,
): Question[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  const slice = questions.slice(start, start + pageSize);
  if (!categoryId) return slice;
  return slice.filter((q) => q.category_id === categoryId);
}

export function totalQuestionPages(
  questionCount: number,
  pageSize = PAGE_SIZE,
): number {
  return Math.max(1, Math.ceil(questionCount / pageSize));
}

export function parsePageParam(
  raw: string | null | undefined,
  totalPages: number,
): number {
  const n = Number.parseInt(String(raw ?? '1'), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, Math.max(1, totalPages));
}

export function globalQuestionIndex(
  allQuestions: Question[],
  question: Question,
): number {
  return allQuestions.findIndex((q) => q.id === question.id);
}
