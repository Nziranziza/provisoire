import type { Lang, Question } from '../../lib/quiz';
import type {
  ExamMode,
  PastResult,
  PracticeAction,
  PracticeState,
  SessionQuestion,
} from './types';
import {
  DEFAULT_TOTAL_QUESTIONS,
  EXAM_CONFIG,
  EXAM_DURATION_SECONDS,
  STORAGE_KEY_SKIP_AUTO_RESTORE,
  PASSING_SCORE,
} from './constants';
import {
  clearHistoryFromStorage,
  clearSessionFromStorage,
  saveHistoryToStorage,
  saveSessionToStorage,
} from './storage';

/** Randomly samples 20 questions, optionally restricted to a specific category */
export function sampleQuestions(
  allQuestions: Question[],
  totalCount = DEFAULT_TOTAL_QUESTIONS,
  categoryId: number | null = null,
): SessionQuestion[] {
  // Shuffle helper (Fisher-Yates)
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i]!;
      copy[i] = copy[j]!;
      copy[j] = temp;
    }
    return copy;
  };

  let combined: Question[];

  if (categoryId !== null && categoryId !== undefined) {
    const categoryQuestions = allQuestions.filter(
      (q) => q.category_id === categoryId,
    );
    const shuffled = shuffle(categoryQuestions);
    combined = shuffled.slice(0, Math.min(totalCount, shuffled.length));
  } else {
    const cat1 = allQuestions.filter((q) => q.category_id === 1);
    const cat2 = allQuestions.filter((q) => q.category_id === 2);

    const shuffledCat1 = shuffle(cat1);
    const shuffledCat2 = shuffle(cat2);

    // Take ~12 traffic rules and ~8 road signs, or adapt if bank counts differ
    const targetCat2 = Math.min(
      EXAM_CONFIG.DEFAULT_SIGNS_COUNT,
      shuffledCat2.length,
    );
    const targetCat1 = totalCount - targetCat2;

    const selectedCat1 = shuffledCat1.slice(0, targetCat1);
    const selectedCat2 = shuffledCat2.slice(0, targetCat2);

    combined = shuffle([...selectedCat1, ...selectedCat2]);
  }

  return combined.map((q, idx) => {
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

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function calculateFinishState(
  state: PracticeState,
  explicitDate?: string,
): PracticeState {
  let score = 0;
  state.sessionQuestions.forEach((q, idx) => {
    if (state.answers[idx] === q.correct_index) {
      score += 1;
    }
  });

  const passed = score >= PASSING_SCORE;
  const isMock =
    state.mode === 'mock_exam' || (state.mode as string) === 'timed';
  const finalTime = isMock
    ? EXAM_DURATION_SECONDS - state.timeRemaining
    : state.timeSpent;

  const dateFormatted =
    explicitDate ||
    new Date().toLocaleDateString(
      state.currentLocale === 'en'
        ? 'en-US'
        : state.currentLocale === 'fr'
          ? 'fr-FR'
          : 'rw-RW',
      {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );

  const newResult: PastResult = {
    id: String(Date.now()),
    date: dateFormatted,
    score,
    total: state.sessionQuestions.length,
    passed,
    timeSpentSeconds: Math.max(1, finalTime),
    mode: state.mode,
    categoryName:
      state.selectedCategory === 1
        ? 'Traffic Rules'
        : state.selectedCategory === 2
          ? 'Road Signs'
          : 'All Topics',
  };

  const updatedHistory = [newResult, ...state.history].slice(0, 10);
  saveHistoryToStorage(updatedHistory);

  // Persist review_all stage so refreshing the results page stays on results
  saveSessionToStorage({
    sessionQuestions: state.sessionQuestions,
    currentIndex: state.currentIndex,
    answers: state.answers,
    flagged: state.flagged,
    timeRemaining: state.timeRemaining,
    timeSpent: Math.max(1, finalTime),
    mode: state.mode,
    stage: 'review_all',
    selectedCategory: state.selectedCategory,
    locale: state.currentLocale,
    savedAt: Date.now(),
  });

  return {
    ...state,
    stage: 'review_all',
    timeSpent: Math.max(1, finalTime),
    showSubmitModal: false,
    hasSavedSession: true,
    history: updatedHistory,
    reviewFilter: 'all',
  };
}

export function createInitialState(
  initialLang: Lang = 'en',
  initialCategory: number | null = null,
  initialMode: ExamMode = 'practice',
): PracticeState {
  return {
    stage: 'intro',
    mode: initialMode,
    selectedCategory: initialCategory,
    sessionQuestions: [],
    currentIndex: 0,
    answers: {},
    flagged: {},
    timeRemaining: EXAM_DURATION_SECONDS,
    timeSpent: 0,
    isPaused: false,
    showSubmitModal: false,
    reviewFilter: 'all',
    currentLocale: initialLang,
    hasSavedSession: false,
    history: [],
    isHydrated: false,
  };
}

export function practiceReducer(
  state: PracticeState,
  action: PracticeAction,
): PracticeState {
  switch (action.type) {
    case 'INIT_STORAGE': {
      const { history, savedSession, urlCategory, urlMode, detectedLocale } =
        action.payload;
      const initialCat = urlCategory ?? state.selectedCategory ?? null;
      // The route ( /practice vs /exam ) should win over whatever is stored in localStorage.
      // We'll only auto-restore if the stored mode matches the requested mode.
      const requestedMode: ExamMode = (urlMode ?? state.mode) as ExamMode;
      const activeLocale =
        detectedLocale || savedSession?.locale || state.currentLocale;

      // If user explicitly went "back to question bank", don't auto-resume
      // the previously running in-progress session on the next navigation.
      let skipAutoRestore = false;
      try {
        if (typeof window !== 'undefined') {
          skipAutoRestore =
            localStorage.getItem(STORAGE_KEY_SKIP_AUTO_RESTORE) === '1';
          if (skipAutoRestore) {
            localStorage.removeItem(STORAGE_KEY_SKIP_AUTO_RESTORE);
          }
        }
      } catch {
        // ignore
      }

      if (!savedSession || savedSession.sessionQuestions.length === 0) {
        return {
          ...state,
          history,
          mode: requestedMode,
          currentLocale: activeLocale,
          selectedCategory: initialCat,
          hasSavedSession: false,
          isHydrated: true,
        };
      }

      const normalizedSavedMode: ExamMode =
        savedSession.mode === 'mock_exam' ||
        (savedSession.mode as string) === 'timed'
          ? 'mock_exam'
          : 'practice';
      const canAutoRestore =
        normalizedSavedMode === requestedMode && !skipAutoRestore;

      // If session was in_progress, restore it directly (only when mode matches)
      if (savedSession.stage === 'in_progress') {
        const now = Date.now();
        const elapsedSeconds = savedSession.savedAt
          ? Math.max(0, Math.floor((now - savedSession.savedAt) / 1000))
          : 0;
        const isMock = normalizedSavedMode === 'mock_exam';

        const adjustedTimeRemaining = isMock
          ? Math.max(0, savedSession.timeRemaining - elapsedSeconds)
          : savedSession.timeRemaining;

        const adjustedTimeSpent = savedSession.timeSpent + elapsedSeconds;

        if (canAutoRestore && isMock && adjustedTimeRemaining <= 0) {
          // Time ran out while away: auto-submit exam results
          return calculateFinishState({
            ...state,
            sessionQuestions: savedSession.sessionQuestions,
            currentIndex: savedSession.currentIndex,
            answers: savedSession.answers || {},
            flagged: savedSession.flagged || {},
            timeRemaining: 0,
            timeSpent: adjustedTimeSpent,
            mode: normalizedSavedMode,
            selectedCategory: savedSession.selectedCategory ?? null,
            currentLocale: activeLocale,
            history,
            isHydrated: true,
          });
        }

        return {
          ...state,
          stage: canAutoRestore ? 'in_progress' : 'intro',
          sessionQuestions: savedSession.sessionQuestions,
          currentIndex: Math.min(
            savedSession.sessionQuestions.length - 1,
            Math.max(0, savedSession.currentIndex),
          ),
          answers: savedSession.answers || {},
          flagged: savedSession.flagged || {},
          timeRemaining: adjustedTimeRemaining,
          timeSpent: adjustedTimeSpent,
          mode: requestedMode,
          selectedCategory: initialCat,
          currentLocale: activeLocale,
          isPaused: false,
          showSubmitModal: false,
          hasSavedSession: true,
          history,
          isHydrated: true,
          reviewFilter: 'all',
        };
      }

      // If session was in review_all (results screen), restore review screen only when mode matches.
      if (savedSession.stage === 'review_all') {
        return {
          ...state,
          stage: canAutoRestore ? 'review_all' : 'intro',
          sessionQuestions: savedSession.sessionQuestions,
          currentIndex: Math.min(
            savedSession.sessionQuestions.length - 1,
            Math.max(0, savedSession.currentIndex),
          ),
          answers: savedSession.answers || {},
          flagged: savedSession.flagged || {},
          timeRemaining: savedSession.timeRemaining,
          timeSpent: savedSession.timeSpent,
          mode: requestedMode,
          selectedCategory: initialCat,
          currentLocale: activeLocale,
          isPaused: false,
          showSubmitModal: false,
          hasSavedSession: true,
          history,
          isHydrated: true,
          reviewFilter: 'all',
        };
      }

      return {
        ...state,
        history,
        currentLocale: activeLocale,
        selectedCategory: initialCat,
        hasSavedSession: true,
        isHydrated: true,
        mode: requestedMode,
      };
    }

    case 'START_EXAM': {
      clearSessionFromStorage();
      return {
        ...state,
        stage: 'in_progress',
        sessionQuestions: action.payload.questions,
        mode: action.payload.mode,
        selectedCategory: action.payload.selectedCategory,
        currentIndex: 0,
        answers: {},
        flagged: {},
        timeRemaining: EXAM_DURATION_SECONDS,
        timeSpent: 0,
        isPaused: false,
        showSubmitModal: false,
        hasSavedSession: true,
      };
    }

    case 'RESUME_SESSION': {
      if (state.sessionQuestions.length > 0) {
        return {
          ...state,
          stage: 'in_progress',
          isPaused: false,
          showSubmitModal: false,
        };
      }
      return state;
    }

    case 'DISCARD_SAVED_SESSION': {
      clearSessionFromStorage();
      return {
        ...state,
        stage: 'intro',
        hasSavedSession: false,
        sessionQuestions: [],
        answers: {},
        flagged: {},
        currentIndex: 0,
        timeRemaining: EXAM_DURATION_SECONDS,
        timeSpent: 0,
      };
    }

    case 'SELECT_ANSWER': {
      const { questionIndex, optionIndex } = action.payload;
      return {
        ...state,
        answers: {
          ...state.answers,
          [questionIndex]: optionIndex,
        },
      };
    }

    case 'TOGGLE_FLAG': {
      const { questionIndex } = action.payload;
      return {
        ...state,
        flagged: {
          ...state.flagged,
          [questionIndex]: !state.flagged[questionIndex],
        },
      };
    }

    case 'SET_CURRENT_INDEX': {
      const safeIndex = Math.max(
        0,
        Math.min(state.sessionQuestions.length - 1, action.payload.index),
      );
      return {
        ...state,
        currentIndex: safeIndex,
      };
    }

    case 'NEXT_QUESTION': {
      if (state.currentIndex < state.sessionQuestions.length - 1) {
        return {
          ...state,
          currentIndex: state.currentIndex + 1,
        };
      }
      return state;
    }

    case 'PREV_QUESTION': {
      if (state.currentIndex > 0) {
        return {
          ...state,
          currentIndex: state.currentIndex - 1,
        };
      }
      return state;
    }

    case 'SKIP_QUESTION': {
      const total = state.sessionQuestions.length;
      if (total === 0) return state;

      if (state.currentIndex < total - 1) {
        return {
          ...state,
          currentIndex: state.currentIndex + 1,
        };
      }

      // If at the end, find first unanswered question from beginning
      for (let i = 0; i < total; i++) {
        if (state.answers[i] === undefined) {
          return {
            ...state,
            currentIndex: i,
          };
        }
      }

      return state;
    }

    case 'JUMP_TO_NEXT_UNANSWERED': {
      const total = state.sessionQuestions.length;
      if (total === 0) return state;

      // Check ahead first
      for (let i = state.currentIndex + 1; i < total; i++) {
        if (state.answers[i] === undefined) {
          return {
            ...state,
            currentIndex: i,
          };
        }
      }
      // Then wrap around from start
      for (let i = 0; i < state.currentIndex; i++) {
        if (state.answers[i] === undefined) {
          return {
            ...state,
            currentIndex: i,
          };
        }
      }
      return state;
    }

    case 'JUMP_TO_NEXT_FLAGGED': {
      const total = state.sessionQuestions.length;
      if (total === 0) return state;

      // Check ahead first
      for (let i = state.currentIndex + 1; i < total; i++) {
        if (state.flagged[i]) {
          return {
            ...state,
            currentIndex: i,
          };
        }
      }
      // Then wrap around from start
      for (let i = 0; i < state.currentIndex; i++) {
        if (state.flagged[i]) {
          return {
            ...state,
            currentIndex: i,
          };
        }
      }
      return state;
    }

    case 'TICK_TIMER': {
      if (state.stage !== 'in_progress' || state.isPaused) {
        return state;
      }

      const nextTimeSpent = state.timeSpent + 1;
      const isMock =
        state.mode === 'mock_exam' || (state.mode as string) === 'timed';

      if (isMock) {
        if (state.timeRemaining <= 1) {
          // Time is up -> complete exam
          return calculateFinishState({
            ...state,
            timeRemaining: 0,
            timeSpent: nextTimeSpent,
          });
        }
        return {
          ...state,
          timeRemaining: state.timeRemaining - 1,
          timeSpent: nextTimeSpent,
        };
      }

      return {
        ...state,
        timeSpent: nextTimeSpent,
      };
    }

    case 'TOGGLE_PAUSE': {
      return {
        ...state,
        isPaused: !state.isPaused,
      };
    }

    case 'SET_PAUSE': {
      return {
        ...state,
        isPaused: action.payload.isPaused,
      };
    }

    case 'OPEN_SUBMIT_MODAL': {
      return {
        ...state,
        showSubmitModal: true,
      };
    }

    case 'CLOSE_SUBMIT_MODAL': {
      return {
        ...state,
        showSubmitModal: false,
      };
    }

    case 'FINISH_EXAM': {
      return calculateFinishState(state, action.payload?.dateFormatted);
    }

    case 'RETAKE_MISSED': {
      const missedQuestions = state.sessionQuestions.filter(
        (q, idx) => state.answers[idx] !== q.correct_index,
      );
      if (missedQuestions.length === 0) return state;

      const refreshed: SessionQuestion[] = missedQuestions.map((q, idx) => ({
        ...q,
        sessionNumber: idx + 1,
      }));

      clearSessionFromStorage();
      return {
        ...state,
        stage: 'in_progress',
        sessionQuestions: refreshed,
        mode: 'practice',
        currentIndex: 0,
        answers: {},
        flagged: {},
        timeRemaining: refreshed.length * 60,
        timeSpent: 0,
        isPaused: false,
        showSubmitModal: false,
        hasSavedSession: true,
      };
    }

    case 'CLEAR_HISTORY': {
      clearHistoryFromStorage();
      return {
        ...state,
        history: [],
      };
    }

    case 'SET_REVIEW_FILTER': {
      return {
        ...state,
        reviewFilter: action.payload.filter,
      };
    }

    case 'SET_LOCALE': {
      return {
        ...state,
        currentLocale: action.payload.locale,
      };
    }

    case 'SET_MODE': {
      return {
        ...state,
        mode: action.payload.mode,
      };
    }

    case 'SET_CATEGORY': {
      return {
        ...state,
        selectedCategory: action.payload.categoryId,
      };
    }

    default:
      return state;
  }
}
