import type { PastResult, SavedSession } from './types';
import { STORAGE_KEY_HISTORY, STORAGE_KEY_SESSION } from './constants';

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
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearSessionFromStorage(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_SESSION);
  } catch {
    // ignore
  }
}

export function saveHistoryToStorage(history: PastResult[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch {
    // ignore
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
