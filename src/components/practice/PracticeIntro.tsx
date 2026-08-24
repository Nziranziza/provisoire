import { useId, type Dispatch } from 'react';
import type { Question } from '../../lib/quiz';
import type { I18nDictionary } from './constants';
import { formatTime, sampleQuestions } from './reducer';
import type { ExamMode, PracticeAction, PracticeState } from './types';
import { DEFAULT_TOTAL_QUESTIONS, PASSING_SCORE } from './constants';

interface PracticeIntroProps {
  state: PracticeState;
  dispatch: Dispatch<PracticeAction>;
  allQuestions: Question[];
  t: I18nDictionary;
}

export default function PracticeIntro({
  state,
  dispatch,
  allQuestions,
  t,
}: PracticeIntroProps) {
  const selectId = useId();
  const categorySelectId = useId();

  const selectedCategoryName =
    state.selectedCategory === 1
      ? t.rulesCategory
      : state.selectedCategory === 2
        ? t.signsCategory
        : null;

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

  const targetSlug = state.mode === 'mock_exam' ? 'exam' : 'practice';
  const categoryQuery =
    state.selectedCategory === 1
      ? '?category=traffic-rules'
      : state.selectedCategory === 2
        ? '?category=road-signs'
        : '';

  const handleModeChange = (chosenMode: ExamMode) => {
    dispatch({ type: 'SET_MODE', payload: { mode: chosenMode } });

    try {
      if (typeof window !== 'undefined') {
        const slug = chosenMode === 'mock_exam' ? 'exam' : 'practice';
        const newUrl = `/${state.currentLocale}/${slug}${categoryQuery}`;
        window.history.pushState(null, '', newUrl);
      }
    } catch {
      // ignore
    }
  };

  const handleCategoryChange = (catId: number | null) => {
    dispatch({ type: 'SET_CATEGORY', payload: { categoryId: catId } });

    try {
      if (typeof window !== 'undefined') {
        const slug = state.mode === 'mock_exam' ? 'exam' : 'practice';
        const search =
          catId === 1
            ? '?category=traffic-rules'
            : catId === 2
              ? '?category=road-signs'
              : '';
        const newUrl = `/${state.currentLocale}/${slug}${search}`;
        window.history.pushState(null, '', newUrl);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Saved Session Alert Banner at Top */}
        {state.hasSavedSession && (
          <div className="mb-6 rounded-2xl border-2 border-blue-600 bg-blue-50/80 p-4 shadow-xs sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-700 px-2 py-0.5 text-[11px] font-extrabold text-white uppercase">
                  Saved Session
                </span>
                <p className="mt-1.5 text-xs font-semibold text-blue-950 sm:text-sm">
                  You have an unfinished practice/exam session in progress.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'RESUME_SESSION' })}
                  className="flex min-h-[42px] cursor-pointer touch-manipulation items-center justify-center rounded-full bg-blue-700 px-4 py-2 text-center text-xs leading-tight font-bold text-white shadow-xs transition hover:bg-blue-800 active:scale-95 sm:text-sm"
                >
                  {t.resumeBtn} →
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'DISCARD_SAVED_SESSION' })}
                  className="flex min-h-[42px] cursor-pointer touch-manipulation items-center justify-center rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-center text-xs leading-tight font-bold text-slate-900 transition hover:bg-stone-100 active:scale-95 sm:text-sm"
                >
                  ↺ {t.discardBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          <span>🇷🇼</span>
          <span>Provisoire Exam Simulator</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {t.pageTitle}
        </h1>
        <p className="mt-2 text-base text-slate-600">{t.subtitle}</p>

        {/* Spec Box */}
        <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-5">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
            {t.examSpecs}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                {DEFAULT_TOTAL_QUESTIONS}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {selectedCategoryName
                  ? t.specQuestionsCategory(selectedCategoryName)
                  : t.specQuestions}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-amber-100 text-sm font-bold text-amber-700">
                ⏱
              </span>
              <span className="text-sm font-medium text-slate-700">
                {t.specDuration}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                {PASSING_SCORE}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {t.specPassMark}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                ✓
              </span>
              <span className="text-sm font-medium text-slate-700">
                {t.specScoring}
              </span>
            </div>
          </div>
        </div>

        {/* Mode selection (Practice vs Mock Exam) */}
        <div className="mt-6">
          <label
            htmlFor={selectId}
            className="block text-xs font-bold tracking-wider text-slate-500 uppercase"
          >
            {t.modeLabel}
          </label>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Mode 1: Practice Mode (Immediate feedback) */}
            <a
              href={`/${state.currentLocale}/practice${categoryQuery}`}
              id={selectId}
              onClick={(e) => {
                e.preventDefault();
                handleModeChange('practice');
              }}
              className={`block cursor-pointer touch-manipulation rounded-2xl border-2 p-4.5 text-left no-underline transition active:scale-[0.985] ${
                state.mode === 'practice'
                  ? 'border-blue-700 bg-blue-50/60 shadow-xs ring-1 ring-blue-700'
                  : 'border-stone-200 bg-white hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">
                  {t.modePractice}
                </span>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  {t.modePracticeBadge}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {t.modePracticeDesc}
              </p>
            </a>

            {/* Mode 2: Mock Exam (No feedback until session ends) */}
            <a
              href={`/${state.currentLocale}/exam${categoryQuery}`}
              onClick={(e) => {
                e.preventDefault();
                handleModeChange('mock_exam');
              }}
              className={`block cursor-pointer touch-manipulation rounded-2xl border-2 p-4.5 text-left no-underline transition active:scale-[0.985] ${
                state.mode === 'mock_exam'
                  ? 'border-blue-700 bg-blue-50/60 shadow-xs ring-1 ring-blue-700'
                  : 'border-stone-200 bg-white hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">
                  {t.modeMockExam}
                </span>
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                  {t.modeMockExamBadge}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {t.modeMockExamDesc}
              </p>
            </a>
          </div>
        </div>

        {/* Category / Topic selection */}
        <div className="mt-6">
          <label
            htmlFor={categorySelectId}
            className="block text-xs font-bold tracking-wider text-slate-500 uppercase"
          >
            {t.categoryLabel}
          </label>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <a
              href={`/${state.currentLocale}/${targetSlug}`}
              id={categorySelectId}
              onClick={(e) => {
                e.preventDefault();
                handleCategoryChange(null);
              }}
              className={`block cursor-pointer touch-manipulation rounded-2xl border-2 p-4 text-left no-underline transition active:scale-[0.985] ${
                state.selectedCategory === null
                  ? 'border-blue-700 bg-blue-50/60 shadow-xs ring-1 ring-blue-700'
                  : 'border-stone-200 bg-white hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900">
                  {t.categoryAll}
                </span>
                <span className="text-lg">🔀</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {t.categoryAllDesc}
              </p>
            </a>

            <a
              href={`/${state.currentLocale}/${targetSlug}?category=traffic-rules`}
              onClick={(e) => {
                e.preventDefault();
                handleCategoryChange(1);
              }}
              className={`block cursor-pointer touch-manipulation rounded-2xl border-2 p-4 text-left no-underline transition active:scale-[0.985] ${
                state.selectedCategory === 1
                  ? 'border-blue-700 bg-blue-50/60 shadow-xs ring-1 ring-blue-700'
                  : 'border-stone-200 bg-white hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900">
                  {t.categoryRules}
                </span>
                <span className="text-lg">🚦</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {t.categoryRulesDesc}
              </p>
            </a>

            <a
              href={`/${state.currentLocale}/${targetSlug}?category=road-signs`}
              onClick={(e) => {
                e.preventDefault();
                handleCategoryChange(2);
              }}
              className={`block cursor-pointer touch-manipulation rounded-2xl border-2 p-4 text-left no-underline transition active:scale-[0.985] ${
                state.selectedCategory === 2
                  ? 'border-blue-700 bg-blue-50/60 shadow-xs ring-1 ring-blue-700'
                  : 'border-stone-200 bg-white hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900">
                  {t.categorySigns}
                </span>
                <span className="text-lg">🛑</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {t.categorySignsDesc}
              </p>
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {state.hasSavedSession ? (
            <>
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESUME_SESSION' })}
                className="flex min-h-[50px] flex-1 touch-manipulation items-center justify-center rounded-full bg-blue-700 px-5 py-2 text-center text-sm leading-tight font-bold text-white shadow-sm transition hover:bg-blue-800 active:scale-95"
              >
                {t.resumeBtn}
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'DISCARD_SAVED_SESSION' })}
                className="flex min-h-[50px] touch-manipulation items-center justify-center rounded-full border-2 border-slate-900 bg-white px-5 py-2 text-center text-sm leading-tight font-bold text-slate-900 transition hover:bg-stone-100 active:scale-95"
              >
                {t.discardBtn}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() =>
                handleStartExam(state.mode, state.selectedCategory)
              }
              className="flex min-h-[54px] w-full touch-manipulation items-center justify-center rounded-full bg-slate-900 px-6 text-base font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-95"
            >
              {t.startBtn} →
            </button>
          )}
        </div>
      </div>

      {/* Past History Card */}
      {state.history.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wide text-slate-800 uppercase">
              {t.historyTitle}
            </h3>
            <button
              type="button"
              onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}
              className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-rose-600 hover:underline"
            >
              {t.clearHistory}
            </button>
          </div>

          <div className="mt-3 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
            {state.history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      item.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.passed ? t.historyPassed : t.historyFailed}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {item.score} / {item.total} (
                    {Math.round((item.score / item.total) * 100)}%)
                  </span>
                  <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    {item.mode === 'practice' ? t.modePractice : t.modeMockExam}
                  </span>
                  {item.categoryName && (
                    <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      {item.categoryName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span>{formatTime(item.timeSpentSeconds)}</span>
                  <span>·</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
