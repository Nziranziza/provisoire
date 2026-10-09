import { useMemo, useState, useEffect, type Dispatch } from 'react';
import type { I18nDictionary } from './constants';
import { formatTime } from './reducer';
import type { PracticeAction, PracticeState, ReviewFilter } from './types';
import { PASSING_SCORE } from './constants';
import { clearSessionFromStorage } from './storage';
import InstallAppPrompt from '../InstallAppPrompt';
import ShareResultCard from './ShareResultCard';
import { categoryLabel } from '../../lib/quiz';
import { questionImageAlt } from '../../lib/seo';
import {
  isQuestionBookmarked,
  toggleQuestionBookmark,
  getQuestionProgress,
  deriveMasteryStatus,
  EVENT_BOOKMARKS_CHANGED,
} from '../../lib/study-progress';

interface PracticeReviewProps {
  state: PracticeState;
  dispatch: Dispatch<PracticeAction>;
  t: I18nDictionary;
  imageBase: string;
  onRetake: () => void;
}

export default function PracticeReview({
  state,
  dispatch,
  t,
  imageBase,
  onRetake,
}: PracticeReviewProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    return new Set(
      state.sessionQuestions
        .map((q) => q.id)
        .filter((id) => isQuestionBookmarked(id)),
    );
  });

  useEffect(() => {
    const handleBookmarkEvent = () => {
      setBookmarkedIds(
        new Set(
          state.sessionQuestions
            .map((q) => q.id)
            .filter((id) => isQuestionBookmarked(id)),
        ),
      );
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_BOOKMARKS_CHANGED, handleBookmarkEvent);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          EVENT_BOOKMARKS_CHANGED,
          handleBookmarkEvent,
        );
      }
    };
  }, [state.sessionQuestions]);

  const handleToggleBookmark = (questionId: string) => {
    const next = toggleQuestionBookmark(questionId);
    setBookmarkedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(questionId);
      else copy.delete(questionId);
      return copy;
    });
  };
  let totalScore = 0;
  let rulesScore = 0;
  let rulesTotal = 0;
  let signsScore = 0;
  let signsTotal = 0;

  state.sessionQuestions.forEach((q, idx) => {
    const isQCorrect = state.answers[idx] === q.correct_index;
    if (isQCorrect) totalScore += 1;

    if (q.category_id === 1) {
      rulesTotal += 1;
      if (isQCorrect) rulesScore += 1;
    } else {
      signsTotal += 1;
      if (isQCorrect) signsScore += 1;
    }
  });

  const isPassed = totalScore >= PASSING_SCORE;
  const scorePercent = Math.round(
    (totalScore / Math.max(1, state.sessionQuestions.length)) * 100,
  );

  const resultCardData = useMemo(
    () => ({
      score: totalScore,
      total: state.sessionQuestions.length,
      isPassed,
      rulesScore,
      rulesTotal,
      signsScore,
      signsTotal,
      timeSpent: state.timeSpent,
      mode:
        state.mode === 'mock_exam'
          ? ('mock_exam' as const)
          : ('practice' as const),
      locale: state.currentLocale,
    }),
    [
      totalScore,
      state.sessionQuestions.length,
      isPassed,
      rulesScore,
      rulesTotal,
      signsScore,
      signsTotal,
      state.timeSpent,
      state.mode,
      state.currentLocale,
    ],
  );

  // Filtered list for review mode
  const filteredReviewQuestions = state.sessionQuestions
    .map((q, idx) => {
      const uAns = state.answers[idx];
      const isAnsCorrect = uAns === q.correct_index;
      const isAns = typeof uAns === 'number';
      const isFlag = Boolean(state.flagged[idx]);
      return {
        q,
        idx,
        userAnswer: uAns,
        isCorrect: isAnsCorrect,
        isAnswered: isAns,
        isFlagged: isFlag,
      };
    })
    .filter((item) => {
      if (state.reviewFilter === 'incorrect') return !item.isCorrect;
      if (state.reviewFilter === 'correct') return item.isCorrect;
      if (state.reviewFilter === 'flagged') return item.isFlagged;
      return true;
    });

  return (
    <div className="space-y-6">
      {/* Certificate / Result Card */}
      <div
        className={`rounded-2xl border-2 p-6 shadow-sm sm:p-8 ${
          isPassed
            ? 'border-emerald-500 bg-emerald-50/60'
            : 'border-rose-300 bg-rose-50/60'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold tracking-wider uppercase ${
              isPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {isPassed ? t.historyPassed : t.historyFailed}
          </span>

          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {isPassed ? t.resultPassedTitle : t.resultFailedTitle}
          </h1>

          <p className="mt-2 max-w-md text-sm text-slate-600">
            {isPassed ? t.resultPassedDesc : t.resultFailedDesc}
          </p>

          {/* Big Score Display */}
          <div className="my-6 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
              {totalScore}
            </span>
            <span className="text-2xl font-bold text-slate-500">
              / {state.sessionQuestions.length}
            </span>
            <span className="ml-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-sm font-bold text-slate-700 shadow-xs">
              {scorePercent}%
            </span>
          </div>

          {/* Performance Stats */}
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center">
              <span className="text-xs text-slate-500">{t.timeTaken}</span>
              <div className="mt-1 font-mono text-base font-bold text-slate-800">
                {formatTime(state.timeSpent)}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center">
              <span className="text-xs text-slate-500">{t.rulesCategory}</span>
              <div className="mt-1 font-mono text-base font-bold text-slate-800">
                {rulesScore} / {rulesTotal}
              </div>
            </div>

            <div className="col-span-2 rounded-xl border border-stone-200 bg-white p-3 text-center sm:col-span-1">
              <span className="text-xs text-slate-500">{t.signsCategory}</span>
              <div className="mt-1 font-mono text-base font-bold text-slate-800">
                {signsScore} / {signsTotal}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons on Top — Structured for large text with vertical multiline support */}
        <div className="mt-6 w-full space-y-3">
          <button
            type="button"
            onClick={onRetake}
            className="flex min-h-[56px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-center text-sm leading-snug font-black text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] sm:min-h-[60px] sm:text-base"
          >
            <span>↺</span>
            <span>{t.retakeBtn}</span>
          </button>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {!isPassed && totalScore < state.sessionQuestions.length && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'RETAKE_MISSED' })}
                className="flex min-h-[52px] w-full cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-2xl border-2 border-slate-900 bg-white px-4 py-3 text-center text-xs leading-snug font-extrabold text-slate-900 shadow-xs transition hover:bg-stone-100 active:scale-95 sm:text-sm"
              >
                <span>⚡</span>
                <span>{t.retakeMissedBtn}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => dispatch({ type: 'DISCARD_SAVED_SESSION' })}
              className="flex min-h-[52px] w-full cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-2xl border-2 border-stone-300 bg-white px-4 py-3 text-center text-xs leading-snug font-extrabold text-slate-700 shadow-xs transition hover:bg-stone-100 active:scale-95 sm:text-sm"
            >
              <span>↺</span>
              <span>{t.discardBtn}</span>
            </button>

            <a
              href={`/${state.currentLocale}/questions`}
              className="flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-1.5 rounded-2xl border-2 border-stone-300 bg-white px-4 py-3 text-center text-xs leading-snug font-extrabold text-slate-700 no-underline shadow-xs transition hover:bg-stone-100 hover:text-blue-700 active:scale-95 sm:text-sm"
              onClick={() => {
                clearSessionFromStorage();
              }}
            >
              <span>←</span>
              <span>{t.bankBtn}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Shareable Viral Result Card for WhatsApp & Social */}
      <ShareResultCard data={resultCardData} locale={state.currentLocale} />

      {/* Sensible Add to Home Screen Prompt after completed session */}
      <InstallAppPrompt lang={state.currentLocale} />

      {/* Detailed Question Review List */}
      <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-black tracking-wide text-slate-900 uppercase sm:text-lg">
            {t.reviewHeader}
          </h2>

          {/* Filter Tabs with Accessible Tap Targets */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'incorrect', 'correct', 'flagged'] as ReviewFilter[]).map(
              (f) => {
                const active = state.reviewFilter === f;
                const label =
                  f === 'all'
                    ? `${t.filterAll} (${state.sessionQuestions.length})`
                    : f === 'incorrect'
                      ? `${t.filterIncorrect} (${state.sessionQuestions.length - totalScore})`
                      : f === 'correct'
                        ? `${t.filterCorrect} (${totalScore})`
                        : `${t.filterFlagged} (${Object.values(state.flagged).filter(Boolean).length})`;

                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'SET_REVIEW_FILTER',
                        payload: { filter: f },
                      })
                    }
                    className={`flex min-h-[42px] cursor-pointer touch-manipulation items-center justify-center rounded-2xl px-4.5 py-2 text-xs font-extrabold transition active:scale-95 sm:rounded-full sm:text-sm ${
                      active
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'border-2 border-stone-300 bg-white text-slate-700 hover:bg-stone-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Review Cards */}
        <div className="space-y-4">
          {filteredReviewQuestions.map(
            ({
              q,
              idx,
              userAnswer: uAns,
              isCorrect: isAnsCorrect,
              isAnswered: isAns,
              isFlagged,
            }) => {
              const tr =
                q.translations[state.currentLocale] || q.translations.en;
              const title = tr?.question || 'Question';
              const opts = tr?.options || [];
              const explanation = tr?.explanation;
              const isBookmarked = bookmarkedIds.has(q.id);
              const p = getQuestionProgress(q.id);
              const status = deriveMasteryStatus(p);

              return (
                <div
                  key={q.id}
                  className={`rounded-xl border border-l-4 bg-white p-4 shadow-xs sm:p-5 ${
                    isAnsCorrect
                      ? 'border-stone-200 border-l-emerald-600'
                      : 'border-stone-200 border-l-rose-600'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Q{idx + 1}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white uppercase ${
                          isAnsCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {isAnsCorrect
                          ? '✓ Correct'
                          : isAns
                            ? '✗ Incorrect'
                            : '○ Skipped'}
                      </span>
                      {isFlagged && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          ⚑ {t.flaggedDuringTest}
                        </span>
                      )}
                      {status === 'mastered' && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 uppercase">
                          🟢 {t.mastered}
                        </span>
                      )}
                      {status === 'weak' && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800 uppercase">
                          🔴 {t.weak}
                        </span>
                      )}
                      {status === 'learning' && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 uppercase">
                          🟡 {t.learning}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(q.id)}
                        className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold shadow-2xs transition ${
                          isBookmarked
                            ? 'bg-sky-700 text-white hover:bg-sky-800'
                            : 'border border-stone-300 bg-white text-slate-700 hover:bg-stone-100'
                        }`}
                        title={isBookmarked ? t.bookmarkedBtn : t.bookmarkBtn}
                      >
                        <span>{isBookmarked ? '🔖' : '🏷️'}</span>
                        <span className="hidden sm:inline">
                          {isBookmarked ? t.bookmarkedBtn : t.bookmarkBtn}
                        </span>
                      </button>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase ${
                          q.category_id === 2 ? 'bg-sky-700' : 'bg-amber-700'
                        }`}
                      >
                        {categoryLabel(q.category_id, state.currentLocale)}
                      </span>
                    </div>
                  </div>

                  {q.image_url && (
                    <div className="my-2">
                      <img
                        src={`${imageBase}${q.image_url.replace(/^\//, '')}`}
                        alt={questionImageAlt(
                          q,
                          state.currentLocale,
                          q.sessionNumber,
                        )}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                        }}
                        className="max-h-40 max-w-full rounded-lg border border-stone-200 object-contain"
                      />
                    </div>
                  )}

                  <p className="mb-3 text-sm leading-relaxed font-bold text-slate-900">
                    {title}
                  </p>

                  {/* Options list */}
                  <div className="space-y-2.5">
                    {opts.map((opt, oIdx) => {
                      const isCorrectOption = oIdx === q.correct_index;
                      const isUserSelected = uAns === oIdx;

                      return (
                        <div
                          key={oIdx}
                          className={`flex items-start gap-3 rounded-xl border-2 p-3 text-xs sm:p-3.5 sm:text-sm ${
                            isCorrectOption
                              ? 'border-emerald-600 bg-emerald-50/90 font-semibold text-slate-900 shadow-2xs'
                              : isUserSelected && !isAnsCorrect
                                ? 'border-rose-400 bg-rose-50/90 text-rose-950 shadow-2xs'
                                : 'border-stone-200 bg-stone-50/60 text-slate-700'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-6 w-6 flex-none shrink-0 items-center justify-center rounded-full text-xs font-black sm:h-6.5 sm:w-6.5 ${
                              isCorrectOption
                                ? 'bg-emerald-600 text-white'
                                : isUserSelected && !isAnsCorrect
                                  ? 'bg-rose-600 text-white'
                                  : 'border border-slate-300 bg-white text-slate-700'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="leading-relaxed break-words">
                              {opt}
                            </span>
                            {isCorrectOption && (
                              <span className="inline-flex items-center self-start rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-800 uppercase sm:text-xs">
                                ✓ {t.correctAnswer}
                              </span>
                            )}
                            {isUserSelected && !isCorrectOption && (
                              <span className="inline-flex items-center self-start rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-rose-800 uppercase sm:text-xs">
                                ✗ {t.yourAnswer}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if present */}
                  {explanation && (
                    <div className="mt-3.5 rounded-2xl border border-blue-200/80 bg-blue-50/80 p-3.5 text-xs text-blue-950 sm:p-4 sm:text-sm">
                      <strong className="mb-1 block font-black text-blue-900">
                        {t.explanation}:
                      </strong>
                      <p className="leading-relaxed break-words">
                        {explanation}
                      </p>
                    </div>
                  )}

                  <div className="mt-3.5 flex justify-end">
                    <a
                      href={`/${state.currentLocale}/questions/${q.bankIndex + 1}`}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 px-3.5 py-1.5 text-xs font-bold text-blue-700 no-underline transition hover:bg-blue-100 hover:text-blue-900"
                    >
                      <span>{t.bankLink}</span>
                    </a>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
