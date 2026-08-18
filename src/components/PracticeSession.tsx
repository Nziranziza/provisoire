import { useReducer, useEffect } from 'react';
import type { Lang, Question } from '../lib/quiz';
import questionBank from '../../questions.json';

// Re-export types for consumers
export type {
  PracticeSessionProps,
  SessionQuestion,
  ExamStage,
  ExamMode,
  ReviewFilter,
  PastResult,
  SavedSession,
  PracticeState,
  PracticeAction,
} from './practice/types';

import type { PracticeSessionProps, ExamMode } from './practice/types';
import { getTranslation } from './practice/constants';
import {
  loadHistoryFromStorage,
  loadSessionFromStorage,
  saveSessionToStorage,
  clearSessionFromStorage,
} from './practice/storage';
import {
  createInitialState,
  practiceReducer,
  sampleQuestions,
} from './practice/reducer';
import { DEFAULT_TOTAL_QUESTIONS } from './practice/constants';

import PracticeIntro from './practice/PracticeIntro';
import PracticeExam from './practice/PracticeExam';
import PracticeSubmitModal from './practice/PracticeSubmitModal';
import PracticeReview from './practice/PracticeReview';

export default function PracticeSession({
  lang = 'en',
  imageBase = '/',
  initialCategory = null,
  initialMode = 'practice',
}: PracticeSessionProps) {
  const [state, dispatch] = useReducer(practiceReducer, lang, (l) =>
    createInitialState(l, initialCategory, initialMode),
  );

  const t = getTranslation(state.currentLocale);
  const allQuestions = (questionBank.questions || []) as Question[];

  // Sync lang prop changes from parent / route
  useEffect(() => {
    if (lang && state.currentLocale !== lang) {
      dispatch({ type: 'SET_LOCALE', payload: { locale: lang } });
    }
  }, [lang]);

  // Hydrate from localStorage once mounted & detect route path locale/mode
  useEffect(() => {
    const history = loadHistoryFromStorage();
    const savedSession = loadSessionFromStorage();

    let urlCat: number | null = null;
    let urlMode: ExamMode | null = null;
    let pathLocale: Lang = lang;

    try {
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search);
        const cat = p.get('category') || p.get('cat');
        if (cat === 'traffic-rules' || cat === '1') urlCat = 1;
        else if (cat === 'road-signs' || cat === '2') urlCat = 2;

        const modeParam = p.get('mode');
        if (
          modeParam === 'mock_exam' ||
          modeParam === 'exam' ||
          modeParam === 'timed'
        ) {
          urlMode = 'mock_exam';
        } else if (modeParam === 'practice' || modeParam === 'untimed') {
          urlMode = 'practice';
        }

        const match = window.location.pathname.match(/^\/(en|fr|rw)(\/|$)/);
        if (match && match[1]) {
          pathLocale = match[1] as Lang;
        }

        if (window.location.pathname.includes('/exam')) {
          urlMode = 'mock_exam';
        } else if (window.location.pathname.includes('/practice')) {
          urlMode = urlMode ?? initialMode;
        }
      }
    } catch {
      // ignore
    }

    dispatch({
      type: 'INIT_STORAGE',
      payload: {
        history,
        savedSession,
        urlCategory: urlCat ?? initialCategory,
        urlMode: urlMode ?? initialMode,
        detectedLocale: pathLocale,
      },
    });
  }, [lang, initialCategory, initialMode]);

  // Save active session / review state to localStorage on state changes
  useEffect(() => {
    if (!state.isHydrated) return;

    if (
      (state.stage === 'in_progress' || state.stage === 'review_all') &&
      state.sessionQuestions.length > 0
    ) {
      saveSessionToStorage({
        sessionQuestions: state.sessionQuestions,
        currentIndex: state.currentIndex,
        answers: state.answers,
        flagged: state.flagged,
        timeRemaining: state.timeRemaining,
        timeSpent: state.timeSpent,
        mode: state.mode,
        stage: state.stage,
        selectedCategory: state.selectedCategory,
        locale: state.currentLocale,
        savedAt: Date.now(),
      });
    } else if (state.stage === 'intro') {
      clearSessionFromStorage();
    }
  }, [
    state.isHydrated,
    state.stage,
    state.sessionQuestions,
    state.currentIndex,
    state.answers,
    state.flagged,
    state.timeRemaining,
    state.timeSpent,
    state.mode,
    state.selectedCategory,
    state.currentLocale,
  ]);

  // Timer interval
  useEffect(() => {
    if (state.stage !== 'in_progress' || state.isPaused) return;

    const timer = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.stage, state.isPaused]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (state.stage !== 'in_progress') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement)?.tagName,
        )
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        dispatch({ type: 'NEXT_QUESTION' });
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        dispatch({ type: 'PREV_QUESTION' });
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        dispatch({ type: 'SKIP_QUESTION' });
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        dispatch({ type: 'JUMP_TO_NEXT_UNANSWERED' });
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        dispatch({
          type: 'TOGGLE_FLAG',
          payload: { questionIndex: state.currentIndex },
        });
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const optionIndex = Number.parseInt(e.key, 10) - 1;
        dispatch({
          type: 'SELECT_ANSWER',
          payload: { questionIndex: state.currentIndex, optionIndex },
        });
      } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const optionIndex = e.key.toLowerCase().charCodeAt(0) - 97;
        dispatch({
          type: 'SELECT_ANSWER',
          payload: { questionIndex: state.currentIndex, optionIndex },
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.stage, state.currentIndex]);

  // Listen to browser back/forward history navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const isExamPath = window.location.pathname.includes('/exam');
      const isPracticePath = window.location.pathname.includes('/practice');
      const targetMode: ExamMode | null = isExamPath
        ? 'mock_exam'
        : isPracticePath
          ? 'practice'
          : null;
      if (targetMode && targetMode !== state.mode) {
        dispatch({ type: 'SET_MODE', payload: { mode: targetMode } });
      }

      const match = window.location.pathname.match(/^\/(en|fr|rw)(\/|$)/);
      if (match && match[1] && (match[1] as Lang) !== state.currentLocale) {
        dispatch({
          type: 'SET_LOCALE',
          payload: { locale: match[1] as Lang },
        });
      }

      const p = new URLSearchParams(window.location.search);
      const cat = p.get('category') || p.get('cat');
      let catId: number | null = null;
      if (cat === 'traffic-rules' || cat === '1') catId = 1;
      else if (cat === 'road-signs' || cat === '2') catId = 2;
      if (catId !== state.selectedCategory) {
        dispatch({ type: 'SET_CATEGORY', payload: { categoryId: catId } });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [state.mode, state.currentLocale, state.selectedCategory]);

  const handleStartExam = (
    chosenMode: ExamMode,
    chosenCat: number | null = state.selectedCategory,
  ) => {
    const sampled = sampleQuestions(
      allQuestions,
      DEFAULT_TOTAL_QUESTIONS,
      chosenCat,
    );
    dispatch({
      type: 'START_EXAM',
      payload: {
        questions: sampled,
        mode: chosenMode,
        selectedCategory: chosenCat,
      },
    });
  };

  const handleLocaleChange = (newLocale: Lang) => {
    dispatch({ type: 'SET_LOCALE', payload: { locale: newLocale } });

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('provisoire_user_locale', newLocale);

        // Update the browser URL so a page refresh (F5) stays in this exact locale & mode!
        const currentPath = window.location.pathname;
        const targetSlug = state.mode === 'mock_exam' ? 'exam' : 'practice';
        let newPath = `/${newLocale}/${targetSlug}`;
        if (/^\/(en|fr|rw)\/(exam|practice)(\/|$)/.test(currentPath)) {
          newPath = currentPath.replace(/^\/(en|fr|rw)/, `/${newLocale}`);
        }
        window.history.pushState(null, '', newPath + window.location.search);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="practice-engine mx-auto max-w-3xl text-slate-900">
      {/* Top Locale Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            Rwanda Provisional Driving Test · 20 Qs
          </span>
        </div>

        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label="Language selector"
        >
          {(['en', 'fr', 'rw'] as Lang[]).map((code) => {
            const active = state.currentLocale === code;
            const targetSlug = state.mode === 'mock_exam' ? 'exam' : 'practice';
            const catSearch =
              state.selectedCategory === 1
                ? '?category=traffic-rules'
                : state.selectedCategory === 2
                  ? '?category=road-signs'
                  : '';
            return (
              <a
                key={code}
                href={`/${code}/${targetSlug}${catSearch}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLocaleChange(code);
                }}
                aria-pressed={active}
                className={`flex min-h-[36px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full px-3.5 text-xs font-bold no-underline transition active:scale-95 ${
                  active
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'border border-stone-300 bg-white text-slate-700 hover:bg-stone-200'
                }`}
              >
                {code.toUpperCase()}
              </a>
            );
          })}
        </div>
      </div>

      {/* 1. Intro Stage */}
      {state.stage === 'intro' && (
        <PracticeIntro
          state={state}
          dispatch={dispatch}
          allQuestions={allQuestions}
          t={t}
        />
      )}

      {/* 2. In-Progress Exam Stage */}
      {state.stage === 'in_progress' && (
        <PracticeExam
          state={state}
          dispatch={dispatch}
          t={t}
          imageBase={imageBase}
        />
      )}

      {/* 3. Review / Results Stage */}
      {state.stage === 'review_all' && (
        <PracticeReview
          state={state}
          dispatch={dispatch}
          t={t}
          imageBase={imageBase}
          onRetake={() => handleStartExam(state.mode, state.selectedCategory)}
        />
      )}

      {/* Submit / Finish Confirmation Modal */}
      <PracticeSubmitModal state={state} dispatch={dispatch} t={t} />
    </div>
  );
}
