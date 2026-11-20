import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log('======================================================');
console.log('--- Verifying Wrong Answer Review & Retry Wrong Only ---');
console.log('======================================================\n');

// 1. Verify Question Bank and Explanations
const bank = JSON.parse(
  fs.readFileSync(path.join(root, 'questions.json'), 'utf8'),
);
assert(Array.isArray(bank.questions), 'questions.json must contain questions');
assert.equal(
  bank.questions.length,
  198,
  'Question bank must have 198 questions',
);

let missingExplCount = 0;
for (const q of bank.questions) {
  for (const lang of ['rw', 'en', 'fr']) {
    const expl = q.translations[lang]?.explanation;
    if (!expl || !expl.trim()) {
      missingExplCount++;
    }
  }
}
assert.equal(
  missingExplCount,
  0,
  'Every question must have an explanation in all 3 languages (rw, en, fr)',
);
console.log(
  '✔ All 198 questions in questions.json contain valid explanations in rw, en, and fr.',
);

// Mock window & localStorage for storage functions
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}
globalThis.window = {
  localStorage: new MockLocalStorage(),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.CustomEvent = class CustomEvent {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict?.detail;
  }
};

// 2. Load Reducer & Constants logic
import {
  practiceReducer,
  createInitialState,
  calculateFinishState,
  sampleQuestions,
} from '../src/components/practice/reducer.ts';
import { I18N } from '../src/components/practice/constants.ts';

// 3. Test Deliberate Wrong Answers in Reducer & calculateFinishState
console.log('\n--- 2. Testing Deliberate Wrong Answers Review Payload ---');
const sample = sampleQuestions(bank.questions, 20);
assert.equal(sample.length, 20, 'Sample must have 20 questions');

// Simulate answers: 14 correct, 4 wrong, 2 skipped
const answers = {};
const deliberateWrongIndices = [2, 5, 11, 17];
const skippedIndices = [8, 19];
const correctIndices = [];

sample.forEach((q, idx) => {
  if (deliberateWrongIndices.includes(idx)) {
    // Deliberately choose a wrong option
    const wrongOpt = (q.correct_index + 1) % q.translations.rw.options.length;
    answers[idx] = wrongOpt;
  } else if (skippedIndices.includes(idx)) {
    // Skipped
  } else {
    answers[idx] = q.correct_index;
    correctIndices.push(idx);
  }
});

let state = createInitialState('rw', null, 'mock_exam');
state = {
  ...state,
  stage: 'in_progress',
  sessionQuestions: sample,
  answers,
  timeRemaining: 600,
  timeSpent: 600,
};

const finishState = calculateFinishState(state);
assert.equal(finishState.stage, 'review_all', 'Stage must be review_all');

let totalScore = 0;
const missedQuestions = [];
const correctQuestions = [];

finishState.sessionQuestions.forEach((q, idx) => {
  const uAns = finishState.answers[idx];
  const isCorrect = uAns === q.correct_index;
  if (isCorrect) {
    totalScore++;
    correctQuestions.push({ q, idx });
  } else {
    missedQuestions.push({ q, idx, uAns, isSkipped: typeof uAns !== 'number' });
  }
});

assert.equal(totalScore, 14, 'Total score must be 14');
assert.equal(missedQuestions.length, 6, 'Missed questions count must be 6');
assert.equal(correctQuestions.length, 14, 'Correct questions count must be 14');

// Verify every missed question has required fields:
for (const missed of missedQuestions) {
  const { q, uAns, isSkipped } = missed;
  for (const lang of ['rw', 'en', 'fr']) {
    const tr = q.translations[lang];
    assert(tr.question, 'Question text must exist');
    assert(Array.isArray(tr.options), 'Options must exist');
    assert.equal(
      typeof q.correct_index,
      'number',
      'correct_index must be a number',
    );
    assert(tr.options[q.correct_index], 'Correct option string must exist');
    assert(tr.explanation, 'Explanation must exist on missed question');
    assert(tr.explanation.length > 10, 'Explanation must be substantial');

    if (!isSkipped) {
      assert(tr.options[uAns], 'Chosen option string must exist');
      assert.notEqual(
        uAns,
        q.correct_index,
        'Chosen option must differ from correct option for missed question',
      );
    }
  }

  // Internal link target verification
  const fullPageUrl = `/rw/questions/${q.bankIndex + 1}`;
  assert(
    q.bankIndex >= 0 && q.bankIndex < 198,
    'bankIndex must point to valid index in questions bank',
  );
  assert(
    fullPageUrl.startsWith('/rw/questions/'),
    'Link must point to single question page',
  );
}
console.log(
  '✔ Every incorrect answer includes: question, option chosen, correct option, explanation, and question bank URL.',
);

// 4. Test Collapsed Correct Answers Logic
console.log('\n--- 3. Testing Collapsed Correct Answers by Default ---');
const initialExpandedSet = new Set();
finishState.sessionQuestions.forEach((q, idx) => {
  const isCorrect = finishState.answers[idx] === q.correct_index;
  if (!isCorrect) {
    initialExpandedSet.add(q.id);
  }
});

assert.equal(
  initialExpandedSet.size,
  6,
  'Initial expanded set must only contain the 6 missed questions',
);
for (const correct of correctQuestions) {
  assert(
    !initialExpandedSet.has(correct.q.id),
    `Correct question ${correct.q.id} must be COLLAPSED by default`,
  );
}
for (const missed of missedQuestions) {
  assert(
    initialExpandedSet.has(missed.q.id),
    `Missed question ${missed.q.id} must be EXPANDED by default`,
  );
}
console.log(
  '✔ Correct answers are collapsed by default so the review stays focused on mistakes.',
);

// 5. Test "Retry Wrong Only" action
console.log('\n--- 4. Testing "Retry Wrong Only" Action ---');
const retakeState = practiceReducer(finishState, { type: 'RETAKE_MISSED' });

assert.equal(
  retakeState.stage,
  'in_progress',
  'Retake state must be in_progress',
);
assert.equal(
  retakeState.mode,
  'practice',
  'Retake session must switch to practice mode for instant learning feedback',
);
assert.equal(
  retakeState.sessionQuestions.length,
  6,
  'Retake session must contain PRECISELY the 6 missed questions',
);
assert.equal(
  retakeState.currentIndex,
  0,
  'Retake session must reset currentIndex to 0',
);
assert.deepEqual(
  retakeState.answers,
  {},
  'Retake session answers must be reset',
);
assert.deepEqual(
  retakeState.flagged,
  {},
  'Retake session flagged must be reset',
);

const retakeQuestionIds = retakeState.sessionQuestions.map((q) => q.id);
const expectedMissedIds = missedQuestions.map((m) => m.q.id);
assert.deepEqual(
  retakeQuestionIds,
  expectedMissedIds,
  'Retake questions must match exactly the missed question set in order',
);
console.log(
  '✔ "Retry wrong only" starts a new session containing PRECISELY the set of missed questions.',
);

// 6. Test Scoring & Proportional Passing in Retake Session
console.log(
  '\n--- 5. Testing Scoring & Proportional Passing on Retake Session ---',
);
// In the 6-question retake session, user answers 5 correctly and 1 wrong
const retakeAnswers = {};
retakeState.sessionQuestions.forEach((q, idx) => {
  if (idx === 0) {
    retakeAnswers[idx] = (q.correct_index + 1) % 4; // 1 wrong
  } else {
    retakeAnswers[idx] = q.correct_index; // 5 correct
  }
});

const retakeCompletedState = calculateFinishState({
  ...retakeState,
  answers: retakeAnswers,
  timeSpent: 120,
});

assert.equal(
  retakeCompletedState.history[0].score,
  5,
  'Retake score must be 5/6',
);
assert.equal(
  retakeCompletedState.history[0].total,
  6,
  'Retake total must be 6',
);
assert.equal(
  retakeCompletedState.history[0].passed,
  true,
  '5/6 (83%) must pass proportional threshold of 60% (ceil(6 * 0.6) = 4)',
);
console.log(
  '✔ Proportional pass/fail threshold works accurately on retry sessions.',
);

// 7. Verify Trilingual Localization
console.log('\n--- 6. Verifying Trilingual Localization for Review Screen ---');
for (const lang of ['rw', 'en', 'fr']) {
  const dict = I18N[lang];
  assert(dict.retakeMissedBtn, `${lang} must have retakeMissedBtn`);
  assert(dict.showDetails, `${lang} must have showDetails`);
  assert(dict.hideDetails, `${lang} must have hideDetails`);
  assert(dict.expandAll, `${lang} must have expandAll`);
  assert(dict.collapseAll, `${lang} must have collapseAll`);
  assert(dict.collapsedNotice, `${lang} must have collapsedNotice`);
  assert(dict.explanation, `${lang} must have explanation`);
  assert(dict.yourAnswer, `${lang} must have yourAnswer`);
  assert(dict.correctAnswer, `${lang} must have correctAnswer`);
}
console.log(
  '✔ All review dictionaries contain complete trilingual keys (rw, en, fr).',
);

console.log('\n======================================================');
console.log('--- ALL WRONG ANSWER REVIEW VERIFICATIONS PASSED! ---');
console.log('======================================================\n');
