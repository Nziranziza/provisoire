import type { Lang } from './quiz';

export type TermsSection = {
  title: string;
  paragraphs: string[];
};

export type TermsContent = {
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  lastUpdated: string;
  sections: TermsSection[];
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
  terms: string;
  about: string;
  reportHref: string;
};

const content: Record<Lang, TermsContent> = {
  en: {
    title: 'Terms of Use & Disclaimer — Provisoire',
    description:
      'Read the Terms of Use, unofficial study disclaimer, accuracy limitations, acceptable use, and licensing for the Provisoire revision platform.',
    eyebrow: 'Legal & Disclaimer',
    intro:
      'Please read these Terms of Use carefully before using Provisoire. By accessing or using our practice quizzes, mock exams, or question bank, you agree to be bound by these terms.',
    lastUpdated: 'September 2026',
    sections: [
      {
        title: '1. Unofficial Study Aid & Accuracy Disclaimer',
        paragraphs: [
          'Provisoire is an independent, non-governmental educational study project. It is NOT affiliated with, endorsed by, authorized by, or in any way connected to the Rwanda National Police (RNP), the Government of Rwanda, or any official driver licensing authority.',
          'The questions, answers, road signs, and legal explanations provided on this site are compiled from publicly available educational resources for personal revision purposes only. While we make reasonable efforts to maintain quality, the materials may contain typographical errors, translation differences, or outdated information relative to current official traffic regulations.',
          'Passing mock exams or scoring highly on Provisoire does NOT guarantee that you will pass the official Rwanda provisional driving license examination, nor does it guarantee that any specific question will appear on the official test. Always consult official Rwandan legislation and materials provided by registered driving schools.',
        ],
      },
      {
        title: '2. No Warranty and Limitation of Liability',
        paragraphs: [
          'The service and all study materials are provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, whether express, implied, or statutory.',
          'To the maximum extent permitted by applicable Rwandan law, Provisoire, its maintainers, and its contributors disclaim all warranties, including merchantability, fitness for a particular purpose, and non-infringement. We assume no liability or responsibility for any errors or omissions in content, exam failures, lost study time, or any direct or indirect damages arising from your access to or use of the service.',
        ],
      },
      {
        title: '3. Acceptable Use and Restrictions',
        paragraphs: [
          'You are granted a limited, revocable, non-exclusive license to access and use Provisoire strictly for personal, non-commercial educational study and offline revision.',
          'You agree NOT to: (a) scrape, harvest, crawl, or extract questions, images, or data in bulk using automated tools; (b) repackage, redistribute, sell, rent, or commercially monetize the question bank or application; (c) frame or mirror any part of the site without prior permission; or (d) interfere with the security, availability, or normal operation of the service.',
        ],
      },
      {
        title: '4. Content Sourcing and Intellectual Property',
        paragraphs: [
          'Rwandan traffic laws, official road sign definitions, and statutory rules are public domain legal materials. The selection, software code, interactive quiz engine, and original editorial explanations are the intellectual property of the Provisoire project contributors.',
          'The platform code is provided for open community benefit. You may share direct links to individual questions or pages to help fellow learners, but you may not claim authorship or ownership of the compiled database.',
        ],
      },
      {
        title: '5. Service Modifications and Availability',
        paragraphs: [
          'Because Provisoire is a free, volunteer-maintained study tool, we reserve the right to modify, update, correct, or discontinue any feature, question, or the entire service at any time without prior notice or liability.',
        ],
      },
      {
        title: '6. How to Report Errors and Corrections',
        paragraphs: [
          'We actively welcome contributions and corrections from learners, driving instructors, and road safety advocates. If you identify an inaccurate question, translation mismatch, wrong answer, or unclear explanation, please report it via our GitHub issue tracker.',
        ],
      },
      {
        title: '7. Governing Law',
        paragraphs: [
          'These Terms of Use shall be interpreted and governed in accordance with the laws of the Republic of Rwanda.',
        ],
      },
    ],
    languagesTitle: 'Available languages',
    languages: ['Kinyarwanda', 'English', 'Français'],
    reportTitle: 'Found an error or have questions?',
    reportText:
      'Help us keep the question bank accurate and up to date by reporting issues on GitHub.',
    reportLink: 'Submit on GitHub',
    home: 'Home',
    questions: 'Questions',
    trafficRules: 'Traffic rules',
    roadSigns: 'Road signs',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    about: 'About',
    reportHref: 'https://github.com/Nziranziza/provisoire/issues',
  },
  fr: {
    title: 'Conditions d’utilisation et avertissement — Provisoire',
    description:
      'Consultez les conditions d’utilisation, l’avertissement sur le caractère non officiel, les règles d’usage et les licences de la plateforme Provisoire.',
    eyebrow: 'Mentions légales & Avertissement',
    intro:
      'Veuillez lire attentivement les présentes conditions d’utilisation avant d’utiliser Provisoire. En accédant à nos quiz, examens blancs ou questions, vous acceptez d’être lié par ces conditions.',
    lastUpdated: 'Septembre 2026',
    sections: [
      {
        title: '1. Outil non officiel et clause de non-responsabilité',
        paragraphs: [
          'Provisoire est un projet d’étude éducatif indépendant. Il n’est PAS affilié, approuvé, autorisé ou lié de quelque manière que ce soit à la Police Nationale du Rwanda (RNP), au Gouvernement du Rwanda ou à toute autorité officielle d’examen du permis de conduire.',
          'Les questions, réponses, panneaux routiers et explications juridiques figurant sur ce site sont compilés à partir de ressources pédagogiques publiques à des fins de révision personnelle. Bien que nous nous efforcions de maintenir une haute qualité, les contenus peuvent contenir des erreurs typographiques, des nuances de traduction ou des informations non actualisées par rapport aux récents textes réglementaires.',
          'Réussir les examens blancs ou obtenir d’excellents résultats sur Provisoire ne garantit EN AUCUN CAS votre réussite à l’examen officiel du permis provisoire rwandais, ni la présence des mêmes questions lors de l’épreuve officielle. Consultez toujours les textes officiels et les instructions de votre auto-école agréée.',
        ],
      },
      {
        title: '2. Absence de garantie et limitation de responsabilité',
        paragraphs: [
          'Le service et l’ensemble des contenus sont fournis « EN L’ÉTAT » et « SELON DISPONIBILITÉ », sans aucune garantie expresse, implicite ou légale.',
          'Dans toute la mesure permise par le droit rwandais, Provisoire et ses contributeurs déclinent toute garantie d’exactitude, d’adéquation à un usage particulier ou de non-violation. Nous déclinons toute responsabilité en cas d’erreurs ou d’omissions, d’échec à l’examen, de temps perdu ou de tout préjudice direct ou indirect résultant de l’utilisation du site.',
        ],
      },
      {
        title: '3. Utilisation autorisée et restrictions',
        paragraphs: [
          'Il vous est accordé un droit d’accès personnel, révocable et non exclusif pour utiliser Provisoire uniquement à des fins d’apprentissage individuel et de révision hors-ligne.',
          'Il est strictement interdit de : (a) collecter, aspirer (scraping) ou extraire massivement les questions ou images à l’aide d’outils automatisés ; (b) redistribuer, vendre, louer ou commercialiser la banque de questions ; (c) intégrer le site dans un cadre (iframe) ou un miroir sans autorisation préalable ; ou (d) porter atteinte à la sécurité ou au bon fonctionnement du service.',
        ],
      },
      {
        title: '4. Sources du contenu et propriété intellectuelle',
        paragraphs: [
          'Les règles du code de la route et les définitions des panneaux routiers rwandais relèvent du domaine public. La structure du code, le moteur interactif de quiz, la mise en page et les explications originales constituent la propriété intellectuelle du projet Provisoire.',
          'Le code source est mis à disposition au bénéfice de la communauté. Vous pouvez partager des liens directs vers les questions pour aider d’autres candidats, mais vous ne pouvez pas vous approprier la base de données compilée.',
        ],
      },
      {
        title: '5. Modifications et disponibilité du service',
        paragraphs: [
          'Provisoire étant un outil bénévole et gratuit, nous nous réservons le droit de modifier, corriger, suspendre ou interrompre tout ou partie du service à tout moment, sans préavis ni indemnité.',
        ],
      },
      {
        title: '6. Signalement d’erreurs et contributions',
        paragraphs: [
          'Nous encourageons vivement les apprenants, moniteurs d’auto-école et professionnels de la route à nous signaler toute question erronée, mauvaise traduction ou explication imprécise via notre outil de suivi GitHub.',
        ],
      },
      {
        title: '7. Droit applicable',
        paragraphs: [
          'Les présentes conditions d’utilisation sont régies et interprétées conformément aux lois de la République du Rwanda.',
        ],
      },
    ],
    languagesTitle: 'Langues disponibles',
    languages: ['Kinyarwanda', 'English', 'Français'],
    reportTitle: 'Une erreur à signaler ?',
    reportText:
      'Aidez-nous à maintenir des questions fiables en signalant les anomalies sur GitHub.',
    reportLink: 'Signaler sur GitHub',
    home: 'Accueil',
    questions: 'Questions',
    trafficRules: 'Règles de circulation',
    roadSigns: 'Panneaux routiers',
    privacy: 'Confidentialité',
    terms: 'Conditions d’utilisation',
    about: 'À propos',
    reportHref: 'https://github.com/Nziranziza/provisoire/issues',
  },
  rw: {
    title: 'Amabwiriza n’Inshingano — Provisoire',
    description:
      'Soma amabwiriza agenga imikoreshereze, itangazo ry’uko uru rubuga ari urwo kwiga gusa, inshingano n’uburenganzira kuri Provisoire.',
    eyebrow: 'Amategeko & Inshingano',
    intro:
      'Nyamuneka soma aya mabwiriza witonze mbere yo gukoresha Provisoire. Gukoresha iyi myitozo n’ibibazo byo kwiga bishatse kuvuga ko wemeye aya mabwiriza.',
    lastUpdated: 'Nzeri 2026',
    sections: [
      {
        title: '1. Ubufasha bw’imyitozo butari ubwa Leta n’Inshingano',
        paragraphs: [
          'Provisoire ni umushinga wigenga w’uburezi ufasha abantu kwitegura. NTABWO ifitanye isano, itegurwa, cyangwa ngo yemezwe na Polisi y’u Rwanda (RNP), Guverinoma y’u Rwanda cyangwa urwego urwo arirwo rwose rutanga ibizamini byo gutwara.',
          'Ibibazo, ibisubizo, ibyapa n’ibisobanuro biri kuri uru rubuga byakusanyijwe mu nyandiko rusange zo kwiga amategeko y’umuhanda ku bw’imyitozo bwite. Nubwo dukora ibishoboka byose ngo amakuru abe yizewe, hashobora kubamo amakosa y’imyandikire, ubusemuzi, cyangwa amategeko yahindutse kuva byandikwa.',
          'Gutsinda imyitozo cyangwa ibizamini by’ikitegererezo kuri Provisoire NTABWO bitanga ingwate ko uzatsinda ikizamini nyakuri cy’uruhushya rw’agateganyo gitangwa na Polisi y’u Rwanda, cyangwa ko ibi bibazo aribyo bizaza mu kizamini. Buri gihe kurikiza amategeko agezweho n’inyigisho z’ishuri ryemewe wigiramo gutwara.',
        ],
      },
      {
        title: '2. Nta ngwate no kumenyesha inshingano',
        paragraphs: [
          'Iyi porogaramu n’ibiyigize byose bitangwa "UKO BIMEZE" nta ngwate y’ubwoko ubwo aribwo bwose, yaba yeruye cyangwa iteruye.',
          'Mu buryo bwemewe n’amategeko y’u Rwanda, abategura Provisoire ntabwo bazabazwa amakosa, gutsindwa mu kizamini, umwanya watakaye cyangwa ibindi bibazo ibyo aribyo byose byaturuka ku gukoresha uru rubuga.',
        ],
      },
      {
        title: '3. Imikoreshereze yemewe n’ibibujijwe',
        paragraphs: [
          'Uhawe uburenganzira bwo gukoresha Provisoire mu kwiga ku giti cyawe no gusubiramo ibibazo nta interineti.',
          'Birabujijwe rwose: (a) gukuraho cyangwa gukusanya ibibazo n’amashusho byose mu buryo bwikora (scraping); (b) gucuruza, gukodesha cyangwa gukwirakwiza iyi banki y’ibibazo ku nyungu z’amafaranga; (c) gufata no gushyira uru rubuga ahandi utabiherewe uburenganzira; cyangwa (d) kubangamira umutekano n’imikorere y’urubuga.',
        ],
      },
      {
        title: '4. Inkomoko y’ibiriho n’Uburenganzira',
        paragraphs: [
          'Amategeko y’umuhanda n’ibyapa byo mu Rwanda ni amakuru rusange ya Leta. Porogaramu, uburyo ibibazo bibazwamo n’ibisobanuro byateguwe ni umutungo mu by’ubwenge w’abategura Provisoire.',
          'Ushobora gusangiza abandi amashami y’ibibazo kugira ngo bafashwe kwiga, ariko ntushobora kwiyitirira iyi nyandiko yose cyangwa kuyibyaza umusaruro w’ubucuruzi.',
        ],
      },
      {
        title: '5. Guhindura cyangwa guhagarika ubufasha',
        paragraphs: [
          'Kubera ko Provisoire ari ubufasha bw’ubuntu buterwa inkunga n’abagiraneza, dufite uburenganzira bwo guhindura, gukosora cyangwa guhagarika ibice runaka by’urubuga igihe icyo aricyo cyose nta nteguza.',
        ],
      },
      {
        title: '6. Gutanga amakuru ku makosa',
        paragraphs: [
          'Dushimira abanyeshuri n’abigisha amategeko y’umuhanda badufasha gukosora amakosa. Niba ubonye ikibazo kitari cyo, ubusemuzi bufutamye cyangwa igisubizo kidasobanutse, tubwire unyuze kuri GitHub issue tracker.',
        ],
      },
      {
        title: '7. Amategeko agenga aya mabwiriza',
        paragraphs: [
          'Aya mabwiriza agengwa kandi asobanurwa hakurikijwe amategeko ya Repubulika y’u Rwanda.',
        ],
      },
    ],
    languagesTitle: 'Indimi ziboneka',
    languages: ['Kinyarwanda', 'English', 'Français'],
    reportTitle: 'Ufite ikibazo cyangwa inyunganizi?',
    reportText:
      'Dufashe gutunganya neza ibibazo utanga amakuru ku makosa kuri GitHub.',
    reportLink: 'Tanga amakuru kuri GitHub',
    home: 'Ahabanza',
    questions: 'Ibibazo',
    trafficRules: 'Amategeko y’umuhanda',
    roadSigns: 'Ibyapa byo ku muhanda',
    privacy: 'Politiki y’ubuzima bwite',
    terms: 'Amabwiriza n’Inshingano',
    about: 'Ibyerekeye',
    reportHref: 'https://github.com/Nziranziza/provisoire/issues',
  },
};

export function getTermsContent(lang: Lang): TermsContent {
  return content[lang] ?? content.en;
}
