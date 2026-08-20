import {
  useState,
  useRef,
  useEffect,
  type Dispatch,
  type TouchEvent,
} from 'react';
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

  // The bottom Prev/Next bar is truly `position: fixed` to the browser
  // viewport (so it never moves if the surrounding page scrolls), but it
  // still needs to line up with the card's left/right edges below. Since a
  // real `fixed` element ignores this component's own width once nothing is
  // scoping it, we measure the column's actual on-screen box and mirror it
  // onto the nav via inline style, keeping it in sync on resize.
  const columnRef = useRef<HTMLDivElement>(null);
  const [navBounds, setNavBounds] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    const updateBounds = () => {
      if (columnRef.current) {
        const rect = columnRef.current.getBoundingClientRect();
        setNavBounds({ left: rect.left, width: rect.width });
      }
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

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
  const flaggedCount = Object.values(state.flagged).filter(Boolean).length;
  const isCurrentFlagged = Boolean(state.flagged[state.currentIndex]);
  const isMockMode = state.mode === 'mock_exam';
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
      ref={columnRef}
      className="flex h-dvh flex-col justify-between overflow-hidden pb-20 select-none sm:pb-24 sm:select-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* 0. Back to Bank link — sits above the header, not inside it */}
      <div className="mb-1.5 flex-none">
        <a
          href={`/${state.currentLocale}/questions`}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-stone-300 bg-white px-3 text-xs font-bold whitespace-nowrap text-slate-700 no-underline shadow-2xs transition hover:bg-stone-100 hover:text-blue-700 active:scale-95"
          title={t.bankBtn}
          onClick={() => {
            // The user left Practice/Exam to browse questions.
            // Start fresh next time (and prevent the saved session banner).
            clearSessionFromStorage();
          }}
        >
          <span>←</span>
          <span>{t.bankBtn}</span>
        </a>
      </div>

      {/* 1. Header Bar (Progress, Category, Timer, Language & Grid) */}
      <header className="flex-none rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-xs backdrop-blur-md sm:p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Progress badge & Category */}
          <div className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <span className="flex h-9 flex-none items-center justify-center rounded-lg bg-blue-700 px-2 font-mono text-[11px] font-black whitespace-nowrap text-white shadow-2xs sm:h-8 sm:px-2.5 sm:text-sm">
              {String(state.currentIndex + 1).padStart(2, '0')} /{' '}
              {totalQuestions}
            </span>

            <span
              className={`xs:inline-flex hidden flex-none rounded-md px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase shadow-2xs ${
                currentQ.category_id === 2 ? 'bg-sky-700' : 'bg-amber-700'
              }`}
            >
              {currentQ.category_name}
            </span>
          </div>

          {/* Right: Timer, Language, Grid trigger & Finish */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:flex-nowrap sm:gap-2">
            {/* Timer */}
            {isMockMode ? (
              <div
                className={`flex h-9 flex-none items-center gap-1 rounded-full px-2.5 font-mono text-[11px] font-bold transition sm:h-8 sm:text-xs ${
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
                className="flex h-9 flex-none items-center gap-1 rounded-full bg-stone-100 px-2.5 font-mono text-[11px] font-bold text-slate-700 sm:h-8 sm:text-xs"
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
              className="flex h-9 flex-none cursor-pointer touch-manipulation items-center gap-1 rounded-full border border-stone-300 bg-white px-2.5 text-[11px] font-bold text-slate-800 hover:bg-stone-100 active:scale-95 sm:h-8 sm:text-xs"
              title={t.questionGrid}
            >
              <span>⊞</span>
              <span className="xs:inline hidden text-[11px]">20 Qs</span>
              {flaggedCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-900">
                  {flaggedCount}
                </span>
              )}
            </button>

            {/* Finish Test Button */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_SUBMIT_MODAL' })}
              className="flex h-9 flex-none cursor-pointer touch-manipulation items-center justify-center rounded-full bg-slate-900 px-3 text-[11px] font-bold whitespace-nowrap text-white transition hover:bg-slate-700 active:scale-95 sm:h-8 sm:text-xs"
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
              const isDotFlagged = Boolean(state.flagged[dotIdx]);

              let segmentColor = 'bg-stone-200 hover:bg-stone-300';
              if (isDotCurrent) {
                segmentColor =
                  'bg-blue-700 ring-2 ring-blue-300 ring-offset-1 z-10';
              } else if (isDotFlagged) {
                segmentColor = 'bg-amber-400 hover:bg-amber-500';
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
                  title={`Q${dotIdx + 1}${isDotAnswered ? ' (Answered)' : ' (Unanswered)'}${isDotFlagged ? ' ⚑' : ''}`}
                  className={`h-2 flex-1 cursor-pointer touch-manipulation rounded-xs transition-all duration-150 sm:h-2.5 ${segmentColor}`}
                  aria-label={`Jump to question ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. Main Question Card Area (Prev/Next removed — now pinned as its own row at the bottom of this same column, so it lines up with this card's edges) */}
      <main className="my-1.5 flex flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs sm:my-2 sm:rounded-3xl sm:p-5 md:p-6">
        {/* Question Header Row */}
        <div className="mb-2 flex flex-none items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
              {t.questionOf(state.currentIndex + 1, totalQuestions)}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white uppercase shadow-2xs ${
                currentQ.category_id === 2 ? 'bg-sky-700' : 'bg-amber-700'
              }`}
            >
              {currentQ.category_name}
            </span>
          </div>

          {/* Quick Flag Chip */}
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'TOGGLE_FLAG',
                payload: { questionIndex: state.currentIndex },
              })
            }
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition active:scale-95 ${
              isCurrentFlagged
                ? 'border border-amber-300 bg-amber-50 text-amber-900'
                : 'text-slate-400 hover:bg-stone-100 hover:text-slate-700'
            }`}
          >
            <span>⚑</span>
            <span>{isCurrentFlagged ? t.unflagQuestion : t.flagQuestion}</span>
          </button>
        </div>

        {/* Question Content & Options Container */}
        <div className="flex flex-1 flex-col justify-center overflow-y-auto pr-1">
          {currentQ.image_url ? (
            /* Road Sign Question: Responsive 2-Column on Tablet/Desktop, Compact Stacked on Mobile */
            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12 md:gap-6">
              {/* Left Column: Sign Image + Question Title + Practice Feedback */}
              <div className="flex flex-col items-center justify-center text-center md:col-span-5">
                <div className="my-1 flex justify-center">
                  <img
                    src={`${imageBase}${currentQ.image_url.replace(/^\//, '')}`}
                    alt="Road sign"
                    className="max-h-24 max-w-full rounded-xl border border-stone-200 bg-stone-50 object-contain p-1.5 shadow-2xs sm:max-h-32 md:max-h-44"
                  />
                </div>

                <h2 className="mt-1.5 text-xs leading-snug font-bold text-slate-900 sm:text-sm md:text-base">
                  {questionTitle}
                </h2>

                {/* Immediate Feedback in Practice Mode */}
                {!isMockMode && isAnswered && (
                  <div
                    className={`mt-2 w-full rounded-xl border p-2 text-left transition-all ${
                      isCorrect
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                        : 'border-rose-300 bg-rose-50 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold">
                      <span>{isCorrect ? '✓' : '✗'}</span>
                      <span>
                        {isCorrect
                          ? t.feedbackCorrectTitle
                          : t.feedbackIncorrectTitle}
                      </span>
                    </div>
                    {qTrans?.explanation && (
                      <p className="mt-1 text-[11px] leading-tight text-slate-800">
                        <strong className="font-semibold">
                          {t.explanation}:
                        </strong>{' '}
                        {qTrans.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Option Buttons */}
              <div
                className="flex flex-col justify-center space-y-2 sm:space-y-2.5 md:col-span-7"
                role="radiogroup"
                aria-label={questionTitle}
              >
                {options.map((opt, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  // Practice mode answered feedback
                  if (!isMockMode && isAnswered) {
                    const isCorrectOption = optIdx === currentQ.correct_index;
                    const isUserWrongChoice = isSelected && !isCorrect;

                    let optionStyle =
                      'border-stone-200 bg-stone-50/40 text-slate-600 opacity-75';
                    let badgeStyle =
                      'border border-slate-300 bg-white text-slate-600';

                    if (isCorrectOption) {
                      optionStyle =
                        'border-emerald-600 bg-emerald-50 text-slate-950 font-medium shadow-xs ring-1 ring-emerald-600';
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
                        className={`flex min-h-[44px] w-full cursor-pointer touch-manipulation items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.985] sm:min-h-[48px] sm:gap-3 sm:rounded-2xl sm:px-3.5 sm:py-2.5 ${optionStyle}`}
                      >
                        <span
                          className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-black transition sm:h-8 sm:w-8 ${badgeStyle}`}
                        >
                          {isCorrectOption
                            ? '✓'
                            : isUserWrongChoice
                              ? '✗'
                              : letter}
                        </span>
                        <span className="flex-1 text-xs leading-snug font-medium sm:text-sm">
                          {opt}
                        </span>
                        {isCorrectOption && (
                          <span className="flex-none text-[11px] font-bold text-emerald-700">
                            {t.correctAnswer}
                          </span>
                        )}
                        {isUserWrongChoice && (
                          <span className="flex-none text-[11px] font-bold text-rose-700">
                            {t.yourAnswer}
                          </span>
                        )}
                      </button>
                    );
                  }

                  // Default / Mock exam option selection
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
                      className={`flex min-h-[44px] w-full cursor-pointer touch-manipulation items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.985] sm:min-h-[48px] sm:gap-3 sm:rounded-2xl sm:px-3.5 sm:py-2.5 ${
                        isSelected
                          ? 'border-blue-700 bg-blue-50/80 text-slate-950 shadow-xs ring-1 ring-blue-700'
                          : 'border-stone-200 bg-stone-50/80 text-slate-700 hover:border-slate-400 hover:bg-white'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-extrabold transition sm:h-8 sm:w-8 ${
                          isSelected
                            ? 'bg-blue-700 text-white shadow-2xs'
                            : 'border border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 text-xs leading-snug font-medium sm:text-sm">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Traffic Rules Question: Single Column Clean Layout */
            <div className="mx-auto flex w-full max-w-3xl flex-col justify-center">
              <h2 className="mb-3 text-sm leading-snug font-bold text-slate-900 sm:mb-4 sm:text-base md:text-lg">
                {questionTitle}
              </h2>

              <div
                className="space-y-2 sm:space-y-2.5"
                role="radiogroup"
                aria-label={questionTitle}
              >
                {options.map((opt, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  // Practice mode answered feedback
                  if (!isMockMode && isAnswered) {
                    const isCorrectOption = optIdx === currentQ.correct_index;
                    const isUserWrongChoice = isSelected && !isCorrect;

                    let optionStyle =
                      'border-stone-200 bg-stone-50/40 text-slate-600 opacity-75';
                    let badgeStyle =
                      'border border-slate-300 bg-white text-slate-600';

                    if (isCorrectOption) {
                      optionStyle =
                        'border-emerald-600 bg-emerald-50 text-slate-950 font-medium shadow-xs ring-1 ring-emerald-600';
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
                        className={`flex min-h-[44px] w-full cursor-pointer touch-manipulation items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.985] sm:min-h-[48px] sm:rounded-2xl sm:px-4 sm:py-2.5 ${optionStyle}`}
                      >
                        <span
                          className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-black transition sm:h-8 sm:w-8 ${badgeStyle}`}
                        >
                          {isCorrectOption
                            ? '✓'
                            : isUserWrongChoice
                              ? '✗'
                              : letter}
                        </span>
                        <span className="flex-1 text-xs leading-snug font-medium sm:text-sm md:text-base">
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

                  // Default / Mock exam option selection
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
                      className={`flex min-h-[44px] w-full cursor-pointer touch-manipulation items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.985] sm:min-h-[48px] sm:rounded-2xl sm:px-4 sm:py-2.5 ${
                        isSelected
                          ? 'border-blue-700 bg-blue-50/80 text-slate-950 shadow-xs ring-1 ring-blue-700'
                          : 'border-stone-200 bg-stone-50/80 text-slate-700 hover:border-slate-400 hover:bg-white'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-extrabold transition sm:h-8 sm:w-8 ${
                          isSelected
                            ? 'bg-blue-700 text-white shadow-2xs'
                            : 'border border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 text-xs leading-snug font-medium sm:text-sm md:text-base">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Immediate Feedback in Practice Mode */}
              {!isMockMode && isAnswered && (
                <div
                  className={`mt-3 rounded-xl border p-3 text-left transition-all ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      : 'border-rose-300 bg-rose-50 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-extrabold sm:text-sm">
                    <span>{isCorrect ? '✓' : '✗'}</span>
                    <span>
                      {isCorrect
                        ? t.feedbackCorrectTitle
                        : t.feedbackIncorrectTitle}
                    </span>
                  </div>
                  {qTrans?.explanation && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-800">
                      <strong className="font-semibold">
                        {t.explanation}:
                      </strong>{' '}
                      {qTrans.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 3. Previous (left) & Next/Finish (right) — genuinely `position: fixed` to the browser viewport, so it stays glued in place no matter how the page scrolls. Its left/width are set from the measured card column (via the effect above) so it still lines up exactly with the header and question card. */}
      <nav
        className="fixed bottom-0 z-40 flex items-center justify-between bg-transparent pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:pt-3 sm:pb-[calc(0.875rem+env(safe-area-inset-bottom))]"
        style={
          navBounds
            ? { left: navBounds.left, width: navBounds.width }
            : { left: 0, right: 0 }
        }
        aria-label="Question navigation"
      >
        {/* Previous — left */}
        <button
          type="button"
          disabled={state.currentIndex === 0}
          onClick={() => dispatch({ type: 'PREV_QUESTION' })}
          className="flex min-h-[44px] w-28 cursor-pointer touch-manipulation items-center justify-center rounded-full border-2 border-slate-900 bg-white px-3 text-xs font-bold whitespace-nowrap text-slate-900 transition hover:bg-stone-100 active:scale-95 disabled:border-stone-200 disabled:text-stone-300 disabled:hover:bg-transparent sm:min-h-[48px] sm:w-36 sm:text-sm"
        >
          ←{' '}
          {state.currentLocale === 'fr' ? (
            <>
              <span className="sm:hidden">Préc.</span>
              <span className="hidden sm:inline">{t.prevBtn}</span>
            </>
          ) : state.currentLocale === 'rw' ? (
            <>
              <span className="sm:hidden">Inyuma</span>
              <span className="hidden sm:inline">{t.prevBtn}</span>
            </>
          ) : (
            t.prevBtn
          )}
        </button>

        {/* Next or Finish — right */}
        {state.currentIndex < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
            className="flex min-h-[44px] w-28 cursor-pointer touch-manipulation items-center justify-center rounded-full bg-slate-900 px-3 text-xs font-bold whitespace-nowrap text-white shadow-xs transition hover:bg-slate-700 active:scale-95 sm:min-h-[48px] sm:w-36 sm:text-sm"
          >
            {state.currentLocale === 'fr' ? (
              <>
                <span className="sm:hidden">Suiv.</span>
                <span className="hidden sm:inline">{t.nextBtn}</span>
              </>
            ) : state.currentLocale === 'rw' ? (
              <>
                <span className="sm:hidden">Imbere</span>
                <span className="hidden sm:inline">{t.nextBtn}</span>
              </>
            ) : (
              t.nextBtn
            )}{' '}
            →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => dispatch({ type: 'OPEN_SUBMIT_MODAL' })}
            className="flex min-h-[44px] w-28 cursor-pointer touch-manipulation items-center justify-center rounded-full bg-emerald-600 px-3 text-xs font-bold whitespace-nowrap text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 sm:min-h-[48px] sm:w-36 sm:text-sm"
          >
            {state.currentLocale === 'fr' ? (
              <>
                <span className="sm:hidden">Terminer</span>
                <span className="hidden sm:inline">{t.finishBtn}</span>
              </>
            ) : state.currentLocale === 'rw' ? (
              <>
                <span className="sm:hidden">Soza</span>
                <span className="hidden sm:inline">{t.finishBtn}</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">Finish</span>
                <span className="hidden sm:inline">{t.finishBtn}</span>
              </>
            )}{' '}
            ✓
          </button>
        )}
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
            <div className="my-3 flex items-center justify-between gap-2">
              {unansweredCount > 0 && (
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
              )}

              {flaggedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'JUMP_TO_NEXT_FLAGGED' });
                    setShowGridModal(false);
                  }}
                  className="flex min-h-[34px] cursor-pointer touch-manipulation items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900 hover:bg-amber-100"
                >
                  ⚑ {t.nextFlagged}
                </button>
              )}
            </div>

            {/* 20 Questions Matrix */}
            <div className="my-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {state.sessionQuestions.map((q, idx) => {
                const isCurrent = idx === state.currentIndex;
                const userAns = state.answers[idx];
                const isQAnswered = typeof userAns === 'number';
                const isQCorrect = isQAnswered && userAns === q.correct_index;
                const isFlag = Boolean(state.flagged[idx]);

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
                    className={`relative flex h-11 min-w-[40px] cursor-pointer touch-manipulation flex-col items-center justify-center rounded-xl font-mono text-xs font-bold transition active:scale-95 ${btnColor} ${
                      isFlag && !isCurrent ? 'ring-2 ring-amber-400' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlag && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-950 shadow-xs">
                        ⚑
                      </span>
                    )}
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
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-md bg-amber-400" />
                {t.legendFlagged}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
