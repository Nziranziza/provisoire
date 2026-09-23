import type { Lang } from './quiz';

export type AboutSection = {
  title: string;
  paragraphs: string[];
};

export type AboutContent = {
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  sections: AboutSection[];
  languagesTitle: string;
  languages: string[];
  reportTitle: string;
  reportText: string;
  reportLink: string;
  home: string;
  questions: string;
  trafficRules: string;
  roadSigns: string;
  about: string;
  reportHref: string;
};

const content: Record<Lang, AboutContent> = {
  en: {
    title: 'About Provisoire — Rwanda Driving Theory Practice',
    description:
      'Learn who runs Provisoire, where its Rwanda driving theory questions come from, and how the study material is maintained.',
    eyebrow: 'About Provisoire',
    intro:
      'Provisoire is a free study tool for people preparing for the Rwandan driving theory exam. It brings traffic rules, road signs, explanations, and practice tests together in one place.',
    sections: [
      {
        title: 'Who runs this site?',
        paragraphs: [
          'Provisoire is an independent study project published under the name Provisoire. It is made to make driving-theory practice easier to access in Rwanda and is not operated by a government agency.',
        ],
      },
      {
        title: 'Where do the questions come from?',
        paragraphs: [
          'The question bank is assembled and adapted from publicly available driving-study and road-safety materials used to explain traffic rules and road signs.',
          'This is unofficial study material. Provisoire is not a government publication, is not the official examination, and does not guarantee that a question will appear in an exam. Always check current official guidance and the instructions given by your driving school or examination authority.',
        ],
      },
      {
        title: 'How is the content maintained?',
        paragraphs: [
          'Questions and explanations are reviewed when changes to the source material are identified and when learners report a possible error. Updates may clarify wording, correct translations, or remove content that is no longer reliable.',
          'Because road rules and examination practices can change, use this site as revision support and confirm important requirements against current official sources.',
        ],
      },
    ],
    languagesTitle: 'Available languages',
    languages: ['Kinyarwanda', 'English', 'Français'],
    reportTitle: 'Found an error?',
    reportText:
      'Please report incorrect wording, translation, answer, or explanation through the GitHub issue tracker so it can be reviewed.',
    reportLink: 'Report an error on GitHub',
    home: 'Home',
    questions: 'Questions',
    trafficRules: 'Traffic rules',
    roadSigns: 'Road signs',
    about: 'About',
    reportHref: 'https://github.com/Nziranziza/provisoire/issues',
  },
  fr: {
    title: 'À propos de Provisoire — Entraînement au code rwandais',
    description:
      'Découvrez qui publie Provisoire, l’origine de ses questions de code rwandais et la manière dont le contenu est maintenu.',
    eyebrow: 'À propos de Provisoire',
    intro:
      'Provisoire est un outil d’étude gratuit pour les personnes qui préparent l’examen théorique du permis de conduire rwandais. Il réunit les règles de circulation, les panneaux, les explications et les entraînements au même endroit.',
    sections: [
      {
        title: 'Qui gère ce site ?',
        paragraphs: [
          'Provisoire est un projet d’étude indépendant publié sous le nom Provisoire. Il a pour objectif de faciliter l’accès à l’entraînement au code au Rwanda et n’est pas géré par une agence gouvernementale.',
        ],
      },
      {
        title: 'D’où viennent les questions ?',
        paragraphs: [
          'La banque de questions est constituée et adaptée à partir de supports publics d’étude de la conduite et de sécurité routière qui présentent les règles de circulation et les panneaux.',
          'Il s’agit d’un support d’étude non officiel. Provisoire n’est pas une publication gouvernementale, ne constitue pas l’examen officiel et ne garantit pas qu’une question apparaisse à l’examen. Consultez toujours les informations officielles à jour ainsi que les consignes de votre auto-école ou de l’autorité d’examen.',
        ],
      },
      {
        title: 'Comment le contenu est-il maintenu ?',
        paragraphs: [
          'Les questions et les explications sont vérifiées lorsqu’une modification des sources est identifiée ou lorsqu’un apprenant signale une erreur possible. Les mises à jour peuvent préciser une formulation, corriger une traduction ou retirer un contenu devenu peu fiable.',
          'Les règles de circulation et les pratiques d’examen pouvant évoluer, utilisez ce site comme aide à la révision et confirmez les exigences importantes auprès des sources officielles actuelles.',
        ],
      },
    ],
    languagesTitle: 'Langues disponibles',
    languages: ['Kinyarwanda', 'English', 'Français'],
    reportTitle: 'Vous avez trouvé une erreur ?',
    reportText:
      'Signalez une formulation, une traduction, une réponse ou une explication incorrecte sur le suivi GitHub afin qu’elle puisse être vérifiée.',
    reportLink: 'Signaler une erreur sur GitHub',
    home: 'Accueil',
    questions: 'Questions',
    trafficRules: 'Règles de circulation',
    roadSigns: 'Panneaux routiers',
    about: 'À propos',
    reportHref: 'https://github.com/Nziranziza/provisoire/issues',
  },
  rw: {
    title: 'Ibyerekeye Provisoire — Imyitozo y’amategeko y’umuhanda',
    description:
      'Menya uyobora Provisoire, aho ibibazo by’amategeko y’umuhanda bikomoka n’uburyo ibikubiyemo bisuzumwa kandi bikavugururwa.',
    eyebrow: 'Ibyerekeye Provisoire',
    intro:
      'Provisoire ni urubuga rw’ubuntu rufasha abitegura ikizamini cy’amategeko y’umuhanda cyo mu Rwanda. Ruhuza amategeko y’umuhanda, ibyapa, ibisobanuro n’ibizamini by’imyitozo ahantu hamwe.',
    sections: [
      {
        title: 'Ni nde uyobora uru rubuga?',
        paragraphs: [
          'Provisoire ni umushinga wigenga wo kwiga, utangazwa ku izina rya Provisoire. Wakozwe kugira ngo imyitozo y’amategeko y’umuhanda iboneke ku buryo bworoshye mu Rwanda kandi ntabwo uyoborwa n’urwego rwa Leta.',
        ],
      },
      {
        title: 'Ibibazo biva he?',
        paragraphs: [
          'Urutonde rw’ibibazo rukusanywa kandi rugahuzwa n’ibikoresho rusange byo kwiga gutwara no kubungabunga umutekano wo mu muhanda bisobanura amategeko n’ibyapa.',
          'Ibi ni ibikoresho byo kwiga bitari ibyemewe na Leta. Provisoire ntabwo ari inyandiko ya Leta, ntabwo ari ikizamini cya Leta kandi ntabwo yemeza ko ikibazo runaka kizaboneka mu kizamini. Buri gihe genzura amabwiriza agezweho atangwa n’inzego zibishinzwe cyangwa n’ishuri wigamo gutwara.',
        ],
      },
      {
        title: 'Ibikubiyemo bisuzumwa bite?',
        paragraphs: [
          'Ibibazo n’ibisobanuro bisuzumwa iyo hari impinduka zigaragaye mu masoko byifashishijwe cyangwa iyo abanyeshuri batanze amakuru ku ikosa rishoboka. Ivugurura rishobora gusobanura neza amagambo, gukosora ubusemuzi cyangwa gukuramo ibitakiri ingenzi.',
          'Kubera ko amategeko y’umuhanda n’imikorere y’ibizamini bishobora guhinduka, koresha uru rubuga nk’ubufasha bwo kwisubiramo kandi wemeze ibisabwa by’ingenzi ukoresheje amakuru agezweho y’inzego zibishinzwe.',
        ],
      },
    ],
    languagesTitle: 'Indimi ziboneka',
    languages: ['Kinyarwanda', 'English', 'Français'],
    reportTitle: 'Wabonye ikosa?',
    reportText:
      'Tanga amakuru ku kibazo, ku busemyi, ku gisubizo cyangwa ku bisobanuro bitari byo ukoresheje GitHub kugira ngo bisuzumwe.',
    reportLink: 'Tanga amakuru ku ikosa kuri GitHub',
    home: 'Ahabanza',
    questions: 'Ibibazo',
    trafficRules: 'Amategeko y’umuhanda',
    roadSigns: 'Ibyapa byo ku muhanda',
    about: 'Ibyerekeye',
    reportHref: 'https://github.com/Nziranziza/provisoire/issues',
  },
};

export function getAboutContent(lang: Lang): AboutContent {
  return content[lang] ?? content.rw;
}
