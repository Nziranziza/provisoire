import type { Lang } from './quiz';

export type PrivacySection = {
  title: string;
  paragraphs: string[];
};

export type PrivacyContent = {
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  lastUpdated: string;
  sections: PrivacySection[];
  banner: {
    message: string;
    accept: string;
    decline: string;
    learnMore: string;
  };
  consentWidget: {
    title: string;
    description: string;
    statusLabel: string;
    statusGranted: string;
    statusDenied: string;
    statusUndecided: string;
    grantButton: string;
    denyButton: string;
    resetButton: string;
    updatedToast: string;
  };
  languagesTitle: string;
  languages: string[];
  reportTitle: string;
  reportText: string;
  reportLink: string;
  home: string;
  questions: string;
  trafficRules: string;
  roadSigns: string;
  privacy: string;
  about: string;
  reportHref: string;
};

const content: Record<Lang, PrivacyContent> = {
  en: {
    title: 'Privacy Policy & Cookies — Provisoire',
    description:
      'Learn how Provisoire protects your privacy, manages cookies, and stores offline study data under Rwandan and international data protection standards.',
    eyebrow: 'Privacy & Data Protection',
    intro:
      'Provisoire is built with privacy by design. We believe revision tools should be fast, accessible, and respectful of your personal data. This policy explains what information is processed, how local storage works, and how you control analytics cookies.',
    lastUpdated: 'September 2026',
    sections: [
      {
        title: '1. What Information Is Collected and Why',
        paragraphs: [
          'We collect minimal data necessary to deliver and improve our educational study materials. We distinguish between data that stays on your device and optional analytics data.',
          'Microsoft Clarity (Optional Analytics): When you give consent, we use Microsoft Clarity to understand user behavior through aggregated heatmaps, click patterns, and session replays. This helps us identify usability issues and fix confusing quiz interfaces. Clarity sets first-party cookies (_clck and _clsk) to connect pageviews across a single session and distinguish unique browsers.',
          'Cloudflare Pages (Hosting & Edge Security): Our site is hosted on Cloudflare Pages. Cloudflare automatically processes standard server request logs and IP addresses at network edge points (including their Kigali edge location) for security, DDoS protection, and high-speed asset delivery.',
        ],
      },
      {
        title: '2. Your Practice and Exam Progress Stays on Your Device',
        paragraphs: [
          'All your learning activity — including completed quizzes, mock exam scores, review bookmarks, and question answers — is stored exclusively in your browser’s local storage (localStorage).',
          'This data is never sent to our servers, never synchronized to an external database, and never sold or shared with any third party. If you clear your browser storage, your local progress is reset.',
        ],
      },
      {
        title: '3. Offline Caching and Progressive Web App (PWA)',
        paragraphs: [
          'Provisoire operates as an installable Progressive Web App (PWA) with offline capabilities. Our Service Worker caches the question bank (questions.json), road sign graphics, and application shell on your device.',
          'This cached content is stored locally so that you can study Rwandan traffic rules without an active internet connection. You can remove all cached assets at any time by clearing your browser cache or uninstalling the app.',
        ],
      },
      {
        title: '4. Third-Party Service Providers',
        paragraphs: [
          'We partner with trusted service providers who process data in accordance with strict privacy safeguards:',
          '• Microsoft Corporation (Analytics): Processes telemetry and session recordings only after user consent. For details, review the Microsoft Privacy Statement (https://privacy.microsoft.com/privacystatement).',
          '• Cloudflare, Inc. (Hosting & CDN): Processes edge network requests. For details, review the Cloudflare Privacy Policy (https://www.cloudflare.com/privacypolicy/).',
        ],
      },
      {
        title: '5. Data Retention and Storage Lifespans',
        paragraphs: [
          '• Cookie Consent Preference: Stored in your local storage until you change or reset your decision.',
          '• Analytics Cookies (_clck, _clsk): Managed by Microsoft Clarity with lifespans ranging from the active session up to 1 year.',
          '• Practice History & Quizzes: Retained indefinitely in your local browser storage until you choose to reset them.',
          '• Hosting Logs: Retained by Cloudflare per standard infrastructure security logs retention cycles.',
        ],
      },
      {
        title: '6. Your Rights and Rwandan Law No. 058/2021 Compliance',
        paragraphs: [
          'We adhere to the principles of Rwanda’s Law No. 058/2021 of 13/10/2021 relating to the Protection of Personal Data and Privacy, as well as global standards like the GDPR.',
          'You have the right to know what data is stored, the right to refuse non-essential cookies, the right to erase all client-side data, and the right to withdraw previously granted consent at any time using the control below.',
        ],
      },
      {
        title: '7. How to Manage Cookies and Opt Out',
        paragraphs: [
          'You have full control over cookie settings on Provisoire:',
          '• You can grant, deny, or reset your analytics cookie preferences at any time using the "Manage Cookie Consent" widget on this page.',
          '• To clear all offline questions and practice progress, use your browser settings to "Clear Site Data" for this domain.',
          '• You can also install the Microsoft Clarity Opt-out browser add-on or enable Global Privacy Control (GPC) in your browser.',
        ],
      },
      {
        title: '8. Contact and Data Inquiries',
        paragraphs: [
          'If you have questions regarding this Privacy Policy, wish to report a data concern, or want to suggest improvements, please submit an issue on our GitHub issue tracker.',
        ],
      },
    ],
    banner: {
      message:
        'We use optional analytics cookies (Microsoft Clarity) to understand site usage and improve quizzes. Practice progress stays strictly on your device.',
      accept: 'Accept Analytics',
      decline: 'Decline',
      learnMore: 'Privacy Policy',
    },
    consentWidget: {
      title: 'Manage Cookie Consent',
      description:
        'Control whether optional Microsoft Clarity analytics cookies and session replays are enabled on this device.',
      statusLabel: 'Current Status:',
      statusGranted: 'Accepted — Analytics cookies are active.',
      statusDenied: 'Declined — Analytics cookies are blocked.',
      statusUndecided: 'Not Decided — Banner default active.',
      grantButton: 'Accept Analytics',
      denyButton: 'Decline Analytics',
      resetButton: 'Reset Preference',
      updatedToast: 'Cookie consent preference updated!',
    },
    languagesTitle: 'Available languages',
    languages: ['Kinyarwanda', 'English', 'Français'],
    reportTitle: 'Questions or Concerns?',
    reportText:
      'Have questions about privacy or wish to request information? Open an issue on GitHub.',
    reportLink: 'Contact on GitHub',
    home: 'Home',
    questions: 'Questions',
    trafficRules: 'Traffic rules',
    roadSigns: 'Road signs',
    privacy: 'Privacy Policy',
    about: 'About',
    reportHref: 'https://github.com/Nziranziza/provisoire/issues',
  },
  fr: {
    title: 'Politique de confidentialité et cookies — Provisoire',
    description:
      'Découvrez comment Provisoire protège votre vie privée, gère les cookies et conserve les données d’apprentissage hors ligne conformément aux lois rwandaises et internationales.',
    eyebrow: 'Vie privée & Protection des données',
    intro:
      'Provisoire est conçu selon le principe de respect de la vie privée dès la conception. Nous croyons que les outils de révision doivent être rapides, accessibles et respectueux de vos données personnelles. Cette politique détaille les traitements effectués, le fonctionnement du stockage local et la gestion des cookies.',
    lastUpdated: 'Septembre 2026',
    sections: [
      {
        title: '1. Données collectées et finalités',
        paragraphs: [
          'Nous collectons uniquement le strict minimum nécessaire pour fournir et améliorer nos outils d’apprentissage. Nous distinguons les données locales de votre appareil et les analyses optionnelles.',
          'Microsoft Clarity (Analytique optionnelle) : Avec votre consentement, nous utilisons Microsoft Clarity pour analyser l’ergonomie à travers des cartes de chaleur, des statistiques de clics et des enregistrements de session. Cela permet d’identifier les erreurs d’interface. Clarity dépose des cookies propriétaires (_clck et _clsk) pour relier les pages d’une même session.',
          'Cloudflare Pages (Hébergement et Sécurité) : Notre site est hébergé sur Cloudflare Pages. Cloudflare traite automatiquement les journaux de requêtes et les adresses IP sur son réseau périphérique (y compris au point de présence de Kigali) pour la sécurité et la rapidité de diffusion.',
        ],
      },
      {
        title: '2. Vos entraînements restent 100% sur votre appareil',
        paragraphs: [
          'Toutes vos activités d’apprentissage — incluant les quiz terminés, les notes d’examens blancs, les questions marquées et vos réponses — sont enregistrées exclusivement dans le stockage local de votre navigateur (localStorage).',
          'Ces données ne sont jamais transmises à nos serveurs, jamais synchronisées vers une base de données externe et ne sont jamais vendues ni partagées. Effacer le stockage de votre navigateur réinitialise vos données locales.',
        ],
      },
      {
        title:
          '3. Mise en cache hors ligne et application web progressive (PWA)',
        paragraphs: [
          'Provisoire fonctionne comme une Progressive Web App (PWA) installable et utilisable sans connexion. Notre Service Worker met en cache la banque de questions (questions.json), les images des panneaux et l’interface sur votre appareil.',
          'Ce contenu mis en cache vous permet de réviser le code de la route rwandais sans connexion Internet. Vous pouvez vider ces données en vidant le cache de votre navigateur ou en désinstallant l’application.',
        ],
      },
      {
        title: '4. Sous-traitants et partenaires tiers',
        paragraphs: [
          'Nous faisons appel à des prestataires de confiance opérant selon des normes strictes de protection des données :',
          '• Microsoft Corporation (Analytique) : Traite les données de télémétrie uniquement après consentement. Consultez la Déclaration de confidentialité Microsoft (https://privacy.microsoft.com/privacystatement).',
          '• Cloudflare, Inc. (Hébergement et CDN) : Traite les requêtes réseau. Consultez la Politique de confidentialité Cloudflare (https://www.cloudflare.com/privacypolicy/).',
        ],
      },
      {
        title: '5. Durées de conservation des données',
        paragraphs: [
          '• Préférence de consentement aux cookies : Conservée dans votre navigateur jusqu’à modification de votre part.',
          '• Cookies analytiques (_clck, _clsk) : Gérés par Microsoft Clarity pour une durée allant de la session jusqu’à 1 an.',
          '• Historique d’apprentissage : Conservé localement sur votre appareil jusqu’à suppression par vos soins.',
          '• Journaux d’hébergement : Conservés par Cloudflare selon ses politiques standard de sécurité.',
        ],
      },
      {
        title: '6. Vos droits et conformité à la Loi rwandaise n° 058/2021',
        paragraphs: [
          'Nous respectons les dispositions de la Loi rwandaise n° 058/2021 du 13/10/2021 relative à la protection des données à caractère personnel et de la vie privée, ainsi que les principes du RGPD.',
          'Vous disposez d’un droit d’accès, de refus des cookies non essentiels, d’effacement de vos données locales et de retrait de votre consentement à tout moment grâce au module ci-dessous.',
        ],
      },
      {
        title: '7. Gestion des cookies et désactivation',
        paragraphs: [
          'Vous disposez d’un contrôle total sur vos préférences :',
          '• Vous pouvez accepter, refuser ou réinitialiser les cookies analytiques à tout moment via l’outil de gestion sur cette page.',
          '• Pour supprimer toutes les questions hors ligne et scores, utilisez l’option « Effacer les données de navigation » de votre navigateur.',
          '• Vous pouvez également installer l’extension de désactivation Microsoft Clarity ou activer Global Privacy Control (GPC).',
        ],
      },
      {
        title: '8. Contact et demandes relatives aux données',
        paragraphs: [
          'Pour toute question concernant cette politique ou pour exercer vos droits, vous pouvez ouvrir un ticket sur notre gestionnaire GitHub.',
        ],
      },
    ],
    banner: {
      message:
        'Nous utilisons des cookies analytiques optionnels (Microsoft Clarity) pour améliorer l’application. Vos données d’entraînement restent exclusivement sur votre appareil.',
      accept: 'Accepter',
      decline: 'Refuser',
      learnMore: 'Confidentialité',
    },
    consentWidget: {
      title: 'Gérer vos préférences de cookies',
      description:
        'Contrôlez si les cookies analytiques Microsoft Clarity et les enregistrements de session sont autorisés sur cet appareil.',
      statusLabel: 'Statut actuel :',
      statusGranted: 'Accepté — Les cookies analytiques sont activés.',
      statusDenied: 'Refusé — Les cookies analytiques sont bloqués.',
      statusUndecided: 'Non défini — Bannière active.',
      grantButton: 'Accepter l’analytique',
      denyButton: 'Refuser l’analytique',
      resetButton: 'Réinitialiser le choix',
      updatedToast: 'Préférence de cookies mise à jour !',
    },
    languagesTitle: 'Langues disponibles',
    languages: ['Kinyarwanda', 'English', 'Français'],
    reportTitle: 'Des questions ?',
    reportText:
      'Une question sur vos données ou la confidentialité ? Ouvrez un ticket sur GitHub.',
    reportLink: 'Contacter sur GitHub',
    home: 'Accueil',
    questions: 'Questions',
    trafficRules: 'Règles de circulation',
    roadSigns: 'Panneaux routiers',
    privacy: 'Confidentialité',
    about: 'À propos',
    reportHref: 'https://github.com/Nziranziza/provisoire/issues',
  },
  rw: {
    title: 'Politiki y’ubuzima bwite n’amakuki — Provisoire',
    description:
      'Menya uko Provisoire irinda ubuzima bwite bwanyu, icunga amakuki kandi ikabika amakuru yo kwiga kuri interineti idahari hakurikijwe amategeko y’u Rwanda n’amahanga.',
    eyebrow: 'Ubuzima bwite & Kurinda amakuru',
    intro:
      'Provisoire yateguwe ku buryo yubaha ubuzima bwite bw’abayikoresha. Twizera ko ibikoresho byo kwiga bigomba kwihuta, kuboneka byoroshye kandi bitabangamiye amakuru yanyu bwite. Iyi politiki isobanura amakuru akusanywa, uburyo ububiko bwa telefone bukoreshwa n’uko ucunga amakuki.',
    lastUpdated: 'Nzeri 2026',
    sections: [
      {
        title: '1. Amakuru akusanywa n’impamvu zabyo',
        paragraphs: [
          'Dukusanya gusa amakuru y’ibanze akenewe kugira ngo dutange kandi tunoze ubufasha bwo kwiga. Dutandukanya amakuru aguma ku gikoresho cyanyu n’isuzuma ry’imikoreshereze ridahagazeho.',
          'Microsoft Clarity (Isuzuma ry’imikoreshereze rihitwamo): Iyo mwabyemeye, dukoresha Microsoft Clarity mu gusobanukirwa uburyo urubuga rukoreshwa hagamijwe gukosora amakosa y’imikoreshereze. Clarity ikoresha amakuki yayo (_clck na _clsk) mu guhuza paji zasuwe mu gihe kimwe.',
          'Cloudflare Pages (Ububiko bwa seriveri n’umutekano): Urubuga rwacu rwakirwa na Cloudflare Pages. Cloudflare ibika amakuru asanzwe ya seriveri n’aderesi za IP ku miyoboro yayo (harimo na seriveri iri i Kigali) ku bw’umutekano no kwihutisha paji.',
        ],
      },
      {
        title: '2. Aho mwagejeje mwitoza haguma ku gikoresho cyanyu gusa',
        paragraphs: [
          'Ibikorwa byose byo kwiga mwakoze — harimo ibizamini mwakoze, amanota mwabonye, ibibazo mwameretse n’ibisubizo byanyu — bibikwa mu bubiko bw’imbere muri mushakisha yanyu (localStorage).',
          'Aya makuru ntabwo yigera yoherezwa kuri seriveri zacu, ntabwo asangizwa ahandi kandi ntabwo agurishwa. Iyo usibye amakuru ya mushakisha, amanota yanyu yo kwiga aragenda.',
        ],
      },
      {
        title: '3. Kubika ibibazo bikoreshwa interineti idahari (PWA)',
        paragraphs: [
          'Provisoire ikora nka porogaramu yinjira muri telefone (PWA) ishobora gukoreshwa nta interineti. Porogaramu ibika ububiko bw’ibibazo (questions.json), amashusho y’ibyapa n’imfuruka z’urubuga ku gikoresho cyanyu.',
          'Ibi bituma ushobora kwiga amategeko y’umuhanda yo mu Rwanda igihe cyose niyo waba udafite interineti. Ushobora gusiba ibi byose usibye ububiko bwa mushakisha cyangwa ukuraho porogaramu.',
        ],
      },
      {
        title: '4. Abandi bafatanyabikorwa b’ikoranabuhanga',
        paragraphs: [
          'Dukorana n’ibigo byizewe bikurikiza amategeko yo kurinda amakuru bwite:',
          '• Microsoft Corporation (Isuzuma): Ikusanya amakuru gusa iyo mwabyemeye. Soma Politiki y’ubuzima bwite ya Microsoft (https://privacy.microsoft.com/privacystatement).',
          '• Cloudflare, Inc. (Kwakira urubuga): Ikora ku miyoboro y’urubuga. Soma Politiki y’ubuzima bwite ya Cloudflare (https://www.cloudflare.com/privacypolicy/).',
        ],
      },
      {
        title: '5. Igihe amakuru abikirwa',
        paragraphs: [
          '• Amahitamo y’amakuki: Aguma muri mushakisha yanyu kugeza igihe muyahinduriye.',
          '• Amakuki y’isuzuma (_clck, _clsk): Acungwa na Microsoft Clarity kuva ku isaha imwe kugeza ku mwaka 1.',
          '• Amanota n’imyitozo: Biguma ku gikoresho cyanyu kugeza igihe mubyisibiye.',
          '• Amakuru ya seriveri: Abikwa na Cloudflare hakurikijwe amategeko y’umutekano wa seriveri.',
        ],
      },
      {
        title: '6. Uburenganzira bwanyu n’Itegeko ry’u Rwanda No 058/2021',
        paragraphs: [
          'Dukurikiza amabwiriza agenga Itegeko ry’u Rwanda No 058/2021 ryo ku wa 13/10/2021 ryerekeye kurengera amakuru bwite n’ubuzima bwite bw’umuntu, hamwe n’amabwiriza mpuzamahanga ya GDPR.',
          'Mufite uburenganzira bwo kumenya amakuru abikwa, kwanga amakuki y’isuzuma, gusiba amakuru abitswe ku gikoresho cyanyu no guhindura amahitamo igihe icyo aricyo cyose.',
        ],
      },
      {
        title: '7. Uko wahindura amahitamo y’amakuki no guhagarika isuzuma',
        paragraphs: [
          'Mufite ubushobozi bwose bwo kugenzura amakuki kuri Provisoire:',
          '• Ushobora kwemeza, kwanga cyangwa gusubiramo amahitamo y’amakuki ukoresheje agasanduku k’ubugenzuzi kari hasi kuri iyi paji.',
          '• Gusiba ibibazo n’imyitozo byose, koresha uburyo bwa mushakisha bwo gusiba amakuru y’urubuga (Clear Site Data).',
          '• Ushobora no gukoresha Microsoft Clarity Opt-out cyangwa Global Privacy Control (GPC).',
        ],
      },
      {
        title: '8. Uburyo bwo kutwandikira ku bibazo by’ubuzima bwite',
        paragraphs: [
          'Niba ufite ikibazo cyangwa inyunganizi ku bijyanye n’ubuzima bwite no kurinda amakuru, mwatwandikira mukoresheje urubuga rwa GitHub issue tracker.',
        ],
      },
    ],
    banner: {
      message:
        'Dukoresha amakuki y’isuzuma (Microsoft Clarity) mu rwego rwo kunoza imyitozo. Amakuru y’imyitozo aguma ku gikoresho cyanyu gusa.',
      accept: 'Emeza',
      decline: 'Hana',
      learnMore: 'Ubuzima bwite',
    },
    consentWidget: {
      title: 'Gucunga amakuki n’ubuzima bwite',
      description:
        'GenDatabase niba wemera ko amakuki y’isuzuma ya Microsoft Clarity akoreshwa kuri iki gikoresho.',
      statusLabel: 'Uko bihagaze ubu:',
      statusGranted: 'Byemejwe — Amakuki y’isuzuma arakora.',
      statusDenied: 'Byanzwe — Amakuki y’isuzuma yarahagaritswe.',
      statusUndecided:
        'Ntibirafatwaho umwanzuro — Agasanduku k’amakuki karacyerekanwa.',
      grantButton: 'Emeza isuzuma',
      denyButton: 'Hana isuzuma',
      resetButton: 'Subiramo amahitamo',
      updatedToast: 'Amahitamo y’amakuki yahinduwe neza!',
    },
    languagesTitle: 'Indimi ziboneka',
    languages: ['Kinyarwanda', 'English', 'Français'],
    reportTitle: 'Ufite ikibazo?',
    reportText:
      'Ufite ikibazo ku bijyanye no kurinda amakuru yanyu? Tanga ubutumwa kuri GitHub.',
    reportLink: 'Twandikire kuri GitHub',
    home: 'Ahabanza',
    questions: 'Ibibazo',
    trafficRules: 'Amategeko y’umuhanda',
    roadSigns: 'Ibyapa byo ku muhanda',
    privacy: 'Politiki y’ubuzima bwite',
    about: 'Ibyerekeye',
    reportHref: 'https://github.com/Nziranziza/provisoire/issues',
  },
};

export function getPrivacyContent(lang: Lang): PrivacyContent {
  return content[lang] ?? content.en;
}
