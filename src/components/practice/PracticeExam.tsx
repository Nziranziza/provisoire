import { useRef, type Dispatch, type TouchEvent } from 'react';
import type { I18nDictionary } from './constants';
import { EXAM_CONFIG } from './constants';
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
  const answeredCount = Object.keys(state.answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = Object.values(state.flagged).filter(Boolean).length;
  const isCurrentFlagged = Boolean(state.flagged[state.currentIndex]);
  const isMockMode = state.mode === 'mock_exam';
  const percentCompleted = Math.round(
    (answeredCount / Math.max(1, totalQuestions)) * 100,
  );

  const isTimeLow =
    isMockMode && state.timeRemaining <= EXAM_CONFIG.TIME_LOW_WARNING_SECONDS;
  const isTimeCritical =
    isMockMode &&
    state.timeRemaining <= EXAM_CONFIG.TIME_CRITICAL_WARNING_SECONDS;

  const isLastQuestion = state.currentIndex === totalQuestions - 1;

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

    // Must be a quick swipe (< 600ms) with at least 45px horizontal movement
    // and predominantly horizontal (deltaX > 1.3 * deltaY)
    if (
      deltaTime < 600 &&
      Math.abs(deltaX) > 45 &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.3
    ) {
      if (deltaX < 0) {
        // Swipe Left -> Next Question
        if (state.currentIndex < totalQuestions - 1) {
          dispatch({ type: 'NEXT_QUESTION' });
        } else if (unansweredCount > 0) {
          dispatch({ type: 'JUMP_TO_NEXT_UNANSWERED' });
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
    <div className="space-y-4 select-none sm:select-auto">
      {/* Sticky Header Bar */}
      <div className="sticky top-2 z-20 rounded-2xl border border-stone-200 bg-white/95 p-3.5 shadow-md backdrop-blur-md sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Progress Summary & Mode Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-slate-900 sm:text-base">
              {t.questionOf(state.currentIndex + 1, totalQuestions)}
            </span>

            {/* Answered count & percentage badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-slate-700">
              <span>{t.answeredCount(answeredCount, totalQuestions)}</span>
              <span className="text-slate-400">·</span>
              <span className="font-extrabold text-blue-700">
                {percentCompleted}%
              </span>
            </span>

            {/* Flagged counter pill (if any flagged) */}
            {flaggedCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'JUMP_TO_NEXT_FLAGGED' })}
                title={t.nextFlagged}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-amber-100 px-2.5 text-xs font-extrabold text-amber-900 transition hover:bg-amber-200 active:scale-95"
              >
                <span>⚑</span>
                <span>{t.flaggedCount(flaggedCount)}</span>
              </button>
            )}

            {/* Mode badge */}
            <span
              className={`hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${
                isMockMode
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isMockMode ? t.modeMockExam : t.modePractice}
            </span>
          </div>

          {/* Controls: Timer, Pause, Flag, Finish */}
          <div className="flex items-center gap-2">
            {/* Timer: Countdown in Mock Exam, Elapsed in Practice */}
            {isMockMode ? (
              <div
                className={`flex h-9 items-center gap-1.5 rounded-full px-3 font-mono text-xs font-bold transition ${
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
                className="flex h-9 items-center gap-1.5 rounded-full bg-stone-100 px-3 font-mono text-xs font-bold text-slate-700"
                title={t.timeSpent}
              >
                <span>⏱</span>
                <span>{formatTime(state.timeSpent)}</span>
              </div>
            )}

            {/* Pause Button */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
              className="flex h-9 min-w-[40px] touch-manipulation items-center justify-center rounded-full border border-stone-300 bg-stone-50 px-3 text-xs font-bold text-slate-700 transition hover:bg-stone-200 active:scale-95"
              aria-label={state.isPaused ? t.resume : t.pause}
            >
              {state.isPaused ? t.resume : t.pause}
            </button>

            {/* Flag for review toggle button */}
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'TOGGLE_FLAG',
                  payload: { questionIndex: state.currentIndex },
                })
              }
              title={t.flaggedCardTooltip}
              className={`flex h-9 touch-manipulation items-center gap-1.5 rounded-full px-3 text-xs font-bold transition active:scale-95 ${
                isCurrentFlagged
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'border border-stone-300 bg-white text-slate-700 hover:bg-stone-100'
              }`}
              aria-pressed={isCurrentFlagged}
            >
              <span className="text-sm">⚑</span>
              <span className="hidden sm:inline">
                {isCurrentFlagged ? t.unflagQuestion : t.flagQuestion}
              </span>
            </button>

            {/* Submit / Finish button */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_SUBMIT_MODAL' })}
              className="flex h-9 touch-manipulation items-center rounded-full bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-700 active:scale-95"
            >
              {t.finishBtn}
            </button>
          </div>
        </div>

        {/* Multi-track Visual Progress Bar */}
        <div className="mt-3">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
            {/* Answered progress fill */}
            <div
              className="h-full bg-blue-700 transition-all duration-300 ease-out"
              style={{
                width: `${percentCompleted}%`,
              }}
            />
          </div>
          {/* Progress Segment indicators: mini dots representing 20 questions */}
          <div className="mt-2 flex justify-between px-0.5">
            {state.sessionQuestions.map((_, dotIdx) => {
              const isDotCurrent = dotIdx === state.currentIndex;
              const isDotAnswered = typeof state.answers[dotIdx] === 'number';
              const isDotFlagged = Boolean(state.flagged[dotIdx]);

              let dotStyle = 'bg-stone-200';
              if (isDotCurrent) {
                dotStyle = 'bg-blue-700 ring-2 ring-blue-300 scale-150 z-10';
              } else if (isDotFlagged) {
                dotStyle = 'bg-amber-400';
              } else if (isDotAnswered) {
                dotStyle = 'bg-slate-800';
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
                  title={`Question ${dotIdx + 1}${isDotAnswered ? ' (Answered)' : ' (Unanswered)'}${isDotFlagged ? ' ⚑' : ''}`}
                  className={`h-2 w-2 touch-manipulation rounded-full transition-all duration-150 ${dotStyle}`}
                  aria-label={`Jump to question ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Pause overlay banner */}
      {state.isPaused && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-center shadow-sm">
          <p className="text-sm font-bold text-amber-900">{t.pausedMsg}</p>
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'SET_PAUSE', payload: { isPaused: false } })
            }
            className="mt-3 min-h-[44px] touch-manipulation rounded-full bg-amber-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95"
          >
            {t.resume}
          </button>
        </div>
      )}

      {/* Helper Banner when on last question with unanswered/skipped items */}
      {isLastQuestion && unansweredCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/95 p-4 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="font-bold">
              {t.unansweredBanner(unansweredCount)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'JUMP_TO_NEXT_UNANSWERED' })}
            className="flex min-h-[40px] touch-manipulation items-center rounded-full bg-amber-600 px-4 font-bold text-white shadow-xs transition hover:bg-amber-700 active:scale-95"
          >
            {t.returnToSkipped(unansweredCount)} →
          </button>
        </div>
      )}

      {/* Main Question Card with Swipe Gesture Support */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
        className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-8"
      >
        {/* Category & Card Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
              {String(state.currentIndex + 1).padStart(2, '0')} /{' '}
              {totalQuestions}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wide text-white uppercase shadow-2xs ${
                currentQ.category_id === 2 ? 'bg-sky-700' : 'bg-amber-700'
              }`}
            >
              {currentQ.category_name}
            </span>
          </div>

          {/* Direct Card Flag Action */}
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'TOGGLE_FLAG',
                payload: { questionIndex: state.currentIndex },
              })
            }
            title={t.flaggedCardTooltip}
            className={`inline-flex min-h-[36px] touch-manipulation items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition active:scale-95 ${
              isCurrentFlagged
                ? 'border border-amber-300 bg-amber-50 text-amber-900'
                : 'text-slate-500 hover:bg-stone-100 hover:text-slate-900'
            }`}
          >
            <span
              className={`text-base ${isCurrentFlagged ? 'text-amber-600' : 'text-slate-400'}`}
            >
              ⚑
            </span>
            <span className="text-xs">
              {isCurrentFlagged ? t.unflagQuestion : t.flagQuestion}
            </span>
          </button>
        </div>

        {/* Question Image (if any) */}
        {currentQ.image_url && (
          <div className="my-4 flex justify-center">
            <img
              src={`${imageBase}${currentQ.image_url.replace(/^\//, '')}`}
              alt="Road sign"
              className="max-h-60 max-w-full rounded-2xl border border-stone-200 object-contain p-1 shadow-xs"
            />
          </div>
        )}

        {/* Question Text */}
        <h2 className="mb-6 text-base leading-relaxed font-bold text-slate-900 sm:text-lg">
          {questionTitle}
        </h2>

        {/* Options List with Large Tap Targets (min 56px height) */}
        <div className="space-y-3" role="radiogroup" aria-label={questionTitle}>
          {options.map((opt, optIdx) => {
            const isSelected = userAnswer === optIdx;
            const letter = String.fromCharCode(65 + optIdx);

            // In PRACTICE MODE: immediate feedback styling after answering
            if (!isMockMode && isAnswered) {
              const isCorrectOption = optIdx === currentQ.correct_index;
              const isUserWrongChoice = isSelected && !isCorrect;

              let optionStyle =
                'border-stone-200 bg-stone-50/40 text-slate-600 opacity-75';
              let badgeStyle =
                'border border-slate-300 bg-white text-slate-600';

              if (isCorrectOption) {
                optionStyle =
                  'border-emerald-600 bg-emerald-50 text-slate-950 font-medium shadow-xs';
                badgeStyle =
                  'bg-emerald-600 text-white font-extrabold shadow-xs';
              } else if (isUserWrongChoice) {
                optionStyle =
                  'border-rose-400 bg-rose-50 text-rose-950 font-medium';
                badgeStyle = 'bg-rose-600 text-white font-extrabold';
              }

              return (
                <button
                  key={optIdx}
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
                  className={`flex min-h-[58px] w-full touch-manipulation items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition active:scale-[0.985] ${optionStyle}`}
                >
                  <span
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-black transition sm:text-sm ${badgeStyle}`}
                  >
                    {isCorrectOption ? '✓' : isUserWrongChoice ? '✗' : letter}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed sm:text-base">
                    {opt}
                  </span>
                  {isCorrectOption && (
                    <span className="flex-none text-xs font-bold text-emerald-700">
                      {t.correctAnswer}
                    </span>
                  )}
                  {isUserWrongChoice && (
                    <span className="flex-none text-xs font-bold text-rose-700">
                      {t.yourAnswer}
                    </span>
                  )}
                </button>
              );
            }

            // In MOCK EXAM MODE or unanswered practice question: regular selection without feedback
            return (
              <button
                key={optIdx}
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
                className={`flex min-h-[58px] w-full cursor-pointer touch-manipulation items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition active:scale-[0.985] ${
                  isSelected
                    ? 'border-blue-700 bg-blue-50/80 text-slate-950 shadow-sm ring-1 ring-blue-700'
                    : 'border-stone-200 bg-stone-50/80 text-slate-700 hover:border-slate-400 hover:bg-white'
                }`}
              >
                <span
                  className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-extrabold transition sm:text-sm ${
                    isSelected
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'border border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1 text-sm leading-relaxed font-medium sm:text-base">
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Immediate feedback card in PRACTICE MODE */}
        {!isMockMode && isAnswered && (
          <div
            className={`mt-6 rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${
              isCorrect
                ? 'border-emerald-200 bg-emerald-50/90 text-emerald-950'
                : 'border-rose-200 bg-rose-50/90 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg font-black">
                {isCorrect ? '✓' : '✗'}
              </span>
              <strong className="text-sm font-bold sm:text-base">
                {isCorrect ? t.feedbackCorrectTitle : t.feedbackIncorrectTitle}
              </strong>
            </div>

            {qTrans?.explanation && (
              <div className="mt-2 text-xs leading-relaxed text-slate-800 sm:text-sm">
                <strong className="font-semibold">{t.explanation}:</strong>{' '}
                {qTrans.explanation}
              </div>
            )}
          </div>
        )}

        {/* Swipe Affordance Indicator (visible on touch devices) */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
          <span>👈</span>
          <span>{t.swipeHint}</span>
          <span>👉</span>
        </div>

        {/* Navigation & Skip Bar with Large Touch Targets (min 44px-48px height) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-6">
          {/* Previous Button */}
          <button
            type="button"
            disabled={state.currentIndex === 0}
            onClick={() => dispatch({ type: 'PREV_QUESTION' })}
            className="flex min-h-[46px] touch-manipulation items-center rounded-full border-2 border-slate-900 bg-white px-5 text-xs font-bold text-slate-900 transition hover:bg-stone-100 active:scale-95 disabled:border-stone-200 disabled:text-stone-300 disabled:hover:bg-transparent sm:px-6 sm:text-sm"
          >
            ← {t.prevBtn}
          </button>

          {/* Middle Actions: Skip for now & Jump to next unanswered */}
          <div className="flex items-center gap-2">
            {/* Skip for now button */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'SKIP_QUESTION' })}
              title={t.skipForNow}
              className="flex min-h-[46px] touch-manipulation items-center rounded-full border border-stone-300 bg-stone-50 px-4 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-stone-200 active:scale-95 sm:px-5 sm:text-sm"
            >
              ↷ {t.skipForNow}
            </button>

            {/* Quick jump to Next Unanswered when user answered this question and others remain */}
            {unansweredCount > 0 && isAnswered && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'JUMP_TO_NEXT_UNANSWERED' })}
                title={t.nextUnanswered}
                className="hidden min-h-[46px] touch-manipulation items-center rounded-full border border-blue-200 bg-blue-50 px-4 text-xs font-bold text-blue-800 transition hover:bg-blue-100 active:scale-95 sm:flex sm:text-sm"
              >
                {t.nextUnanswered} →
              </button>
            )}
          </div>

          {/* Next or Finish Button */}
          {state.currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
              className="flex min-h-[46px] touch-manipulation items-center rounded-full bg-slate-900 px-6 text-xs font-bold text-white shadow-sm transition hover:bg-slate-700 active:scale-95 sm:px-8 sm:text-sm"
            >
              {t.nextBtn} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_SUBMIT_MODAL' })}
              className="flex min-h-[46px] touch-manipulation items-center rounded-full bg-emerald-600 px-6 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 sm:px-8 sm:text-sm"
            >
              {t.finishBtn} ✓
            </button>
          )}
        </div>
      </div>

      {/* Question Navigator Grid (1-20 Matrix with Large Tap Targets) */}
      <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 shadow-2xs sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold tracking-wider text-slate-600 uppercase">
              {t.questionGrid}
            </h3>
            <span className="text-xs font-bold text-slate-500">
              ({answeredCount}/{totalQuestions} · {percentCompleted}%)
            </span>
          </div>

          {/* Quick jump helpers */}
          <div className="flex items-center gap-2">
            {unansweredCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'JUMP_TO_NEXT_UNANSWERED' })}
                className="flex min-h-[34px] touch-manipulation items-center rounded-full border border-stone-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-stone-100 active:scale-95"
              >
                ○ {t.nextUnanswered}
              </button>
            )}

            {flaggedCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'JUMP_TO_NEXT_FLAGGED' })}
                className="flex min-h-[34px] touch-manipulation items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900 transition hover:bg-amber-100 active:scale-95"
              >
                ⚑ {t.nextFlagged}
              </button>
            )}
          </div>
        </div>

        {/* 20 Question matrix with accessible 48px touch targets */}
        <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-10">
          {state.sessionQuestions.map((q, idx) => {
            const isCurrent = idx === state.currentIndex;
            const userAns = state.answers[idx];
            const isQAnswered = typeof userAns === 'number';
            const isQCorrect = isQAnswered && userAns === q.correct_index;
            const isFlag = Boolean(state.flagged[idx]);

            // Styling matrix buttons based on current, answered, correct, incorrect, and flagged
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
              // Mock exam mode: neutral answered style (solid dark)
              btnColor =
                'border border-slate-900 bg-slate-900 text-white font-bold';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'SET_CURRENT_INDEX',
                    payload: { index: idx },
                  })
                }
                title={`Question ${idx + 1} · ${isQAnswered ? (isMockMode ? 'Answered' : isQCorrect ? 'Correct' : 'Incorrect') : 'Unanswered / Skipped'}${isFlag ? ' (Flagged)' : ''}`}
                className={`relative flex h-11 min-w-[44px] cursor-pointer touch-manipulation flex-col items-center justify-center rounded-xl font-mono text-xs font-bold transition active:scale-95 sm:h-12 sm:text-sm ${btnColor} ${
                  isFlag && !isCurrent ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                <span>{idx + 1}</span>
                {isFlag && (
                  <span
                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-950 shadow-xs"
                    title={t.flaggedDuringTest}
                  >
                    ⚑
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-3.5 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-md bg-blue-700 ring-1 ring-blue-300" />
            {t.legendCurrent}
          </span>
          {!isMockMode ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-3.5 rounded-md bg-emerald-600" />
                {t.legendCorrect}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-3.5 rounded-md bg-rose-600" />
                {t.legendIncorrect}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-md bg-slate-900" />
              {t.legendAnswered}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-md border border-dashed border-stone-400 bg-white" />
            {t.legendSkipped}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-md bg-amber-400" />
            {t.legendFlagged}
          </span>
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-400">
          {t.keyboardTips}
        </p>
      </div>
    </div>
  );
}
