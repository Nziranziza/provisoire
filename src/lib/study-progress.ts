import type { Question } from './quiz';
import type { SessionQuestion } from '../components/practice/types';

export type MasteryStatus = 'unseen' | 'weak' | 'learning' | 'mastered';

export interface QuestionProgress {
  timesSeen: number;
  timesCorrect: number;
  lastAttempted: number; // timestamp in ms
  lastResult?: 'correct' | 'incorrect';
}

export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  activeDates: string[];
}

export interface LastStudiedState {
  mode: 'practice' | 'mock_exam' | 'weak_drill' | 'bookmarked_drill';
  categoryId: number | null;
  label?: string;
  timestamp: number;
}

export interface StudyProgressExport {
  version: 1;
  app: 'provisoire';
  exportedAt: string;
  questions: Record<string, QuestionProgress>;
  bookmarks: string[];
  streak: StudyStreak;
  lastStudied: LastStudiedState | null;
}

export interface CategoryProgressStats {
  categoryId: number;
  categoryName: string;
  totalQuestions: number;
  seenQuestions: number;
  masteredCount: number;
  learningCount: number;
  weakCount: number;
  unseenCount: number;
  coveragePercent: number;
  accuracyPercent: number;
}

export interface StudyDashboardStats {
  totalQuestions: number;
  seenQuestions: number;
  masteredCount: number;
  learningCount: number;
  weakCount: number;
  unseenCount: number;
  coveragePercent: number;
  overallAccuracyPercent: number;
  streak: StudyStreak;
  practicedToday: boolean;
  bookmarkedCount: number;
  byCategory: Record<number, CategoryProgressStats>;
}

// Storage keys
export const STORAGE_KEY_QUESTION_PROGRESS = 'provisoire_question_progress_v1';
export const STORAGE_KEY_BOOKMARKS = 'provisoire_bookmarks_v1';
export const STORAGE_KEY_STREAK = 'provisoire_study_streak_v1';
export const STORAGE_KEY_LAST_STUDIED = 'provisoire_last_studied_v1';

// Custom events for reactive UI updates across components
export const EVENT_PROGRESS_UPDATED = 'provisoire:progress_updated';
export const EVENT_BOOKMARKS_CHANGED = 'provisoire:bookmarks_changed';
export const EVENT_STREAK_UPDATED = 'provisoire:streak_updated';

// -------------------------------------------------------------
// Safe Storage Layer with In-Memory Fallback (Private Browsing)
// -------------------------------------------------------------
const inMemoryStore: Record<string, string> = {};

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__provisoire_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

let storageAvailable: boolean | null = null;

export function isPersistentStorageSupported(): boolean {
  if (storageAvailable === null) {
    storageAvailable = isLocalStorageAvailable();
  }
  return storageAvailable;
}

export function getSafeItem(key: string): string | null {
  if (isPersistentStorageSupported()) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // Fallback below
    }
  }
  return inMemoryStore[key] ?? null;
}

export function setSafeItem(key: string, value: string): void {
  if (isPersistentStorageSupported()) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      // Storage quota or restriction, keep in memory
    }
  }
  inMemoryStore[key] = value;
}

export function removeSafeItem(key: string): void {
  if (isPersistentStorageSupported()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  delete inMemoryStore[key];
}

// -------------------------------------------------------------
// Date Helpers
// -------------------------------------------------------------
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

export function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateKey(d);
}

// -------------------------------------------------------------
// Per-Question Progress
// -------------------------------------------------------------
export function getAllQuestionProgress(): Record<string, QuestionProgress> {
  try {
    const raw = getSafeItem(STORAGE_KEY_QUESTION_PROGRESS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, QuestionProgress>;
      }
    }
  } catch {
    // ignore
  }
  return {};
}

export function getQuestionProgress(
  questionId: string,
): QuestionProgress | null {
  const all = getAllQuestionProgress();
  return all[questionId] ?? null;
}

/**
 * Derives the mastery status for a question:
 * - 'unseen': never attempted
 * - 'weak': failed repeatedly or accuracy < 60% with at least one miss
 * - 'mastered': attempted >= 2 times with >= 80% accuracy and <= 1 total miss
 * - 'learning': all other attempted questions
 */
export function deriveMasteryStatus(
  progress?: QuestionProgress | null,
): MasteryStatus {
  if (!progress || !progress.timesSeen || progress.timesSeen <= 0) {
    return 'unseen';
  }
  const { timesSeen, timesCorrect } = progress;
  const missCount = Math.max(0, timesSeen - timesCorrect);
  const accuracy = timesSeen > 0 ? timesCorrect / timesSeen : 0;

  if (timesSeen >= 2 && accuracy >= 0.8 && missCount <= 1) {
    return 'mastered';
  }

  if (missCount >= 2 || (timesSeen > 0 && accuracy < 0.6)) {
    return 'weak';
  }

  return 'learning';
}

/**
 * Records an answer to a question. Updates seen/correct counts,
 * last attempted timestamp, updates streak, and notifies listeners.
 */
export function recordQuestionAttempt(
  questionId: string,
  isCorrect: boolean,
): QuestionProgress {
  const all = getAllQuestionProgress();
  const existing = all[questionId] ?? {
    timesSeen: 0,
    timesCorrect: 0,
    lastAttempted: 0,
  };

  const updated: QuestionProgress = {
    timesSeen: existing.timesSeen + 1,
    timesCorrect: existing.timesCorrect + (isCorrect ? 1 : 0),
    lastAttempted: Date.now(),
    lastResult: isCorrect ? 'correct' : 'incorrect',
  };

  all[questionId] = updated;
  setSafeItem(STORAGE_KEY_QUESTION_PROGRESS, JSON.stringify(all));

  // Also update daily streak
  recordStudyActivity();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_PROGRESS_UPDATED, {
        detail: { questionId, progress: updated },
      }),
    );
  }

  return updated;
}

// -------------------------------------------------------------
// Weak-Question Drill Selection
// -------------------------------------------------------------
export interface WeakQuestionCandidate {
  question: Question;
  progress: QuestionProgress;
  weaknessScore: number;
}

/**
 * Ranks all attempted questions that have mistakes.
 * Higher weaknessScore means the question was missed more often or more recently.
 */
export function getWeakQuestions(
  allQuestions: Question[],
  categoryId?: number | null,
): WeakQuestionCandidate[] {
  const allProgress = getAllQuestionProgress();
  const candidates: WeakQuestionCandidate[] = [];

  for (const q of allQuestions) {
    if (
      categoryId !== null &&
      categoryId !== undefined &&
      q.category_id !== categoryId
    ) {
      continue;
    }
    const p = allProgress[q.id];
    if (!p || p.timesSeen <= 0) continue;

    const missCount = Math.max(0, p.timesSeen - p.timesCorrect);
    if (missCount <= 0) continue; // Never missed

    const errorRate = missCount / p.timesSeen;
    // Primary weight: total misses (each miss gives 10 points)
    // Error rate weight: up to 5 points
    // Recency weight: 3 points if the last attempt was wrong
    const weaknessScore =
      missCount * 10 + errorRate * 5 + (p.lastResult === 'incorrect' ? 3 : 0);

    candidates.push({
      question: q,
      progress: p,
      weaknessScore,
    });
  }

  // Sort descending by weaknessScore, then by recency
  candidates.sort((a, b) => {
    if (b.weaknessScore !== a.weaknessScore) {
      return b.weaknessScore - a.weaknessScore;
    }
    return (b.progress.lastAttempted || 0) - (a.progress.lastAttempted || 0);
  });

  return candidates;
}

/**
 * Samples up to `maxCount` questions from the weak question candidates
 * and transforms them into SessionQuestions for the practice engine.
 */
export function sampleWeakDrillQuestions(
  allQuestions: Question[],
  maxCount = 20,
  categoryId?: number | null,
): SessionQuestion[] {
  const weakCandidates = getWeakQuestions(allQuestions, categoryId);
  const selected = weakCandidates.slice(0, maxCount).map((c) => c.question);

  return selected.map((q, idx) => {
    const bankIndex = allQuestions.findIndex((item) => item.id === q.id);
    return {
      id: q.id,
      bankIndex: bankIndex >= 0 ? bankIndex : 0,
      sessionNumber: idx + 1,
      category_id: q.category_id,
      category_name: q.category_name,
      image_url: q.image_url,
      correct_index: q.correct_index,
      translations: q.translations,
    };
  });
}

// -------------------------------------------------------------
// Bookmarks System
// -------------------------------------------------------------
export function getAllBookmarks(): string[] {
  try {
    const raw = getSafeItem(STORAGE_KEY_BOOKMARKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as string[];
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function isQuestionBookmarked(questionId: string): boolean {
  const bookmarks = getAllBookmarks();
  return bookmarks.includes(questionId);
}

export function setQuestionBookmark(
  questionId: string,
  bookmarked: boolean,
): void {
  const bookmarks = getAllBookmarks();
  const set = new Set(bookmarks);
  if (bookmarked) {
    set.add(questionId);
  } else {
    set.delete(questionId);
  }
  const next = Array.from(set);
  setSafeItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(next));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_BOOKMARKS_CHANGED, {
        detail: { questionId, bookmarked, totalBookmarks: next.length },
      }),
    );
  }
}

export function toggleQuestionBookmark(questionId: string): boolean {
  const current = isQuestionBookmarked(questionId);
  const next = !current;
  setQuestionBookmark(questionId, next);
  return next;
}

export function getBookmarkedQuestions(allQuestions: Question[]): Question[] {
  const bookmarks = new Set(getAllBookmarks());
  return allQuestions.filter((q) => bookmarks.has(q.id));
}

export function sampleBookmarkedQuestions(
  allQuestions: Question[],
  maxCount = 20,
): SessionQuestion[] {
  const bookmarked = getBookmarkedQuestions(allQuestions);
  const selected = bookmarked.slice(0, maxCount);

  return selected.map((q, idx) => {
    const bankIndex = allQuestions.findIndex((item) => item.id === q.id);
    return {
      id: q.id,
      bankIndex: bankIndex >= 0 ? bankIndex : 0,
      sessionNumber: idx + 1,
      category_id: q.category_id,
      category_name: q.category_name,
      image_url: q.image_url,
      correct_index: q.correct_index,
      translations: q.translations,
    };
  });
}

// -------------------------------------------------------------
// Daily Study Streak
// -------------------------------------------------------------
export function getStudyStreak(): StudyStreak {
  try {
    const raw = getSafeItem(STORAGE_KEY_STREAK);
    if (raw) {
      const parsed = JSON.parse(raw) as StudyStreak;
      if (
        parsed &&
        typeof parsed.currentStreak === 'number' &&
        typeof parsed.longestStreak === 'number'
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    activeDates: [],
  };
}

/**
 * Returns streak with active vs broken status computed for today.
 */
export function getActiveStreakState(): {
  streak: StudyStreak;
  practicedToday: boolean;
  effectiveCurrentStreak: number;
} {
  const streak = getStudyStreak();
  const today = getTodayKey();
  const yesterday = getYesterdayKey();

  const practicedToday = streak.lastActiveDate === today;
  let effectiveCurrentStreak = streak.currentStreak;

  // If last practice was older than yesterday, the streak is currently 0
  if (!practicedToday && streak.lastActiveDate !== yesterday) {
    effectiveCurrentStreak = 0;
  }

  return {
    streak,
    practicedToday,
    effectiveCurrentStreak,
  };
}

export function recordStudyActivity(): StudyStreak {
  const streak = getStudyStreak();
  const today = getTodayKey();
  const yesterday = getYesterdayKey();

  if (streak.lastActiveDate === today) {
    // Already active today
    return streak;
  }

  let nextCurrent = 1;
  if (streak.lastActiveDate === yesterday) {
    nextCurrent = streak.currentStreak + 1;
  }

  const nextLongest = Math.max(streak.longestStreak, nextCurrent);
  const nextActiveDates = Array.from(
    new Set([...streak.activeDates, today]),
  ).slice(-60); // Keep last 60 active days

  const updated: StudyStreak = {
    currentStreak: nextCurrent,
    longestStreak: nextLongest,
    lastActiveDate: today,
    activeDates: nextActiveDates,
  };

  setSafeItem(STORAGE_KEY_STREAK, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_STREAK_UPDATED, { detail: updated }),
    );
  }

  return updated;
}

// -------------------------------------------------------------
// Resume Where You Left Off (Study Habit)
// -------------------------------------------------------------
export function getLastStudiedSession(): LastStudiedState | null {
  try {
    const raw = getSafeItem(STORAGE_KEY_LAST_STUDIED);
    if (raw) {
      const parsed = JSON.parse(raw) as LastStudiedState;
      if (parsed && parsed.mode) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function recordLastStudiedSession(state: LastStudiedState): void {
  setSafeItem(STORAGE_KEY_LAST_STUDIED, JSON.stringify(state));
}

// -------------------------------------------------------------
// Overall Dashboard & Coverage Aggregation
// -------------------------------------------------------------
export function calculateDashboardStats(
  allQuestions: Question[],
): StudyDashboardStats {
  const progressMap = getAllQuestionProgress();
  const { streak, practicedToday, effectiveCurrentStreak } =
    getActiveStreakState();
  const bookmarks = getAllBookmarks();

  let masteredCount = 0;
  let learningCount = 0;
  let weakCount = 0;
  let seenQuestions = 0;
  let totalAttempts = 0;
  let totalCorrect = 0;

  const catMap: Record<number, CategoryProgressStats> = {
    1: {
      categoryId: 1,
      categoryName: 'Traffic Rules',
      totalQuestions: 0,
      seenQuestions: 0,
      masteredCount: 0,
      learningCount: 0,
      weakCount: 0,
      unseenCount: 0,
      coveragePercent: 0,
      accuracyPercent: 0,
    },
    2: {
      categoryId: 2,
      categoryName: 'Road Signs',
      totalQuestions: 0,
      seenQuestions: 0,
      masteredCount: 0,
      learningCount: 0,
      weakCount: 0,
      unseenCount: 0,
      coveragePercent: 0,
      accuracyPercent: 0,
    },
  };

  for (const q of allQuestions) {
    const p = progressMap[q.id];
    const status = deriveMasteryStatus(p);

    const cat = catMap[q.category_id] ?? {
      categoryId: q.category_id,
      categoryName: q.category_name,
      totalQuestions: 0,
      seenQuestions: 0,
      masteredCount: 0,
      learningCount: 0,
      weakCount: 0,
      unseenCount: 0,
      coveragePercent: 0,
      accuracyPercent: 0,
    };
    catMap[q.category_id] = cat;

    cat.totalQuestions += 1;

    if (p && p.timesSeen > 0) {
      seenQuestions += 1;
      cat.seenQuestions += 1;
      totalAttempts += p.timesSeen;
      totalCorrect += p.timesCorrect;
    }

    if (status === 'mastered') {
      masteredCount += 1;
      cat.masteredCount += 1;
    } else if (status === 'weak') {
      weakCount += 1;
      cat.weakCount += 1;
    } else if (status === 'learning') {
      learningCount += 1;
      cat.learningCount += 1;
    } else {
      cat.unseenCount += 1;
    }
  }

  // Calculate percentages
  const totalQuestions = allQuestions.length;
  const unseenCount = Math.max(0, totalQuestions - seenQuestions);
  const coveragePercent =
    totalQuestions > 0 ? Math.round((seenQuestions / totalQuestions) * 100) : 0;
  const overallAccuracyPercent =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  for (const cat of Object.values(catMap)) {
    cat.unseenCount = Math.max(0, cat.totalQuestions - cat.seenQuestions);
    cat.coveragePercent =
      cat.totalQuestions > 0
        ? Math.round((cat.seenQuestions / cat.totalQuestions) * 100)
        : 0;
    // Calculate cat attempts
    let catAttempts = 0;
    let catCorrect = 0;
    for (const q of allQuestions) {
      if (q.category_id === cat.categoryId) {
        const p = progressMap[q.id];
        if (p && p.timesSeen > 0) {
          catAttempts += p.timesSeen;
          catCorrect += p.timesCorrect;
        }
      }
    }
    cat.accuracyPercent =
      catAttempts > 0 ? Math.round((catCorrect / catAttempts) * 100) : 0;
  }

  return {
    totalQuestions,
    seenQuestions,
    masteredCount,
    learningCount,
    weakCount,
    unseenCount,
    coveragePercent,
    overallAccuracyPercent,
    streak: {
      ...streak,
      currentStreak: effectiveCurrentStreak,
    },
    practicedToday,
    bookmarkedCount: bookmarks.length,
    byCategory: catMap,
  };
}

// -------------------------------------------------------------
// JSON Export & Import
// -------------------------------------------------------------
export function exportStudyProgressJson(): string {
  const exportData: StudyProgressExport = {
    version: 1,
    app: 'provisoire',
    exportedAt: new Date().toISOString(),
    questions: getAllQuestionProgress(),
    bookmarks: getAllBookmarks(),
    streak: getStudyStreak(),
    lastStudied: getLastStudiedSession(),
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadStudyProgressFile(): void {
  try {
    if (typeof window === 'undefined') return;
    const jsonStr = exportStudyProgressJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provisoire-progress-${getTodayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to trigger file download', err);
  }
}

export interface ImportResult {
  success: boolean;
  error?: string;
  questionCount?: number;
  bookmarkCount?: number;
}

export function importStudyProgressJson(rawJson: string): ImportResult {
  try {
    if (!rawJson || typeof rawJson !== 'string') {
      return { success: false, error: 'Empty or invalid data provided.' };
    }

    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'File is not a valid JSON object.' };
    }

    const questions: Record<string, QuestionProgress> = {};
    if (parsed.questions && typeof parsed.questions === 'object') {
      for (const [id, val] of Object.entries(parsed.questions)) {
        if (val && typeof val === 'object') {
          const p = val as Record<string, unknown>;
          questions[id] = {
            timesSeen: Number(p.timesSeen) || 0,
            timesCorrect: Number(p.timesCorrect) || 0,
            lastAttempted: Number(p.lastAttempted) || Date.now(),
            lastResult:
              p.lastResult === 'correct' || p.lastResult === 'incorrect'
                ? p.lastResult
                : undefined,
          };
        }
      }
    }

    const bookmarks: string[] = [];
    if (Array.isArray(parsed.bookmarks)) {
      for (const item of parsed.bookmarks) {
        if (typeof item === 'string') {
          bookmarks.push(item);
        }
      }
    }

    // Save to safe storage
    setSafeItem(STORAGE_KEY_QUESTION_PROGRESS, JSON.stringify(questions));
    setSafeItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));

    if (parsed.streak && typeof parsed.streak === 'object') {
      const s = parsed.streak as Record<string, unknown>;
      const streakToSave: StudyStreak = {
        currentStreak: Number(s.currentStreak) || 0,
        longestStreak: Number(s.longestStreak) || 0,
        lastActiveDate:
          typeof s.lastActiveDate === 'string' ? s.lastActiveDate : null,
        activeDates: Array.isArray(s.activeDates)
          ? (s.activeDates.filter((x) => typeof x === 'string') as string[])
          : [],
      };
      setSafeItem(STORAGE_KEY_STREAK, JSON.stringify(streakToSave));
    }

    if (parsed.lastStudied && typeof parsed.lastStudied === 'object') {
      setSafeItem(STORAGE_KEY_LAST_STUDIED, JSON.stringify(parsed.lastStudied));
    }

    // Notify all UI listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EVENT_PROGRESS_UPDATED, { detail: {} }),
      );
      window.dispatchEvent(
        new CustomEvent(EVENT_BOOKMARKS_CHANGED, { detail: {} }),
      );
      window.dispatchEvent(
        new CustomEvent(EVENT_STREAK_UPDATED, { detail: {} }),
      );
    }

    return {
      success: true,
      questionCount: Object.keys(questions).length,
      bookmarkCount: bookmarks.length,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to parse JSON progress file.',
    };
  }
}

export function clearAllStudyProgress(): void {
  removeSafeItem(STORAGE_KEY_QUESTION_PROGRESS);
  removeSafeItem(STORAGE_KEY_BOOKMARKS);
  removeSafeItem(STORAGE_KEY_STREAK);
  removeSafeItem(STORAGE_KEY_LAST_STUDIED);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_PROGRESS_UPDATED, { detail: {} }),
    );
    window.dispatchEvent(
      new CustomEvent(EVENT_BOOKMARKS_CHANGED, { detail: {} }),
    );
    window.dispatchEvent(new CustomEvent(EVENT_STREAK_UPDATED, { detail: {} }));
  }
}
