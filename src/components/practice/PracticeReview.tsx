import type { Dispatch } from 'react';
import type { I18nDictionary } from './constants';
import { formatTime } from './reducer';
import type { PracticeAction, PracticeState, ReviewFilter } from './types';
import { PASSING_SCORE } from './constants';

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

        {/* Action Buttons with Large Tap Targets */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetake}
            className="flex min-h-[50px] flex-1 touch-manipulation items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
          >
            {t.retakeBtn}
          </button>

          {!isPassed && totalScore < state.sessionQuestions.length && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'RETAKE_MISSED' })}
              className="flex min-h-[50px] touch-manipulation items-center justify-center rounded-full border-2 border-slate-900 bg-white px-6 text-sm font-bold text-slate-900 transition hover:bg-stone-100 active:scale-95"
            >
              {t.retakeMissedBtn}
            </button>
          )}
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-black tracking-wide text-slate-900 uppercase">
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
                    className={`flex min-h-[38px] touch-manipulation items-center rounded-full px-4 text-xs font-bold transition active:scale-95 ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'border border-stone-300 bg-white text-slate-700 hover:bg-stone-200'
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

              return (
                <div
                  key={q.id}
                  className={`rounded-xl border border-l-4 bg-white p-4 shadow-xs sm:p-5 ${
                    isAnsCorrect
                      ? 'border-stone-200 border-l-emerald-600'
                      : 'border-stone-200 border-l-rose-600'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase ${
                        q.category_id === 2 ? 'bg-sky-700' : 'bg-amber-700'
                      }`}
                    >
                      {q.category_name}
                    </span>
                  </div>

                  {q.image_url && (
                    <div className="my-2">
                      <img
                        src={`${imageBase}${q.image_url.replace(/^\//, '')}`}
                        alt="Road sign"
                        className="max-h-40 max-w-full rounded-lg border border-stone-200 object-contain"
                      />
                    </div>
                  )}

                  <p className="mb-3 text-sm leading-relaxed font-bold text-slate-900">
                    {title}
                  </p>

                  {/* Options list */}
                  <div className="space-y-2">
                    {opts.map((opt, oIdx) => {
                      const isCorrectOption = oIdx === q.correct_index;
                      const isUserSelected = uAns === oIdx;

                      return (
                        <div
                          key={oIdx}
                          className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs sm:text-sm ${
                            isCorrectOption
                              ? 'border-emerald-600 bg-emerald-50 font-medium text-slate-900'
                              : isUserSelected && !isAnsCorrect
                                ? 'border-rose-400 bg-rose-50 text-rose-900'
                                : 'border-stone-200 bg-stone-50/50 text-slate-600'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-extrabold ${
                              isCorrectOption
                                ? 'bg-emerald-600 text-white'
                                : isUserSelected && !isAnsCorrect
                                  ? 'bg-rose-600 text-white'
                                  : 'border border-slate-300 bg-white text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrectOption && (
                            <span className="flex-none font-bold text-emerald-700">
                              {t.correctAnswer}
                            </span>
                          )}
                          {isUserSelected && !isCorrectOption && (
                            <span className="flex-none font-bold text-rose-700">
                              {t.yourAnswer}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if present */}
                  {explanation && (
                    <div className="mt-3 rounded-lg bg-blue-50/70 p-3 text-xs text-blue-900">
                      <strong className="block font-bold">
                        {t.explanation}:
                      </strong>
                      <p className="mt-0.5">{explanation}</p>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <a
                      href={`/${state.currentLocale}/questions/${q.bankIndex + 1}`}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      {t.bankLink}
                    </a>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="text-center">
        <a
          href={`/${state.currentLocale}/questions`}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-900 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-stone-100"
        >
          ← {t.bankBtn}
        </a>
      </div>
    </div>
  );
}
