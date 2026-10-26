import en from './en.json';
import fr from './fr.json';
import rw from './rw.json';
import type { Lang } from '../lib/quiz';

export const UI_TRANSLATIONS = {
  en,
  fr,
  rw,
} as const;

export type SupportedLocale = keyof typeof UI_TRANSLATIONS;
export type UIChrome = typeof en;

/**
 * Returns a typed dictionary of UI chrome strings for the given locale.
 * Falls back to 'en' (or 'rw') if the requested locale is not found.
 */
export function getUIChrome(lang: Lang | string = 'en'): UIChrome {
  return UI_TRANSLATIONS[lang as SupportedLocale] ?? UI_TRANSLATIONS.en;
}

/**
 * Returns a lookup function for UI chrome strings for the given locale.
 */
export function useTranslations(lang: Lang | string = 'en') {
  const dict = getUIChrome(lang);
  return <K extends keyof UIChrome>(section: K): UIChrome[K] => dict[section];
}
