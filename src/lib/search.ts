import type { Lang } from './quiz';

export type MatchField =
  | 'number'
  | 'question'
  | 'option'
  | 'explanation'
  | 'answer'
  | 'category';

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
  /** Correct answer text for active locale (omitted if empty) */
  a?: string;
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
  answer: string;
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
 * Generates stem and morphological variants for a normalized token (English, French, Kinyarwanda).
 * Enables queries like "borders" to match "border" and vice-versa.
 */
export function getWordStems(token: string): string[] {
  if (!token) return [];
  const clean = token.toLowerCase().trim();
  if (clean.length < 3) return [clean];

  const stems = new Set<string>([clean]);

  // English & French plural/ending rules
  if (clean.endsWith('ies') && clean.length > 4) {
    stems.add(clean.slice(0, -3) + 'y');
  }
  if (clean.endsWith('es') && clean.length > 4) {
    stems.add(clean.slice(0, -2));
    stems.add(clean.slice(0, -1)); // e.g. devices -> device
  }
  if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 3) {
    stems.add(clean.slice(0, -1)); // e.g. borders -> border, reflectors -> reflector
  }
  if (clean.endsWith('ing') && clean.length > 5) {
    stems.add(clean.slice(0, -3)); // crossing -> cross, parking -> park
    stems.add(clean.slice(0, -3) + 'e'); // overtaking -> overtake
  }
  if (clean.endsWith('ed') && clean.length > 4) {
    stems.add(clean.slice(0, -2)); // parked -> park
    stems.add(clean.slice(0, -1)); // signaled -> signal, placed -> place
  }
  if (clean.endsWith('aux') && clean.length > 4) {
    stems.add(clean.slice(0, -3) + 'al'); // signaux -> signal
    stems.add(clean.slice(0, -1)); // panneaux -> panneau
  }
  if (clean.endsWith('x') && clean.length > 3) {
    stems.add(clean.slice(0, -1)); // feux -> feu
  }

  // Allow singular forms to match plural forms as well
  if (clean.length >= 3 && !clean.endsWith('s')) {
    stems.add(clean + 's');
    stems.add(clean + 'es');
  }

  return Array.from(stems);
}

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
 * space-separated tokens, and word stems for complete query coverage.
 */
export function generateSearchVariants(text: string): string {
  if (!text) return '';
  const norm = normalizeForSearch(text);
  const noApos = norm.replace(/'/g, '');
  const spaceApos = norm.replace(/'/g, ' ');

  const tokens = norm.split(/\s+/).filter(Boolean);
  const allStems = new Set<string>();
  for (const t of tokens) {
    for (const s of getWordStems(t)) {
      allStems.add(s);
    }
  }

  return `${norm} ${noApos} ${spaceApos} ${Array.from(allStems).join(' ')}`.trim();
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
  normalizedAnswer: string;
  answerVariants: string;
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

    const normAns = item.a ? normalizeForSearch(item.a) : '';
    const ansVariants = item.a ? generateSearchVariants(item.a) : '';

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
      normalizedAnswer: normAns,
      answerVariants: ansVariants,
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
 * Whole-token test against a normalized haystack (space-padded).
 */
function containsToken(haystack: string, token: string): boolean {
  if (!haystack || !token) return false;
  return ` ${haystack} `.includes(` ${token} `);
}

/**
 * Hand-rolled client-side token search matcher.
 * STRICTLY searches active locale content (question text, options, explanations, correct answer, category).
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
  const allQueryStems = Array.from(
    new Set(queryTokens.flatMap((t) => getWordStems(t))),
  );
  const meaningfulTokens = allQueryStems.filter(
    (t) => t.replace(/'/g, '').length >= 3,
  );
  const scoreTokens =
    meaningfulTokens.length >= 1 ? meaningfulTokens : queryTokens;

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
    if (indexed.normalizedQuestion === normalizedQuery) {
      score += 50000;
      matches.push({
        field: 'question',
        snippet: extractSnippet(item.q, allQueryStems),
        matchedText: item.q,
      });
    } else if (
      indexed.normalizedQuestion.includes(normalizedQuery) ||
      indexed.questionVariants.includes(normalizedQuery)
    ) {
      score += 5000;
      if (indexed.normalizedQuestion.startsWith(normalizedQuery)) {
        score += 600;
      }
      matches.push({
        field: 'question',
        snippet: extractSnippet(item.q, allQueryStems),
        matchedText: item.q,
      });
    } else {
      let qTokenMatches = 0;
      for (const token of scoreTokens) {
        if (
          indexed.questionTokens.has(token) ||
          containsToken(indexed.normalizedQuestion, token) ||
          indexed.questionVariants.includes(token)
        ) {
          qTokenMatches++;
          if (indexed.questionTokens.has(token)) {
            score += 40; // Exact word boost
          }
        }
      }
      if (qTokenMatches > 0) {
        score += qTokenMatches * 50;
        if (qTokenMatches >= scoreTokens.length) {
          score += 200; // Full query token coverage
        }
        matches.push({
          field: 'question',
          snippet: extractSnippet(item.q, allQueryStems),
          matchedText: item.q,
        });
      }
    }

    // 3. Options Matching — best single option only (prevents score stacking)
    let bestOptionMatch: SearchMatch | null = null;
    let bestOptionScore = 0;

    (item.o || []).forEach((option, idx) => {
      const optVariants =
        indexed.optionsVariants[idx] ?? generateSearchVariants(option);
      const normOpt = indexed.normalizedOptions[idx] ?? normalizeForSearch(option);
      let optScore = 0;

      if (normOpt === normalizedQuery) {
        optScore = 8000;
      } else if (
        normOpt.includes(normalizedQuery) ||
        optVariants.includes(normalizedQuery)
      ) {
        optScore = 4000;
      } else {
        let optTokenMatches = 0;
        for (const token of scoreTokens) {
          if (optVariants.includes(token)) {
            optTokenMatches++;
          }
        }
        if (optTokenMatches > 0) {
          optScore = optTokenMatches * 40;
          if (optTokenMatches >= scoreTokens.length) {
            optScore += 100;
          }
        }
      }

      if (optScore > bestOptionScore) {
        bestOptionScore = optScore;
        bestOptionMatch = {
          field: 'option',
          optionIndex: idx,
          snippet: extractSnippet(option, allQueryStems),
          matchedText: option,
        };
      }
    });

    if (bestOptionMatch && bestOptionScore > 0) {
      score += bestOptionScore;
      matches.push(bestOptionMatch);
    }

    // 4. Explanation Matching (Active Locale Only)
    if (item.e && indexed.explanationVariants) {
      if (
        indexed.normalizedExplanation.includes(normalizedQuery) ||
        indexed.explanationVariants.includes(normalizedQuery)
      ) {
        score += 350;
        matches.push({
          field: 'explanation',
          snippet: extractSnippet(item.e, allQueryStems),
          matchedText: item.e,
        });
      } else {
        let expTokenMatches = 0;
        for (const token of scoreTokens) {
          if (indexed.explanationVariants.includes(token)) {
            expTokenMatches++;
          }
        }
        if (expTokenMatches > 0) {
          score += expTokenMatches * 30;
          if (expTokenMatches >= scoreTokens.length) {
            score += 80;
          }
          matches.push({
            field: 'explanation',
            snippet: extractSnippet(item.e, allQueryStems),
            matchedText: item.e,
          });
        }
      }
    }

    // 5. Correct Answer Matching (Active Locale Only)
    if (item.a && indexed.answerVariants) {
      if (
        indexed.normalizedAnswer.includes(normalizedQuery) ||
        indexed.answerVariants.includes(normalizedQuery)
      ) {
        score += 300;
        matches.push({
          field: 'answer',
          snippet: extractSnippet(item.a, allQueryStems),
          matchedText: item.a,
        });
      } else {
        let ansTokenMatches = 0;
        for (const token of scoreTokens) {
          if (indexed.answerVariants.includes(token)) {
            ansTokenMatches++;
          }
        }
        if (ansTokenMatches > 0) {
          score += ansTokenMatches * 25;
          if (ansTokenMatches >= scoreTokens.length) {
            score += 60;
          }
          matches.push({
            field: 'answer',
            snippet: extractSnippet(item.a, allQueryStems),
            matchedText: item.a,
          });
        }
      }
    }

    // 6. Category Name Matching (Active Locale Only)
    if (indexed.normalizedCategory.includes(normalizedQuery)) {
      score += 40;
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
        answer: item.a ?? '',
        score,
        matches,
      });
    }
  }

  if (results.length === 0 && directNumber === null) {
    for (const indexed of tokenIndex.items) {
      const item = indexed.raw;
      const haystack = [
        indexed.normalizedQuestion,
        ...(indexed.normalizedOptions || []),
        indexed.normalizedExplanation,
        indexed.normalizedAnswer,
        indexed.normalizedCategory,
      ]
        .filter(Boolean)
        .join(' ');

      if (!haystack.includes(normalizedQuery)) {
        const anyToken = scoreTokens.some((token) => containsToken(haystack, token));
        if (!anyToken) continue;
      }

      results.push({
        n: item.n,
        categoryId: item.c,
        categoryName: indexed.categoryName,
        question: item.q,
        options: item.o || [],
        explanation: item.e ?? '',
        answer: item.a ?? '',
        score: haystack.includes(normalizedQuery) ? 800 : 120,
        matches: [
          {
            field: 'question',
            snippet: extractSnippet(item.q, allQueryStems),
            matchedText: item.q,
          },
        ],
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

  // Generate tokens including stripped apostrophe forms and word stems
  const allTokens: string[] = [];
  for (const t of rawTokens) {
    allTokens.push(escapeHtml(t));
    const noApos = escapeHtml(t.replace(/'/g, ''));
    if (noApos && noApos !== t) allTokens.push(noApos);
    const stems = getWordStems(normalizeForSearch(t));
    for (const s of stems) {
      if (s.length >= 3) allTokens.push(escapeHtml(s));
    }
  }

  const escapedRegexTokens = Array.from(new Set(allTokens))
    .sort((a, b) => b.length - a.length)
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
