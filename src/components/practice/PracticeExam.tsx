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
import { categoryLabel } from '../../lib/quiz';
import { questionImageAlt } from '../../lib/seo';
import {
  isQuestionBookmarked,
  toggleQuestionBookmark,
  recordQuestionAttempt,
  EVENT_BOOKMARKS_CHANGED,
} from '../../lib/study-progress';

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
  const [isBookmarked, setIsBookmarked] = useState(() =>
    currentQ ? isQuestionBookmarked(currentQ.id) : false,
  );

  useEffect(() => {
    if (currentQ) {
      setIsBookmarked(isQuestionBookmarked(currentQ.id));
    }
  }, [currentQ]);

  useEffect(() => {
    const handleBookmarkEvent = () => {
      if (currentQ) {
        setIsBookmarked(isQuestionBookmarked(currentQ.id));
      }
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
  }, [currentQ]);

  const handleToggleBookmark = () => {
    if (!currentQ) return;
    const next = toggleQuestionBookmark(currentQ.id);
    setIsBookmarked(next);
  };

  const handleSelectAnswer = (optIdx: number) => {
    if (!currentQ) return;
    const isAlreadyAnswered =
      typeof state.answers[state.currentIndex] === 'number';

    dispatch({
      type: 'SELECT_ANSWER',
      payload: {
        questionIndex: state.currentIndex,
        optionIndex: optIdx,
      },
    });

    // In immediate modes (practice, weak drill, bookmarked drill), record progress immediately on first attempt only
    if (state.mode !== 'mock_exam' && !isAlreadyAnswered) {
      const isCorrectChoice = optIdx === currentQ.correct_index;
      recordQuestionAttempt(currentQ.id, isCorrectChoice);
    }
  };

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
          className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 no-underline shadow-2xs transition hover:bg-stone-100 hover:text-blue-700 active:scale-95"
          title={t.bankBtn}
          onClick={() => {
            clearSessionFromStorage();
          }}
        >
          <span className="text-sm">←</span>
          <span>{t.bankBtn}</span>
        </a>
      </div>

      {/* Mode Special Drill Banner */}
      {state.mode === 'weak_drill' && (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-rose-400 bg-rose-50/90 px-4 py-2.5 text-xs font-extrabold text-rose-950 shadow-2xs">
          <span className="text-base">🎯</span>
          <span>{t.weakDrillTitle} — Focused revision of missed questions</span>
        </div>
      )}
      {state.mode === 'bookmarked_drill' && (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-sky-400 bg-sky-50/90 px-4 py-2.5 text-xs font-extrabold text-sky-950 shadow-2xs">
          <span className="text-base">🔖</span>
          <span>{t.bookmarksTitle} — Practicing saved questions</span>
        </div>
      )}

      {/* 1. Header Bar (Progress, Category, Timer, Language & Grid) */}
      <header className="rounded-2xl border border-stone-200 bg-white p-3 shadow-xs sm:p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Progress badge & Category */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex min-h-[36px] items-center justify-center rounded-xl bg-blue-700 px-3 font-mono text-xs font-black text-white shadow-2xs sm:text-sm">
              {String(state.currentIndex + 1).padStart(2, '0')} /{' '}
              {totalQuestions}
            </span>

            <span
              className={`inline-flex min-h-[36px] items-center rounded-xl px-2.5 py-1 text-[11px] font-black tracking-wide text-white uppercase shadow-2xs ${
                isRoadSigns ? 'bg-sky-700' : 'bg-amber-700'
              }`}
            >
              {categoryLabel(currentQ.category_id, state.currentLocale)}
            </span>
          </div>

          {/* Right: Timer, Language, Grid trigger & Finish */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Timer */}
            {isMockMode ? (
              <div
                className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-3 font-mono text-xs font-bold transition sm:text-sm ${
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
                className="flex min-h-[36px] items-center gap-1.5 rounded-full bg-stone-100 px-3 font-mono text-xs font-bold text-slate-700 sm:text-sm"
                title={t.timeSpent}
              >
                <span>⏱</span>
                <span>{formatTime(state.timeSpent)}</span>
              </div>
            )}

            {/* Locked Language Badge */}
            <span
              className="hidden min-h-[36px] items-center rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-black text-slate-500 uppercase sm:inline-flex"
              title="Test language is locked"
            >
              {state.currentLocale.toUpperCase()}
            </span>

            {/* 20 Questions Navigator Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowGridModal(true)}
              className="flex min-h-[36px] cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-400 hover:bg-stone-100 active:scale-95 sm:text-sm"
              title={t.questionGrid}
            >
              <span>⊞</span>
              <span className="hidden text-xs sm:inline">20 Qs</span>
            </button>

            {/* Finish Test Button */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_SUBMIT_MODAL' })}
              className="flex min-h-[36px] cursor-pointer touch-manipulation items-center justify-center rounded-full bg-slate-900 px-4 py-1 text-xs font-extrabold whitespace-nowrap text-white shadow-2xs transition hover:bg-slate-800 active:scale-95 sm:text-sm"
            >
              {t.finishBtn}
            </button>
          </div>
        </div>

        {/* 20-Segment Interactive Multi-Track Bar */}
        <div className="mt-2.5">
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
                  className={`h-2.5 flex-1 cursor-pointer touch-manipulation rounded-xs transition-all duration-150 sm:h-3 ${segmentColor}`}
                  aria-label={`Jump to question ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. Main Question Card Area — generous vertical room and clear typography */}
      <article
        className={`quiz-item rounded-2xl border-2 border-l-[6px] bg-white p-5 shadow-sm transition sm:p-6 ${
          isRoadSigns
            ? 'border-stone-200 border-l-sky-600'
            : 'border-stone-200 border-l-amber-500'
        }`}
      >
        {/* Header inside Card */}
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
            {String(state.currentIndex + 1).padStart(2, '0')} / {totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold shadow-2xs transition ${
                isBookmarked
                  ? 'bg-sky-700 text-white hover:bg-sky-800'
                  : 'border border-stone-300 bg-white text-slate-700 hover:bg-stone-100'
              }`}
              title={isBookmarked ? t.bookmarkedBtn : t.bookmarkBtn}
              aria-pressed={isBookmarked}
            >
              <span>{isBookmarked ? '🔖' : '🏷️'}</span>
              <span className="hidden sm:inline">
                {isBookmarked ? t.bookmarkedBtn : t.bookmarkBtn}
              </span>
            </button>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wide text-white uppercase shadow-2xs ${
                isRoadSigns ? 'bg-sky-700' : 'bg-amber-700'
              }`}
            >
              {categoryLabel(currentQ.category_id, state.currentLocale)}
            </span>
          </div>
        </div>

        {/* Question Image if present */}
        {currentQ.image_url && (
          <div className="quiz-image-wrap my-3 flex justify-center">
            <img
              src={`${imageBase}${currentQ.image_url.replace(/^\//, '')}`}
              alt={questionImageAlt(
                currentQ,
                state.currentLocale,
                currentQ.sessionNumber,
              )}
              loading="eager"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
              className="block max-h-36 max-w-full rounded-xl border border-stone-200 object-contain shadow-2xs sm:max-h-48"
            />
          </div>
        )}

        {/* Question Title */}
        <p className="mb-4 text-base leading-relaxed font-bold break-words text-slate-900 sm:text-lg">
          {questionTitle}
        </p>

        {/* Options List — designed large with spacious vertical padding and multi-line fitting */}
        <ul
          className="m-0 flex list-none flex-col gap-2.5 p-0 sm:gap-3"
          role="radiogroup"
          aria-label={questionTitle}
        >
          {options.map((opt, optIdx) => {
            const isSelected = userAnswer === optIdx;
            const letter = String.fromCharCode(65 + optIdx);

            if (!isMockMode && isAnswered) {
              const isCorrectOption = optIdx === currentQ.correct_index;
              const isUserWrongChoice = isSelected && !isCorrect;

              let optionStyle =
                'border-stone-200 bg-stone-50/60 text-slate-700';
              let badgeStyle = 'border-slate-400 bg-stone-100 text-slate-600';

              if (isCorrectOption) {
                optionStyle =
                  'border-emerald-600 bg-emerald-50 text-slate-900 shadow-xs ring-2 ring-emerald-600/20';
                badgeStyle =
                  'border-emerald-600 bg-emerald-600 text-white shadow-2xs';
              } else if (isUserWrongChoice) {
                optionStyle =
                  'border-rose-500 bg-rose-50 text-slate-900 shadow-xs ring-2 ring-rose-500/20';
                badgeStyle =
                  'border-rose-600 bg-rose-600 text-white shadow-2xs';
              }

              return (
                <li key={optIdx}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectAnswer(optIdx)}
                    className={`group flex min-h-[58px] w-full cursor-pointer touch-manipulation items-start gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.99] sm:min-h-[62px] ${optionStyle}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6.5 w-6.5 flex-none shrink-0 items-center justify-center rounded-full border-2 text-xs font-black sm:h-7 sm:w-7 sm:text-sm ${badgeStyle}`}
                    >
                      {isCorrectOption ? '✓' : isUserWrongChoice ? '✗' : letter}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="text-sm leading-relaxed font-semibold break-words sm:text-base">
                        {opt}
                      </span>
                      {isCorrectOption && (
                        <span className="inline-flex items-center self-start rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-black tracking-wide text-emerald-800 uppercase sm:text-xs">
                          ✓ {t.correctAnswer}
                        </span>
                      )}
                      {isUserWrongChoice && (
                        <span className="inline-flex items-center self-start rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-black tracking-wide text-rose-800 uppercase sm:text-xs">
                          ✗ {t.yourAnswer}
                        </span>
                      )}
                    </div>
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
                  onClick={() => handleSelectAnswer(optIdx)}
                  className={`group flex min-h-[58px] w-full cursor-pointer touch-manipulation items-start gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.99] sm:min-h-[62px] ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50/90 text-slate-950 shadow-sm ring-2 ring-blue-700/20'
                      : 'border-stone-200 bg-stone-50/50 text-slate-800 hover:border-slate-400 hover:bg-white'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6.5 w-6.5 flex-none shrink-0 items-center justify-center rounded-full border-2 text-xs font-black sm:h-7 sm:w-7 sm:text-sm ${
                      isSelected
                        ? 'border-blue-700 bg-blue-700 text-white shadow-2xs'
                        : 'border-slate-400 bg-white text-slate-700'
                    }`}
                  >
                    {letter}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm leading-relaxed font-semibold break-words sm:text-base">
                      {opt}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Compact Immediate Feedback in Practice Mode */}
        {!isMockMode && isAnswered && (
          <div
            className={`mt-4 rounded-2xl border-2 p-4 sm:p-4.5 ${
              isCorrect
                ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs'
                : 'border-rose-400 bg-rose-50/90 text-rose-950 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black tracking-wider uppercase ${
                  isCorrect ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {isCorrect
                  ? `✓ ${t.feedbackCorrectTitle}`
                  : `✗ ${t.feedbackIncorrectTitle}`}
              </span>
            </div>
            {qTrans?.explanation && (
              <p className="mt-2 text-xs leading-relaxed font-medium break-words text-slate-800 sm:text-sm">
                <strong className="font-bold text-slate-900">
                  {t.explanation}:
                </strong>{' '}
                {qTrans.explanation}
              </p>
            )}
          </div>
        )}
      </article>

      {/* 3. Fixed Bottom Navigation Bar — spacious buttons with vertical line fitting */}
      <nav
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-stone-200/90 bg-stone-100/95 py-3.5 pb-[calc(0.85rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md"
        aria-label="Question navigation"
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-0">
          {/* Previous */}
          {state.currentIndex > 0 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'PREV_QUESTION' })}
              className="flex min-h-[48px] min-w-[100px] cursor-pointer touch-manipulation items-center justify-center rounded-2xl border-2 border-slate-900 bg-white px-5 py-2.5 text-xs font-extrabold text-slate-900 shadow-xs transition hover:bg-stone-100 active:scale-95 sm:min-w-[125px] sm:rounded-full sm:text-sm"
            >
              ← {t.prevBtn}
            </button>
          ) : (
            <span className="flex min-h-[48px] min-w-[100px] items-center justify-center rounded-2xl border border-stone-200 bg-white/60 px-5 py-2.5 text-xs font-bold text-stone-300 select-none sm:min-w-[125px] sm:rounded-full sm:text-sm">
              ← {t.prevBtn}
            </span>
          )}

          {/* Counter */}
          <span className="shrink-0 px-2 font-mono text-sm font-black text-slate-800 sm:text-base">
            {String(state.currentIndex + 1).padStart(2, '0')} / {totalQuestions}
          </span>

          {/* Next or Finish */}
          {state.currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
              className="flex min-h-[48px] min-w-[100px] cursor-pointer touch-manipulation items-center justify-center rounded-2xl border-2 border-slate-900 bg-slate-900 px-5 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-slate-800 active:scale-95 sm:min-w-[125px] sm:rounded-full sm:text-sm"
            >
              {t.nextBtn} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_SUBMIT_MODAL' })}
              className="flex min-h-[48px] min-w-[120px] cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-2xl border-2 border-emerald-600 bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-700 active:scale-95 sm:min-w-[150px] sm:rounded-full sm:text-sm"
            >
              <span>{t.finishBtn}</span>
              <span>✓</span>
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
                <h3 className="text-base font-black text-slate-900">
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
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-slate-600 transition hover:bg-stone-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Quick Filter Jump Helpers */}
            {unansweredCount > 0 && (
              <div className="my-3.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'JUMP_TO_NEXT_UNANSWERED' });
                    setShowGridModal(false);
                  }}
                  className="flex min-h-[42px] cursor-pointer touch-manipulation items-center rounded-2xl border-2 border-blue-200 bg-blue-50/90 px-4 py-2 text-xs leading-snug font-bold text-blue-950 transition hover:bg-blue-100 active:scale-95 sm:rounded-full sm:text-sm"
                >
                  ○ {t.nextUnanswered}
                </button>
              </div>
            )}

            {/* 20 Questions Matrix */}
            <div className="my-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {state.sessionQuestions.map((q, idx) => {
                const isCurrent = idx === state.currentIndex;
                const userAns = state.answers[idx];
                const isQAnswered = typeof userAns === 'number';
                const isQCorrect = isQAnswered && userAns === q.correct_index;

                let btnColor =
                  'border-2 border-stone-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-stone-50';

                if (isCurrent) {
                  btnColor =
                    'border-2 border-blue-700 bg-blue-700 text-white font-black shadow-sm ring-2 ring-blue-300';
                } else if (!isMockMode && isQAnswered) {
                  btnColor = isQCorrect
                    ? 'border-2 border-emerald-600 bg-emerald-600 text-white font-black'
                    : 'border-2 border-rose-600 bg-rose-600 text-white font-black';
                } else if (isQAnswered) {
                  btnColor =
                    'border-2 border-slate-900 bg-slate-900 text-white font-black';
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
                    className={`relative flex min-h-[46px] min-w-[44px] cursor-pointer touch-manipulation flex-col items-center justify-center rounded-xl font-mono text-xs font-bold transition active:scale-95 sm:text-sm ${btnColor}`}
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
                <span className="inline-block h-3 w-3 rounded-md border border-stone-300 bg-white" />
                {t.legendSkipped}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
