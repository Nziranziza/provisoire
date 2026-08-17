import React from 'react';
import type { I18nDictionary } from './constants';
import { formatTime } from './reducer';
import type { PracticeAction, PracticeState } from './types';

interface PracticeSubmitModalProps {
  state: PracticeState;
  dispatch: React.Dispatch<PracticeAction>;
  t: I18nDictionary;
}

export default function PracticeSubmitModal({
  state,
  dispatch,
  t,
}: PracticeSubmitModalProps) {
  if (!state.showSubmitModal) return null;

  const total = state.sessionQuestions.length;
  const answeredCount = Object.keys(state.answers).length;
  const unansweredCount = total - answeredCount;
  const isMockMode = state.mode === 'mock_exam';

  // Find all flagged question indices
  const flaggedIndices = state.sessionQuestions
    .map((_, idx) => (state.flagged[idx] ? idx : -1))
    .filter((idx) => idx >= 0);

  const handleJumpToQuestion = (targetIdx: number) => {
    dispatch({ type: 'CLOSE_SUBMIT_MODAL' });
    dispatch({ type: 'SET_CURRENT_INDEX', payload: { index: targetIdx } });
  };

  const handleReviewSkipped = () => {
    // Find first unanswered question
    for (let i = 0; i < total; i++) {
      if (state.answers[i] === undefined) {
        handleJumpToQuestion(i);
        return;
      }
    }
    dispatch({ type: 'CLOSE_SUBMIT_MODAL' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-extrabold text-slate-900">
          {t.submitModalTitle}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {unansweredCount > 0
            ? t.submitModalWarning(unansweredCount)
            : t.submitModalAllDone}
        </p>

        {/* Quick stats in modal */}
        <div className="my-4 grid grid-cols-2 gap-2.5 rounded-2xl bg-stone-50 p-4 text-xs">
          <div>
            <span className="text-slate-500">{t.modalAnswered}:</span>{' '}
            <strong className="font-bold text-slate-900">
              {answeredCount} / {total}
            </strong>
          </div>

          <div>
            <span className="text-slate-500">{t.modalUnanswered}:</span>{' '}
            <strong
              className={
                unansweredCount > 0
                  ? 'font-bold text-amber-700'
                  : 'text-slate-900'
              }
            >
              {unansweredCount}
            </strong>
          </div>

          <div>
            <span className="text-slate-500">{t.modalFlagged}:</span>{' '}
            <strong
              className={
                flaggedIndices.length > 0
                  ? 'font-bold text-amber-700'
                  : 'text-slate-900'
              }
            >
              {flaggedIndices.length}
            </strong>
          </div>

          <div>
            <span className="text-slate-500">
              {isMockMode ? t.modalTimeLeft : t.modalTimeSpent}:
            </span>{' '}
            <strong className="font-mono font-bold text-slate-900">
              {formatTime(isMockMode ? state.timeRemaining : state.timeSpent)}
            </strong>
          </div>
        </div>

        {/* Flagged questions quick jump chips with accessible touch targets */}
        {flaggedIndices.length > 0 && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
            <span className="block text-xs font-bold text-amber-900">
              ⚑ {t.modalReviewFlagged} ({flaggedIndices.length}):
            </span>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {flaggedIndices.map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleJumpToQuestion(idx)}
                  className="flex min-h-[38px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl border border-amber-300 bg-white px-3 text-xs font-bold text-amber-950 transition hover:bg-amber-100 active:scale-95"
                  title={`${t.modalJumpToFlagged} Q${idx + 1}`}
                >
                  Q{idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Review skipped action button if unanswered questions remain */}
        {unansweredCount > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleReviewSkipped}
              className="flex min-h-[46px] w-full touch-manipulation items-center justify-center rounded-2xl border border-blue-200 bg-blue-50/90 px-4 text-xs font-bold text-blue-900 transition hover:bg-blue-100 active:scale-95 sm:text-sm"
            >
              ↷ {t.modalReviewSkipped} ({unansweredCount})
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => dispatch({ type: 'FINISH_EXAM' })}
            className="flex min-h-[48px] touch-manipulation items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
          >
            {t.modalConfirmSubmit}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'CLOSE_SUBMIT_MODAL' })}
            className="flex min-h-[48px] touch-manipulation items-center justify-center rounded-full border-2 border-stone-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-stone-100 active:scale-95"
          >
            {t.modalContinue}
          </button>
        </div>
      </div>
    </div>
  );
}
