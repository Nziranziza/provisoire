import type { Lang } from './quiz';

export type FooterDictionary = {
  tagline: string;
  home: string;
  practice: string;
  exam: string;
  questions: string;
  trafficRules: string;
  roadSigns: string;
  about: string;
  privacy: string;
  terms: string;
  share: string;
  shareToast: string;
  shareTitle: string;
  shareText: string;
  languageSelector: string;
  backToTop: string;
  disclaimer: string;
  nav: string;
};

export const FOOTER_DICTIONARIES: Record<Lang, FooterDictionary> = {
  en: {
    tagline: 'Study support for Rwanda driving theory',
    home: 'Home',
    practice: 'Practice',
    exam: 'Mock Exam',
    questions: 'Questions',
    trafficRules: 'Traffic rules',
    roadSigns: 'Road signs',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    share: 'Share',
    shareToast: 'Link copied to clipboard!',
    shareTitle: 'Provisoire - Rwanda Driving Theory Test Prep',
    shareText:
      'Practice official Rwanda driving questions and mock exams offline for free!',
    languageSelector: 'Language selector',
    backToTop: 'Top',
    disclaimer:
      'Provisoire is an unofficial, independent study aid not affiliated with or endorsed by the Rwanda National Police (RNP) or any government body.',
    nav: 'Footer navigation',
  },
  fr: {
    tagline: 'Aide à l’étude pour le code de la route au Rwanda',
    home: 'Accueil',
    practice: 'Entraînement',
    exam: 'Examen blanc',
    questions: 'Questions',
    trafficRules: 'Règles de circulation',
    roadSigns: 'Panneaux routiers',
    about: 'À propos',
    privacy: 'Confidentialité',
    terms: 'Conditions d’utilisation',
    share: 'Partager',
    shareToast: 'Lien copié dans le presse-papiers !',
    shareTitle: 'Provisoire — Entraînement au code de la route rwandais',
    shareText:
      'Entraînez-vous gratuitement aux questions officielles du code rwandais et aux examens blancs hors ligne !',
    languageSelector: 'Sélecteur de langue',
    backToTop: 'Haut',
    disclaimer:
      'Provisoire est un support d’étude non officiel et indépendant, non affilié à la Police Nationale du Rwanda (RNP) ni au gouvernement.',
    nav: 'Navigation du pied de page',
  },
  rw: {
    tagline: 'Ubufasha bwo kwiga amategeko y’umuhanda mu Rwanda',
    home: 'Ahabanza',
    practice: 'Imyitozo',
    exam: 'Ikizamini',
    questions: 'Ibibazo',
    trafficRules: 'Amategeko y’umuhanda',
    roadSigns: 'Ibyapa byo ku muhanda',
    about: 'Ibyerekeye',
    privacy: 'Ubuzima bwite',
    terms: 'Amabwiriza',
    share: 'Sangiza',
    shareToast: 'Ihuza ryamaze gukopororwa !',
    shareTitle:
      'Provisoire — Kwitegura ikizamini cy’amategeko y’umuhanda mu Rwanda',
    shareText:
      'Itoze ibibazo by’amategeko y’umuhanda n’ibizamini by’ikitegererezo ku buntu ndetse no kuri interineti itariho!',
    languageSelector: 'Guhitamo ururimi',
    backToTop: 'Hejuru',
    disclaimer:
      'Provisoire ni umfashanyigisho yigenga kandi itari iya Leta, itafitanye isano na Polisi y’u Rwanda (RNP) cyangwa urwego rwa Leta.',
    nav: 'Kugenda kuri footer',
  },
};

export function getFooterContent(lang: Lang): FooterDictionary {
  return FOOTER_DICTIONARIES[lang] ?? FOOTER_DICTIONARIES.rw;
}
