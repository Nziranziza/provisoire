import type { Lang, QuestionPayload } from '../lib/quiz';

const UI_COPY: Record<
  Lang,
  {
    correct: string;
    incorrect: string;
    correctAnswer: string;
  }
> = {
  en: {
    correct: 'Correct!',
    incorrect: 'Not correct',
    correctAnswer: 'Correct answer:',
  },
  fr: {
    correct: 'Correct !',
    incorrect: 'Incorrect',
    correctAnswer: 'Bonne réponse :',
  },
  rw: {
    correct: 'Nibyo!',
    incorrect: 'Sibyo',
    correctAnswer: 'Igisubizo cy’ukuri:',
  },
};

const LEFT_BORDER = {
  default: ['border-l-amber-400'],
  correct: ['border-l-emerald-600'],
  incorrect: ['border-l-red-600'],
};

const OPTION_RESULT = {
  correct: ['border-emerald-600', 'bg-emerald-50'],
  incorrect: ['border-red-600', 'bg-red-50'],
};

const MARKER_RESULT = {
  correct: ['bg-emerald-600', 'border-emerald-600', 'text-white'],
  incorrect: ['bg-red-600', 'border-red-600', 'text-white'],
};

const RESULT_CARD = {
  correct: {
    card: ['border-emerald-600', 'bg-emerald-50'],
    status: ['text-emerald-700'],
    icon: ['bg-emerald-600'],
    iconText: '✓',
  },
  incorrect: {
    card: ['border-red-600', 'bg-red-50'],
    status: ['text-red-700'],
    icon: ['bg-red-600'],
    iconText: '✗',
  },
};

function uiCopy(lang: string) {
  return UI_COPY[(lang as Lang) in UI_COPY ? (lang as Lang) : 'en'];
}

function initQuiz(root: HTMLElement) {
  const items = Array.from(
    root.querySelectorAll<HTMLElement>('[data-question]'),
  );
  const langButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-lang-btn]'),
  );
  const categorySelect = root.querySelector<HTMLSelectElement>(
    '[data-category-select]',
  );
  const scoreAnswered = root.querySelector('[data-score-answered]');
  const scoreCorrect = root.querySelector('[data-score-correct]');
  const scoreTotal = root.querySelector('[data-score-total]');
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

  let currentLang = root.dataset.lang || 'en';
  let currentPage = 1;
  let filteredItems = items.slice();

  function setSearchError(message: string) {
    if (!searchError) return;
    searchError.textContent = message;
    searchError.classList.toggle('hidden', !message);
  }

  function updateLangButtons() {
    langButtons.forEach((btn) => {
      const active = btn.dataset.langBtn === currentLang;
      btn.classList.toggle('bg-blue-700', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('bg-stone-50', !active);
      btn.classList.toggle('text-slate-900', !active);
    });
  }

  function correctAnswerText(data: QuestionPayload, lang: string) {
    const t = data.t[lang] || data.t.en;
    if (!t) return '';
    return t.correct_answer || t.options[data.correctIndex] || '';
  }

  function updateResultCard(item: HTMLElement, data: QuestionPayload) {
    const card = item.querySelector<HTMLElement>('[data-result-card]');
    if (!card || !item.dataset.state) return;

    const isCorrect = item.dataset.state === 'correct';
    const copy = uiCopy(currentLang);
    const style = isCorrect ? RESULT_CARD.correct : RESULT_CARD.incorrect;
    const letter = String.fromCharCode(65 + data.correctIndex);
    const translation = data.t[currentLang] || data.t.en;
    const answer = correctAnswerText(data, currentLang);

    const statusEl = card.querySelector('[data-result-status]');
    const questionEl = card.querySelector('[data-result-question]');
    const answerLabelEl = card.querySelector('[data-result-answer-label]');
    const answerEl = card.querySelector('[data-result-answer]');
    const iconEl = card.querySelector<HTMLElement>('[data-result-icon]');

    if (statusEl) {
      statusEl.classList.remove(
        ...RESULT_CARD.correct.status,
        ...RESULT_CARD.incorrect.status,
      );
      statusEl.classList.add(...style.status);
      statusEl.textContent = isCorrect ? copy.correct : copy.incorrect;
    }
    if (questionEl) questionEl.textContent = translation?.question || '';
    if (answerLabelEl) answerLabelEl.textContent = `${copy.correctAnswer} `;
    if (answerEl) answerEl.textContent = `${letter}. ${answer}`;
    if (iconEl) {
      iconEl.classList.remove(
        ...RESULT_CARD.correct.icon,
        ...RESULT_CARD.incorrect.icon,
      );
      iconEl.classList.add(...style.icon);
      iconEl.textContent = style.iconText;
    }
  }

  function showResultCard(
    item: HTMLElement,
    data: QuestionPayload,
    isCorrect: boolean,
  ) {
    const card = item.querySelector<HTMLElement>('[data-result-card]');
    if (!card) return;

    card.classList.remove(
      'hidden',
      ...RESULT_CARD.correct.card,
      ...RESULT_CARD.incorrect.card,
    );
    card.classList.add(
      ...(isCorrect ? RESULT_CARD.correct.card : RESULT_CARD.incorrect.card),
    );
    card.hidden = false;
    updateResultCard(item, data);
  }

  function applyLang(lang: string) {
    currentLang = lang;
    root.dataset.lang = lang;
    items.forEach((item) => {
      const data: QuestionPayload = JSON.parse(item.dataset.payload || '{}');
      const t = data.t[lang] || data.t.en;
      if (!t) return;

      const qEl = item.querySelector('[data-question-text]');
      if (qEl) qEl.textContent = t.question;

      const optionEls = Array.from(
        item.querySelectorAll<HTMLElement>('[data-option-text]'),
      );
      optionEls.forEach((el, idx) => {
        if (t.options[idx] !== undefined) el.textContent = t.options[idx];
      });

      updateResultCard(item, data);
    });
    updateLangButtons();
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
    const pageItems = currentPageItems();
    const answeredCount = pageItems.filter((item) => item.dataset.state).length;
    const pageComplete =
      pageItems.length > 0 && answeredCount === pageItems.length;

    if (prevPageButton) prevPageButton.disabled = currentPage === 1;
    if (nextPageButton)
      nextPageButton.disabled = currentPage >= totalPages || !pageComplete;
  }

  function updateScoreboard() {
    const pageItems = currentPageItems();
    const answered = pageItems.filter((item) => item.dataset.state).length;
    const correct = pageItems.filter(
      (item) => item.dataset.state === 'correct',
    ).length;

    if (scoreAnswered) scoreAnswered.textContent = String(answered);
    if (scoreCorrect) scoreCorrect.textContent = String(correct);
    if (scoreTotal) scoreTotal.textContent = String(pageItems.length);
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
    updateScoreboard();
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

  langButtons.forEach((btn) => {
    btn.addEventListener('click', () =>
      applyLang(btn.dataset.langBtn as string),
    );
  });

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

  items.forEach((item) => {
    const data: QuestionPayload = JSON.parse(item.dataset.payload || '{}');
    const optionButtons = Array.from(
      item.querySelectorAll<HTMLButtonElement>('.quiz-option'),
    );

    optionButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        if (item.dataset.state) return;

        const isCorrect = idx === data.correctIndex;
        item.dataset.state = isCorrect ? 'correct' : 'incorrect';

        item.classList.remove(...LEFT_BORDER.default);
        item.classList.add(
          ...(isCorrect ? LEFT_BORDER.correct : LEFT_BORDER.incorrect),
        );

        optionButtons.forEach((b, i) => {
          b.disabled = true;
          const marker = b.querySelector<HTMLElement>('.quiz-option-marker');

          if (i === data.correctIndex) {
            b.classList.add(...OPTION_RESULT.correct);
            marker?.classList.add(...MARKER_RESULT.correct);
          } else if (i === idx) {
            b.classList.add(...OPTION_RESULT.incorrect);
            marker?.classList.add(...MARKER_RESULT.incorrect);
          }
        });

        showResultCard(item, data, isCorrect);
        updateScoreboard();
        updateNavigationState();
      });
    });
  });

  renderPage();
  updateLangButtons();
}

export function initAllQuizzes() {
  document.querySelectorAll<HTMLElement>('.quiz').forEach(initQuiz);
}
