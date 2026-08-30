import { useState, useRef, type Dispatch, type TouchEvent } from 'react';
import type { I18nDictionary } from './constants';
import { EXAM_CONFIG } from './constants';
import { clearSessionFromStorage } from './storage';
import { formatTime } from './reducer';
import type { PracticeAction, PracticeState } from './types';

interface PracticeExamProps {
  state: PracticeState;
  dispatch: Dispatch<PracticeAction>;
  t: I18nDictionary;
  imageBase: string;
}

export default function PracticeExam({
  state,
  dispatch,
  t,
  imageBase,
}: PracticeExamProps) {
  const [showGridModal, setShowGridModal] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const currentQ = state.sessionQuestions[state.currentIndex];
  if (!currentQ) return null;

  const totalQuestions = state.sessionQuestions.length;
  const qTrans =
    currentQ.translations[state.currentLocale] || currentQ.translations.en;
  const questionTitle = qTrans?.question ?? 'Question not found';
  const options = qTrans?.options ?? [];
  const userAnswer = state.answers[state.currentIndex];
  const isAnswered = typeof userAnswer === 'number';
  const isCorrect = isAnswered && userAnswer === currentQ.correct_index;
  const unansweredCount = totalQuestions - Object.keys(state.answers).length;
  const isMockMode = state.mode === 'mock_exam';
  const isRoadSigns = currentQ.category_id === 2;
  const percentCompleted = Math.round(
    (Object.keys(state.answers).length / Math.max(1, totalQuestions)) * 100,
  );

  const isTimeLow =
    isMockMode && state.timeRemaining <= EXAM_CONFIG.TIME_LOW_WARNING_SECONDS;
  const isTimeCritical =
    isMockMode &&
    state.timeRemaining <= EXAM_CONFIG.TIME_CRITICAL_WARNING_SECONDS;

  // Touch Swipe Handlers for mobile swipe navigation
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (e.touches.length === 1 && touch) {
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEnd = e.changedTouches[0];
    if (!touchStartRef.current || !touchEnd) return;

    const deltaX = touchEnd.clientX - touchStartRef.current.x;
    const deltaY = touchEnd.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;

    // Quick swipe (< 600ms) with at least 45px horizontal movement
    if (
      deltaTime < 600 &&
      Math.abs(deltaX) > 45 &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.3
    ) {
      if (deltaX < 0) {
        // Swipe Left -> Next Question
        if (state.currentIndex < totalQuestions - 1) {
          dispatch({ type: 'NEXT_QUESTION' });
        }
      } else {
        // Swipe Right -> Previous Question
        if (state.currentIndex > 0) {
          dispatch({ type: 'PREV_QUESTION' });
        }
      }
    }
  };

  return (
    <div
      className="w-full space-y-3 pb-24 text-slate-900 sm:space-y-3.5"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 0. Back to Bank link */}
      <div className="flex items-center justify-between">
        <a
          href={`/${state.currentLocale}/questions`}
          className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 text-xs font-bold text-slate-700 no-underline shadow-2xs transition hover:bg-stone-100 hover:text-blue-700 active:scale-95"
          title={t.bankBtn}
          onClick={() => {
            clearSessionFromStorage();
          }}
        >
          <span>←</span>
          <span>{t.bankBtn}</span>
        </a>
      </div>

      {/* 1. Header Bar (Progress, Category, Timer, Language & Grid) */}
      <header className="rounded-xl border border-stone-200 bg-white p-2.5 shadow-xs sm:p-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Progress badge & Category */}
          <div className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <span className="flex h-7.5 flex-none items-center justify-center rounded-lg bg-blue-700 px-2.5 font-mono text-xs font-black text-white shadow-2xs sm:h-8 sm:text-sm">
              {String(state.currentIndex + 1).padStart(2, '0')} /{' '}
              {totalQuestions}
            </span>

            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase shadow-2xs ${
                isRoadSigns ? 'bg-sky-700' : 'bg-amber-700'
              }`}
            >
              {currentQ.category_name}
            </span>
          </div>

          {/* Right: Timer, Language, Grid trigger & Finish */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {/* Timer */}
            {isMockMode ? (
              <div
                className={`flex h-7.5 flex-none items-center gap-1 rounded-full px-2.5 font-mono text-xs font-bold transition sm:h-8 ${
                  isTimeCritical
                    ? 'animate-pulse bg-rose-600 text-white shadow-xs'
                    : isTimeLow
                      ? 'border border-amber-300 bg-amber-100 text-amber-900'
                      : 'bg-stone-100 text-slate-800'
                }`}
                aria-live="polite"
                title={t.timeRemaining}
              >
                <span>⏱</span>
                <span>{formatTime(state.timeRemaining)}</span>
              </div>
            ) : (
              <div
                className="flex h-7.5 flex-none items-center gap-1 rounded-full bg-stone-100 px-2.5 font-mono text-xs font-bold text-slate-700 sm:h-8"
                title={t.timeSpent}
              >
                <span>⏱</span>
                <span>{formatTime(state.timeSpent)}</span>
              </div>
            )}

            {/* Locked Language Badge */}
            <span
              className="hidden flex-none items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-500 uppercase sm:inline-flex"
              title="Test language is locked"
            >
              {state.currentLocale.toUpperCase()}
            </span>

            {/* 20 Questions Navigator Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowGridModal(true)}
              className="flex h-7.5 flex-none cursor-pointer touch-manipulation items-center gap-1 rounded-full border border-stone-300 bg-white px-2.5 text-xs font-bold text-slate-800 hover:bg-stone-100 active:scale-95 sm:h-8"
              title={t.questionGrid}
            >
              <span>⊞</span>
              <span className="hidden text-xs sm:inline">20 Qs</span>
            </button>

            {/* Finish Test Button */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_SUBMIT_MODAL' })}
              className="flex h-7.5 flex-none cursor-pointer touch-manipulation items-center justify-center rounded-full bg-slate-900 px-3 text-xs font-bold whitespace-nowrap text-white transition hover:bg-slate-700 active:scale-95 sm:h-8"
            >
              {t.finishBtn}
            </button>
          </div>
        </div>

        {/* 20-Segment Interactive Multi-Track Bar */}
        <div className="mt-2">
          <div className="flex w-full gap-1">
            {state.sessionQuestions.map((q, dotIdx) => {
              const isDotCurrent = dotIdx === state.currentIndex;
              const isDotAnswered = typeof state.answers[dotIdx] === 'number';
              const isDotCorrect =
                isDotAnswered && state.answers[dotIdx] === q.correct_index;

              let segmentColor = 'bg-stone-200 hover:bg-stone-300';
              if (isDotCurrent) {
                segmentColor =
                  'bg-blue-700 ring-2 ring-blue-300 ring-offset-1 z-10';
              } else if (!isMockMode && isDotAnswered) {
                segmentColor = isDotCorrect ? 'bg-emerald-500' : 'bg-rose-500';
              } else if (isDotAnswered) {
                segmentColor = 'bg-slate-800';
              }

              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'SET_CURRENT_INDEX',
                      payload: { index: dotIdx },
                    })
                  }
                  title={`Q${dotIdx + 1}${isDotAnswered ? ' (Answered)' : ' (Unanswered)'}`}
                  className={`h-2 flex-1 cursor-pointer touch-manipulation rounded-xs transition-all duration-150 ${segmentColor}`}
                  aria-label={`Jump to question ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. Main Question Card Area — identical structure for practice & exam, fitting cleanly */}
      <article
        className={`quiz-item rounded-xl border border-l-4 bg-white px-4 pt-3.5 pb-4 transition sm:px-5 sm:pt-4 sm:pb-5 ${
          isRoadSigns
            ? 'border-stone-200 border-l-sky-600'
            : 'border-stone-200 border-l-amber-500'
        }`}
      >
        {/* Header inside Card */}
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
            {String(state.currentIndex + 1).padStart(2, '0')}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase ${
              isRoadSigns ? 'bg-sky-700' : 'bg-amber-700'
            }`}
          >
            {currentQ.category_name}
          </span>
        </div>

        {/* Question Image if present */}
        {currentQ.image_url && (
          <div className="quiz-image-wrap my-1.5 flex justify-center">
            <img
              src={`${imageBase}${currentQ.image_url.replace(/^\//, '')}`}
              alt="Road sign"
              loading="eager"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
              className="block max-h-32 max-w-full rounded-lg border border-stone-200 object-contain sm:max-h-40"
            />
          </div>
        )}

        {/* Question Title */}
        <p className="mb-2.5 text-sm leading-relaxed font-semibold text-slate-900 sm:text-base">
          {questionTitle}
        </p>

        {/* Options List */}
        <ul
          className="m-0 flex list-none flex-col gap-1.5 p-0 sm:gap-2"
          role="radiogroup"
          aria-label={questionTitle}
        >
          {options.map((opt, optIdx) => {
            const isSelected = userAnswer === optIdx;
            const letter = String.fromCharCode(65 + optIdx);

            if (!isMockMode && isAnswered) {
              const isCorrectOption = optIdx === currentQ.correct_index;
              const isUserWrongChoice = isSelected && !isCorrect;

              let optionStyle = 'border-stone-200 bg-stone-50 text-slate-700';
              let badgeStyle = 'border-slate-400 text-slate-600';

              if (isCorrectOption) {
                optionStyle = 'border-emerald-600 bg-emerald-50 text-slate-900';
                badgeStyle = 'border-emerald-600 bg-emerald-600 text-white';
              } else if (isUserWrongChoice) {
                optionStyle = 'border-rose-400 bg-rose-50 text-slate-900';
                badgeStyle = 'border-rose-600 bg-rose-600 text-white';
              }

              return (
                <li key={optIdx}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() =>
                      dispatch({
                        type: 'SELECT_ANSWER',
                        payload: {
                          questionIndex: state.currentIndex,
                          optionIndex: optIdx,
                        },
                      })
                    }
                    className={`flex w-full cursor-pointer touch-manipulation items-center gap-2.5 rounded-lg border-[1.5px] px-3 py-2 text-left text-xs transition active:scale-[0.985] sm:gap-3 sm:py-2.5 sm:text-sm ${optionStyle}`}
                  >
                    <span
                      className={`flex h-5.5 w-5.5 flex-none items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold sm:h-6 sm:w-6 sm:text-xs ${badgeStyle}`}
                    >
                      {isCorrectOption ? '✓' : isUserWrongChoice ? '✗' : letter}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                    {isCorrectOption && (
                      <span className="flex-none text-[11px] font-bold text-emerald-700 sm:text-xs">
                        {t.correctAnswer}
                      </span>
                    )}
                    {isUserWrongChoice && (
                      <span className="flex-none text-[11px] font-bold text-rose-700 sm:text-xs">
                        {t.yourAnswer}
                      </span>
                    )}
                  </button>
                </li>
              );
            }

            return (
              <li key={optIdx}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() =>
                    dispatch({
                      type: 'SELECT_ANSWER',
                      payload: {
                        questionIndex: state.currentIndex,
                        optionIndex: optIdx,
                      },
                    })
                  }
                  className={`flex w-full cursor-pointer touch-manipulation items-center gap-2.5 rounded-lg border-[1.5px] px-3 py-2 text-left text-xs transition active:scale-[0.985] sm:gap-3 sm:py-2.5 sm:text-sm ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50 text-slate-900 ring-1 ring-blue-700'
                      : 'border-stone-200 bg-stone-50 text-slate-700 hover:border-slate-400 hover:bg-white'
                  }`}
                >
                  <span
                    className={`flex h-5.5 w-5.5 flex-none items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold sm:h-6 sm:w-6 sm:text-xs ${
                      isSelected
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-400 text-slate-600'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 leading-snug">{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Compact Immediate Feedback in Practice Mode */}
        {!isMockMode && isAnswered && (
          <div
            className={`mt-2.5 rounded-lg border p-2.5 sm:mt-3 sm:p-3 ${
              isCorrect
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                : 'border-rose-400 bg-rose-50 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-bold tracking-wider uppercase sm:text-xs ${
                  isCorrect ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isCorrect
                  ? `✓ ${t.feedbackCorrectTitle}`
                  : `✗ ${t.feedbackIncorrectTitle}`}
              </span>
            </div>
            {qTrans?.explanation && (
              <p className="mt-1 text-xs leading-relaxed text-slate-800 sm:text-sm">
                <strong className="font-semibold">{t.explanation}:</strong>{' '}
                {qTrans.explanation}
              </p>
            )}
          </div>
        )}
      </article>

      {/* 3. Fixed Bottom Navigation Bar — strictly aligned with exam/practice card edges */}
      <nav
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-stone-200/80 bg-stone-100/90 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md"
        aria-label="Question navigation"
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 sm:px-0">
          {/* Previous */}
          {state.currentIndex > 0 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'PREV_QUESTION' })}
              className="rounded-full border border-slate-900 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-xs transition hover:bg-stone-100 active:scale-95"
            >
              ← {t.prevBtn}
            </button>
          ) : (
            <span className="rounded-full border border-stone-200 bg-white/60 px-5 py-2.5 text-sm font-bold text-stone-300">
              ← {t.prevBtn}
            </span>
          )}

          {/* Counter */}
          <span className="text-sm font-semibold text-slate-600">
            {state.currentIndex + 1} / {totalQuestions}
          </span>

          {/* Next or Finish */}
          {state.currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
              className="rounded-full border border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-slate-700 active:scale-95"
            >
              {t.nextBtn} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_SUBMIT_MODAL' })}
              className="rounded-full border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
            >
              {t.finishBtn} ✓
            </button>
          )}
        </div>
      </nav>

      {/* 4. On-Demand 20-Questions Grid Modal */}
      {showGridModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {t.questionGrid}
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {Object.keys(state.answers).length} / {totalQuestions}{' '}
                  {t.legendAnswered} ({percentCompleted}%)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGridModal(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-slate-600 hover:bg-stone-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Quick Filter Jump Helpers */}
            {unansweredCount > 0 && (
              <div className="my-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'JUMP_TO_NEXT_UNANSWERED' });
                    setShowGridModal(false);
                  }}
                  className="flex min-h-[34px] cursor-pointer touch-manipulation items-center rounded-full border border-stone-300 bg-stone-50 px-3 text-xs font-bold text-slate-700 hover:bg-stone-100"
                >
                  ○ {t.nextUnanswered}
                </button>
              </div>
            )}

            {/* 20 Questions Matrix */}
            <div className="my-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {state.sessionQuestions.map((q, idx) => {
                const isCurrent = idx === state.currentIndex;
                const userAns = state.answers[idx];
                const isQAnswered = typeof userAns === 'number';
                const isQCorrect = isQAnswered && userAns === q.correct_index;

                let btnColor =
                  'border border-dashed border-stone-300 bg-white text-slate-600 hover:border-slate-500 hover:bg-stone-100';

                if (isCurrent) {
                  btnColor =
                    'border-2 border-blue-700 bg-blue-700 text-white font-black shadow-sm ring-2 ring-blue-300';
                } else if (!isMockMode && isQAnswered) {
                  btnColor = isQCorrect
                    ? 'border border-emerald-600 bg-emerald-600 text-white font-bold'
                    : 'border border-rose-600 bg-rose-600 text-white font-bold';
                } else if (isQAnswered) {
                  btnColor =
                    'border border-slate-900 bg-slate-900 text-white font-bold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      dispatch({
                        type: 'SET_CURRENT_INDEX',
                        payload: { index: idx },
                      });
                      setShowGridModal(false);
                    }}
                    title={`Question ${idx + 1}`}
                    className={`relative flex h-11 min-w-[40px] cursor-pointer touch-manipulation flex-col items-center justify-center rounded-xl font-mono text-xs font-bold transition active:scale-95 ${btnColor}`}
                  >
                    <span>{idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-md bg-blue-700" />
                {t.legendCurrent}
              </span>
              {!isMockMode ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-md bg-emerald-600" />
                    {t.legendCorrect}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-md bg-rose-600" />
                    {t.legendIncorrect}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-md bg-slate-900" />
                  {t.legendAnswered}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-md border border-dashed border-stone-400 bg-white" />
                {t.legendSkipped}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
