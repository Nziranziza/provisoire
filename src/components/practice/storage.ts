import type { PastResult, SavedSession } from './types';
import { STORAGE_KEY_HISTORY, STORAGE_KEY_SESSION } from './constants';
import { enqueueOfflineAction, isOnline } from '../../lib/pwa';

export function loadHistoryFromStorage(): PastResult[] {
  try {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
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
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEY_SESSION);
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
    if (typeof window === 'undefined') return;
    const serialized = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY_SESSION, serialized);
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
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_SESSION);
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
    if (typeof window === 'undefined') return;
    const serialized = JSON.stringify(history);
    localStorage.setItem(STORAGE_KEY_HISTORY, serialized);
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
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch {
    // ignore
  }
}
