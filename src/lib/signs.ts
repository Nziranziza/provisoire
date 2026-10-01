import signsData from '../data/signs.json';
import type { Lang } from './quiz';

export type SignType =
  'warning' | 'prohibitory' | 'mandatory' | 'information' | 'marking';

export type LocalizedString = Record<Lang, string>;

export type SignEntry = {
  id: string;
  slug: string;
  type: SignType;
  image_url: string;
  source_question_id: string;
  names: LocalizedString;
  meaning: LocalizedString;
  action: LocalizedString;
  questionIds: string[];
  questionNumbers: number[];
};

export const SIGN_TYPES: SignType[] = [
  'warning',
  'prohibitory',
  'mandatory',
  'information',
  'marking',
];

export const SIGN_TYPE_LABELS: Record<SignType, LocalizedString> = {
  warning: {
    en: 'Warning',
    fr: 'Danger',
    rw: 'Integuza',
  },
  prohibitory: {
    en: 'Prohibitory',
    fr: 'Interdiction',
    rw: 'Kubuza',
  },
  mandatory: {
    en: 'Mandatory',
    fr: 'Obligation',
    rw: 'Gutegeka',
  },
  information: {
    en: 'Information',
    fr: 'Indication',
    rw: 'Amakuru',
  },
  marking: {
    en: 'Road marking',
    fr: 'Marquage',
    rw: 'Ikimenyetso ku muhanda',
  },
};

const signs = (signsData as { signs: SignEntry[] }).signs;

const bySlug = new Map(signs.map((s) => [s.slug, s]));
const byQuestionId = new Map<string, SignEntry>();
for (const sign of signs) {
  for (const qid of sign.questionIds) {
    byQuestionId.set(qid, sign);
  }
}

export function getAllSigns(): SignEntry[] {
  return signs;
}

export function getSignBySlug(slug: string): SignEntry | undefined {
  return bySlug.get(slug);
}

export function getSignForQuestionId(
  questionId: string,
): SignEntry | undefined {
  return byQuestionId.get(questionId);
}

export function signsByType(type: SignType): SignEntry[] {
  return signs.filter((s) => s.type === type);
}

export function signHref(lang: Lang, slug: string): string {
  return `/${lang}/signs/${slug}`;
}

export function signsIndexHref(lang: Lang): string {
  return `/${lang}/signs`;
}

export function signName(sign: SignEntry, lang: Lang): string {
  return sign.names[lang] || sign.names.en;
}

export function signMeaning(sign: SignEntry, lang: Lang): string {
  return sign.meaning[lang] || sign.meaning.en;
}

export function signAction(sign: SignEntry, lang: Lang): string {
  return sign.action[lang] || sign.action.en;
}

export function signTypeLabel(type: SignType, lang: Lang): string {
  return SIGN_TYPE_LABELS[type][lang];
}
