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
    root.querySelector('[data-question-count]')?.textContent || '0',
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

  // Redirect legacy ?page=N URLs to crawlable /page/N paths.
  const params = new URL(window.location.href).searchParams;
  const legacyPage = Number.parseInt(params.get('page') || '', 10);
  if (Number.isFinite(legacyPage) && legacyPage > 1) {
    const target =
      legacyPage <= 1
        ? `/${lang}/questions`
        : `/${lang}/questions/page/${legacyPage}`;
    window.location.replace(target);
    return;
  }

  categorySelect?.addEventListener('change', () => {
    const value = categorySelect.value;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('[data-question]'),
    );
    items.forEach((item) => {
      const match = value === 'all' || item.dataset.categoryId === value;
      item.classList.toggle('hidden', !match);
    });
  });

  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    goToQuestionNumber(searchInput?.value || '');
  });
}

export function initAllQuizzes() {
  document.querySelectorAll<HTMLElement>('.quiz').forEach(initQuiz);
}
