import type { Lang } from './quiz';

export type HeaderDictionary = {
  home: string;
  trafficRules: string;
  roadSigns: string;
  practice: string;
  exam: string;
  questions: string;
  about: string;
  languageSelector: string;
  openMenu: string;
  closeMenu: string;
  nav: string;
  mobileNav: string;
  brandTagline: string;
  skipToContent: string;
  homeAriaLabel: string;
  homeDesc?: string;
  trafficRulesDesc?: string;
  roadSignsDesc?: string;
  practiceDesc?: string;
  examDesc?: string;
  installAppText?: string;
  installAppDesc?: string;
  activeBadge?: string;
};

export const HEADER_DICTIONARIES: Record<Lang, HeaderDictionary> = {
  en: {
    home: 'Home',
    trafficRules: 'Traffic Rules',
    roadSigns: 'Road Signs',
    practice: 'Practice',
    exam: 'Exam',
    questions: 'Questions',
    about: 'About',
    languageSelector: 'Language selector',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    nav: 'Main navigation',
    mobileNav: 'Mobile navigation',
    brandTagline: 'Rwanda Driving Theory',
    skipToContent: 'Skip to main content',
    homeAriaLabel: 'Provisoire home',
    homeDesc: 'Home & question bank overview',
    trafficRulesDesc: 'Official regulations & priority rules',
    roadSignsDesc: 'Warning, mandatory & info signs',
    practiceDesc: 'Interactive quiz without timer',
    examDesc: '20-question timed mock exam',
    installAppText: 'Install App',
    installAppDesc: 'Practice offline on your device',
    activeBadge: 'Current',
  },
  fr: {
    home: 'Accueil',
    trafficRules: 'Règles de circulation',
    roadSigns: 'Panneaux routiers',
    practice: 'Entraînement',
    exam: 'Examen',
    questions: 'Questions',
    about: 'À propos',
    languageSelector: 'Sélecteur de langue',
    openMenu: 'Ouvrir le menu de navigation',
    closeMenu: 'Fermer le menu de navigation',
    nav: 'Navigation principale',
    mobileNav: 'Navigation mobile',
    brandTagline: 'Code de la route rwandais',
    skipToContent: 'Passer au contenu principal',
    homeAriaLabel: 'Accueil Provisoire',
    homeDesc: 'Aperçu & banque de questions',
    trafficRulesDesc: 'Règles officielles & priorités',
    roadSignsDesc: 'Signaux de danger, d’obligation & d’indication',
    practiceDesc: 'Quiz interactif sans chronomètre',
    examDesc: 'Examen blanc chronométré 20 questions',
    installAppText: 'Installer l’app',
    installAppDesc: 'Révisez hors-ligne sur votre appareil',
    activeBadge: 'Actuel',
  },
  rw: {
    home: 'Ahabanza',
    trafficRules: 'Amategeko y’umuhanda',
    roadSigns: 'Ibyapa byo ku muhanda',
    practice: 'Imyitozo',
    exam: 'Ikizamini',
    questions: 'Ibibazo',
    about: 'Ibyerekeye',
    languageSelector: 'Guhitamo ururimi',
    openMenu: 'Fungura menu y’urubuga',
    closeMenu: 'Funga menu y’urubuga',
    nav: 'Ibyerekezo bikuru',
    mobileNav: 'Kugenda kuri telefoni',
    brandTagline: 'Kwiga amategeko y’umuhanda',
    skipToContent: 'Simbukira ku birimo nyamukuru',
    homeAriaLabel: 'Ahabanza ha Provisoire',
    homeDesc: 'Ahabanza n’incamake y’ibibazo',
    trafficRulesDesc: 'Amategeko agenga uburyo bwo kugenda',
    roadSignsDesc: 'Ibyapa by’integuza, ibitegeka n’ibimenyesha',
    practiceDesc: 'Kwimenyereza ibibazo nta gitutu',
    examDesc: 'Ikizamini cy’ikitegererezo cy’iminota 20',
    installAppText: 'Shyiramo App',
    installAppDesc: 'Wige nta interineti muri telefone yawe',
    activeBadge: 'Iriho',
  },
};

export function getHeaderContent(lang: Lang): HeaderDictionary {
  return HEADER_DICTIONARIES[lang] ?? HEADER_DICTIONARIES.rw;
}

/**
 * Computes the equivalent URL for the target locale while preserving the current route structure and query parameters.
 */
export function getLocalizedPath(
  targetLang: Lang,
  currentPath: string,
  search: string = '',
): string {
  const clean = currentPath.replace(/\.html$/, '').replace(/\/index$/, '');
  const parts = clean.split('/').filter(Boolean);
  const query = search && !search.startsWith('?') ? `?${search}` : search;
  if (parts.length === 0) return `/${targetLang}${query}`;
  if (parts[0] === 'en' || parts[0] === 'fr' || parts[0] === 'rw') {
    parts[0] = targetLang;
    return '/' + parts.join('/') + query;
  }
  return `/${targetLang}/${parts.join('/')}${query}`;
}
