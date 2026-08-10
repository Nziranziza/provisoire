export type Lang = 'en' | 'fr' | 'rw';

export type QuestionTranslation = {
  question: string;
  options: string[];
  correct_answer?: string;
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

export const ANSWER_LABEL: Record<Lang, string> = {
  en: 'Correct answer:',
  fr: 'Bonne réponse :',
  rw: 'Igisubizo cy’ukuri:',
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

/** List URL: page 1 at /[lang]/questions, later pages at /[lang]/questions/page/[n]. */
export function questionsListHref(lang: Lang, page = 1): string {
  if (page <= 1) return `/${lang}/questions`;
  return `/${lang}/questions/page/${page}`;
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
