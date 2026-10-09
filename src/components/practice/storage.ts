import type { PastResult, SavedSession } from './types';
import { STORAGE_KEY_HISTORY, STORAGE_KEY_SESSION } from './constants';
import { enqueueOfflineAction, isOnline } from '../../lib/pwa';
import {
  getSafeItem,
  setSafeItem,
  removeSafeItem,
} from '../../lib/study-progress';

export function loadHistoryFromStorage(): PastResult[] {
  try {
    const saved = getSafeItem(STORAGE_KEY_HISTORY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed as PastResult[];
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function loadSessionFromStorage(): SavedSession | null {
  try {
    const saved = getSafeItem(STORAGE_KEY_SESSION);
    if (saved) {
      const parsed = JSON.parse(saved) as SavedSession;
      if (
        parsed &&
        Array.isArray(parsed.sessionQuestions) &&
        parsed.sessionQuestions.length > 0
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveSessionToStorage(session: SavedSession): void {
  try {
    const serialized = JSON.stringify(session);
    setSafeItem(STORAGE_KEY_SESSION, serialized);
    if (!isOnline()) {
      enqueueOfflineAction('SAVE_SESSION', serialized);
    }
  } catch {
    if (!isOnline()) {
      enqueueOfflineAction('SAVE_SESSION');
    }
  }
}

export function clearSessionFromStorage(): void {
  try {
    removeSafeItem(STORAGE_KEY_SESSION);
    if (!isOnline()) {
      enqueueOfflineAction('CLEAR_SESSION');
    }
  } catch {
    if (!isOnline()) {
      enqueueOfflineAction('CLEAR_SESSION');
    }
  }
}

export function saveHistoryToStorage(history: PastResult[]): void {
  try {
    const serialized = JSON.stringify(history);
    setSafeItem(STORAGE_KEY_HISTORY, serialized);
    if (!isOnline()) {
      enqueueOfflineAction('SAVE_HISTORY', serialized);
    }
  } catch {
    if (!isOnline()) {
      enqueueOfflineAction('SAVE_HISTORY');
    }
  }
}

export function clearHistoryFromStorage(): void {
  try {
    removeSafeItem(STORAGE_KEY_HISTORY);
  } catch {
    // ignore
  }
}
