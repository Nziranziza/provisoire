/**
 * scripts/validate-questions.mjs
 *
 * Validates questions in questions.json and public/data/questions.json:
 * - Structural integrity (id, category_id, correct_index, translations for rw/en/fr).
 * - Per-locale checks (question text, options array).
 * - Optional & nullable explanation checks:
 *   If present: must be a non-empty string of reasonable length (>= 20 chars, <= 2000 chars).
 *   If null/undefined: allowed (pages render fine before backfill).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const MIN_EXPLANATION_LENGTH = 20;
const MAX_EXPLANATION_LENGTH = 2000;
const EXPECTED_LANGUAGES = ['rw', 'en', 'fr'];

export function validateQuestionBank(data, filename = 'questions.json') {
  const errors = [];
  const stats = {
    total: 0,
    withExplanation: { rw: 0, en: 0, fr: 0 },
    withoutExplanation: { rw: 0, en: 0, fr: 0 },
  };

  if (!data || typeof data !== 'object') {
    errors.push(`[${filename}] Root must be an object.`);
    return { valid: false, errors, stats };
  }

  if (!Array.isArray(data.questions)) {
    errors.push(`[${filename}] "questions" must be an array.`);
    return { valid: false, errors, stats };
  }

  stats.total = data.questions.length;

  data.questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const qId = q.id || `index_${idx}`;

    if (!q.id || typeof q.id !== 'string') {
      errors.push(`[${filename}] Question #${qNum} is missing a valid "id".`);
    }

    if (typeof q.category_id !== 'number') {
      errors.push(
        `[${filename}] Question #${qNum} (${qId}) is missing a valid numeric "category_id".`,
      );
    }

    if (typeof q.correct_index !== 'number' || q.correct_index < 0) {
      errors.push(
        `[${filename}] Question #${qNum} (${qId}) has invalid "correct_index": ${q.correct_index}`,
      );
    }

    if (!q.translations || typeof q.translations !== 'object') {
      errors.push(
        `[${filename}] Question #${qNum} (${qId}) is missing "translations" object.`,
      );
      return;
    }

    for (const lang of EXPECTED_LANGUAGES) {
      const tr = q.translations[lang];
      if (!tr || typeof tr !== 'object') {
        errors.push(
          `[${filename}] Question #${qNum} (${qId}) missing translation for language "${lang}".`,
        );
        continue;
      }

      if (
        !tr.question ||
        typeof tr.question !== 'string' ||
        !tr.question.trim()
      ) {
        errors.push(
          `[${filename}] Question #${qNum} (${qId}) [${lang}] has empty or non-string "question".`,
        );
      }

      if (!Array.isArray(tr.options) || tr.options.length < 2) {
        errors.push(
          `[${filename}] Question #${qNum} (${qId}) [${lang}] "options" must be an array with >= 2 items.`,
        );
      } else {
        if (q.correct_index >= tr.options.length) {
          errors.push(
            `[${filename}] Question #${qNum} (${qId}) [${lang}] correct_index ${q.correct_index} is out of bounds for options (${tr.options.length}).`,
          );
        }
      }

      // Check explanation field: optional and nullable
      const expl = tr.explanation;
      if (expl === null || expl === undefined) {
        stats.withoutExplanation[lang]++;
      } else {
        // If present, it must be a non-empty string of reasonable length
        if (typeof expl !== 'string') {
          errors.push(
            `[${filename}] Question #${qNum} (${qId}) [${lang}] "explanation" must be a string or null/undefined, received ${typeof expl}.`,
          );
        } else {
          const trimmed = expl.trim();
          if (trimmed.length === 0) {
            errors.push(
              `[${filename}] Question #${qNum} (${qId}) [${lang}] "explanation" is present but empty. (Use null or omit if absent).`,
            );
          } else if (trimmed.length < MIN_EXPLANATION_LENGTH) {
            errors.push(
              `[${filename}] Question #${qNum} (${qId}) [${lang}] "explanation" is too short (${trimmed.length} chars, minimum ${MIN_EXPLANATION_LENGTH}). Reasoned 2-4 sentences required.`,
            );
          } else if (trimmed.length > MAX_EXPLANATION_LENGTH) {
            errors.push(
              `[${filename}] Question #${qNum} (${qId}) [${lang}] "explanation" exceeds maximum reasonable length (${trimmed.length} chars, maximum ${MAX_EXPLANATION_LENGTH}).`,
            );
          } else {
            stats.withExplanation[lang]++;
          }
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    stats,
  };
}

export function runValidation() {
  console.log('======================================================');
  console.log('--- Validating Question Bank & Explanations Schema ---');
  console.log('======================================================\n');

  const filesToValidate = [
    path.join(root, 'questions.json'),
    path.join(root, 'public', 'data', 'questions.json'),
  ];

  let allValid = true;

  for (const filePath of filesToValidate) {
    if (!fs.existsSync(filePath)) {
      console.warn(
        `[WARN] Skipping non-existent file: ${path.relative(root, filePath)}`,
      );
      continue;
    }

    const relName = path.relative(root, filePath);
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`[ERROR] Failed to parse JSON in ${relName}:`, err.message);
      allValid = false;
      continue;
    }

    const result = validateQuestionBank(parsed, relName);
    if (!result.valid) {
      allValid = false;
      console.error(
        `\n❌ Validation FAILED for ${relName} (${result.errors.length} errors):`,
      );
      for (const err of result.errors.slice(0, 20)) {
        console.error(`  - ${err}`);
      }
      if (result.errors.length > 20) {
        console.error(`  ... and ${result.errors.length - 20} more errors.`);
      }
    } else {
      console.log(`✔ ${relName}: ${result.stats.total} questions checked.`);
      console.log(`  Explanations present:`);
      for (const lang of EXPECTED_LANGUAGES) {
        console.log(
          `    - [${lang}]: ${result.stats.withExplanation[lang]}/${result.stats.total} with explanation (${result.stats.withoutExplanation[lang]} empty/null)`,
        );
      }
    }
  }

  if (!allValid) {
    console.error('\n❌ Question bank validation failed!');
    process.exit(1);
  } else {
    console.log('\n✔ All question bank validations passed successfully!\n');
  }
}

// Run directly if invoked via CLI
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  runValidation();
}
