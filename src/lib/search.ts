import type { Lang } from './quiz';

export type MatchField =
  'number' | 'question' | 'option' | 'explanation' | 'answer' | 'category';

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
 * Characteristic keywords, function words, and particles unique to specific locales.
 * Used to immediately detect and prevent cross-locale queries from producing false positives.
 */
export const LOCALE_SIGNATURE_WORDS: Record<Lang, Set<string>> = {
  en: new Set([
    'the',
    'and',
    'must',
    'should',
    'would',
    'could',
    'which',
    'what',
    'when',
    'where',
    'their',
    'there',
    'they',
    'this',
    'that',
    'these',
    'those',
    'with',
    'from',
    'have',
    'has',
    'had',
    'been',
    'were',
    'highway',
    'roadway',
    'reflectors',
    'devices',
    'manner',
    'following',
    'answers',
    'traffic',
    'signs',
    'driver',
    'pedestrians',
    'vehicle',
    'vehicles',
    'speed',
    'right',
    'left',
    'yellow',
    'orange',
    'none',
    'correct',
    'rules',
    'allowed',
    'prohibited',
    'overtaking',
    'parking',
    'crossing',
    'intersection',
    'lane',
    'lanes',
    'motorway',
    'public',
  ]),
  fr: new Set([
    'les',
    'des',
    'une',
    'qui',
    'que',
    'dans',
    'pour',
    'avec',
    'sont',
    'cette',
    'ces',
    'aux',
    'sur',
    'par',
    'est',
    'du',
    'au',
    'ne',
    'pas',
    'leur',
    'leurs',
    'voient',
    'peuvent',
    'etre',
    'facon',
    'façon',
    'suivante',
    'laquelle',
    'lesquelles',
    'chaussee',
    'chaussée',
    'panneaux',
    'signalisation',
    'dispositifs',
    'reflechissants',
    'réfléchissants',
    'reponse',
    'réponse',
    'reponses',
    'réponses',
    'aucune',
    'droite',
    'gauche',
    'couleur',
    'rouge',
    'orange',
    'jaune',
    'usagers',
    'places',
    'placés',
    'voie',
    'publique',
    'interdit',
    'autorise',
    'autorisé',
    'conducteur',
    'pietons',
    'piétons',
    'virage',
    'sens',
    'circulation',
    'priorite',
    'priorité',
    'carrefour',
    'ceux',
    'regles',
    'règles',
    'vitesse',
    'depassement',
    'bords',
  ]),
  rw: new Set([
    'cyangwa',
    'nyabagendwa',
    'zishobora',
    'kugaragazwa',
    'ngarurarumuri',
    'bigomba',
    'gushyirwaho',
    'abagenzi',
    'babibona',
    'ikibazo',
    'igisubizo',
    'amategeko',
    'ibyapa',
    'inzira',
    'umuhanda',
    'ibinyabiziga',
    'umuvuduko',
    'gutambuka',
    'amapine',
    'amatara',
    'umupolisi',
    'guhagarara',
    'kwitonda',
    'nta',
    'kimwe',
    'byose',
    'niba',
    'igihe',
    'ahantu',
    'gusa',
    'byemewe',
    'bibujijwe',
    'bifite',
    'uburenganzira',
    'uburyo',
    'iburyo',
    'ibumoso',
    'umutuku',
    'umuhondo',
    'oranje',
    'umukara',
    'icyatsi',
    'icyapa',
    'itegeko',
    'ibimenyetso',
    'z’inzira',
    "z'inzira",
    'z’umuhanda',
    "z'umuhanda",
    "n'ibikoresho",
    'n’ibikoresho',
    "n'abagenzi",
    'n’abagenzi',
    'ahabujijwe',
    'kwerekeza',
    'kurenga',
    'inkombe',
  ]),
};

/**
 * Checks whether a search query contains distinctive markers of a different locale.
 */
export function isQueryForeignToLocale(
  query: string,
  activeLang: Lang,
): boolean {
  if (!query) return false;
  const normalized = normalizeForSearch(query);
  const words = normalized.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return false;

  let activeMatches = 0;
  let maxOtherMatches = 0;

  const activeSet = LOCALE_SIGNATURE_WORDS[activeLang];
  for (const w of words) {
    if (activeSet?.has(w)) activeMatches++;
  }

  for (const [lang, set] of Object.entries(LOCALE_SIGNATURE_WORDS) as [
    Lang,
    Set<string>,
  ][]) {
    if (lang === activeLang) continue;
    let count = 0;
    for (const w of words) {
      if (set.has(w)) count++;
    }
    if (count > maxOtherMatches) {
      maxOtherMatches = count;
    }
  }

  // If query contains strong markers from another locale and none from the active locale
  if (maxOtherMatches >= 1 && activeMatches === 0) {
    return true;
  }

  // If foreign markers heavily outweigh active locale markers
  if (maxOtherMatches >= 2 && maxOtherMatches > activeMatches) {
    return true;
  }

  return false;
}

/**
 * Generates stem and morphological variants for a normalized token scoped to the active locale.
 * Enables queries like "borders" to match "border" and vice-versa.
 */
export function getWordStems(token: string, lang: Lang = 'en'): string[] {
  if (!token) return [];
  const clean = token.toLowerCase().trim();
  if (clean.length < 3) return [clean];

  const stems = new Set<string>([clean]);

  if (lang === 'en') {
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
    if (clean.length >= 3 && !clean.endsWith('s')) {
      stems.add(clean + 's');
      stems.add(clean + 'es');
    }
  } else if (lang === 'fr') {
    if (clean.endsWith('aux') && clean.length > 4) {
      stems.add(clean.slice(0, -3) + 'al'); // signaux -> signal
    }
    if (clean.endsWith('eaux') && clean.length > 5) {
      stems.add(clean.slice(0, -1)); // panneaux -> panneau
    }
    if (clean.endsWith('es') && clean.length > 4) {
      stems.add(clean.slice(0, -1));
      stems.add(clean.slice(0, -2));
    }
    if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 3) {
      stems.add(clean.slice(0, -1)); // bords -> bord, dispositifs -> dispositif
    }
    if (clean.endsWith('x') && clean.length > 3) {
      stems.add(clean.slice(0, -1)); // feux -> feu
    }
    if (clean.length >= 3 && !clean.endsWith('s') && !clean.endsWith('x')) {
      stems.add(clean + 's');
      stems.add(clean + 'x');
      stems.add(clean + 'es');
    }
  } else if (lang === 'rw') {
    const strippedApos = clean.replace(/^[a-z]+'/, '');
    if (strippedApos && strippedApos !== clean && strippedApos.length >= 3) {
      stems.add(strippedApos);
    }
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
export function generateSearchVariants(
  text: string,
  lang: Lang = 'en',
): string {
  if (!text) return '';
  const norm = normalizeForSearch(text);
  const noApos = norm.replace(/'/g, '');
  const spaceApos = norm.replace(/'/g, ' ');

  const tokens = norm.split(/\s+/).filter(Boolean);
  const allStems = new Set<string>();
  for (const t of tokens) {
    for (const s of getWordStems(t, lang)) {
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
  const lang: Lang = payload.lang || 'en';
  const items: IndexedItem[] = (payload.items || []).map((item) => {
    const catName =
      CATEGORY_NAMES[item.c]?.[lang] ??
      (item.c === 2 ? 'Road Signs' : 'Traffic Rules');

    const normQ = normalizeForSearch(item.q || '');
    const qVariants = generateSearchVariants(item.q || '', lang);

    const normOpts = (item.o || []).map((opt) => normalizeForSearch(opt || ''));
    const optsVariants = (item.o || []).map((opt) =>
      generateSearchVariants(opt || '', lang),
    );

    const normExpl = item.e ? normalizeForSearch(item.e) : '';
    const explVariants = item.e ? generateSearchVariants(item.e, lang) : '';

    const normAns = item.a ? normalizeForSearch(item.a) : '';
    const ansVariants = item.a ? generateSearchVariants(item.a, lang) : '';

    const normCat = generateSearchVariants(catName, lang);

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
 * Returns empty array immediately for foreign-language queries or queries that don't match the active locale.
 */
export function searchTokenIndex(
  tokenIndex: ClientTokenIndex,
  rawQuery: string,
  limit = 8,
): SearchResult[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const activeLang: Lang = tokenIndex.lang || 'en';

  // Check if query is directly pointing to a question number (e.g. "42", "#42", "q42", "question 42", "ikibazo 42", "no 42")
  const directNumberMatch = query.match(
    /^(?:#|q|question\s*|ikibazo\s*|n°\s*|no\s*)?(\d+)$/i,
  );
  const directNumber = directNumberMatch
    ? Number.parseInt(directNumberMatch[1]!, 10)
    : null;

  // Strict locale check: If query contains markers from a different locale and is not a number, return [] immediately
  if (directNumber === null && isQueryForeignToLocale(query, activeLang)) {
    return [];
  }

  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  const queryVariants = generateSearchVariants(query, activeLang);
  const queryTokens = Array.from(
    new Set(queryVariants.split(/\s+/).filter((t) => t.length > 0)),
  );
  const allQueryStems = Array.from(
    new Set(queryTokens.flatMap((t) => getWordStems(t, activeLang))),
  );
  const meaningfulTokens = allQueryStems.filter(
    (t) => t.replace(/'/g, '').length >= 3,
  );
  const scoreTokens =
    meaningfulTokens.length >= 1 ? meaningfulTokens : queryTokens;

  // Distinct base search tokens from the user's raw query
  const rawNormalizedTokens = Array.from(
    new Set(
      normalizedQuery
        .split(/\s+/)
        .map((t) => t.replace(/'/g, '').trim())
        .filter((t) => t.length >= 2),
    ),
  );
  const totalQueryTokens = rawNormalizedTokens.length;

  const results: SearchResult[] = [];

  for (const indexed of tokenIndex.items) {
    const item = indexed.raw;
    let score = 0;
    const matches: SearchMatch[] = [];
    const coveredRawTokens = new Set<string>();

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
    const isExactQuestion = indexed.normalizedQuestion === normalizedQuery;
    const isSubQuestion =
      indexed.normalizedQuestion.includes(normalizedQuery) ||
      indexed.questionVariants.includes(normalizedQuery);

    if (isExactQuestion) {
      score += 50000;
      for (const t of rawNormalizedTokens) coveredRawTokens.add(t);
      matches.push({
        field: 'question',
        snippet: extractSnippet(item.q, allQueryStems),
        matchedText: item.q,
      });
    } else if (isSubQuestion && normalizedQuery.length >= 3) {
      score += 5000;
      if (indexed.normalizedQuestion.startsWith(normalizedQuery)) {
        score += 600;
      }
      for (const t of rawNormalizedTokens) coveredRawTokens.add(t);
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
      for (const rawT of rawNormalizedTokens) {
        const stems = getWordStems(rawT, activeLang);
        if (
          stems.some(
            (s) =>
              indexed.questionTokens.has(s) ||
              containsToken(indexed.normalizedQuestion, s) ||
              indexed.questionVariants.includes(s),
          )
        ) {
          coveredRawTokens.add(rawT);
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
        indexed.optionsVariants[idx] ??
        generateSearchVariants(option, activeLang);
      const normOpt =
        indexed.normalizedOptions[idx] ?? normalizeForSearch(option);
      let optScore = 0;

      if (normOpt === normalizedQuery) {
        optScore = 8000;
        for (const t of rawNormalizedTokens) coveredRawTokens.add(t);
      } else if (
        (normOpt.includes(normalizedQuery) ||
          optVariants.includes(normalizedQuery)) &&
        normalizedQuery.length >= 3
      ) {
        optScore = 4000;
        for (const t of rawNormalizedTokens) coveredRawTokens.add(t);
      } else {
        let optTokenMatches = 0;
        for (const token of scoreTokens) {
          if (optVariants.includes(token)) {
            optTokenMatches++;
          }
        }
        for (const rawT of rawNormalizedTokens) {
          const stems = getWordStems(rawT, activeLang);
          if (stems.some((s) => optVariants.includes(s))) {
            coveredRawTokens.add(rawT);
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
        (indexed.normalizedExplanation.includes(normalizedQuery) ||
          indexed.explanationVariants.includes(normalizedQuery)) &&
        normalizedQuery.length >= 3
      ) {
        score += 350;
        for (const t of rawNormalizedTokens) coveredRawTokens.add(t);
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
        for (const rawT of rawNormalizedTokens) {
          const stems = getWordStems(rawT, activeLang);
          if (stems.some((s) => indexed.explanationVariants.includes(s))) {
            coveredRawTokens.add(rawT);
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
        (indexed.normalizedAnswer.includes(normalizedQuery) ||
          indexed.answerVariants.includes(normalizedQuery)) &&
        normalizedQuery.length >= 3
      ) {
        score += 300;
        for (const t of rawNormalizedTokens) coveredRawTokens.add(t);
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
        for (const rawT of rawNormalizedTokens) {
          const stems = getWordStems(rawT, activeLang);
          if (stems.some((s) => indexed.answerVariants.includes(s))) {
            coveredRawTokens.add(rawT);
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
      for (const t of rawNormalizedTokens) coveredRawTokens.add(t);
      matches.push({
        field: 'category',
        snippet: indexed.categoryName,
        matchedText: indexed.categoryName,
      });
    }

    // 7. Token Coverage Validation:
    // For direct number matches, accept immediately.
    // For text queries, ensure a minimum percentage of distinct query tokens are matched.
    if (directNumber === null && totalQueryTokens > 0) {
      const matchCount = coveredRawTokens.size;
      const isSubMatch = isExactQuestion || isSubQuestion;

      if (!isSubMatch) {
        if (totalQueryTokens === 1 && matchCount < 1) continue;
        if (totalQueryTokens === 2 && matchCount < 1) continue;
        if (totalQueryTokens === 3 && matchCount < 2) continue;
        if (
          totalQueryTokens >= 4 &&
          matchCount < Math.ceil(totalQueryTokens * 0.5)
        ) {
          continue;
        }
      }
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
export function highlightSnippet(
  text: string,
  rawQuery: string,
  lang: Lang = 'en',
): string {
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
    const stems = getWordStems(normalizeForSearch(t), lang);
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
