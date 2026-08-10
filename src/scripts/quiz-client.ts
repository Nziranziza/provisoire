function initQuiz(root: HTMLElement) {
  const items = Array.from(
    root.querySelectorAll<HTMLElement>('[data-question]'),
  );
  const categorySelect = root.querySelector<HTMLSelectElement>(
    '[data-category-select]',
  );
  const pageCurrentEls = Array.from(
    root.querySelectorAll<HTMLElement>(
      '[data-page-current], [data-page-current-bottom]',
    ),
  );
  const pageTotalEls = Array.from(
    root.querySelectorAll<HTMLElement>(
      '[data-page-total], [data-page-total-bottom]',
    ),
  );
  const questionCountEl = root.querySelector('[data-question-count]');
  const prevPageButton =
    root.querySelector<HTMLButtonElement>('[data-page-prev]');
  const nextPageButton =
    root.querySelector<HTMLButtonElement>('[data-page-next]');
  const searchForm = root.querySelector<HTMLFormElement>(
    '[data-question-search]',
  );
  const searchInput = root.querySelector<HTMLInputElement>(
    '[data-question-search-input]',
  );
  const searchError = root.querySelector<HTMLElement>(
    '[data-question-search-error]',
  );
  const pageSize = Number(root.dataset.pageSize || '20');

  let currentPage = 1;
  let filteredItems = items.slice();

  function setSearchError(message: string) {
    if (!searchError) return;
    searchError.textContent = message;
    searchError.classList.toggle('hidden', !message);
  }

  function pageCount() {
    return Math.max(1, Math.ceil(filteredItems.length / pageSize));
  }

  function currentPageItems() {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }

  function updateNavigationState() {
    const totalPages = pageCount();
    if (prevPageButton) prevPageButton.disabled = currentPage === 1;
    if (nextPageButton) nextPageButton.disabled = currentPage >= totalPages;
  }

  function renderPage() {
    const pageItems = currentPageItems();
    items.forEach((item) => {
      item.classList.toggle('hidden', !pageItems.includes(item));
    });

    const pageLabel = String(currentPage);
    const totalLabel = String(pageCount());
    pageCurrentEls.forEach((el) => {
      el.textContent = pageLabel;
    });
    pageTotalEls.forEach((el) => {
      el.textContent = totalLabel;
    });
    if (questionCountEl)
      questionCountEl.textContent = String(filteredItems.length);
    updateNavigationState();
  }

  function applyCategoryFilter(value: string) {
    filteredItems = items.filter(
      (item) => value === 'all' || item.dataset.categoryId === value,
    );
    currentPage = 1;
    setSearchError('');
    renderPage();
  }

  function goToQuestionNumber(rawValue: string) {
    const number = Number.parseInt(rawValue.trim(), 10);
    if (!Number.isFinite(number) || number < 1) {
      setSearchError('Enter a valid question number.');
      return;
    }

    const target = items.find(
      (item) => Number(item.dataset.questionIndex) + 1 === number,
    );
    if (!target) {
      setSearchError(`Question ${number} was not found.`);
      return;
    }

    const filteredIndex = filteredItems.indexOf(target);
    if (filteredIndex === -1) {
      setSearchError(`Question ${number} is not in this category.`);
      return;
    }

    setSearchError('');
    currentPage = Math.floor(filteredIndex / pageSize) + 1;
    renderPage();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('ring-2', 'ring-blue-700', 'ring-offset-2');
    window.setTimeout(() => {
      target.classList.remove('ring-2', 'ring-blue-700', 'ring-offset-2');
    }, 1600);
  }

  categorySelect?.addEventListener('change', () => {
    applyCategoryFilter(categorySelect.value);
  });

  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    goToQuestionNumber(searchInput?.value || '');
  });

  prevPageButton?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderPage();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  nextPageButton?.addEventListener('click', () => {
    const totalPages = pageCount();
    if (currentPage < totalPages) {
      currentPage += 1;
      renderPage();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  renderPage();
}

export function initAllQuizzes() {
  document.querySelectorAll<HTMLElement>('.quiz').forEach(initQuiz);
}
