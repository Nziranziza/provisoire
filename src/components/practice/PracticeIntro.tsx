import { useId, type Dispatch } from 'react';
import type { Question } from '../../lib/quiz';
import type { I18nDictionary } from './constants';
import { formatTime, sampleQuestions } from './reducer';
import type { ExamMode, PracticeAction, PracticeState } from './types';
import { DEFAULT_TOTAL_QUESTIONS, PASSING_SCORE } from './constants';
import OfflinePackManager from '../OfflinePackManager';
import InstallAppPanel from '../InstallAppPanel';

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
          <div className="mb-6 rounded-2xl border-2 border-blue-600 bg-blue-50/90 p-4.5 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-700 px-2.5 py-0.5 text-[11px] font-black tracking-wider text-white uppercase shadow-2xs">
                  Saved Session
                </span>
                <p className="mt-1.5 text-xs leading-relaxed font-bold text-blue-950 sm:text-sm">
                  You have an unfinished practice/exam session in progress.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'RESUME_SESSION' })}
                  className="flex min-h-[48px] cursor-pointer touch-manipulation items-center justify-center rounded-2xl bg-blue-700 px-5 py-2.5 text-center text-xs leading-snug font-extrabold text-white shadow-sm transition hover:bg-blue-800 active:scale-95 sm:rounded-full sm:text-sm"
                >
                  {t.resumeBtn} →
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'DISCARD_SAVED_SESSION' })}
                  className="flex min-h-[48px] cursor-pointer touch-manipulation items-center justify-center rounded-2xl border-2 border-slate-900 bg-white px-5 py-2.5 text-center text-xs leading-snug font-extrabold text-slate-900 transition hover:bg-stone-100 active:scale-95 sm:rounded-full sm:text-sm"
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

        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {t.pageTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed font-medium text-slate-600 sm:text-base">
          {t.subtitle}
        </p>

        {/* Spec Box */}
        <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
          <h2 className="text-xs font-black tracking-wider text-slate-500 uppercase">
            {t.examSpecs}
          </h2>
          <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="flex h-7.5 w-7.5 flex-none items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700 shadow-2xs">
                {DEFAULT_TOTAL_QUESTIONS}
              </span>
              <span className="pt-0.5 text-sm leading-snug font-semibold text-slate-700">
                {selectedCategoryName
                  ? t.specQuestionsCategory(selectedCategoryName)
                  : t.specQuestions}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-7.5 w-7.5 flex-none items-center justify-center rounded-xl bg-amber-100 text-sm font-black text-amber-700 shadow-2xs">
                ⏱
              </span>
              <span className="pt-0.5 text-sm leading-snug font-semibold text-slate-700">
                {t.specDuration}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-7.5 w-7.5 flex-none items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700 shadow-2xs">
                {PASSING_SCORE}
              </span>
              <span className="pt-0.5 text-sm leading-snug font-semibold text-slate-700">
                {t.specPassMark}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-7.5 w-7.5 flex-none items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-700 shadow-2xs">
                ✓
              </span>
              <span className="pt-0.5 text-sm leading-snug font-semibold text-slate-700">
                {t.specScoring}
              </span>
            </div>
          </div>
        </div>

        {/* Mode selection (Practice vs Mock Exam) */}
        <div className="mt-7">
          <label
            htmlFor={selectId}
            className="block text-xs font-black tracking-wider text-slate-500 uppercase"
          >
            {t.modeLabel}
          </label>
          <div className="mt-2.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Mode 1: Practice Mode (Immediate feedback) */}
            <a
              href={`/${state.currentLocale}/practice${categoryQuery}`}
              id={selectId}
              onClick={(e) => {
                e.preventDefault();
                handleModeChange('practice');
              }}
              className={`group block min-h-[110px] cursor-pointer touch-manipulation rounded-2xl border-2 p-5 text-left no-underline transition-all active:scale-[0.985] ${
                state.mode === 'practice'
                  ? 'border-blue-700 bg-blue-50/80 shadow-sm ring-2 ring-blue-700/20'
                  : 'border-stone-200 bg-white hover:border-slate-400 hover:bg-stone-50/60'
              }`}
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <span className="text-base leading-snug font-black text-slate-900">
                  {t.modePractice}
                </span>
                <span className="shrink-0 self-start rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-black tracking-wide text-emerald-800 uppercase sm:self-auto">
                  {t.modePracticeBadge}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
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
              className={`group block min-h-[110px] cursor-pointer touch-manipulation rounded-2xl border-2 p-5 text-left no-underline transition-all active:scale-[0.985] ${
                state.mode === 'mock_exam'
                  ? 'border-blue-700 bg-blue-50/80 shadow-sm ring-2 ring-blue-700/20'
                  : 'border-stone-200 bg-white hover:border-slate-400 hover:bg-stone-50/60'
              }`}
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <span className="text-base leading-snug font-black text-slate-900">
                  {t.modeMockExam}
                </span>
                <span className="shrink-0 self-start rounded-lg bg-blue-100 px-2.5 py-1 text-[11px] font-black tracking-wide text-blue-800 uppercase sm:self-auto">
                  {t.modeMockExamBadge}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                {t.modeMockExamDesc}
              </p>
            </a>
          </div>
        </div>

        {/* Category / Topic selection */}
        <div className="mt-7">
          <label
            htmlFor={categorySelectId}
            className="block text-xs font-black tracking-wider text-slate-500 uppercase"
          >
            {t.categoryLabel}
          </label>
          <div className="mt-2.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <a
              href={`/${state.currentLocale}/${targetSlug}`}
              id={categorySelectId}
              onClick={(e) => {
                e.preventDefault();
                handleCategoryChange(null);
              }}
              className={`group block flex min-h-[120px] cursor-pointer touch-manipulation flex-col justify-between rounded-2xl border-2 p-4.5 text-left no-underline transition-all active:scale-[0.985] ${
                state.selectedCategory === null
                  ? 'border-blue-700 bg-blue-50/80 shadow-sm ring-2 ring-blue-700/20'
                  : 'border-stone-200 bg-white hover:border-slate-400 hover:bg-stone-50/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm leading-snug font-extrabold text-slate-900 sm:text-base">
                  {t.categoryAll}
                </span>
                <span className="shrink-0 text-xl">🔀</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed font-medium text-slate-600">
                {t.categoryAllDesc}
              </p>
            </a>

            <a
              href={`/${state.currentLocale}/${targetSlug}?category=traffic-rules`}
              onClick={(e) => {
                e.preventDefault();
                handleCategoryChange(1);
              }}
              className={`group block flex min-h-[120px] cursor-pointer touch-manipulation flex-col justify-between rounded-2xl border-2 p-4.5 text-left no-underline transition-all active:scale-[0.985] ${
                state.selectedCategory === 1
                  ? 'border-blue-700 bg-blue-50/80 shadow-sm ring-2 ring-blue-700/20'
                  : 'border-stone-200 bg-white hover:border-slate-400 hover:bg-stone-50/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm leading-snug font-extrabold text-slate-900 sm:text-base">
                  {t.categoryRules}
                </span>
                <span className="shrink-0 text-xl">🚦</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed font-medium text-slate-600">
                {t.categoryRulesDesc}
              </p>
            </a>

            <a
              href={`/${state.currentLocale}/${targetSlug}?category=road-signs`}
              onClick={(e) => {
                e.preventDefault();
                handleCategoryChange(2);
              }}
              className={`group block flex min-h-[120px] cursor-pointer touch-manipulation flex-col justify-between rounded-2xl border-2 p-4.5 text-left no-underline transition-all active:scale-[0.985] ${
                state.selectedCategory === 2
                  ? 'border-blue-700 bg-blue-50/80 shadow-sm ring-2 ring-blue-700/20'
                  : 'border-stone-200 bg-white hover:border-slate-400 hover:bg-stone-50/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm leading-snug font-extrabold text-slate-900 sm:text-base">
                  {t.categorySigns}
                </span>
                <span className="shrink-0 text-xl">🛑</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed font-medium text-slate-600">
                {t.categorySignsDesc}
              </p>
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8">
          {state.hasSavedSession ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESUME_SESSION' })}
                className="flex min-h-[54px] flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3.5 text-center text-sm leading-snug font-extrabold text-white shadow-md transition hover:bg-blue-800 active:scale-[0.98] sm:text-base"
              >
                <span>{t.resumeBtn}</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'DISCARD_SAVED_SESSION' })}
                className="flex min-h-[54px] cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-2xl border-2 border-slate-900 bg-white px-6 py-3.5 text-center text-sm leading-snug font-extrabold text-slate-900 transition hover:bg-stone-100 active:scale-[0.98] sm:text-base"
              >
                <span>↺</span>
                <span>{t.discardBtn}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                handleStartExam(state.mode, state.selectedCategory)
              }
              className="flex min-h-[56px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-center text-base leading-snug font-black text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] sm:min-h-[60px] sm:text-lg"
            >
              <span>{t.startBtn}</span>
              <span className="text-xl">→</span>
            </button>
          )}
        </div>
      </div>

      {/* Download app for phone & laptop */}
      <InstallAppPanel lang={state.currentLocale} />

      {/* Offline Learning Pack & Road Sign Downloader */}
      <OfflinePackManager lang={state.currentLocale} />

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
