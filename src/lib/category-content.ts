import type { Lang } from './quiz';

export interface CategoryEditorialSection {
  title: string;
  icon?: string;
  paragraphs: string[];
  keyPoints?: { label: string; text: string }[];
}

export interface CategoryHubContent {
  slug: string;
  categoryId: number;
  categoryName: string;
  badge: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  subheadline: string;
  stats: {
    questionCount: number;
    passRequirement: string;
    examWeight: string;
    format: string;
  };
  cta: {
    heading: string;
    description: string;
    practiceBtn: string;
    examBtn: string;
    perks: string[];
  };
  editorial: {
    lead: string;
    sections: CategoryEditorialSection[];
  };
  faqHeading: string;
  faqSubheading: string;
  curatedFaqQuestionIds: string[];
  relatedCategory: {
    id: number;
    slug: string;
    title: string;
    description: string;
    btnText: string;
  };
  allQuestionsHeading: string;
  allQuestionsSubheading: string;
}

export const CATEGORY_CONTENT: Record<
  Lang,
  Record<'traffic-rules' | 'road-signs', CategoryHubContent>
> = {
  en: {
    'traffic-rules': {
      slug: 'traffic-rules',
      categoryId: 1,
      categoryName: 'Traffic Rules',
      badge: 'Core Legal Syllabus · 101 Questions',
      title: 'Rwanda Traffic Rules Test Questions & Answers (2026)',
      metaTitle:
        'Rwanda Traffic Rules Test Questions & Answers (2026) — Provisoire',
      metaDescription:
        'Study 101 Rwanda provisional driving test traffic rules questions in English. Learn right-of-way, speed limits, parking, and pass the RNP exam.',
      headline: "Rwanda Traffic Rules (Amategeko y'Umuhanda)",
      subheadline:
        '101 questions covering right-of-way, speed limits, overtaking, parking laws, and lighting standards for the Rwanda provisional driving test.',
      stats: {
        questionCount: 101,
        passRequirement: '12 / 20 (60%)',
        examWeight: '~55% of Exam',
        format: 'Touchscreen MCQ',
      },
      cta: {
        heading: 'Test Your Knowledge on Traffic Rules',
        description:
          'Practice all 101 traffic law questions with instant answer reveal, legal explanations, and official scoring.',
        practiceBtn: 'Practice Traffic Rules',
        examBtn: 'Start 20-Min Timed Exam',
        perks: [
          'Immediate answer check with legal rationale',
          'Covers priority, speed limits, towing & lighting',
          'Works 100% offline on mobile & desktop',
        ],
      },
      editorial: {
        lead: 'Traffic rules form the core syllabus of the Rwanda National Police (RNP) provisional driving test, testing driver obligations, safety laws, and right-of-way on public roads.',
        sections: [
          {
            title: 'How Traffic Rules Appear in the Real RNP Exam',
            icon: '📋',
            paragraphs: [
              'When taking the computerized provisional test at an official testing center, the computer system randomly draws 20 multiple-choice questions from the national question bank. On average, 10 to 12 of those 20 questions evaluate core traffic rules and legal situational judgments.',
              'You are allotted 20 minutes to complete the exam. To pass and receive your provisional permit certificate, you must achieve a score of at least 12 out of 20 (60%). Questions are single-choice with four options (A, B, C, D), and many contain nuanced conditions such as exceptions for emergency vehicles or nighttime lighting distances.',
            ],
            keyPoints: [
              {
                label: 'Test Structure',
                text: '20 questions randomly selected, 20-minute countdown timer.',
              },
              {
                label: 'Pass Threshold',
                text: 'Minimum 12/20 required to earn your provisional license.',
              },
              {
                label: 'Question Style',
                text: 'Multiple-choice questions testing statutory definitions, distance measurements, and priority rules.',
              },
            ],
          },
          {
            title: 'Core Legal Domains Covered in this 101-Question Bank',
            icon: '⚖️',
            paragraphs: [
              'The 101 traffic rule questions in our bank cover every clause tested by the Rwanda National Police. Mastering these concepts ensures you never get surprised on test day:',
            ],
            keyPoints: [
              {
                label: 'Priority & Right-of-Way',
                text: 'General rule of priority to the right at uncontrolled intersections, absolute priority for vehicles already circulating inside a roundabout (traffic circle), and duty to yield to emergency vehicles emitting sirens or flashing beacons (ambulances, police, firefighting).',
              },
              {
                label: 'Speed Limits & Speed Management',
                text: 'Standard statutory speed limits: 40 km/h in built-up urban zones and agglomerations, and 80 km/h on open national highways. Mandatory speed reduction when approaching schools, hospitals, pedestrian crossings, sharp bends, and crests.',
              },
              {
                label: 'Overtaking (Passing) Regulations',
                text: 'Overtaking must be done on the left. Strictly prohibited on blind curves, hill crests, railway crossings, pedestrian zebra crossings, and when another vehicle behind has already commenced passing.',
              },
              {
                label: 'Stopping & Parking Laws',
                text: 'Clear distinction between stopping (temporary halt to drop/pick passengers) and parking (vehicle left stationary). Required clearance distances from intersections (5m), pedestrian crossings, fire hydrants, and bus stops.',
              },
              {
                label: 'Vehicle Lighting & Visibility Standards',
                text: 'Switching from high beams (road lights) to low beams (passing lights) when following within 50m or meeting oncoming traffic. Minimum reflector visibility (150m in clear weather), clearance lights for vehicles wider than 2.10m, and white/yellow front vs red rear indicators.',
              },
              {
                label: 'Towing, Loads & Safety Equipment',
                text: 'Rigid bar towing rules, mandatory reflective warning triangles, red flagging for projecting cargo, prohibition of carrying children under 12 in the front seat when rear seats are available, and safety belt mandates.',
              },
            ],
          },
          {
            title: 'Proven Strategies for High Exam Scores',
            icon: '🎯',
            paragraphs: [
              'Many candidates lose marks not from lack of knowledge, but due to tricky phrasing. In Rwandan traffic law, pay close attention to qualifier words like "always", "strictly forbidden", "unless signaled otherwise", and "None of the answers is correct".',
              'Take time to review the numerical figures: maximum width allowances (2.50m / 2.10m for clearance lights), reflector visibility distances (150m), high beam illumination distance (100m minimum), and low beam illumination (40m minimum).',
            ],
          },
        ],
      },
      faqHeading: 'Frequently Asked Traffic Rules Questions',
      faqSubheading:
        'Key legal questions from the Rwandan provisional exam with verified correct answers and explanations.',
      curatedFaqQuestionIds: [
        '037a184e-247a-43b7-ab0d-207bed0579f7',
        '07d67991-c02a-4800-b7ee-90593f88f241',
        '0962f1fc-3431-4c2e-ae09-6d06a8bf7505',
        '0cb9bf9a-c522-458f-aded-57f2e089693e',
        'ff6d72c6-2ec7-4cda-97d9-6d924a94a62f',
      ],
      relatedCategory: {
        id: 2,
        slug: 'road-signs',
        title: 'Road Signs Hub (97 Questions)',
        description:
          'Master warning triangles, prohibitory circles, mandatory directions, and road markings.',
        btnText: 'Explore Road Signs',
      },
      allQuestionsHeading:
        'Complete Traffic Rules Question Bank (101 Questions)',
      allQuestionsSubheading:
        'Browse every question in this category. Click any question to open its dedicated study page with full translation and legal rationale.',
    },
    'road-signs': {
      slug: 'road-signs',
      categoryId: 2,
      categoryName: 'Road Signs',
      badge: 'Visual Signage Syllabus · 97 Questions',
      title: 'Rwanda Road Signs Test Questions & Answers (2026)',
      metaTitle:
        'Rwanda Road Signs Test Questions & Answers (2026) — Provisoire',
      metaDescription:
        'Study 97 Rwanda road signs with images and answers in English. Warning, prohibitory, mandatory, and information signs for the provisional exam.',
      headline: 'Rwanda Road Signs (Ibyapa byo mu Muhanda)',
      subheadline:
        '97 questions covering danger warning triangles, prohibitory orders, mandatory actions, direction indicators, and road markings.',
      stats: {
        questionCount: 97,
        passRequirement: '12 / 20 (60%)',
        examWeight: '~45% of Exam',
        format: 'Image-Based MCQ',
      },
      cta: {
        heading: 'Test Your Knowledge on Road Signs',
        description:
          'Practice all 97 road sign questions with high-resolution visual sign images and instant feedback.',
        practiceBtn: 'Practice Road Signs',
        examBtn: 'Start 20-Min Timed Exam',
        perks: [
          'Full color sign illustrations matching the real exam',
          'Covers warning, prohibitory, mandatory & ground markings',
          'Works 100% offline on mobile & desktop',
        ],
      },
      editorial: {
        lead: 'Road signs communicate essential hazard alerts, legal restrictions, and directional instructions across Rwanda’s road network.',
        sections: [
          {
            title: 'How Road Signs Appear in the Real RNP Exam',
            icon: '🚦',
            paragraphs: [
              'In the Rwanda National Police computer exam, approximately 8 to 10 of your 20 test questions will involve identifying road signs or interpreting complex traffic scenarios illustrated with aerial road diagrams and intersection layouts.',
              'Each sign question displays a clear graphic followed by 4 multiple-choice options. You must identify either the official definition of the sign, the required driver action (e.g., reduce speed, yield right-of-way, do not turn), or the vehicle with correct positioning at an intersection.',
            ],
            keyPoints: [
              {
                label: 'Visual Questions',
                text: 'High proportion of questions contain sign graphics or junction schematics.',
              },
              {
                label: 'Action-Oriented',
                text: 'Questions test not only what a sign is called, but what specific legal behavior it obligates.',
              },
              {
                label: 'Hierarchy of Authority',
                text: 'Remember the legal priority: Police officer signals > Traffic lights > Road signs > General traffic rules.',
              },
            ],
          },
          {
            title: 'The Four Fundamental Road Sign Categories in Rwanda',
            icon: '🛑',
            paragraphs: [
              'Rwanda uses standard international geometric shapes and color schemes to convey different degrees of urgency and instruction:',
            ],
            keyPoints: [
              {
                label: '1. Danger Warning Signs (Panneaux de danger)',
                text: 'Triangular signs with a red border and white/yellow background. Warn drivers of impending hazards such as sharp bends, steep descents, narrow bridges, pedestrian crossings, animal crossings, or roadworks. Driver must slow down and exercise caution.',
              },
              {
                label:
                  '2. Prohibitory & Restrictive Signs (Panneaux d’interdiction)',
                text: 'Circular signs with a red border and white background (or diagonal red slash). Express absolute legal prohibitions: No Entry, No Overtaking, Maximum Speed Limits, No Left/Right Turn, No Parking, and Axle Weight limits.',
              },
              {
                label:
                  '3. Mandatory / Obligation Signs (Panneaux d’obligation)',
                text: 'Circular signs with a blue background and white symbols/arrows. Instruct drivers on mandatory actions: Compulsory direction ahead, Roundabout circulation, Minimum speed, or Dedicated bicycle/bus lanes.',
              },
              {
                label:
                  '4. Information, Facility & Direction Signs (Panneaux d’indication)',
                text: 'Rectangular or square signs with blue, green, or white backgrounds. Provide useful guidance: Hospital nearby, Parking zone, One-way street, Dead-end road (cul-de-sac), and Destination route markers.',
              },
              {
                label: '5. Road Surface Markings (Marquages au sol)',
                text: 'Solid continuous white lines (strictly forbidden to cross or straddle), broken dashed lines (overtaking permitted when safe), double continuous lines, zebra pedestrian crossings, and yellow box junctions.',
              },
            ],
          },
          {
            title: 'Top Mistakes to Avoid on Road Sign Questions',
            icon: '💡',
            paragraphs: [
              'A frequent mistake is confusing circular prohibitory signs with circular mandatory signs. Red circle = Prohibited / Forbidden; Blue circle = Mandatory / Required.',
              'Another common trap involves intersection position diagrams (e.g. which car is in the correct lane to turn). Always evaluate lane arrows, solid road markings, and whether the driver must yield to oncoming traffic before turning across traffic lanes.',
            ],
          },
        ],
      },
      faqHeading: 'Frequently Asked Road Signs Questions',
      faqSubheading:
        'Key visual sign questions and intersection scenarios from the Rwandan provisional test with verified solutions.',
      curatedFaqQuestionIds: [
        '01dd53f5-8ec4-402e-8dac-4ea0d81a12f6',
        '04fd5735-fdf1-4302-ba53-b5bbd785a858',
        '06091ab3-8cd3-406b-ba10-dc9f694c5c61',
        '0875f6fd-fd54-40aa-bf2f-df0013d19811',
        '0b789dc3-d0f3-436e-bc2c-eb4e1c81108b',
      ],
      relatedCategory: {
        id: 1,
        slug: 'traffic-rules',
        title: 'Traffic Rules Hub (101 Questions)',
        description:
          'Learn right-of-way, speed regulations, overtaking laws, vehicle lighting, and parking protocols.',
        btnText: 'Explore Traffic Rules',
      },
      allQuestionsHeading: 'Complete Road Signs Question Bank (97 Questions)',
      allQuestionsSubheading:
        'Browse every visual question in this category. Click any question to view full high-res sign images, options, and comprehensive answer rationales.',
    },
  },
  fr: {
    'traffic-rules': {
      slug: 'traffic-rules',
      categoryId: 1,
      categoryName: 'Règles de Circulation',
      badge: 'Programme Juridique Officiel · 101 Questions',
      title: 'Règles de Circulation — Examen Permis Provisoire Rwanda (2026)',
      metaTitle:
        'Règles de Circulation — Examen Permis Provisoire Rwanda (2026) — Provisoire',
      metaDescription:
        'Révisez les 101 questions sur les règles de circulation routière pour le permis provisoire au Rwanda en français. Priorités, vitesse et explications.',
      headline: 'Règles de Circulation Routière au Rwanda',
      subheadline:
        '101 questions officielles sur les priorités de passage, limitations de vitesse, dépassements, stationnement et éclairage.',
      stats: {
        questionCount: 101,
        passRequirement: '12 / 20 (60%)',
        examWeight: '~55% du Test',
        format: 'QCM sur Écran Tactile',
      },
      cta: {
        heading: 'Entraînez-vous sur les Règles de Circulation',
        description:
          'Pratiquez les 101 questions du code de la route avec correction immédiate et explications juridiques détaillées.',
        practiceBtn: 'S’entraîner sur les Règles',
        examBtn: 'Lancer l’Examen Blanc (20 Min)',
        perks: [
          'Affichage instantané de la bonne réponse et de la justification',
          'Priorité, limitations de vitesse, éclairage et remorquage',
          'Fonctionne 100% hors-ligne sur mobile et ordinateur',
        ],
      },
      editorial: {
        lead: 'Les règles de circulation constituent la base de l’examen théorique du permis de conduire provisoire de la Police Nationale du Rwanda (RNP).',
        sections: [
          {
            title: 'Organisation de l’Épreuve Théorique de la Police (RNP)',
            icon: '📋',
            paragraphs: [
              'Lors de l’examen officiel sur ordinateur, le système sélectionne aléatoirement 20 questions parmi la banque nationale. Entre 10 et 12 de ces questions portent directement sur les règles de circulation et les cas de priorité.',
              'Le candidat dispose de 20 minutes pour répondre aux 20 questions à choix multiples (4 options par question). Pour obtenir l’attestation de réussite du permis provisoire, il est obligatoire d’obtenir au minimum 12 bonnes réponses sur 20 (soit 60%).',
            ],
            keyPoints: [
              {
                label: 'Format du test',
                text: '20 questions aléatoires générées par ordinateur en 20 minutes chrono.',
              },
              {
                label: 'Note de passage',
                text: 'Minimum 12/20 exigé par la Police Nationale du Rwanda.',
              },
              {
                label: 'Types de questions',
                text: 'Questions textuelles portant sur les articles de loi, distances réglementaires et règles de priorité.',
              },
            ],
          },
          {
            title:
              'Principaux Thèmes Juridiques Traités dans les 101 Questions',
            icon: '⚖️',
            paragraphs: [
              'Cette banque complète de 101 questions détaille l’ensemble des notions légales indispensables pour réussir votre test du premier coup :',
            ],
            keyPoints: [
              {
                label: 'Priorités de passage',
                text: 'Priorité à droite aux carrefours sans signalisation, priorité absolue aux véhicules engagés dans les carrefours à sens giratoire (rond-point), et obligation de céder le passage aux véhicules prioritaires munis d’avertisseurs sonores ou lumineux spéciaux (police, ambulances, pompiers).',
              },
              {
                label: 'Limitations de vitesse',
                text: 'Vitesse maximale autorisée de 40 km/h dans les agglomérations et zones urbaines, et 80 km/h hors agglomération sur les routes nationales. Ralentissement obligatoire à l’approche des écoles, hôpitaux, passages pour piétons et virages serrés.',
              },
              {
                label: 'Règles de dépassement',
                text: 'Le dépassement s’effectue obligatoirement par la gauche. Il est strictement interdit dans les virages sans visibilité, aux sommets de côtes, aux passages à niveau, sur les passages piétons et lorsqu’un véhicule suiveur a déjà entamé une manœuvre.',
              },
              {
                label: 'Arrêt et stationnement',
                text: 'Distinction entre l’arrêt (immobilisation temporaire pour embarquement/débarquement) et le stationnement. Distances minimales à respecter par rapport aux carrefours (5 mètres), bouches d’incendie et arrêts d’autobus.',
              },
              {
                label: 'Éclairage et feux du véhicule',
                text: 'Remplacement des feux de route par les feux de croisement lors du croisement d’autres usagers ou lorsque l’on suit un véhicule à moins de 50 m. Feux d’encombrement pour les véhicules de plus de 2,10 m de large, catadioptres visibles à 150 m par temps clair.',
              },
              {
                label: 'Sécurité, chargement et passagers',
                text: 'Interdiction de transporter des enfants de moins de 12 ans sur le siège avant s’il existe des places à l’arrière, port obligatoire de la ceinture, et signalisation des chargements dépassant le gabarit.',
              },
            ],
          },
          {
            title: 'Conseils pour Réussir vos Questions Juridiques',
            icon: '🎯',
            paragraphs: [
              'Lisez attentivement chaque énoncé en repérant les termes clés comme « obligatoire », « interdit », « sauf indication contraire » ou « Aucune des réponses n’est correcte ».',
              'Mémorisez avec précision les valeurs numériques (distances de visibilité, gabarits et vitesses maximales) qui reviennent fréquemment dans les questions d’examen.',
            ],
          },
        ],
      },
      faqHeading: 'Questions Fréquentes sur les Règles de Circulation',
      faqSubheading:
        'Exemples représentatifs tirés de l’examen officiel du permis provisoire avec réponses certifiées.',
      curatedFaqQuestionIds: [
        '037a184e-247a-43b7-ab0d-207bed0579f7',
        '07d67991-c02a-4800-b7ee-90593f88f241',
        '0962f1fc-3431-4c2e-ae09-6d06a8bf7505',
        '0cb9bf9a-c522-458f-aded-57f2e089693e',
        'ff6d72c6-2ec7-4cda-97d9-6d924a94a62f',
      ],
      relatedCategory: {
        id: 2,
        slug: 'road-signs',
        title: 'Panneaux de Signalisation (97 Questions)',
        description:
          'Étudiez les panneaux de danger, interdiction, obligation et marquages routiers avec images officielles.',
        btnText: 'Voir les Panneaux Routiers',
      },
      allQuestionsHeading:
        'Banque Complète des Règles de Circulation (101 Questions)',
      allQuestionsSubheading:
        'Consultez toutes les questions de cette catégorie. Cliquez sur une question pour ouvrir sa fiche d’étude individuelle avec options et justifications.',
    },
    'road-signs': {
      slug: 'road-signs',
      categoryId: 2,
      categoryName: 'Panneaux de Signalisation',
      badge: 'Signalisation Visuelle Officielle · 97 Questions',
      title: 'Panneaux de Signalisation — Permis Provisoire Rwanda (2026)',
      metaTitle:
        'Panneaux de Signalisation — Permis Provisoire Rwanda (2026) — Provisoire',
      metaDescription:
        'Guide des 97 panneaux de signalisation routière du permis provisoire rwandais avec images, définitions et réponses officielles en français.',
      headline: 'Panneaux et Signalisation Routière au Rwanda',
      subheadline:
        '97 questions illustrées sur les panneaux de danger, d’interdiction, d’obligation, d’indication et marquages au sol.',
      stats: {
        questionCount: 97,
        passRequirement: '12 / 20 (60%)',
        examWeight: '~45% du Test',
        format: 'QCM Visuel Illustré',
      },
      cta: {
        heading: 'Entraînez-vous sur les Panneaux de Signalisation',
        description:
          'Révisez les 97 questions de signalisation avec des illustrations nettes et une correction instantanée.',
        practiceBtn: 'S’entraîner sur les Panneaux',
        examBtn: 'Lancer l’Examen Blanc (20 Min)',
        perks: [
          'Illustrations fidèles aux écrans de l’examen officiel',
          'Danger, interdiction, obligation, indication et marquages au sol',
          'Fonctionne 100% hors-ligne sur smartphone et ordinateur',
        ],
      },
      editorial: {
        lead: 'Les panneaux routiers constituent la signalisation visuelle indispensable pour circuler en toute sécurité sur les routes du Rwanda.',
        sections: [
          {
            title: 'Place de la Signalisation Routière dans l’Examen de la RNP',
            icon: '🚦',
            paragraphs: [
              'Dans le test informatisé du permis provisoire, près de la moitié des questions (environ 8 à 10 sur 20) comportent des images de panneaux ou des schémas d’intersections.',
              'Chaque question présente le panneau ou la situation de circulation, puis propose 4 options de réponse. Le candidat doit désigner soit la signification exacte du panneau, soit la manœuvre requise, soit le véhicule prioritaire selon le positionnement.',
            ],
            keyPoints: [
              {
                label: 'Questions visuelles',
                text: 'Nombreuses questions illustrées par des pictogrammes officiels et schémas d’intersection.',
              },
              {
                label: 'Comportement attendu',
                text: 'Le test évalue l’action que le conducteur doit effectuer (ralentir, céder le passage, tourner).',
              },
              {
                label: 'Hiérarchie de la signalisation',
                text: 'Ordre de priorité : Injonctions des agents de police > Feux de signalisation > Panneaux routiers > Règles générales de priorité.',
              },
            ],
          },
          {
            title: 'Les 4 Grandes Familles de Panneaux Routiers au Rwanda',
            icon: '🛑',
            paragraphs: [
              'Le code de la route utilise des formes géométriques et des couleurs spécifiques pour distinguer la nature du message transmis :',
            ],
            keyPoints: [
              {
                label: '1. Panneaux de danger (Triangulaires)',
                text: 'Forme triangulaire à bordure rouge et fond blanc/jaune. Annoncent un danger imminent : virage dangereux, descente raide, chaussée rétrécie, passage pour piétons ou travaux. Ralentissement immédiat requis.',
              },
              {
                label:
                  '2. Panneaux d’interdiction et de restriction (Circulaires à bord rouge)',
                text: 'Forme ronde bordée de rouge. Imposent une interdiction stricte : Sens interdit, interdiction de dépasser, limitation de vitesse, interdiction de tourner ou de stationner.',
              },
              {
                label: '3. Panneaux d’obligation (Circulaires à fond bleu)',
                text: 'Forme ronde à fond bleu avec symbole blanc. Prescrivent une obligation légale : Direction obligatoire, sens giratoire obligatoire, piste cyclable ou vitesse minimale obligatoire.',
              },
              {
                label:
                  '4. Panneaux d’indication et de service (Carrés ou rectangulaires)',
                text: 'Forme rectangulaire à fond bleu ou blanc. Fournissent des renseignements utiles : Hôpital, poste de secours, parking, voie sans issue (cul-de-sac), route à sens unique et indications de direction.',
              },
              {
                label: '5. Marquages routiers au sol',
                text: 'Ligne blanche continue (infranchissable), ligne discontinue (dépassement autorisé), lignes mixtes, passages piétons zébrés et flèches de sélection de voie.',
              },
            ],
          },
          {
            title: 'Pièges Fréquents à Éviter lors du Test',
            icon: '💡',
            paragraphs: [
              'Ne confondez pas les panneaux d’interdiction (ronds à bord rouge) avec les panneaux d’obligation (ronds à fond bleu). Rond rouge = Interdit ; Rond bleu = Obligatoire.',
              'Sur les schémas de carrefour avec plusieurs voitures, vérifiez toujours les lignes tracées sur la chaussée et la position relative des véhicules avant de valider votre choix.',
            ],
          },
        ],
      },
      faqHeading: 'Questions Fréquentes sur les Panneaux Routiers',
      faqSubheading:
        'Sélection de questions visuelles tirées de l’examen théorique officiel avec réponses et explications.',
      curatedFaqQuestionIds: [
        '01dd53f5-8ec4-402e-8dac-4ea0d81a12f6',
        '04fd5735-fdf1-4302-ba53-b5bbd785a858',
        '06091ab3-8cd3-406b-ba10-dc9f694c5c61',
        '0875f6fd-fd54-40aa-bf2f-df0013d19811',
        '0b789dc3-d0f3-436e-bc2c-eb4e1c81108b',
      ],
      relatedCategory: {
        id: 1,
        slug: 'traffic-rules',
        title: 'Règles de Circulation (101 Questions)',
        description:
          'Maîtrisez les priorités à droite, limites de vitesse, règles de dépassement et éclairage.',
        btnText: 'Voir les Règles de Circulation',
      },
      allQuestionsHeading:
        'Banque Complète des Panneaux Routiers (97 Questions)',
      allQuestionsSubheading:
        'Découvrez l’intégralité des 97 questions de signalisation. Cliquez sur une question pour voir l’illustration en grand format et les réponses détaillées.',
    },
  },
  rw: {
    'traffic-rules': {
      slug: 'traffic-rules',
      categoryId: 1,
      categoryName: "Amategeko y'Umuhanda",
      badge: "Integanyanyigisho y'Amategeko · Ibibazo 101",
      title: "Amategeko y'Umuhanda — Ibibazo n'Ibisubizo by'Agateganyo (2026)",
      metaTitle:
        "Amategeko y'Umuhanda — Ibibazo n'Ibisubizo by'Agateganyo (2026) — Provisoire",
      metaDescription:
        "Iga ibibazo 101 byose by'amategeko y'umuhanda mu Kinyarwanda by'uruhushya rw'agateganyo mu Rwanda. Ibisubizo by'ukuri n'umuvuduko.",
      headline: "Amategeko y'Umuhanda mu Rwanda",
      subheadline:
        "Ibibazo 101 by'amategeko y'umuhanda: gutambuka mbere, umuvuduko, kunyuranaho, guhagarara n'amatara.",
      stats: {
        questionCount: 101,
        passRequirement: '12 / 20 (60%)',
        examWeight: '~55% by’Ikizamini',
        format: 'Gukorera kuri Mudasobwa',
      },
      cta: {
        heading: "Itoze Ibibazo by'Amategeko y'Umuhanda",
        description:
          "Itoze ibibazo 101 byose by’amategeko: guhita ubona igisubizo cy’ukuri n'ibisobanuro by'amategeko.",
        practiceBtn: 'Kwitoza Amategeko',
        examBtn: 'Gutangira Ikizamini cy’Iminota 20',
        perks: [
          'Guhita ubona igisubizo cy’ukuri n’impamvu yacyo mu mategeko',
          'Bikubiyemo gutambuka mbere, umuvuduko, amatara no gukurura ibinyabiziga',
          'Bikora 100% nta interineti ikenewe kuri telefone no kuri mudasobwa',
        ],
      },
      editorial: {
        lead: "Amategeko y'umuhanda agenga uburyo bwo kugendera mu nzira nyabagendwa n'umutekano w'abawukoresha mu Rwanda.",
        sections: [
          {
            title: "Uko Ikizamini cy'Amategeko kimeze muri Polisi (RNP)",
            icon: '📋',
            paragraphs: [
              "Iyo ugiye gukora ikizamini cy'agateganyo kuri mudasobwa (Touch screen / CBT) mu bigo bya Polisi, mudasobwa igutoranyiriza ibibazo 20 biturutse muri banki y'ibibazo by'igihugu. Muri ibyo bibazo 20, ibibazo biri hagati ya 10 na 12 biba byerekeye amategeko y'umuhanda.",
              "Uhagarikirwa igihe cy'iminota 20 yo gukora ibyo bibazo 20. Buri kibazo kiba gifite amahitamo 4 (A, B, C, D). Kugira ngo utsinde uhabwe uruhushya rw'agateganyo, ugomba gutsindira byibura amanota 12 kuri 20 (60%).",
            ],
            keyPoints: [
              {
                label: 'Imiterere y’ikizamini',
                text: 'Ibibazo 20 bitoranywa mu buryo bwa tombola, iminota 20 yo kubisubiza.',
              },
              {
                label: 'Amanota yo gutsinda',
                text: 'Byibura amanota 12/20 asabwa na Polisi y’u Rwanda kugira ngo utsinde.',
              },
              {
                label: 'Ubwoko bw’ibibazo',
                text: 'Ibibazo by’amahitamo bibaza ku ngingo z’amategeko, intera zitegetswe n’uburenganzira bwo gutambuka.',
              },
            ],
          },
          {
            title: "Ingingo z'Ingenzi Zibazwa muri Ibi Bibazo 101",
            icon: '⚖️',
            paragraphs: [
              "Ibibazo 101 biri muri iyi banki byibanda ku ngingo z'ingenzi zikunze kugaruka mu kizamini cya Polisi:",
            ],
            keyPoints: [
              {
                label: 'Gutambuka Mbere (Uburenganzira bwo Gutambuka)',
                text: 'Ihame ryo gutanga inzira ku kinyabiziga giturutse iburyo mu mahuriro y’imihanda adafite ibyapa, gutambuka mbere ku kinyabiziga kiri muri rond-point, no kureka ibinyabiziga bitabaye bifite intabaza n’amatara y’umuburo (imbangukiragutabara, polisi, kizimyamoto) bigatambuka mbere.',
              },
              {
                label: 'Umuvuduko Ntarengwa',
                text: 'Umuvuduko ntarengwa wemewe: km 40 mu isaha mu nsisiro / mu mijyi, na km 80 mu isaha ahasanzwe mu mihanda minini. Kugabanya umuvuduko ahari amashuri, ibitaro, inzira z’abanyamaguru no mu makorosi.',
              },
              {
                label: 'Kunyuranaho mu Muhanda',
                text: 'Kunyuranaho bikorerwa ibumoso gusa. Birabujijwe kunyuranaho mu makorosi ateje akaga, mu misozi hejuru aho utabona imbere, mu mahuriro y’inzira za gariyamoshi, no ku masangano y’abanyamaguru.',
              },
              {
                label: 'Guhagarara Akanya Gato n’Umwanya Munini',
                text: 'Itandukaniro riri hagati yo guhagarara akanya gato (kugira ngo abantu binjire cyangwa baviremo) no guhagarara umwanya munini (parking). Intera ya metero 5 igomba gusigara ku masangano y’imihanda.',
              },
              {
                label: 'Amatara y’Ikinyabiziga n’Urumuri',
                text: 'Kuzimya amatara maremare (y’urugendo) ugacana amagufi (ay’ikibariro) iyo uhuye n’ikindi kinyabiziga cyangwa iyo ugikurikiye muri m 50. Amatara ndangaburumbarare ku binyabiziga bifite ubugari burenze m 2.10, n’utugarurarumuri tubonwa muri m 150.',
              },
              {
                label: 'Gukurura Ibinyabiziga n’Umutekano',
                text: 'Uburyo bwo gukurura ikinyabiziga hakoreshejwe igiti cyangwa icyuma gikomeye, kubuza gutwara abana bari munsi y’imyaka 12 ku ntebe y’imbere igihe hari indi myanya, n’umukandara w’umutekano.',
              },
            ],
          },
          {
            title: 'Inama Zizagufasha Gutsinda Iki Kizamini',
            icon: '🎯',
            paragraphs: [
              "Soma neza interuro y'ikibazo witonze. Witondere amagambo nka « birabujijwe », « bigomba », « igihe cyose », cyangwa « Nta gisubizo cy’ukuri kirimo ».",
              "Fata mu mutwe ibipimo by'imibare: ubugari bw'ikinyabiziga (m 2.50 / m 2.10), intera yo kubona utugarurarumuri (m 150), urumuri rw'amatara maremare (m 100) n'amagufi (m 40).",
            ],
          },
        ],
      },
      faqHeading: "Ibibazo Bikunze Kubazwa ku Mategeko y'Umuhanda",
      faqSubheading:
        "Ibibazo by'ingenzi byo mu kizamini cy'agateganyo n'ibisubizo by'ukuri n'ibisobanuro byabyo.",
      curatedFaqQuestionIds: [
        '037a184e-247a-43b7-ab0d-207bed0579f7',
        '07d67991-c02a-4800-b7ee-90593f88f241',
        '0962f1fc-3431-4c2e-ae09-6d06a8bf7505',
        '0cb9bf9a-c522-458f-aded-57f2e089693e',
        'ff6d72c6-2ec7-4cda-97d9-6d924a94a62f',
      ],
      relatedCategory: {
        id: 2,
        slug: 'road-signs',
        title: 'Ibyapa byo mu Muhanda (Ibibazo 97)',
        description:
          'Iga ibyapa biburira ibyago, ibibuza, ibitegeka, n’ibimenyetso byo ku butaka bifite amafoto yabyo.',
        btnText: 'Reba Ibyapa byo mu Muhanda',
      },
      allQuestionsHeading:
        "Urutonde rw'Ibibazo Byose by'Amategeko (Ibibazo 101)",
      allQuestionsSubheading:
        'Reba ibibazo byose biri muri iki cyiciro. Kanda kuri buri kibazo kugira ngo ufungure paji yacyo yihariye irimo ibisobanuro birambuye.',
    },
    'road-signs': {
      slug: 'road-signs',
      categoryId: 2,
      categoryName: 'Ibyapa byo mu Muhanda',
      badge: "Integanyanyigisho y'Ibyapa · Ibibazo 97",
      title: "Ibyapa byo mu Muhanda — Ibibazo n'Ibisubizo by'Agateganyo (2026)",
      metaTitle:
        "Ibyapa byo mu Muhanda — Ibibazo n'Ibisubizo by'Agateganyo (2026) — Provisoire",
      metaDescription:
        "Ibyapa 97 byose byo mu muhanda mu Rwanda bifite amafoto n'ibisubizo by'ukuri mu Kinyarwanda. Ibyapa biburira, ibitegeka, n'ibyerekana inzira.",
      headline: 'Ibyapa n’Ibimenyetso byo mu Muhanda mu Rwanda',
      subheadline:
        "Ibibazo 97 by'ibyapa bifite amafoto: ibyapa biburira ibyago, ibibuza, ibitegeka n'imirongo yo mu muhanda.",
      stats: {
        questionCount: 97,
        passRequirement: '12 / 20 (60%)',
        examWeight: '~45% by’Ikizamini',
        format: 'Ibibazo Bifite Amafoto',
      },
      cta: {
        heading: 'Itoze Ibyapa byo mu Muhanda',
        description:
          "Itoze ibibazo 97 byose by'ibyapa byo mu muhanda bifite amafoto asobanutse no kureba amanota yawe.",
        practiceBtn: 'Kwitoza Ibyapa',
        examBtn: 'Gutangira Ikizamini cy’Iminota 20',
        perks: [
          'Amafoto meza asa neza n’ayo Polisi ikoresha mu kizamini',
          'Ibyapa biburira, ibitegeka, ibibuza n’imirongo yo ku butaka',
          'Bikora 100% nta interineti ikenewe kuri telefone no kuri mudasobwa',
        ],
      },
      editorial: {
        lead: "Ibyapa byo mu muhanda n'ibimenyetso byo ku butaka biyobora abagenzi kandi bikarinda impanuka mu mihanda y'u Rwanda.",
        sections: [
          {
            title: 'Uko Ibyapa Bibazwa mu Kizamini cya Polisi (RNP)',
            icon: '🚦',
            paragraphs: [
              "Mu kizamini cy'agateganyo gitangwa na Polisi kuri mudasobwa, ibibazo hafi kimwe cya kabiri (ibibazo hagati ya 8 na 10 kuri 20) biba birimo amafoto y'ibyapa cyangwa ibishushanyo by'imodoka ziri mu mahuriro y'imihanda.",
              "Buri kibazo kiza gifite ifoto y'icyapa, maze ugasabwa guhitamo ubusobanuro nyabwo muri 4 uhawe, cyangwa ugasabwa kugaragaza ikinyabiziga gifite uburenganzira bwo gukata ikoni mbere y'ibindi.",
            ],
            keyPoints: [
              {
                label: 'Ibibazo by’amashusho',
                text: 'Amafoto y’ibyapa n’ibishushanyo by’amahuriro y’imihanda agaragara kenshi mu kizamini.',
              },
              {
                label: 'Icyo icyapa kigutegeka gukora',
                text: 'Ikizamini kibaza icyo icyapa gisobanura n’icyo umushoferi agomba gukora (kugabanya umuvuduko, gutanga inzira).',
              },
              {
                label: 'Urwego rw’amategeko',
                text: 'Ibimenyetso by’umupolisi biyobora umuhanda bisumbya amatara; amatara asumbya ibyapa; ibyapa bisumbya amategeko asanzwe yo gutambuka.',
              },
            ],
          },
          {
            title: "Ibyiciro 4 Bikomeye by'Ibyapa mu Rwanda",
            icon: '🛑',
            paragraphs: [
              "Amategeko y'umuhanda akoresha imiterere y'amashusho n'amabara yihariye kugira ngo agaragaze icyo icyapa kigamije:",
            ],
            keyPoints: [
              {
                label: '1. Ibyapa Biburira Ibyago (Mpandeshatu)',
                text: 'Ishusho ya mpandeshatu ifite uruhande rutukura n’imbere hera cyangwa h’umuhondo. Biburira ibyago biri imbere: amakorosi ateje akaga, kumanuka cyane, umuhanda ufunganye, abanyamaguru bambuka cyangwa amatungo. Umushoferi agomba guhita agabanya umuvuduko.',
              },
              {
                label:
                  '2. Ibyapa Bibuza cyangwa Bitegeka Kwirinda (Uruziga rutukura)',
                text: 'Ishusho y’uruziga rufite uruhande rutukura. Bibuza gukora ibintu runaka: Kubuza kwinjira, kubuza kunyuranaho, umuvuduko ntarengwa, kubuza gukata ibumoso/iburyo, no kubuza guhagarara.',
              },
              {
                label: '3. Ibyapa Bitegeka (Uruziga rw’ubururu)',
                text: 'Ishusho y’uruziga rufite ibara ry’ubururu n’ikimenyetso cyera. Bitegeka icyo umushoferi agomba gukora: Icyerekezo gitegetswe, kuzenguruka muri rond-point, inzira y’amagare, cyangwa umuvuduko muto utegetswe.',
              },
              {
                label: '4. Ibyapa Biyobora n’Ibimenyesha (Urukiramende)',
                text: 'Ishusho y’urukiramende cyangwa kare ifite ibara ry’ubururu, icyatsi cyangwa ryera. Bitanga amakuru y’ingirakamaro: Ibitaro biri hafi, aho guhagarara (parking), inzira ifunze imbere, n’ibyerekezo by’imijyi.',
              },
              {
                label: '5. Ibimenyetso byo ku Butaka (Imirongo yo mu Muhanda)',
                text: 'Umurongo udacagaguye wera (ntiwemerewe kuwurenga cyangwa kuwugendaho), umurongo ucagaguye (wemerewe kuwurenga unyuranaho iyo nta kibazo), imirongo ibiri, inzira z’abanyamaguru zifite imirongo ya zebra.',
              },
            ],
          },
          {
            title: 'Amakosa Akunze Gukorwa ku Byapa Witondere',
            icon: '💡',
            paragraphs: [
              "Ntukitiranye ibyapa bibuza (uruziga rufite uruhande rutukura) n'ibyapa bitegeka (uruziga rw'ubururu). Uruziga rutukura = Birabujijwe ; Uruziga rw'ubururu = Birategetswe.",
              "Kuri foto z'amamodoka ari mu mahuriro y'imihanda, banza urebe umurongo ikinyabiziga kirimo, ibyapa biri ku muhanda n'ikinyabiziga gifite ikorosi cyinjiramo mbere yo guhitamo igisubizo cy'ukuri.",
            ],
          },
        ],
      },
      faqHeading: 'Ibibazo Bikunze Kubazwa ku Byapa byo mu Muhanda',
      faqSubheading:
        "Ingero z'ibibazo by'ibyapa n'amafoto yabyo byo mu kizamini cy'agateganyo n'ibisubizo by'ukuri.",
      curatedFaqQuestionIds: [
        '01dd53f5-8ec4-402e-8dac-4ea0d81a12f6',
        '04fd5735-fdf1-4302-ba53-b5bbd785a858',
        '06091ab3-8cd3-406b-ba10-dc9f694c5c61',
        '0875f6fd-fd54-40aa-bf2f-df0013d19811',
        '0b789dc3-d0f3-436e-bc2c-eb4e1c81108b',
      ],
      relatedCategory: {
        id: 1,
        slug: 'traffic-rules',
        title: "Amategeko y'Umuhanda (Ibibazo 101)",
        description:
          'Iga gutambuka mbere, umuvuduko ntarengwa, kunyuranaho, amatara no guhagarara.',
        btnText: "Reba Amategeko y'Umuhanda",
      },
      allQuestionsHeading: "Urutonde rw'Ibibazo Byose by'Ibyapa (Ibibazo 97)",
      allQuestionsSubheading:
        'Reba ibibazo 97 byose by’ibyapa bifite amafoto yabyo. Kanda kuri buri kibazo kugira ngo ufungure paji irambuye irimo amafoto manini n’ibisubizo by’ukuri.',
    },
  },
};

export function getCategoryContent(
  lang: Lang,
  categorySlug: 'traffic-rules' | 'road-signs',
): CategoryHubContent {
  const langContent = CATEGORY_CONTENT[lang] || CATEGORY_CONTENT.en;
  return langContent[categorySlug] || CATEGORY_CONTENT.en[categorySlug];
}
