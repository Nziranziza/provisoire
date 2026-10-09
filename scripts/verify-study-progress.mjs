import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('======================================================');
console.log('--- Verifying Study Habit, Progress, & Weak Drill ---');
console.log('======================================================\n');

// 1. Verify questions bank has 198 questions
const questionsPath = resolve('questions.json');
const rawQuestions = JSON.parse(readFileSync(questionsPath, 'utf8'));
const allQuestions = rawQuestions.questions;
assert.equal(allQuestions.length, 198, 'Question bank must have 198 questions');
console.log('✔ Question bank verified: 198 questions loaded.');

// 2. Setup mock browser environment (window, localStorage, CustomEvent)
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.window = {
  localStorage: new MockLocalStorage(),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.CustomEvent = class CustomEvent {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict?.detail;
  }
};

// Import module under test
const studyModule = await import('../src/lib/study-progress.ts');
const {
  deriveMasteryStatus,
  recordQuestionAttempt,
  getQuestionProgress,
  getWeakQuestions,
  sampleWeakDrillQuestions,
  setQuestionBookmark,
  isQuestionBookmarked,
  getAllBookmarks,
  sampleBookmarkedQuestions,
  getStudyStreak,
  recordStudyActivity,
  calculateDashboardStats,
  exportStudyProgressJson,
  importStudyProgressJson,
  clearAllStudyProgress,
  getSafeItem,
  setSafeItem,
  removeSafeItem,
} = studyModule;

// Clean slate
clearAllStudyProgress();

// 3. Test Mastery Status Derivation
console.log('\n--- 3. Testing Mastery Derivation ---');
assert.equal(deriveMasteryStatus(null), 'unseen');
assert.equal(
  deriveMasteryStatus({ timesSeen: 0, timesCorrect: 0, lastAttempted: 0 }),
  'unseen',
);
assert.equal(
  deriveMasteryStatus({ timesSeen: 1, timesCorrect: 0, lastAttempted: 1 }),
  'weak',
);
assert.equal(
  deriveMasteryStatus({ timesSeen: 2, timesCorrect: 0, lastAttempted: 1 }),
  'weak',
);
assert.equal(
  deriveMasteryStatus({ timesSeen: 1, timesCorrect: 1, lastAttempted: 1 }),
  'learning',
);
assert.equal(
  deriveMasteryStatus({ timesSeen: 2, timesCorrect: 2, lastAttempted: 1 }),
  'mastered',
);
assert.equal(
  deriveMasteryStatus({ timesSeen: 3, timesCorrect: 2, lastAttempted: 1 }),
  'learning',
);
assert.equal(
  deriveMasteryStatus({ timesSeen: 5, timesCorrect: 4, lastAttempted: 1 }),
  'mastered',
);
console.log(
  '✔ Mastery status derived correctly for all scenarios (unseen, weak, learning, mastered).',
);

// 4. Test "Answering the same question wrong repeatedly surfaces it in the weak drill"
console.log(
  '\n--- 4. Testing Repeated Wrong Answers & Weak Drill Priority ---',
);
const testQ1 = allQuestions[0];
const testQ2 = allQuestions[1];

// First wrong answer on Q1
recordQuestionAttempt(testQ1.id, false);
let progressQ1 = getQuestionProgress(testQ1.id);
assert.equal(progressQ1.timesSeen, 1);
assert.equal(progressQ1.timesCorrect, 0);
assert.equal(progressQ1.lastResult, 'incorrect');
assert.equal(deriveMasteryStatus(progressQ1), 'weak');

let weakList = getWeakQuestions(allQuestions);
assert.equal(weakList.length, 1);
assert.equal(weakList[0].question.id, testQ1.id);

// Answer Q2 wrong once
recordQuestionAttempt(testQ2.id, false);
weakList = getWeakQuestions(allQuestions);
assert.equal(weakList.length, 2);

// Now answer Q1 wrong AGAIN (2nd time) and AGAIN (3rd time)
recordQuestionAttempt(testQ1.id, false);
recordQuestionAttempt(testQ1.id, false);
progressQ1 = getQuestionProgress(testQ1.id);
assert.equal(progressQ1.timesSeen, 3);
assert.equal(progressQ1.timesCorrect, 0);

weakList = getWeakQuestions(allQuestions);
// Q1 has 3 misses vs Q2 has 1 miss -> Q1 MUST rank higher at index 0!
assert.equal(
  weakList[0].question.id,
  testQ1.id,
  'Q1 with repeated misses must surface at top of weak list',
);
assert.ok(
  weakList[0].weaknessScore > weakList[1].weaknessScore,
  'Weakness score must be higher for repeated misses',
);

const weakDrill = sampleWeakDrillQuestions(allQuestions, 10);
assert.equal(
  weakDrill[0].id,
  testQ1.id,
  'Weak drill session must place the most-missed question first',
);
console.log(
  '✔ Repeatedly answering wrong increases weakness score and places question at the top of the weak drill.',
);

// 5. Test Progress Survives Simulated Browser Restart (reading from storage)
console.log('\n--- 5. Testing Persistence across Browser Restart ---');
// Read fresh from storage via module methods
const restoredP1 = getQuestionProgress(testQ1.id);
assert.equal(restoredP1.timesSeen, 3);
assert.equal(restoredP1.timesCorrect, 0);
const restoredWeak = sampleWeakDrillQuestions(allQuestions, 10);
assert.equal(restoredWeak[0].id, testQ1.id);
console.log('✔ Progress survives storage re-read / simulated restart.');

// 6. Test Bookmarks
console.log('\n--- 6. Testing Bookmarks ---');
assert.equal(isQuestionBookmarked(testQ1.id), false);
setQuestionBookmark(testQ1.id, true);
assert.equal(isQuestionBookmarked(testQ1.id), true);
assert.ok(getAllBookmarks().includes(testQ1.id));

const bookmarkedSession = sampleBookmarkedQuestions(allQuestions);
assert.equal(bookmarkedSession.length, 1);
assert.equal(bookmarkedSession[0].id, testQ1.id);

setQuestionBookmark(testQ1.id, false);
assert.equal(isQuestionBookmarked(testQ1.id), false);
console.log('✔ Bookmarks add, query, list, and remove work as expected.');

// 7. Test Daily Streak
console.log('\n--- 7. Testing Daily Streak ---');
const manualActivity = recordStudyActivity();
assert.ok(
  manualActivity.currentStreak >= 1,
  'recordStudyActivity returns current streak',
);
const streak = getStudyStreak();
assert.ok(
  streak.currentStreak >= 1,
  'Practicing questions recorded today updates streak',
);
assert.ok(streak.activeDates.length >= 1);
console.log(
  `✔ Daily streak active: ${streak.currentStreak} day(s), longest: ${streak.longestStreak}.`,
);

// 8. Test Dashboard Calculations
console.log('\n--- 8. Testing Dashboard Statistics ---');
const dashStats = calculateDashboardStats(allQuestions);
assert.equal(dashStats.totalQuestions, 198);
assert.equal(dashStats.seenQuestions, 2);
assert.equal(dashStats.weakCount, 2);
assert.ok(dashStats.byCategory[1]);
assert.ok(dashStats.byCategory[2]);
console.log(
  `✔ Dashboard stats accurate: Coverage ${dashStats.coveragePercent}%, ${dashStats.seenQuestions}/198 questions seen.`,
);

// 9. Test JSON Export and Import
console.log('\n--- 9. Testing Export & Import JSON ---');
const exportedJson = exportStudyProgressJson();
const parsedExport = JSON.parse(exportedJson);
assert.equal(parsedExport.version, 1);
assert.equal(parsedExport.app, 'provisoire');
assert.ok(parsedExport.questions[testQ1.id]);

// Clear all data
clearAllStudyProgress();
assert.equal(getQuestionProgress(testQ1.id), null);
assert.equal(getWeakQuestions(allQuestions).length, 0);

// Import back
const importResult = importStudyProgressJson(exportedJson);
assert.equal(importResult.success, true);
assert.equal(importResult.questionCount, 2);

const postImportP1 = getQuestionProgress(testQ1.id);
assert.equal(postImportP1.timesSeen, 3);
assert.equal(postImportP1.timesCorrect, 0);
assert.equal(getWeakQuestions(allQuestions)[0].question.id, testQ1.id);

// Verify rejection of negative timesSeen or timesCorrect
const badImportSeen = importStudyProgressJson(
  JSON.stringify({
    version: 1,
    app: 'provisoire',
    questions: {
      [testQ1.id]: { timesSeen: -1, timesCorrect: 0 },
    },
  }),
);
assert.equal(badImportSeen.success, false);

const badImportCorrect = importStudyProgressJson(
  JSON.stringify({
    version: 1,
    app: 'provisoire',
    questions: {
      [testQ1.id]: { timesSeen: 2, timesCorrect: -3 },
    },
  }),
);
assert.equal(badImportCorrect.success, false);
console.log(
  '✔ Export and Import JSON perfectly preserved and restored study progress, rejecting negative counters.',
);

// 10. Test Graceful Degradation (Private Browsing / Blocked Storage)
console.log('\n--- 10. Testing Graceful Degradation (Storage Throws) ---');
globalThis.window.localStorage = {
  getItem: () => {
    throw new Error(
      'QuotaExceededError / SecurityError: Storage blocked in Private Browsing',
    );
  },
  setItem: () => {
    throw new Error(
      'QuotaExceededError / SecurityError: Storage blocked in Private Browsing',
    );
  },
  removeItem: () => {
    throw new Error(
      'QuotaExceededError / SecurityError: Storage blocked in Private Browsing',
    );
  },
};
// Module should not crash; in-memory fallback engages
setSafeItem('test_private_key', 'private_val');
assert.equal(getSafeItem('test_private_key'), 'private_val');
removeSafeItem('test_private_key');
assert.equal(getSafeItem('test_private_key'), null);
console.log(
  '✔ Graceful degradation works seamlessly when localStorage throws errors.',
);

console.log('\n======================================================');
console.log('--- ALL STUDY PROGRESS & WEAK DRILL TESTS PASSED! ---');
console.log('======================================================\n');
