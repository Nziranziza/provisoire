import type { Lang, Question } from './quiz';
import {
  questionExplanation,
  questionNumber,
  questionOptions,
  questionText,
} from './quiz';

export type MatchField =
  'number' | 'question' | 'option' | 'explanation' | 'category';

/**
 * Compact payload entry strictly scoped to the active locale.
 */
export type SearchEntryPayload = {
  /** 1-based question number */
  n: number;
  /** Category ID (1 = Traffic Rules, 2 = Road Signs) */
  c: number;
  /** Question text for active locale */
  q: string;
  /** Options array for active locale */
  o: string[];
  /** Optional explanation for active locale (omitted if empty) */
  e?: string;
};

/**
 * Compact build-time JSON payload schema for a single locale.
 */
export type SearchPayload = {
  lang: Lang;
  total: number;
  items: SearchEntryPayload[];
};

export type SearchMatch = {
  field: MatchField;
  optionIndex?: number;
  snippet: string;
  matchedText: string;
};

export type SearchResult = {
  n: number;
  categoryId: number;
  categoryName: string;
  question: string;
  options: string[];
  explanation: string;
  score: number;
  matches: SearchMatch[];
};

export const CATEGORY_NAMES: Record<number, Record<Lang, string>> = {
  1: {
    en: 'Traffic Rules',
    fr: 'Règles de circulation',
    rw: 'Amategeko y’umuhanda',
  },
  2: {
    en: 'Road Signs',
    fr: 'Panneaux de signalisation',
    rw: 'Ibyapa byo ku muhanda',
  },
};

/**
 * Normalizes text for case-insensitive, accent-tolerant, apostrophe-flexible,
 * and punctuation-agnostic matching within the active locale.
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[’‘`´]/g, "'") // normalize apostrophe forms
    .replace(/[^\w\s\d']/g, ' ') // retain letters, digits, spaces, apostrophe
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Produces search variations combining original tokens, apostrophe-stripped tokens,
 * and space-separated tokens for complete query coverage.
 */
export function generateSearchVariants(text: string): string {
  if (!text) return '';
  const norm = normalizeForSearch(text);
  const noApos = norm.replace(/'/g, '');
  const spaceApos = norm.replace(/'/g, ' ');
  return `${norm} ${noApos} ${spaceApos}`.trim();
}

/**
 * Builds the compact, minimal payload JSON for a specific locale at build time.
 * Strictly includes content for the requested locale ONLY.
 */
export function buildSearchPayload(
  questions: Question[],
  lang: Lang,
): SearchPayload {
  const items: SearchEntryPayload[] = questions.map((q, index) => {
    const n = questionNumber(index);
    const qText = questionText(q, lang);
    const options = questionOptions(q, lang);
    const explanation = questionExplanation(q, lang);

    const entry: SearchEntryPayload = {
      n,
      c: q.category_id,
      q: qText,
      o: options,
    };

    if (explanation && explanation.trim().length > 0) {
      entry.e = explanation.trim();
    }

    return entry;
  });

  return {
    lang,
    total: items.length,
    items,
  };
}

/**
 * Pre-indexed item in client memory for instant querying over the active locale.
 */
export type IndexedItem = {
  raw: SearchEntryPayload;
  categoryName: string;
  normalizedQuestion: string;
  questionVariants: string;
  normalizedOptions: string[];
  optionsVariants: string[];
  normalizedExplanation: string;
  explanationVariants: string;
  normalizedCategory: string;
  questionTokens: Set<string>;
};

export type ClientTokenIndex = {
  lang: Lang;
  items: IndexedItem[];
};

/**
 * Ingests the active locale wire payload and builds a fast in-memory token index on the client.
 */
export function createClientTokenIndex(
  payload: SearchPayload,
): ClientTokenIndex {
  const lang = payload.lang || 'en';
  const items: IndexedItem[] = (payload.items || []).map((item) => {
    const catName =
      CATEGORY_NAMES[item.c]?.[lang] ??
      (item.c === 2 ? 'Road Signs' : 'Traffic Rules');

    const normQ = normalizeForSearch(item.q || '');
    const qVariants = generateSearchVariants(item.q || '');

    const normOpts = (item.o || []).map((opt) => normalizeForSearch(opt || ''));
    const optsVariants = (item.o || []).map((opt) =>
      generateSearchVariants(opt || ''),
    );

    const normExpl = item.e ? normalizeForSearch(item.e) : '';
    const explVariants = item.e ? generateSearchVariants(item.e) : '';

    const normCat = generateSearchVariants(catName);

    const questionTokens = new Set(
      qVariants.split(/\s+/).filter((t) => t.length > 1),
    );

    return {
      raw: item,
      categoryName: catName,
      normalizedQuestion: normQ,
      questionVariants: qVariants,
      normalizedOptions: normOpts,
      optionsVariants: optsVariants,
      normalizedExplanation: normExpl,
      explanationVariants: explVariants,
      normalizedCategory: normCat,
      questionTokens,
    };
  });

  return {
    lang,
    items,
  };
}

/**
 * Extracts a concise excerpt around the matched search terms.
 */
export function extractSnippet(
  text: string,
  normalizedQueryTokens: string[],
  maxLength = 110,
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text.trim();

  const normalizedText = normalizeForSearch(text);
  let firstMatchIdx = -1;

  for (const token of normalizedQueryTokens) {
    if (!token) continue;
    const cleanToken = token.replace(/'/g, '');
    const idx = normalizedText.indexOf(cleanToken);
    if (idx !== -1 && (firstMatchIdx === -1 || idx < firstMatchIdx)) {
      firstMatchIdx = idx;
    }
  }

  if (firstMatchIdx === -1) {
    return text.slice(0, maxLength).trim() + '…';
  }

  const start = Math.max(0, firstMatchIdx - Math.floor(maxLength / 3));
  const end = Math.min(text.length, start + maxLength);
  let snippet = text.slice(start, end).trim();

  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';

  return snippet;
}

/**
 * Hand-rolled client-side token search matcher.
 * STRICTLY searches active locale content (question text, options, explanations, category).
 * Queries containing words from a different locale will return NO results.
 */
export function searchTokenIndex(
  tokenIndex: ClientTokenIndex,
  rawQuery: string,
  limit = 8,
): SearchResult[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  const queryVariants = generateSearchVariants(query);
  const queryTokens = Array.from(
    new Set(queryVariants.split(/\s+/).filter((t) => t.length > 0)),
  );

  // Check if query is directly pointing to a question number (e.g. "42", "#42", "q42", "question 42")
  const directNumberMatch = query.match(
    /^(?:#|q|question\s*|ikibazo\s*)?(\d+)$/i,
  );
  const directNumber = directNumberMatch
    ? Number.parseInt(directNumberMatch[1]!, 10)
    : null;

  const results: SearchResult[] = [];

  for (const indexed of tokenIndex.items) {
    const item = indexed.raw;
    let score = 0;
    const matches: SearchMatch[] = [];

    // 1. Direct Question Number Match (Score 10000)
    if (directNumber !== null && item.n === directNumber) {
      score += 10000;
      matches.push({
        field: 'number',
        snippet: `Question #${item.n}`,
        matchedText: String(item.n),
      });
    } else if (
      directNumber !== null &&
      String(item.n).startsWith(String(directNumber))
    ) {
      score += 200;
    }

    // 2. Question Text Matching (Active Locale Only)
    if (indexed.questionVariants.includes(normalizedQuery)) {
      score += 400;
      if (indexed.normalizedQuestion.startsWith(normalizedQuery)) {
        score += 150;
      }
      matches.push({
        field: 'question',
        snippet: extractSnippet(item.q, queryTokens),
        matchedText: item.q,
      });
    } else {
      let qTokenMatches = 0;
      for (const token of queryTokens) {
        if (indexed.questionVariants.includes(token)) {
          qTokenMatches++;
          if (indexed.questionTokens.has(token)) {
            score += 25; // Exact word boost
          }
        }
      }
      if (qTokenMatches > 0) {
        score += qTokenMatches * 40;
        if (qTokenMatches >= queryTokens.length) {
          score += 120; // Full query token coverage
        }
        matches.push({
          field: 'question',
          snippet: extractSnippet(item.q, queryTokens),
          matchedText: item.q,
        });
      }
    }

    // 3. Options Matching (Active Locale Only)
    item.o.forEach((option, idx) => {
      const optVariants =
        indexed.optionsVariants[idx] ?? generateSearchVariants(option);
      if (optVariants.includes(normalizedQuery)) {
        score += 220;
        matches.push({
          field: 'option',
          optionIndex: idx,
          snippet: extractSnippet(option, queryTokens),
          matchedText: option,
        });
      } else {
        let optTokenMatches = 0;
        for (const token of queryTokens) {
          if (optVariants.includes(token)) {
            optTokenMatches++;
          }
        }
        if (optTokenMatches > 0) {
          score += optTokenMatches * 25;
          if (optTokenMatches >= queryTokens.length) {
            score += 60;
          }
          matches.push({
            field: 'option',
            optionIndex: idx,
            snippet: extractSnippet(option, queryTokens),
            matchedText: option,
          });
        }
      }
    });

    // 4. Explanation Matching (Active Locale Only)
    if (item.e && indexed.explanationVariants) {
      if (indexed.explanationVariants.includes(normalizedQuery)) {
        score += 250;
        matches.push({
          field: 'explanation',
          snippet: extractSnippet(item.e, queryTokens),
          matchedText: item.e,
        });
      } else {
        let expTokenMatches = 0;
        for (const token of queryTokens) {
          if (indexed.explanationVariants.includes(token)) {
            expTokenMatches++;
          }
        }
        if (expTokenMatches > 0) {
          score += expTokenMatches * 25;
          if (expTokenMatches >= queryTokens.length) {
            score += 70;
          }
          matches.push({
            field: 'explanation',
            snippet: extractSnippet(item.e, queryTokens),
            matchedText: item.e,
          });
        }
      }
    }

    // 5. Category Name Matching (Active Locale Only)
    if (indexed.normalizedCategory.includes(normalizedQuery)) {
      score += 35;
      matches.push({
        field: 'category',
        snippet: indexed.categoryName,
        matchedText: indexed.categoryName,
      });
    }

    if (score > 0 && matches.length > 0) {
      results.push({
        n: item.n,
        categoryId: item.c,
        categoryName: indexed.categoryName,
        question: item.q,
        options: item.o,
        explanation: item.e ?? '',
        score,
        matches,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || a.n - b.n).slice(0, limit);
}

/**
 * Escapes HTML characters to prevent XSS during highlight rendering.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Highlights matched terms inside a text snippet with accessible mark tags.
 */
export function highlightSnippet(text: string, rawQuery: string): string {
  if (!text || !rawQuery.trim()) return escapeHtml(text);

  const rawTokens = rawQuery
    .trim()
    .split(/\s+/)
    .map((t) => t.trim().replace(/[’‘`´]/g, "'"))
    .filter((t) => t.length > 0);

  if (rawTokens.length === 0) return escapeHtml(text);

  const escapedText = escapeHtml(text);

  // Generate tokens including stripped apostrophe forms
  const allTokens: string[] = [];
  for (const t of rawTokens) {
    allTokens.push(escapeHtml(t));
    const noApos = escapeHtml(t.replace(/'/g, ''));
    if (noApos && noApos !== t) allTokens.push(noApos);
  }

  const escapedRegexTokens = Array.from(new Set(allTokens))
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(Boolean);

  try {
    const regex = new RegExp(`(${escapedRegexTokens.join('|')})`, 'gi');
    return escapedText.replace(
      regex,
      '<mark class="bg-amber-200 text-slate-950 font-semibold px-0.5 rounded">$1</mark>',
    );
  } catch {
    return escapedText;
  }
}
