import type { Lang } from '../../lib/quiz';

/**
 * Official Rwandan Provisional Driving License (Permis Provisoire) Exam Configuration.
 *
 * Verified against official Rwanda National Police (RNP) & IremboGov regulations:
 * - Total Questions: 20 multiple choice questions (traffic regulations & road signs)
 * - Passing Score: 12 / 20 (60% passing threshold)
 * - Time Limit: 20 minutes (1200 seconds — 1 min per question in computerized tests)
 *
 * Official sources & testing centers:
 * - Rwanda National Police (Traffic & Road Safety Department / Busanza Automated Testing Centre): https://police.gov.rw
 * - IremboGov Official Driving License Services: https://irembo.gov.rw
 */
export const EXAM_CONFIG = {
  TOTAL_QUESTIONS: 20,
  PASSING_SCORE: 12,
  PASSING_PERCENTAGE: 60,
  DURATION_MINUTES: 20,
  DURATION_SECONDS: 20 * 60, // 1200 seconds
  DEFAULT_RULES_COUNT: 12,
  DEFAULT_SIGNS_COUNT: 8,
  TIME_LOW_WARNING_SECONDS: 300, // 5 min
  TIME_CRITICAL_WARNING_SECONDS: 120, // 2 min
} as const;

// Configurable constants exported for backwards compatibility & direct use
export const PASSING_SCORE = EXAM_CONFIG.PASSING_SCORE;
export const DEFAULT_TOTAL_QUESTIONS = EXAM_CONFIG.TOTAL_QUESTIONS;
export const EXAM_DURATION_SECONDS = EXAM_CONFIG.DURATION_SECONDS;
export const PASSING_PERCENTAGE = EXAM_CONFIG.PASSING_PERCENTAGE;
export const EXAM_DURATION_MINUTES = EXAM_CONFIG.DURATION_MINUTES;

export const STORAGE_KEY_SESSION = 'provisoire_active_practice_session_v1';
export const STORAGE_KEY_HISTORY = 'provisoire_practice_history_v1';
// One-shot flag: when user leaves Practice/Exam and goes back to the question bank,
// we don't want Practice/Exam to auto-resume the exact in-progress question.
export const STORAGE_KEY_SKIP_AUTO_RESTORE =
  'provisoire_skip_practice_autoresume_v1';

export type I18nDictionary = {
  [K in keyof typeof I18N.rw]: (typeof I18N.rw)[K] extends (
    ...args: infer A
  ) => unknown
    ? (...args: A) => string
    : string;
};

// Complete trilingual copy for the practice engine dynamically bound to EXAM_CONFIG
export const I18N = {
  en: {
    pageTitle: 'Provisional Driving Test Simulator',
    subtitle:
      'Practice Rwanda driving test questions with instant feedback or full timed simulation.',
    examSpecs: 'Exam Rules & Format',
    specQuestions: `${EXAM_CONFIG.TOTAL_QUESTIONS} multiple choice questions sampled from the official bank`,
    specQuestionsCategory: (catName: string) =>
      `${EXAM_CONFIG.TOTAL_QUESTIONS} multiple choice questions from ${catName}`,
    specDuration: `${EXAM_CONFIG.DURATION_MINUTES} minutes countdown timer for mock exams (self-paced practice available)`,
    specPassMark: `${EXAM_CONFIG.PASSING_SCORE} / ${EXAM_CONFIG.TOTAL_QUESTIONS} (${EXAM_CONFIG.PASSING_PERCENTAGE}%) required to pass`,
    specScoring: '1 point per correct answer · No negative marking',
    modeLabel: 'Select Test Mode',
    modePractice: 'Practice Mode',
    modePracticeBadge: 'Immediate Feedback',
    modePracticeDesc:
      'Instant answer feedback & detailed explanations after each question.',
    modeMockExam: `Mock Exam (${EXAM_CONFIG.DURATION_MINUTES} min)`,
    modeMockExamBadge: 'Official Simulation',
    modeMockExamDesc: `Official test simulation with ${EXAM_CONFIG.DURATION_MINUTES} min timer. No feedback until you submit.`,
    categoryLabel: 'Select Question Topic / Category',
    categoryAll: 'All Topics (Balanced)',
    categoryAllDesc: `Balanced mix: ~${EXAM_CONFIG.DEFAULT_RULES_COUNT} traffic rules & ~${EXAM_CONFIG.DEFAULT_SIGNS_COUNT} road signs.`,
    categoryRules: 'Traffic Rules Only',
    categoryRulesDesc: `${EXAM_CONFIG.TOTAL_QUESTIONS} randomized questions exclusively on traffic rules & regulations.`,
    categorySigns: 'Road Signs Only',
    categorySignsDesc: `${EXAM_CONFIG.TOTAL_QUESTIONS} randomized questions exclusively identifying road signs & markings.`,
    startBtn: 'Start Session',
    resumeBtn: 'Resume In-Progress Session',
    discardBtn: 'Start Fresh Session',
    historyTitle: 'Your Recent Practice History',
    historyEmpty: 'No completed tests yet. Take your first session!',
    historyScore: 'Score',
    historyDate: 'Date',
    historyPassed: 'Passed',
    historyFailed: 'Failed',
    clearHistory: 'Clear history',
    // In-progress
    questionOf: (curr: number, total: number) => `Question ${curr} of ${total}`,
    answeredCount: (ans: number, total: number) =>
      `${ans} of ${total} answered`,
    progressPercent: (pct: number) => `${pct}% Completed`,
    flagQuestion: 'Flag for review',
    unflagQuestion: 'Flagged',
    flaggedCount: (count: number) => `${count} Flagged`,
    flaggedCardTooltip: 'Flag this question to review before submitting',
    flaggedDuringTest: 'Flagged for review',
    timeRemaining: 'Time remaining',
    timeSpent: 'Time elapsed',
    timeExpired: "Time's up!",
    pause: 'Pause',
    resume: 'Resume',
    pausedMsg: 'Session is paused. Take a quick breath!',
    prevBtn: 'Previous',
    nextBtn: 'Next',
    skipBtn: 'Skip',
    skipForNow: 'Skip for now',
    nextUnanswered: 'Next Unanswered',
    nextFlagged: 'Next Flagged',
    returnToSkipped: (count: number) => `Review Skipped (${count})`,
    jumpToFirstUnanswered: '1st Skipped',
    unansweredBanner: (count: number) =>
      `You have ${count} unanswered ${count === 1 ? 'question' : 'questions'} remaining.`,
    finishBtn: 'Finish Test',
    questionGrid: 'Question Navigator',
    jumpTo: 'Jump to question',
    legendCurrent: 'Current',
    legendAnswered: 'Answered',
    legendUnanswered: 'Unanswered',
    legendSkipped: 'Skipped',
    legendFlagged: 'Flagged',
    legendCorrect: 'Correct',
    legendIncorrect: 'Incorrect',
    feedbackCorrectTitle: 'Correct! Well done 🎉',
    feedbackIncorrectTitle: 'Incorrect ✗',
    feedbackPracticeNotice:
      'Practice mode active: instant feedback is enabled.',
    // Modal
    submitModalTitle: 'Submit Practice Exam?',
    submitModalWarning: (unanswered: number) =>
      `You still have ${unanswered} unanswered ${unanswered === 1 ? 'question' : 'questions'}. Are you sure you want to finish?`,
    submitModalAllDone: `All ${EXAM_CONFIG.TOTAL_QUESTIONS} questions have been answered. Ready to view your score?`,
    modalAnswered: 'Answered',
    modalUnanswered: 'Unanswered',
    modalFlagged: 'Flagged for review',
    modalTimeLeft: 'Time remaining',
    modalTimeSpent: 'Time elapsed',
    modalConfirmSubmit: 'Yes, View Results',
    modalContinue: 'Keep Practicing',
    modalReviewSkipped: 'Review Skipped Questions',
    modalReviewFlagged: 'Review Flagged Questions',
    modalJumpToFlagged: 'Jump to Question',
    // Results
    resultPassedTitle: 'Congratulations! You Passed 🎉',
    resultPassedDesc: `You reached the official passing threshold of ${EXAM_CONFIG.PASSING_SCORE}/${EXAM_CONFIG.TOTAL_QUESTIONS}.`,
    resultFailedTitle: 'Keep Practicing! You Didn’t Pass ⚠️',
    resultFailedDesc: `The official passing score is ${EXAM_CONFIG.PASSING_SCORE}/${EXAM_CONFIG.TOTAL_QUESTIONS} (${EXAM_CONFIG.PASSING_PERCENTAGE}%). Review your mistakes below and try again!`,
    scoreLabel: 'Your Final Score',
    percentage: 'Percentage',
    timeTaken: 'Time Taken',
    categoryBreakdown: 'Performance by Category',
    rulesCategory: 'Traffic Rules',
    signsCategory: 'Road Signs',
    reviewHeader: 'Question-by-Question Review',
    filterAll: 'All',
    filterIncorrect: 'Incorrect',
    filterCorrect: 'Correct',
    filterFlagged: 'Flagged',
    yourAnswer: 'Your answer:',
    correctAnswer: 'Correct answer:',
    noAnswer: 'No answer selected',
    explanation: 'Explanation',
    bankLink: 'View in question bank →',
    retakeBtn: `Take New ${EXAM_CONFIG.TOTAL_QUESTIONS}-Question Session`,
    retakeMissedBtn: 'Practice Missed Questions Only',
    bankBtn: 'Back to Questions Bank',
    keyboardTips:
      'Shortcuts: [1-4]/[A-D] Select · [←/→] Navigate · [S] Skip · [F] Flag · [U] Next Unanswered',
    swipeHint: 'Swipe ← / → to navigate questions',
    tapHint: 'Tap an option to select answer',
    // Study Habit, Dashboard & Drills
    studyStreakBadge: (streak: number) =>
      `${streak} Day${streak === 1 ? '' : 's'} Streak`,
    streakActiveToday: 'Practiced today! 🔥',
    streakKeepGoing: 'Practice today to keep your streak alive! ⚡',
    streakLongest: (longest: number) => `Best: ${longest} days`,
    overallCoverage: '198-Question Bank Coverage',
    coverageOfTotal: (seen: number, total: number, pct: number) =>
      `${seen} of ${total} questions studied (${pct}%)`,
    mastered: 'Mastered',
    learning: 'Learning',
    weak: 'Needs Practice (Weak)',
    unseen: 'Unseen',
    accuracy: 'Accuracy',
    dashboardTitle: 'Study Habit & Mastery Dashboard',
    dashboardDesc:
      'Track your real progress across all 198 official questions. Everything is stored locally on your device.',
    weakDrillTitle: 'Weak-Question Drill',
    weakDrillDesc:
      'Targeted drill built specifically from the questions you miss most frequently. The highest-yield way to pass.',
    weakDrillAction: (count: number) =>
      `Drill ${count} Missed Question${count === 1 ? '' : 's'}`,
    weakDrillEmpty:
      'No weak questions yet! Practice questions to automatically surface tricky ones here.',
    weakDrillAllGood:
      'Great work! You currently have 0 weak questions. All attempted questions are mastered or in progress.',
    bookmarksTitle: 'Bookmarked Questions',
    bookmarksDesc:
      'Your saved question list for targeted review anytime. Bookmark any tricky road sign or rule.',
    bookmarksAction: (count: number) =>
      `Practice ${count} Bookmarked Question${count === 1 ? '' : 's'}`,
    bookmarksEmpty:
      'No bookmarked questions yet. Click 🔖 on any question to save it here for later review.',
    bookmarkBtn: 'Bookmark',
    bookmarkedBtn: 'Bookmarked',
    savedBookmarksList: 'Saved Bookmarks List',
    manageBookmarks: 'View & Manage Bookmarks',
    hideBookmarks: 'Hide Bookmarks',
    removeBookmark: 'Remove',
    resumeStudy: 'Resume where you left off',
    resumeStudyBtn: (label: string) => `Resume: ${label}`,
    exportProgress: 'Export Progress (JSON)',
    importProgress: 'Import Progress (JSON)',
    resetProgress: 'Reset Progress',
    resetConfirm:
      'Are you sure you want to reset all question mastery, streak, and bookmarks? This cannot be undone unless exported.',
    exportSuccess: 'Progress copied to clipboard and downloaded!',
    importSuccess: (qCount: number) =>
      `Successfully restored progress for ${qCount} questions!`,
    importModalTitle: 'Import Study Progress',
    importModalDesc:
      'Upload a JSON backup file or paste your exported progress JSON to restore all data.',
    uploadFileBtn: 'Upload JSON File',
    pasteJsonLabel: 'Or paste raw JSON:',
    confirmImportBtn: 'Restore Progress',
    cancelBtn: 'Cancel',
    privateBrowsingNotice:
      'Private Browsing Mode: Your storage is temporary in-memory. Export your progress as JSON before closing the browser so you don’t lose it.',
    copyJsonBtn: 'Copy JSON',
    downloadJsonBtn: 'Download JSON File',
    allTopics: 'All Topics',
  },
  fr: {
    pageTitle: 'Simulateur d’examen du permis provisoire',
    subtitle:
      'Pratiquez les questions du permis rwandais avec correction immédiate ou simulation chronométrée.',
    examSpecs: 'Règles et format de l’examen',
    specQuestions: `${EXAM_CONFIG.TOTAL_QUESTIONS} questions à choix multiples tirées de la banque officielle`,
    specQuestionsCategory: (catName: string) =>
      `${EXAM_CONFIG.TOTAL_QUESTIONS} questions à choix multiples sur : ${catName}`,
    specDuration: `Compte à rebours de ${EXAM_CONFIG.DURATION_MINUTES} min en examen blanc (entraînement libre disponible)`,
    specPassMark: `${EXAM_CONFIG.PASSING_SCORE} / ${EXAM_CONFIG.TOTAL_QUESTIONS} (${EXAM_CONFIG.PASSING_PERCENTAGE} %) requis pour réussir`,
    specScoring: '1 point par bonne réponse · Aucune pénalité',
    modeLabel: 'Sélectionner le mode',
    modePractice: 'Mode Entraînement',
    modePracticeBadge: 'Correction immédiate',
    modePracticeDesc:
      'Explications et correction affichées immédiatement après chaque réponse.',
    modeMockExam: `Examen Blanc (${EXAM_CONFIG.DURATION_MINUTES} min)`,
    modeMockExamBadge: 'Simulation officielle',
    modeMockExamDesc: `Conditions officielles avec chronomètre de ${EXAM_CONFIG.DURATION_MINUTES} min. Résultats dévoilés à la fin.`,
    categoryLabel: 'Sélectionner le thème / la catégorie',
    categoryAll: 'Tous les thèmes (Mixte)',
    categoryAllDesc: `Tirage équilibré : ~${EXAM_CONFIG.DEFAULT_RULES_COUNT} règles & ~${EXAM_CONFIG.DEFAULT_SIGNS_COUNT} panneaux.`,
    categoryRules: 'Règles de circulation uniquement',
    categoryRulesDesc: `${EXAM_CONFIG.TOTAL_QUESTIONS} questions aléatoires portant sur les règles et priorités.`,
    categorySigns: 'Panneaux de signalisation uniquement',
    categorySignsDesc: `${EXAM_CONFIG.TOTAL_QUESTIONS} questions aléatoires sur la signalisation routière.`,
    startBtn: 'Commencer la session',
    resumeBtn: 'Reprendre la session en cours',
    discardBtn: 'Nouvelle session',
    historyTitle: 'Historique de vos entraînements',
    historyEmpty:
      'Aucun examen terminé pour le moment. Lancez votre premier test !',
    historyScore: 'Score',
    historyDate: 'Date',
    historyPassed: 'Réussi',
    historyFailed: 'Échoué',
    clearHistory: 'Effacer l’historique',
    // In-progress
    questionOf: (curr: number, total: number) =>
      `Question ${curr} sur ${total}`,
    answeredCount: (ans: number, total: number) =>
      `${ans} sur ${total} répondues`,
    progressPercent: (pct: number) => `${pct} % complété`,
    flagQuestion: 'Marquer pour relecture',
    unflagQuestion: 'Marquée',
    flaggedCount: (count: number) => `${count} Marquée${count > 1 ? 's' : ''}`,
    flaggedCardTooltip:
      'Marquer cette question pour la revoir avant de terminer',
    flaggedDuringTest: 'Marquée pour relecture',
    timeRemaining: 'Temps restant',
    timeSpent: 'Temps écoulé',
    timeExpired: 'Temps écoulé !',
    pause: 'Pause',
    resume: 'Reprendre',
    pausedMsg: 'Session en pause. Respirez un instant !',
    prevBtn: 'Précédente',
    nextBtn: 'Suivante',
    skipBtn: 'Passer',
    skipForNow: 'Passer pour le moment',
    nextUnanswered: 'Suivante non répondue',
    nextFlagged: 'Suivante marquée',
    returnToSkipped: (count: number) => `Revoir les ignorées (${count})`,
    jumpToFirstUnanswered: '1ère ignorée',
    unansweredBanner: (count: number) =>
      `Il vous reste ${count} question${count > 1 ? 's' : ''} non répondue${count > 1 ? 's' : ''}.`,
    finishBtn: 'Terminer la session',
    questionGrid: 'Grille des questions',
    jumpTo: 'Aller à la question',
    legendCurrent: 'Actuelle',
    legendAnswered: 'Répondue',
    legendUnanswered: 'Non répondue',
    legendSkipped: 'Ignorée',
    legendFlagged: 'Marquée',
    legendCorrect: 'Correcte',
    legendIncorrect: 'Erreur',
    feedbackCorrectTitle: 'Bonne réponse ! 🎉',
    feedbackIncorrectTitle: 'Réponse incorrecte ✗',
    feedbackPracticeNotice:
      'Mode entraînement actif : correction immédiate activée.',
    // Modal
    submitModalTitle: 'Terminer la session ?',
    submitModalWarning: (unanswered: number) =>
      `Il vous reste ${unanswered} ${unanswered === 1 ? 'question non répondue' : 'questions non répondues'}. Voulez-vous vraiment terminer ?`,
    submitModalAllDone: `Les ${EXAM_CONFIG.TOTAL_QUESTIONS} questions ont été complétées. Prêt à voir vos résultats ?`,
    modalAnswered: 'Répondues',
    modalUnanswered: 'Non répondues',
    modalFlagged: 'Marquées pour relecture',
    modalTimeLeft: 'Temps restant',
    modalTimeSpent: 'Temps écoulé',
    modalConfirmSubmit: 'Oui, voir les résultats',
    modalContinue: 'Continuer la session',
    modalReviewSkipped: 'Revoir les questions ignorées',
    modalReviewFlagged: 'Revoir les questions marquées',
    modalJumpToFlagged: 'Aller à la question',
    // Results
    resultPassedTitle: 'Félicitations ! Vous avez réussi 🎉',
    resultPassedDesc: `Vous avez atteint le seuil de réussite officiel de ${EXAM_CONFIG.PASSING_SCORE}/${EXAM_CONFIG.TOTAL_QUESTIONS}.`,
    resultFailedTitle: 'Continuez à vous entraîner ! ⚠️',
    resultFailedDesc: `La note de passage officielle est de ${EXAM_CONFIG.PASSING_SCORE}/${EXAM_CONFIG.TOTAL_QUESTIONS} (${EXAM_CONFIG.PASSING_PERCENTAGE} %). Consultez vos erreurs ci-dessous et réessayez !`,
    scoreLabel: 'Votre note finale',
    percentage: 'Pourcentage',
    timeTaken: 'Temps écoulé',
    categoryBreakdown: 'Résultats par catégorie',
    rulesCategory: 'Règles de circulation',
    signsCategory: 'Panneaux de signalisation',
    reviewHeader: 'Revue détaillée des questions',
    filterAll: 'Toutes',
    filterIncorrect: 'Erreurs',
    filterCorrect: 'Correctes',
    filterFlagged: 'Marquées',
    yourAnswer: 'Votre réponse :',
    correctAnswer: 'Bonne réponse :',
    noAnswer: 'Aucune réponse sélectionnée',
    explanation: 'Explication',
    bankLink: 'Voir dans la banque de questions →',
    retakeBtn: `Nouvelle session de ${EXAM_CONFIG.TOTAL_QUESTIONS} questions`,
    retakeMissedBtn: 'Revoir uniquement les erreurs',
    bankBtn: 'Retour aux questions',
    keyboardTips:
      'Raccourcis : [1-4]/[A-D] Choisir · [←/→] Naviguer · [S] Passer · [F] Marquer · [U] Non répondue',
    swipeHint: 'Balayez ← / → pour changer de question',
    tapHint: 'Touchez une option pour répondre',
    // Study Habit, Dashboard & Drills
    studyStreakBadge: (streak: number) =>
      `Série de ${streak} jour${streak === 1 ? '' : 's'}`,
    streakActiveToday: 'Validé aujourd’hui ! 🔥',
    streakKeepGoing: 'Entraînez-vous aujourd’hui pour maintenir la série ! ⚡',
    streakLongest: (longest: number) => `Record : ${longest} jours`,
    overallCoverage: 'Couverture des 198 questions',
    coverageOfTotal: (seen: number, total: number, pct: number) =>
      `${seen} sur ${total} questions abordées (${pct} %)`,
    mastered: 'Maîtrisées',
    learning: 'En apprentissage',
    weak: 'À revoir (Faibles)',
    unseen: 'Non vues',
    accuracy: 'Précision',
    dashboardTitle: 'Tableau de bord d’apprentissage et progression',
    dashboardDesc:
      'Suivez votre maîtrise des 198 questions officielles du code rwandais. Stockage 100 % local sur votre appareil.',
    weakDrillTitle: 'Entraînement Questions Faibles',
    weakDrillDesc:
      'Session ciblée construite à partir des questions que vous ratez le plus souvent. La méthode la plus efficace pour réussir.',
    weakDrillAction: (count: number) =>
      `Réviser ${count} question${count === 1 ? '' : 's'} manquée${count === 1 ? '' : 's'}`,
    weakDrillEmpty:
      'Aucune question faible pour le moment ! Continuez à vous entraîner pour identifier vos lacunes.',
    weakDrillAllGood:
      'Excellent travail ! Vous avez 0 question faible. Toutes vos questions abordées sont maîtrisées ou en cours.',
    bookmarksTitle: 'Questions Enregistrées (Favoris)',
    bookmarksDesc:
      'Votre sélection personnelle de questions à revoir. Marquez n’importe quel panneau ou règle délicate.',
    bookmarksAction: (count: number) =>
      `Réviser ${count} question${count === 1 ? '' : 's'} enregistrée${count === 1 ? '' : 's'}`,
    bookmarksEmpty:
      'Aucune question enregistrée. Cliquez sur 🔖 sur n’importe quelle question pour l’ajouter ici.',
    bookmarkBtn: 'Enregistrer',
    bookmarkedBtn: 'Enregistré',
    savedBookmarksList: 'Liste des questions enregistrées',
    manageBookmarks: 'Gérer les questions enregistrées',
    hideBookmarks: 'Masquer la liste',
    removeBookmark: 'Supprimer',
    resumeStudy: 'Reprendre là où vous vous êtes arrêté',
    resumeStudyBtn: (label: string) => `Reprendre : ${label}`,
    exportProgress: 'Exporter la progression (JSON)',
    importProgress: 'Importer la progression (JSON)',
    resetProgress: 'Réinitialiser la progression',
    resetConfirm:
      'Êtes-vous sûr de vouloir réinitialiser votre progression, série et favoris ? Cette action est irréversible sauf si exportée.',
    exportSuccess: 'Progression copiée dans le presse-papier et téléchargée !',
    importSuccess: (qCount: number) =>
      `Progression restaurée avec succès pour ${qCount} questions !`,
    importModalTitle: 'Importer la progression d’étude',
    importModalDesc:
      'Chargez un fichier JSON ou collez le code JSON pour restaurer votre progression.',
    uploadFileBtn: 'Choisir un fichier JSON',
    pasteJsonLabel: 'Ou collez le texte JSON :',
    confirmImportBtn: 'Restaurer la progression',
    cancelBtn: 'Annuler',
    privateBrowsingNotice:
      'Navigation privée : Les données sont stockées en mémoire temporaire. Exportez votre progression avant de fermer l’onglet.',
    copyJsonBtn: 'Copier JSON',
    downloadJsonBtn: 'Télécharger fichier JSON',
    allTopics: 'Tous les thèmes',
  },
  rw: {
    pageTitle: 'Ikizamini cy’imyitozo cy’uruhushya rw’agateganyo',
    subtitle:
      'Itoze ibibazo by’uruhushya rw’agateganyo: Guhita ubona ibisubizo ako kanya cyangwa ikizamini gifite isaha.',
    examSpecs: 'Amategeko n’imiterere y’ikizamini',
    specQuestions: `Ibibazo ${EXAM_CONFIG.TOTAL_QUESTIONS} by’amahitamo byatoranyijwe mu bubiko bw’ibibazo`,
    specQuestionsCategory: (catName: string) =>
      `Ibibazo ${EXAM_CONFIG.TOTAL_QUESTIONS} byatoranyijwe mu cyiciro: ${catName}`,
    specDuration: `Iminota ${EXAM_CONFIG.DURATION_MINUTES} ibarwa igabanuka ku kizamini (imyitozo ntiyihuta)`,
    specPassMark: `Amanota ${EXAM_CONFIG.PASSING_SCORE} / ${EXAM_CONFIG.TOTAL_QUESTIONS} (${EXAM_CONFIG.PASSING_PERCENTAGE}%) asabwa kugira ngo utsinde`,
    specScoring: 'Inota 1 kuri buri gisubizo cy’ukuri · Nta gihano ku makosa',
    modeLabel: 'Hitamo uburyo bw’ikizamini',
    modePractice: 'Uburyo bw’imyitozo',
    modePracticeBadge: 'Ibisubizo ako kanya',
    modePracticeDesc:
      'Guhita ubona igisubizo cy’ukuri n’ibisobanuro kuri buri kibazo.',
    modeMockExam: `Ikizamini cy’ikitegererezo (Iminota ${EXAM_CONFIG.DURATION_MINUTES})`,
    modeMockExamBadge: 'Ikizamini nyakuri',
    modeMockExamDesc: `Isaha y’iminota ${EXAM_CONFIG.DURATION_MINUTES} nk’ikizamini nyakuri. Ibisubizo biboneka urangije.`,
    categoryLabel: 'Hitamo icyiciro cy’ibibazo',
    categoryAll: 'Ibyiciro byose (Bivanze)',
    categoryAllDesc: `Ibibazo bivanze: ~${EXAM_CONFIG.DEFAULT_RULES_COUNT} by’amategeko & ~${EXAM_CONFIG.DEFAULT_SIGNS_COUNT} by’ibyapa.`,
    categoryRules: 'Amategeko y’umuhanda gusa',
    categoryRulesDesc: `Ibibazo ${EXAM_CONFIG.TOTAL_QUESTIONS} bishingiye ku mategeko n’amabwiriza y’umuhanda gusa.`,
    categorySigns: 'Ibyapa byo ku muhanda gusa',
    categorySignsDesc: `Ibibazo ${EXAM_CONFIG.TOTAL_QUESTIONS} byerekeye kumenya ibyapa n’ibimenyetso byo ku muhanda.`,
    startBtn: 'Tangira ubu',
    resumeBtn: 'Komeza aho wari ugeze',
    discardBtn: 'Tangira ibindi bishya',
    historyTitle: 'Amateka y’ibizamini wakoze',
    historyEmpty: 'Nta kizamini urarangiza. Tangira icyawe cya mbere ubu!',
    historyScore: 'Amanota',
    historyDate: 'Itariki',
    historyPassed: 'Yatsinze',
    historyFailed: 'Yatsinzwe',
    clearHistory: 'Gusiba amateka',
    // In-progress
    questionOf: (curr: number, total: number) =>
      `Ikibazo cya ${curr} kuri ${total}`,
    answeredCount: (ans: number, total: number) =>
      `Ibisubijwe: ${ans} kuri ${total}`,
    progressPercent: (pct: number) => `${pct}% Byakozwe`,
    flagQuestion: 'Kimenyetse',
    unflagQuestion: 'Kiramakaye',
    flaggedCount: (count: number) => `${count} Byamuritswe`,
    flaggedCardTooltip:
      'Shyiraho ikimenyetso kugira ngo uzayigarukire mbere yo gusoza',
    flaggedDuringTest: 'Icyashyizweho ikimenyetso',
    timeRemaining: 'Igihe gisigaye',
    timeSpent: 'Igihe kimaze gukoreshwa',
    timeExpired: 'Igihe cyarangiye!',
    pause: 'Hagarika gato',
    resume: 'Komeza',
    pausedMsg: 'Ikizamini cyahagaze gato. Fata akanya ko kuruhuka!',
    prevBtn: 'Ibanza',
    nextBtn: 'Ikurikira',
    skipBtn: 'Simbuka',
    skipForNow: 'Simbuka by’agateganyo',
    nextUnanswered: 'Ikurikira itarasubizwa',
    nextFlagged: 'Ikurikira yamuritswe',
    returnToSkipped: (count: number) => `Subira ku zitasubijwe (${count})`,
    jumpToFirstUnanswered: 'Ikitasubijwe cya 1',
    unansweredBanner: (count: number) =>
      `Uracyafite ibibazo ${count} bitarasubizwa.`,
    finishBtn: 'Soza ikizamini',
    questionGrid: 'Incamake y’ibibazo',
    jumpTo: 'Jya ku kibazo',
    legendCurrent: 'Icyo uriho',
    legendAnswered: 'Igisubijwe',
    legendUnanswered: 'Ikitasubijwe',
    legendSkipped: 'Iyasimbitswe',
    legendFlagged: 'Icyamuritswe',
    legendCorrect: 'Icy’ukuri',
    legendIncorrect: 'Ikosa',
    feedbackCorrectTitle: 'Ni byo neza! 🎉',
    feedbackIncorrectTitle: 'Ibi si byo ✗',
    feedbackPracticeNotice:
      'Uburyo bw’imyitozo: Ibisobanuro bihita bigaragara.',
    // Modal
    submitModalTitle: 'Gusoza ikizamini?',
    submitModalWarning: (unanswered: number) =>
      `Uracyafite ${unanswered} ${unanswered === 1 ? 'ikibazo kitarasubizwa' : 'ibibazo bitarasubizwa'}. Urashaka gusoza by’ukuri?`,
    submitModalAllDone: `Ibibazo byose ${EXAM_CONFIG.TOTAL_QUESTIONS} bimaze gusubizwa. Witeguye kubona amanota yawe?`,
    modalAnswered: 'Ibisubijwe',
    modalUnanswered: 'Ibitarasubizwa',
    modalFlagged: 'Ibyashyizweho ikimenyetso',
    modalTimeLeft: 'Igihe gisigaye',
    modalTimeSpent: 'Igihe kimaze gukoreshwa',
    modalConfirmSubmit: 'Yego, Reba amanota',
    modalContinue: 'Komeza gukora',
    modalReviewSkipped: 'Subira ku bibazo bitasubijwe',
    modalReviewFlagged: 'Subira ku bibazo byamuritswe',
    modalJumpToFlagged: 'Jya kuri iki kibazo',
    // Results
    resultPassedTitle: 'Ishyari n’amahirwe masa! Watsinze 🎉',
    resultPassedDesc: `Wageze ku kigero cy’amanota ${EXAM_CONFIG.PASSING_SCORE}/${EXAM_CONFIG.TOTAL_QUESTIONS} asabwa kugira ngo utsinde.`,
    resultFailedTitle: 'Komeza witoze! Ntiwageze ku manota asabwa ⚠️',
    resultFailedDesc: `Amanota asabwa ni ${EXAM_CONFIG.PASSING_SCORE}/${EXAM_CONFIG.TOTAL_QUESTIONS} (${EXAM_CONFIG.PASSING_PERCENTAGE}%). Suzuma amakosa yawe hasi wongere ugerageze!`,
    scoreLabel: 'Amanota yawe yose',
    percentage: 'Ijanisha',
    timeTaken: 'Igihe wakoresheje',
    categoryBreakdown: 'Amanota ku byiciro',
    rulesCategory: 'Amategeko y’umuhanda',
    signsCategory: 'Ibyapa byo ku muhanda',
    reviewHeader: 'Gusuzuma ibibazo byose',
    filterAll: 'Byose',
    filterIncorrect: 'Amakosa',
    filterCorrect: 'Iby’ukuri',
    filterFlagged: 'Ibyari byamuritswe',
    yourAnswer: 'Igisubizo cyawe:',
    correctAnswer: 'Igisubizo cy’ukuri:',
    noAnswer: 'Nta gisubizo wahisemo',
    explanation: 'Ibisobanuro',
    bankLink: 'Reba mu bubiko bw’ibibazo byose →',
    retakeBtn: `Kora indi myitozo y’ibibazo ${EXAM_CONFIG.TOTAL_QUESTIONS}`,
    retakeMissedBtn: 'Subiramo ibyo wishe gusa',
    bankBtn: 'Subira ku bibazo byose',
    keyboardTips:
      'Uburyo bworoshye: [1-4]/[A-D] Guhitamo · [←/→] Kugenda · [S] Gusimbuka · [F] Gushyiraho ikimenyetso · [U] Ikitasubizwa',
    swipeHint: 'Kanyuza ← / → guhindura ibibazo',
    tapHint: 'Kanda ku gisubizo kugira ngo uhitemo',
    // Study Habit, Dashboard & Drills
    studyStreakBadge: (streak: number) => `Iminsi ${streak} ikurikiranye`,
    streakActiveToday: 'Wize uyu munsi! 🔥',
    streakKeepGoing: 'Itoze uyu munsi kugira ngo streak ikomeze! ⚡',
    streakLongest: (longest: number) => `Agahigo: iminsi ${longest}`,
    overallCoverage: 'Ibyo wagezeho mu bibazo 198 byose',
    coverageOfTotal: (seen: number, total: number, pct: number) =>
      `Ibibazo ${seen} kuri ${total} bimaze kwigwa (${pct}%)`,
    mastered: 'Ibyatsinzwe neza',
    learning: 'Ibyo ukiga',
    weak: 'Ibyo ugomba kwitoza (Ibigoye)',
    unseen: 'Ibitarakorwa',
    accuracy: 'Imitsindire',
    dashboardTitle: 'Imbonerahamwe y’imyigire n’aho ugeze',
    dashboardDesc:
      'Gukurikirana aho ugeze mu bibazo 198 byose by’amategeko n’ibyapa by’u Rwanda. Amakuru yose abikwa muri telefoni/mudasobwa yawe gusa.',
    weakDrillTitle: 'Kwitoza Ibibazo Wagize Amakosa',
    weakDrillDesc:
      'Imyitozo yihariye igizwe n’ibibazo wagize amakosa kenshi kurusha ibindi. Uburyo bwihuse bwo gutsinda ikizamini.',
    weakDrillAction: (count: number) => `Kora ibibazo ${count} wagize amakosa`,
    weakDrillEmpty:
      'Nta bibazo birimo amakosa ufite kugeza ubu! Komeza witoze kugira ngo ugaragaze ibigoye.',
    weakDrillAllGood:
      'Wakoze neza cyane! Nta bibazo bitoroshye ufite ubu. Ibibazo byose wakoze warabitsinze cyangwa uri kubyiga neza.',
    bookmarksTitle: 'Ibibazo Wifashishije (Bookmarks)',
    bookmarksDesc:
      'Urutonde rw’ibibazo wabitse kugira ngo uzabyitoze ukwabyo igihe cyose ubishakiye.',
    bookmarksAction: (count: number) => `Itoze ibibazo ${count} wabitse`,
    bookmarksEmpty:
      'Nta bibazo urabika kugeza ubu. Kanda 🔖 kuri buri kibazo ushaka kubika kugira ngo kize hano.',
    bookmarkBtn: 'Kubika',
    bookmarkedBtn: 'Byabitswe',
    savedBookmarksList: 'Urutonde rw’ibibazo byabitswe',
    manageBookmarks: 'Reba no gucunga ibyabitswe',
    hideBookmarks: 'Hisha urutonde',
    removeBookmark: 'Gukuraho',
    resumeStudy: 'Komeza aho wari ugeze',
    resumeStudyBtn: (label: string) => `Komeza: ${label}`,
    exportProgress: 'Koporora amakuru (JSON)',
    importProgress: 'Kwinjiza amakuru (JSON)',
    resetProgress: 'Gusiba amakuru yose',
    resetConfirm:
      'Uzi neza ko ushaka gusiba amakuru yose y’aho wari ugeze, streak n’ibyo wabitse? Ibi ntibishobora kugarurwa keretse wabikoporoye mbere.',
    exportSuccess: 'Amakuru yakoporowe neza kandi yabitswe muri dosiye!',
    importSuccess: (qCount: number) =>
      `Amakuru y’ibibazo ${qCount} yagaruwe neza!`,
    importModalTitle: 'Kwinjiza amakuru y’imyigire',
    importModalDesc:
      'Shyiramo dosiye ya JSON cyangwa komekamo inyandiko ya JSON kugira ngo ugarure aho wari ugeze.',
    uploadFileBtn: 'Hitamo dosiye ya JSON',
    pasteJsonLabel: 'Cyangwa komekamo inyandiko ya JSON:',
    confirmImportBtn: 'Garura amakuru',
    cancelBtn: 'Kureka',
    privateBrowsingNotice:
      'Uburyo bw’ibanga (Private Browsing): Amakuru abikwa by’agateganyo gusa. Koporora amakuru yawe mbere yo gufunga porogaramu.',
    copyJsonBtn: 'Koporora JSON',
    downloadJsonBtn: 'Bika dosiye ya JSON',
    allTopics: 'Ibyiciro byose',
  },
} as const;

export function getTranslation(lang: Lang): I18nDictionary {
  return I18N[lang] || I18N.rw;
}
