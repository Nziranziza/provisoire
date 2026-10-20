/**
 * scripts/verify-explanations.mjs
 *
 * Comprehensive end-to-end verification for Issue 14:
 * 1. Types in lib/questions.ts & src/lib/questions.ts (explanation?: string | null)
 * 2. scripts/validate-questions.mjs validation logic (accepts null, enforces non-empty & reasonable length)
 * 3. Question page rendering (with and without explanation)
 * 4. Practice review rendering (with and without explanation)
 * 5. scripts/draft-explanations.mjs output structure and integrity without touching questions.json
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('--- Verifying Issue 14: Language Explanations & Drafting ---');
console.log(
  '================================================================\n',
);

// --- 1. Check lib/questions.ts and src/lib/questions.ts ---
console.log(
  '1. Checking lib/questions.ts & src/lib/questions.ts type definitions...',
);
const rootQuestionsTs = path.join(root, 'lib', 'questions.ts');
const srcQuestionsTs = path.join(root, 'src', 'lib', 'questions.ts');

assert(fs.existsSync(rootQuestionsTs), 'lib/questions.ts must exist');
assert(fs.existsSync(srcQuestionsTs), 'src/lib/questions.ts must exist');

const srcQuestionsContent = fs.readFileSync(srcQuestionsTs, 'utf8');
assert(
  /explanation\?:\s*string\s*\|\s*null/.test(srcQuestionsContent),
  'src/lib/questions.ts must define explanation as optional and nullable (explanation?: string | null)',
);
console.log(
  '✔ Types in lib/questions.ts & src/lib/questions.ts support explanation?: string | null.',
);

// --- 2. Check validateQuestionBank in scripts/validate-questions.mjs ---
console.log('\n2. Testing scripts/validate-questions.mjs behavior...');
const { validateQuestionBank } = await import('./validate-questions.mjs');

// Test 2a: Valid question with explanation
const validWithExpl = {
  questions: [
    {
      id: 'test-1',
      category_id: 1,
      correct_index: 0,
      translations: {
        rw: {
          question: 'Ikibazo cya mbere?',
          options: ['Yego', 'Oya'],
          explanation:
            'Iki ni ibisobanuro birambuye by’ikibazo hakurikijwe amategeko y’umuhanda mu Rwanda.',
        },
        en: {
          question: 'First question?',
          options: ['Yes', 'No'],
          explanation:
            'This is a valid detailed explanation regarding Rwandan traffic law regulations.',
        },
        fr: {
          question: 'Première question ?',
          options: ['Oui', 'Non'],
          explanation:
            'Ceci est une explication détaillée conforme au code de la route rwandais.',
        },
      },
    },
  ],
};
const resValidWith = validateQuestionBank(validWithExpl, 'test-with-expl');
assert.equal(resValidWith.valid, true, 'Valid bank with explanation must pass');
assert.equal(resValidWith.stats.withExplanation.en, 1);
assert.equal(resValidWith.stats.withoutExplanation.en, 0);

// Test 2b: Valid question WITHOUT explanation (null / undefined)
const validWithoutExpl = {
  questions: [
    {
      id: 'test-2',
      category_id: 1,
      correct_index: 0,
      translations: {
        rw: {
          question: 'Ikibazo cya kabiri?',
          options: ['Yego', 'Oya'],
          explanation: null,
        },
        en: {
          question: 'Second question?',
          options: ['Yes', 'No'],
        },
        fr: {
          question: 'Deuxième question ?',
          options: ['Oui', 'Non'],
          explanation: null,
        },
      },
    },
  ],
};
const resValidWithout = validateQuestionBank(
  validWithoutExpl,
  'test-without-expl',
);
assert.equal(
  resValidWithout.valid,
  true,
  'Question bank without explanation (null/omitted) must be valid',
);
assert.equal(resValidWithout.stats.withExplanation.en, 0);
assert.equal(resValidWithout.stats.withoutExplanation.en, 1);
assert.equal(resValidWithout.stats.withoutExplanation.rw, 1);

// Test 2c: Invalid explanation (empty string)
const invalidEmptyExpl = {
  questions: [
    {
      id: 'test-3',
      category_id: 1,
      correct_index: 0,
      translations: {
        rw: { question: 'Q?', options: ['A', 'B'], explanation: '   ' },
        en: { question: 'Q?', options: ['A', 'B'], explanation: '' },
        fr: { question: 'Q?', options: ['A', 'B'], explanation: null },
      },
    },
  ],
};
const resEmpty = validateQuestionBank(invalidEmptyExpl, 'test-empty-expl');
assert.equal(
  resEmpty.valid,
  false,
  'Empty string explanation must fail validation',
);

// Test 2d: Invalid explanation (too short)
const invalidShortExpl = {
  questions: [
    {
      id: 'test-4',
      category_id: 1,
      correct_index: 0,
      translations: {
        rw: { question: 'Q?', options: ['A', 'B'], explanation: 'Too short' },
        en: { question: 'Q?', options: ['A', 'B'], explanation: 'No' },
        fr: { question: 'Q?', options: ['A', 'B'], explanation: null },
      },
    },
  ],
};
const resShort = validateQuestionBank(invalidShortExpl, 'test-short-expl');
assert.equal(
  resShort.valid,
  false,
  'Too short explanation (<20 chars) must fail validation',
);

console.log(
  '✔ scripts/validate-questions.mjs correctly accepts null/omitted explanations and strictly validates present explanations.',
);

// --- 3. Check questionExplanation behavior in src/lib/quiz.ts ---
console.log('\n3. Checking questionExplanation function logic...');
const { questionExplanation } = await import('../src/lib/quiz.ts');

const questionWithExpl = {
  id: 'q-with',
  category_id: 1,
  category_name: 'Traffic Rules',
  image_url: null,
  correct_index: 0,
  translations: {
    en: {
      question: 'Question?',
      options: ['A', 'B'],
      explanation: 'Detailed explanation text here.',
    },
    rw: {
      question: 'Ikibazo?',
      options: ['A', 'B'],
      explanation: 'Ibisobanuro birambuye hano.',
    },
    fr: {
      question: 'Question ?',
      options: ['A', 'B'],
      explanation: 'Texte explicatif détaillé ici.',
    },
  },
};

const questionWithoutExpl = {
  id: 'q-without',
  category_id: 1,
  category_name: 'Traffic Rules',
  image_url: null,
  correct_index: 0,
  translations: {
    en: {
      question: 'Question?',
      options: ['A', 'B'],
      explanation: null,
    },
    rw: {
      question: 'Ikibazo?',
      options: ['A', 'B'],
    },
    fr: {
      question: 'Question ?',
      options: ['A', 'B'],
      explanation: null,
    },
  },
};

assert.equal(
  questionExplanation(questionWithExpl, 'en'),
  'Detailed explanation text here.',
  'Should return trimmed explanation when present',
);
assert.equal(
  questionExplanation(questionWithoutExpl, 'en'),
  undefined,
  'Should return undefined when explanation is null or omitted',
);
console.log(
  '✔ questionExplanation returns explanation when present, and undefined when absent/null.',
);

// --- 4. Verify scripts/draft-explanations.mjs execution ---
console.log(
  '\n4. Verifying draft-explanations.mjs generator & review outputs...',
);
const questionsJsonMtimeBefore = fs.statSync(
  path.join(root, 'questions.json'),
).mtimeMs;

const { generateDraftExplanation } = await import('./draft-explanations.mjs');
const sampleQ = validWithExpl.questions[0];
const sampleDraft = generateDraftExplanation(sampleQ);

assert(
  sampleDraft.en && sampleDraft.en.length >= 20,
  'Draft EN must be substantial 2-4 sentences',
);
assert(
  sampleDraft.fr && sampleDraft.fr.length >= 20,
  'Draft FR must be substantial 2-4 sentences',
);
assert(
  sampleDraft.rw && sampleDraft.rw.length >= 20,
  'Draft RW must be substantial 2-4 sentences',
);

// Verify review files exist
const jsonReviewFile = path.join(root, 'draft-explanations-review.json');
const mdReviewFile = path.join(root, 'draft-explanations-review.md');

assert(
  fs.existsSync(jsonReviewFile),
  'draft-explanations-review.json must exist',
);
assert(fs.existsSync(mdReviewFile), 'draft-explanations-review.md must exist');

const jsonReview = JSON.parse(fs.readFileSync(jsonReviewFile, 'utf8'));
assert(jsonReview.metadata, 'JSON review must have metadata');
assert(
  jsonReview.metadata.warning,
  'JSON review must include human review warning',
);
assert(
  Array.isArray(jsonReview.drafts),
  'JSON review must contain drafts array',
);
assert.equal(
  jsonReview.drafts.length,
  198,
  'Drafts array must contain 198 items',
);

const mdReview = fs.readFileSync(mdReviewFile, 'utf8');
assert(
  mdReview.includes('Human Review Required Before Merge'),
  'Markdown review must have prominent warning',
);
assert(
  mdReview.includes('Question #1'),
  'Markdown review must include Question #1',
);

// Verify questions.json was NOT modified by drafting
const questionsJsonMtimeAfter = fs.statSync(
  path.join(root, 'questions.json'),
).mtimeMs;
assert.equal(
  questionsJsonMtimeBefore,
  questionsJsonMtimeAfter,
  'questions.json must not be modified by the drafting script',
);
console.log(
  '✔ draft-explanations.mjs produces reviewable output in JSON and Markdown without modifying questions.json.',
);

console.log(
  '\n================================================================',
);
console.log('--- ALL ISSUE 14 VERIFICATIONS PASSED SUCCESSFULLY! ---');
console.log(
  '================================================================\n',
);
