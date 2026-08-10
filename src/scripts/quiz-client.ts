import type { Lang, QuestionPayload } from "../lib/quiz";
import { ANSWER_LABEL } from "../lib/quiz";

function initQuiz(root: HTMLElement) {
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-question]"));
  const langButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-lang-btn]"));
  const categorySelect = root.querySelector<HTMLSelectElement>("[data-category-select]");
  const pageCurrentEls = Array.from(
    root.querySelectorAll<HTMLElement>("[data-page-current], [data-page-current-bottom]"),
  );
  const pageTotalEls = Array.from(
    root.querySelectorAll<HTMLElement>("[data-page-total], [data-page-total-bottom]"),
  );
  const questionCountEl = root.querySelector("[data-question-count]");
  const prevPageButton = root.querySelector<HTMLButtonElement>("[data-page-prev]");
  const nextPageButton = root.querySelector<HTMLButtonElement>("[data-page-next]");
  const searchForm = root.querySelector<HTMLFormElement>("[data-question-search]");
  const searchInput = root.querySelector<HTMLInputElement>("[data-question-search-input]");
  const searchError = root.querySelector<HTMLElement>("[data-question-search-error]");
  const pageSize = Number(root.dataset.pageSize || "20");

  let currentLang = root.dataset.lang || "en";
  let currentPage = 1;
  let filteredItems = items.slice();

  function setSearchError(message: string) {
    if (!searchError) return;
    searchError.textContent = message;
    searchError.classList.toggle("hidden", !message);
  }

  function updateLangButtons() {
    langButtons.forEach((btn) => {
      const active = btn.dataset.langBtn === currentLang;
      btn.classList.toggle("bg-blue-700", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("bg-stone-50", !active);
      btn.classList.toggle("text-slate-900", !active);
    });
  }

  function applyLang(lang: string) {
    currentLang = lang;
    root.dataset.lang = lang;
    const label = ANSWER_LABEL[(lang as Lang) in ANSWER_LABEL ? (lang as Lang) : "en"];

    items.forEach((item) => {
      const data: QuestionPayload = JSON.parse(item.dataset.payload || "{}");
      const t = data.t[lang] || data.t.en;
      if (!t) return;

      const qEl = item.querySelector("[data-question-text]");
      if (qEl) qEl.textContent = t.question;

      const titleEl = item.querySelector("[data-answer-card-title]");
      if (titleEl) titleEl.textContent = t.question;

      const optionEls = Array.from(item.querySelectorAll<HTMLElement>("[data-option-text]"));
      optionEls.forEach((el, idx) => {
        if (t.options[idx] !== undefined) el.textContent = t.options[idx];
      });

      const answerLabelEl = item.querySelector("[data-answer-label]");
      const answerTextEl = item.querySelector("[data-answer-text]");
      const answer = t.correct_answer || t.options[data.correctIndex] || "";
      const letter = String.fromCharCode(65 + data.correctIndex);

      if (answerLabelEl) answerLabelEl.textContent = label;
      if (answerTextEl) answerTextEl.textContent = `${letter}. ${answer}`;
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
    if (prevPageButton) prevPageButton.disabled = currentPage === 1;
    if (nextPageButton) nextPageButton.disabled = currentPage >= totalPages;
  }

  function renderPage() {
    const pageItems = currentPageItems();
    items.forEach((item) => {
      item.classList.toggle("hidden", !pageItems.includes(item));
    });

    const pageLabel = String(currentPage);
    const totalLabel = String(pageCount());
    pageCurrentEls.forEach((el) => {
      el.textContent = pageLabel;
    });
    pageTotalEls.forEach((el) => {
      el.textContent = totalLabel;
    });
    if (questionCountEl) questionCountEl.textContent = String(filteredItems.length);
    updateNavigationState();
  }

  function applyCategoryFilter(value: string) {
    filteredItems = items.filter(
      (item) => value === "all" || item.dataset.categoryId === value,
    );
    currentPage = 1;
    setSearchError("");
    renderPage();
  }

  function goToQuestionNumber(rawValue: string) {
    const number = Number.parseInt(rawValue.trim(), 10);
    if (!Number.isFinite(number) || number < 1) {
      setSearchError("Enter a valid question number.");
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

    setSearchError("");
    currentPage = Math.floor(filteredIndex / pageSize) + 1;
    renderPage();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("ring-2", "ring-blue-700", "ring-offset-2");
    window.setTimeout(() => {
      target.classList.remove("ring-2", "ring-blue-700", "ring-offset-2");
    }, 1600);
  }

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.langBtn as string));
  });

  categorySelect?.addEventListener("change", () => {
    applyCategoryFilter(categorySelect.value);
  });

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    goToQuestionNumber(searchInput?.value || "");
  });

  prevPageButton?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderPage();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  nextPageButton?.addEventListener("click", () => {
    const totalPages = pageCount();
    if (currentPage < totalPages) {
      currentPage += 1;
      renderPage();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  renderPage();
  updateLangButtons();
}

export function initAllQuizzes() {
  document.querySelectorAll<HTMLElement>(".quiz").forEach(initQuiz);
}
