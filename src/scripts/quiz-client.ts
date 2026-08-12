function initQuiz(root: HTMLElement) {
  const categorySelect = root.querySelector<HTMLSelectElement>(
    '[data-category-select]',
  );
  const searchForm = root.querySelector<HTMLFormElement>(
    '[data-question-search]',
  );
  const searchInput = root.querySelector<HTMLInputElement>(
    '[data-question-search-input]',
  );
  const searchError = root.querySelector<HTMLElement>(
    '[data-question-search-error]',
  );
  const lang = root.dataset.lang || 'en';
  const totalQuestions = Number(
    root.dataset.bankTotal ||
      root.querySelector('[data-question-count]')?.textContent ||
      '0',
  );

  function setSearchError(message: string) {
    if (!searchError) return;
    searchError.textContent = message;
    searchError.classList.toggle('hidden', !message);
  }

  function goToQuestionNumber(rawValue: string) {
    const number = Number.parseInt(rawValue.trim(), 10);
    if (!Number.isFinite(number) || number < 1) {
      setSearchError('Enter a valid question number.');
      return;
    }
    if (totalQuestions > 0 && number > totalQuestions) {
      setSearchError(`Question ${number} was not found.`);
      return;
    }

    setSearchError('');
    window.location.href = `/${lang}/questions/${number}`;
  }

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
    goToQuestionNumber(searchInput?.value || '');
  });
}

export function initAllQuizzes() {
  document.querySelectorAll<HTMLElement>('.quiz').forEach(initQuiz);
}
