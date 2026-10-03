import type { Dispatch } from 'react';
import type { I18nDictionary } from './constants';
import { formatTime } from './reducer';
import type { PracticeAction, PracticeState } from './types';

interface PracticeSubmitModalProps {
  state: PracticeState;
  dispatch: Dispatch<PracticeAction>;
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
          <div className="mb-4 rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-4">
            <span className="block text-xs font-black tracking-wide text-amber-900 uppercase">
              ⚑ {t.modalReviewFlagged} ({flaggedIndices.length}):
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {flaggedIndices.map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleJumpToQuestion(idx)}
                  className="flex min-h-[42px] min-w-[48px] cursor-pointer touch-manipulation items-center justify-center rounded-xl border-2 border-amber-300 bg-white px-3.5 py-1.5 text-xs font-black text-amber-950 shadow-2xs transition hover:bg-amber-100 active:scale-95 sm:text-sm"
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
              className="flex min-h-[52px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-2xl border-2 border-blue-200 bg-blue-50/95 px-5 py-3 text-center text-xs leading-snug font-extrabold text-blue-950 shadow-xs transition hover:bg-blue-100 active:scale-98 sm:text-sm"
            >
              <span>↷</span>
              <span>
                {t.modalReviewSkipped} ({unansweredCount})
              </span>
            </button>
          </div>
        )}

        {/* Keep Practicing / View Results action buttons — large touch targets and multiline vertical text support */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'CLOSE_SUBMIT_MODAL' })}
            className="flex min-h-[54px] w-full cursor-pointer touch-manipulation items-center justify-center rounded-2xl border-2 border-stone-300 bg-white px-4 py-3 text-center text-xs leading-snug font-extrabold text-slate-800 shadow-xs transition hover:bg-stone-100 active:scale-95 sm:min-h-[58px] sm:text-sm"
          >
            {t.modalContinue}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'FINISH_EXAM' })}
            className="flex min-h-[54px] w-full cursor-pointer touch-manipulation items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-center text-xs leading-snug font-black text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg active:scale-95 sm:min-h-[58px] sm:text-sm"
          >
            {t.modalConfirmSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}
