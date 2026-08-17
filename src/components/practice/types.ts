import type { Lang, QuestionTranslation } from '../../lib/quiz';

export interface PracticeSessionProps {
  lang?: Lang;
  imageBase?: string;
  initialCategory?: number | null;
}

export interface SessionQuestion {
  id: string;
  bankIndex: number;
  sessionNumber: number;
  category_id: number;
  category_name: string;
  image_url: string | null;
  correct_index: number;
  translations: Record<string, QuestionTranslation>;
}

export type ExamStage = 'intro' | 'in_progress' | 'review_all';
export type ExamMode = 'practice' | 'mock_exam';
export type ReviewFilter = 'all' | 'incorrect' | 'correct' | 'flagged';

export interface PastResult {
  id: string;
  date: string;
  score: number;
  total: number;
  passed: boolean;
  timeSpentSeconds: number;
  mode: ExamMode;
  categoryName?: string;
}

export interface SavedSession {
  sessionQuestions: SessionQuestion[];
  currentIndex: number;
  answers: Record<number, number>;
  flagged: Record<number, boolean>;
  timeRemaining: number;
  timeSpent: number;
  mode: ExamMode;
  stage: ExamStage;
  selectedCategory: number | null;
  locale?: Lang;
  savedAt: number;
}

export interface PracticeState {
  stage: ExamStage;
  mode: ExamMode;
  selectedCategory: number | null; // null = all categories (balanced)
  sessionQuestions: SessionQuestion[];
  currentIndex: number;
  answers: Record<number, number>;
  flagged: Record<number, boolean>;
  timeRemaining: number;
  timeSpent: number;
  isPaused: boolean;
  showSubmitModal: boolean;
  reviewFilter: ReviewFilter;
  currentLocale: Lang;
  hasSavedSession: boolean;
  history: PastResult[];
  isHydrated: boolean;
}

export type PracticeAction =
  | {
      type: 'INIT_STORAGE';
      payload: {
        history: PastResult[];
        savedSession: SavedSession | null;
        urlCategory?: number | null;
        detectedLocale?: Lang;
      };
    }
  | {
      type: 'START_EXAM';
      payload: {
        questions: SessionQuestion[];
        mode: ExamMode;
        selectedCategory: number | null;
      };
    }
  | { type: 'RESUME_SESSION' }
  | { type: 'DISCARD_SAVED_SESSION' }
  | {
      type: 'SELECT_ANSWER';
      payload: { questionIndex: number; optionIndex: number };
    }
  | { type: 'TOGGLE_FLAG'; payload: { questionIndex: number } }
  | { type: 'SET_CURRENT_INDEX'; payload: { index: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'TICK_TIMER' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_PAUSE'; payload: { isPaused: boolean } }
  | { type: 'OPEN_SUBMIT_MODAL' }
  | { type: 'CLOSE_SUBMIT_MODAL' }
  | { type: 'FINISH_EXAM'; payload?: { dateFormatted?: string } }
  | { type: 'RETAKE_MISSED' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SKIP_QUESTION' }
  | { type: 'JUMP_TO_NEXT_UNANSWERED' }
  | { type: 'JUMP_TO_NEXT_FLAGGED' }
  | { type: 'SET_REVIEW_FILTER'; payload: { filter: ReviewFilter } }
  | { type: 'SET_LOCALE'; payload: { locale: Lang } }
  | { type: 'SET_MODE'; payload: { mode: ExamMode } }
  | { type: 'SET_CATEGORY'; payload: { categoryId: number | null } };
