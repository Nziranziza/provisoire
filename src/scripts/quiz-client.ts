import type { Lang } from '../lib/quiz';
import { questionHref } from '../lib/quiz';
import type {
  ClientTokenIndex,
  SearchPayload,
  SearchResult,
} from '../lib/search';

const tokenIndexCache: Record<string, ClientTokenIndex> = {};
const pendingFetches: Record<string, Promise<ClientTokenIndex | null>> = {};

let searchModulePromise: Promise<typeof import('../lib/search')> | null = null;

/**
 * Dynamically loads the search engine module only when the user opens search.
 * This keeps the initial page bundle minimal for Core Web Vitals.
 */
function getSearchModule(): Promise<typeof import('../lib/search')> {
  if (!searchModulePromise) {
    searchModulePromise = import('../lib/search');
  }
  return searchModulePromise;
}

const copy = {
  en: {
    resultsCount: (count: number) =>
      `${count} ${count === 1 ? 'question' : 'questions'} found`,
    jumpToQuestion: (n: number) => `Jump to Question #${n}`,
    noResults: (q: string) => `No questions found matching "${q}"`,
    noResultsHint:
      'Try searching by traffic rules, road signs, option text, or a question number.',
    optionLabel: 'Option',
    explanationLabel: 'Explanation',
    correctAnswerLabel: 'Correct',
    questionNotFound: (n: number) => `Question ${n} was not found.`,
    enterValidNumber: 'Enter a valid question number.',
    indexUnavailable:
      'Search is temporarily unavailable. Try again or jump to a question number.',
  },
  fr: {
    resultsCount: (count: number) =>
      `${count} ${count === 1 ? 'question trouvée' : 'questions trouvées'}`,
    jumpToQuestion: (n: number) => `Aller à la question n° ${n}`,
    noResults: (q: string) => `Aucune question trouvée pour « ${q} »`,
    noResultsHint:
      'Essayez de chercher par règles de circulation, panneaux, choix ou numéro de question.',
    optionLabel: 'Option',
    explanationLabel: 'Explication',
    correctAnswerLabel: 'Bonne réponse',
    questionNotFound: (n: number) => `La question ${n} n’a pas été trouvée.`,
    enterValidNumber: 'Entrez un numéro de question valide.',
    indexUnavailable:
      'La recherche est indisponible. Réessayez ou entrez un numéro de question.',
  },
  rw: {
    resultsCount: (count: number) => `Ibibazo ${count} byabonetse`,
    jumpToQuestion: (n: number) => `Jya ku kibazo cya #${n}`,
    noResults: (q: string) => `Nta bibazo bibonetse bihuye na « ${q} »`,
    noResultsHint:
      'Gerageza gushakisha amategeko, ibyapa, amahitamo cyangwa nimero y’ikibazo.',
    optionLabel: 'Ihitamo',
    explanationLabel: 'Ibisobanuro',
    correctAnswerLabel: 'Igisubizo cy’ukuri',
    questionNotFound: (n: number) => `Ikibazo ${n} nticyabonetse.`,
    enterValidNumber: 'Andika nimero nyayo y’ikibazo.',
    indexUnavailable:
      'Gushakisha ntibiboneka. Ongera ugerageze cyangwa andika nimero y’ikibazo.',
  },
};

const SEARCH_INDEX_VERSION = '3';

function isSearchPayload(
  value: unknown,
  lang: Lang,
): value is SearchPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as SearchPayload;
  return (
    payload.lang === lang &&
    Array.isArray(payload.items) &&
    payload.items.length > 0 &&
    typeof payload.items[0]?.q === 'string'
  );
}

/**
 * Lazily loads the pre-rendered search index for the active locale.
 * Prefers /q-index/{lang} (outside locale folders) so the default EN
 * prefix cannot intercept or cache an empty payload.
 */
async function fetchTokenIndex(lang: Lang): Promise<ClientTokenIndex | null> {
  if (tokenIndexCache[lang]?.items.length) {
    return tokenIndexCache[lang]!;
  }

  if (pendingFetches[lang]) {
    return pendingFetches[lang]!;
  }

  const fetchPromise = (async () => {
    const searchLib = await getSearchModule();
    const urls = [
      `/q-index/${lang}?v=${SEARCH_INDEX_VERSION}`,
      `/${lang}/search-index.json?v=${SEARCH_INDEX_VERSION}`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) continue;
        const payload: unknown = await response.json();
        if (!isSearchPayload(payload, lang)) continue;
        const clientIndex = searchLib.createClientTokenIndex(payload);
        if (!clientIndex.items.length) continue;
        tokenIndexCache[lang] = clientIndex;
        return clientIndex;
      } catch {
        // Try the next URL
      }
    }

    return null;
  })().finally(() => {
    delete pendingFetches[lang];
  });

  pendingFetches[lang] = fetchPromise;
  return fetchPromise;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getWordStems(token: string): string[] {
  if (!token) return [];
  const clean = token.toLowerCase().trim();
  if (clean.length < 3) return [clean];

  const stems = new Set<string>([clean]);
  if (clean.endsWith('ies') && clean.length > 4) stems.add(clean.slice(0, -3) + 'y');
  if (clean.endsWith('es') && clean.length > 4) {
    stems.add(clean.slice(0, -2));
    stems.add(clean.slice(0, -1));
  }
  if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 3) stems.add(clean.slice(0, -1));
  if (clean.endsWith('ing') && clean.length > 5) {
    stems.add(clean.slice(0, -3));
    stems.add(clean.slice(0, -3) + 'e');
  }
  if (clean.endsWith('ed') && clean.length > 4) {
    stems.add(clean.slice(0, -2));
    stems.add(clean.slice(0, -1));
  }
  if (clean.endsWith('aux') && clean.length > 4) {
    stems.add(clean.slice(0, -3) + 'al');
    stems.add(clean.slice(0, -1));
  }
  if (clean.endsWith('x') && clean.length > 3) stems.add(clean.slice(0, -1));
  if (clean.length >= 3 && !clean.endsWith('s')) {
    stems.add(clean + 's');
    stems.add(clean + 'es');
  }
  return Array.from(stems);
}

function highlightSnippet(text: string, rawQuery: string): string {
  if (!text || !rawQuery.trim()) return escapeHtml(text || '');

  const rawTokens = rawQuery
    .trim()
    .split(/\s+/)
    .map((t) => t.trim().replace(/[’‘`´]/g, "'"))
    .filter((t) => t.length > 0);

  if (rawTokens.length === 0) return escapeHtml(text);

  const escapedText = escapeHtml(text);

  // Generate tokens including stripped apostrophe forms and stems
  const allTokens: string[] = [];
  for (const t of rawTokens) {
    allTokens.push(escapeHtml(t));
    const noApos = escapeHtml(t.replace(/'/g, ''));
    if (noApos && noApos !== t) allTokens.push(noApos);
    const stems = getWordStems(t.toLowerCase());
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

function initQuiz(root: HTMLElement) {
  if (root.dataset.quizInitialized === 'true') return;
  root.dataset.quizInitialized = 'true';

  const categorySelect = root.querySelector<HTMLSelectElement>(
    '[data-category-select]',
  );
  const searchForm = root.querySelector<HTMLFormElement>(
    '[data-question-search]',
  );
  const searchInput = root.querySelector<HTMLInputElement>(
    '[data-question-search-input]',
  );
  const searchClear = root.querySelector<HTMLButtonElement>(
    '[data-question-search-clear]',
  );
  const searchLoading = root.querySelector<HTMLElement>(
    '[data-question-search-loading]',
  );
  const searchResults = root.querySelector<HTMLElement>(
    '[data-question-search-results]',
  );
  const searchError = root.querySelector<HTMLElement>(
    '[data-question-search-error]',
  );

  const lang = (root.dataset.lang as Lang) || 'en';
  const i18n = copy[lang] || copy.en;

  const totalQuestions = Number(
    root.dataset.bankTotal ||
      root.querySelector('[data-question-count]')?.textContent ||
      '0',
  );

  let currentResults: SearchResult[] = [];
  let selectedIndex = -1;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let searchRequestId = 0;

  function setSearchError(message: string) {
    if (!searchError) return;
    searchError.textContent = message;
    searchError.classList.toggle('hidden', !message);
  }

  function setLoading(loading: boolean) {
    if (!searchLoading) return;
    searchLoading.classList.toggle('hidden', !loading);
  }

  function toggleClearButton(show: boolean) {
    if (!searchClear) return;
    searchClear.classList.toggle('hidden', !show);
  }

  function openResults() {
    if (!searchResults) return;
    searchResults.classList.remove('hidden');
    searchInput?.setAttribute('aria-expanded', 'true');
  }

  function closeResults() {
    if (!searchResults) return;
    searchResults.classList.add('hidden');
    searchInput?.setAttribute('aria-expanded', 'false');
    searchInput?.removeAttribute('aria-activedescendant');
    selectedIndex = -1;
  }

  function goToQuestionNumber(rawValue: string) {
    const number = Number.parseInt(rawValue.trim(), 10);
    if (!Number.isFinite(number) || number < 1) {
      setSearchError(i18n.enterValidNumber);
      return;
    }
    if (totalQuestions > 0 && number > totalQuestions) {
      setSearchError(i18n.questionNotFound(number));
      return;
    }

    setSearchError('');
    closeResults();
    window.location.href = questionHref(lang, number);
  }

  function updateSelectedOption() {
    if (!searchResults) return;
    const items = searchResults.querySelectorAll<HTMLElement>(
      '[data-search-result-item]',
    );
    items.forEach((item, idx) => {
      const isSelected = idx === selectedIndex;
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      item.classList.toggle('bg-blue-50', isSelected);
      item.classList.toggle('border-blue-500', isSelected);
      if (isSelected) {
        searchInput?.setAttribute('aria-activedescendant', item.id);
        item.scrollIntoView({ block: 'nearest' });
      }
    });
    if (selectedIndex === -1) {
      searchInput?.removeAttribute('aria-activedescendant');
    }
  }

  function renderResults(query: string, results: SearchResult[]) {
    if (!searchResults) return;

    if (!query.trim()) {
      closeResults();
      return;
    }

    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="p-5 text-center">
          <p class="text-sm font-semibold text-slate-800">${escapeHtml(
            i18n.noResults(query),
          )}</p>
          <p class="mt-1 text-xs text-slate-500">${escapeHtml(
            i18n.noResultsHint,
          )}</p>
        </div>
      `;
      openResults();
      return;
    }

    const itemsHtml = results
      .map((res, idx) => {
        const href = questionHref(lang, res.n);
        const isRoadSigns = res.categoryId === 2;

        // Context match badges
        const optionMatches = res.matches.filter((m) => m.field === 'option');
        const explanationMatch = res.matches.find(
          (m) => m.field === 'explanation',
        );
        const answerMatch = res.matches.find((m) => m.field === 'answer');
        const optionTexts = new Set(
          optionMatches.map((m) => m.matchedText.trim().toLowerCase()),
        );

        let contextHtml = '';
        if (optionMatches.length > 0) {
          const opt = optionMatches[0]!;
          const letter = String.fromCharCode(65 + (opt.optionIndex ?? 0));
          contextHtml += `
            <div class="mt-1.5 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50/60 px-2 py-1 text-xs text-slate-700">
              <span class="font-bold text-amber-900">${i18n.optionLabel} ${letter}:</span>
              <span class="line-clamp-2">${highlightSnippet(
                opt.snippet,
                query,
              )}</span>
            </div>
          `;
        }

        if (explanationMatch && explanationMatch.snippet) {
          contextHtml += `
            <div class="mt-1.5 flex items-start gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/60 px-2 py-1 text-xs text-slate-700">
              <span class="font-bold text-emerald-900">${i18n.explanationLabel}:</span>
              <span class="line-clamp-2">${highlightSnippet(
                explanationMatch.snippet,
                query,
              )}</span>
            </div>
          `;
        }

        if (
          answerMatch &&
          answerMatch.snippet &&
          !optionTexts.has(answerMatch.matchedText.trim().toLowerCase())
        ) {
          contextHtml += `
            <div class="mt-1.5 flex items-start gap-1.5 rounded-md border border-blue-200 bg-blue-50/60 px-2 py-1 text-xs text-slate-700">
              <span class="font-bold text-blue-900">${i18n.correctAnswerLabel}:</span>
              <span class="line-clamp-2">${highlightSnippet(
                answerMatch.snippet,
                query,
              )}</span>
            </div>
          `;
        }

        return `
          <a
            href="${href}"
            id="search-result-${idx}"
            class="group block border-b border-stone-200 p-3.5 text-left transition hover:bg-stone-50"
            data-search-result-item
            data-index="${idx}"
            role="option"
            aria-selected="false"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <span class="font-mono text-slate-900">#${String(
                  res.n,
                ).padStart(2, '0')}</span>
              </span>
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase ${
                  isRoadSigns ? 'bg-sky-700' : 'bg-amber-700'
                }"
              >
                ${escapeHtml(res.categoryName)}
              </span>
            </div>
            <p class="mt-1.5 text-sm font-semibold text-slate-900 group-hover:text-blue-700">
              ${highlightSnippet(res.question, query)}
            </p>
            ${contextHtml}
          </a>
        `;
      })
      .join('');

    searchResults.innerHTML = `
      <div class="border-b border-stone-200 bg-stone-50 px-3.5 py-2 text-[11px] font-bold tracking-wide text-slate-500 uppercase flex items-center justify-between">
        <span>${i18n.resultsCount(results.length)}</span>
        <span class="text-[10px] text-slate-400 hidden sm:inline">↑↓ to navigate · Enter to view</span>
      </div>
      <div class="max-h-80 overflow-y-auto">
        ${itemsHtml}
      </div>
    `;

    openResults();
  }

  async function handleSearch(query: string) {
    const trimmed = query.trim();
    toggleClearButton(trimmed.length > 0);

    if (!trimmed) {
      closeResults();
      setSearchError('');
      return;
    }

    const requestId = ++searchRequestId;
    setLoading(true);
    try {
      const [tokenIndex, searchLib] = await Promise.all([
        fetchTokenIndex(lang),
        getSearchModule(),
      ]);
      if (requestId !== searchRequestId) return;

      setLoading(false);

      if (!tokenIndex) {
        if (/^\d+$/.test(trimmed)) {
          goToQuestionNumber(trimmed);
          return;
        }
        setSearchError(i18n.indexUnavailable);
        renderResults(trimmed, []);
        return;
      }

      setSearchError('');
      currentResults = searchLib.searchTokenIndex(tokenIndex, trimmed, 8);
      selectedIndex = -1;
      renderResults(trimmed, currentResults);
    } catch {
      if (requestId !== searchRequestId) return;
      setLoading(false);
      setSearchError(i18n.indexUnavailable);
      renderResults(trimmed, []);
    }
  }

  // Lazy-load search index & module when user opens or interacts with search
  function triggerLazyLoad() {
    fetchTokenIndex(lang);
  }

  searchInput?.addEventListener('focus', () => {
    triggerLazyLoad();
    if (searchInput.value.trim() && currentResults.length > 0) {
      openResults();
    }
  });

  searchInput?.addEventListener('pointerdown', triggerLazyLoad, { once: true });

  searchInput?.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const query = searchInput.value;
    debounceTimer = setTimeout(() => {
      handleSearch(query);
    }, 40);
  });

  searchClear?.addEventListener('click', () => {
    if (!searchInput) return;
    searchInput.value = '';
    toggleClearButton(false);
    closeResults();
    setSearchError('');
    searchInput.focus();
  });

  // Direct click handling on search results dropdown
  searchResults?.addEventListener('click', (event) => {
    const item = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      '[data-search-result-item]',
    );
    if (item && item.href) {
      closeResults();
      window.location.href = item.href;
    }
  });

  searchInput?.addEventListener('keydown', (event) => {
    if (searchResults && !searchResults.classList.contains('hidden')) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
        updateSelectedOption();
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelectedOption();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeResults();
        return;
      }
      if (event.key === 'Enter') {
        if (selectedIndex >= 0 && currentResults[selectedIndex]) {
          event.preventDefault();
          const target = currentResults[selectedIndex]!;
          window.location.href = questionHref(lang, target.n);
          return;
        }
      }
    }

    if (event.key === 'Enter') {
      const rawValue = searchInput.value.trim();
      const numMatch = rawValue.match(/^(?:#|q|question\s*)?(\d+)$/i);
      if (numMatch) {
        event.preventDefault();
        goToQuestionNumber(numMatch[1]!);
      } else if (currentResults.length > 0) {
        event.preventDefault();
        const topResult = currentResults[0]!;
        window.location.href = questionHref(lang, topResult.n);
      }
    }
  });

  // Close search results when clicking outside
  document.addEventListener('click', (event) => {
    if (!searchForm?.contains(event.target as Node)) {
      closeResults();
    }
  });

  // Quick keyboard shortcut: Press '/' to focus search input and lazy load index
  document.addEventListener('keydown', (event) => {
    if (
      event.key === '/' &&
      document.activeElement !== searchInput &&
      !['INPUT', 'TEXTAREA', 'SELECT'].includes(
        document.activeElement?.tagName || '',
      )
    ) {
      event.preventDefault();
      triggerLazyLoad();
      searchInput?.focus();
      searchInput?.select();
    }
  });

  const path = window.location.pathname;

  // /questions/page/1 is not a real route; page 1 is /questions.
  if (/^\/(en|fr|rw)\/questions\/page\/1\/?$/.test(path)) {
    window.location.replace(`/${lang}/questions`);
    return;
  }

  // Old: /questions/category/slug[/page/N] → /questions/page/N/category/slug
  const legacyCategory = path.match(
    /^\/(en|fr|rw)\/questions\/category\/([^/]+)(?:\/page\/(\d+))?\/?$/,
  );
  if (legacyCategory) {
    const slug = legacyCategory[2];
    const page = legacyCategory[3] || '1';
    window.location.replace(`/${lang}/questions/page/${page}/category/${slug}`);
    return;
  }

  // Legacy ?page=N on the all-questions list.
  const params = new URL(window.location.href).searchParams;
  const legacyPage = Number.parseInt(params.get('page') || '', 10);
  if (
    Number.isFinite(legacyPage) &&
    legacyPage > 1 &&
    /^\/(en|fr|rw)\/questions\/?$/.test(path)
  ) {
    window.location.replace(`/${lang}/questions/page/${legacyPage}`);
    return;
  }

  categorySelect?.addEventListener('change', () => {
    const href = categorySelect.selectedOptions[0]?.dataset.href;
    if (href) {
      window.location.assign(href);
    }
  });

  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    triggerLazyLoad();
    const rawValue = searchInput?.value || '';
    const numMatch = rawValue.trim().match(/^(?:#|q|question\s*)?(\d+)$/i);
    if (numMatch) {
      goToQuestionNumber(numMatch[1]!);
    } else if (currentResults.length > 0) {
      const topResult = currentResults[0]!;
      window.location.href = questionHref(lang, topResult.n);
    } else {
      handleSearch(rawValue);
    }
  });
}

export function initAllQuizzes() {
  document.querySelectorAll<HTMLElement>('.quiz').forEach(initQuiz);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllQuizzes);
  } else {
    initAllQuizzes();
  }
}
