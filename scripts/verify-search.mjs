/**
 * Acceptance check: distinctive phrases unique to each question must rank
 * that question first via the real searchTokenIndex matcher.
 *
 * Run after `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''``´]/g, "'")
    .replace(/[^\w\s\d']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function entrySearchText(item) {
  return [item.q, ...(item.o || []), item.e || '', item.a || ''].join(' ');
}

/** Find a multi-word phrase from source text that appears in no other entry. */
function uniquePhrase(sourceText, otherTexts, minWords = 3) {
  const words = normalize(sourceText)
    .split(/\s+/)
    .filter((w) => w.length > 2);
  for (let len = Math.min(7, words.length); len >= minWords; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(' ');
      if (phrase.length < 12) continue;
      const duplicate = otherTexts.some((other) =>
        normalize(other).includes(phrase),
      );
      if (!duplicate) return phrase;
    }
  }
  return null;
}

const GENERIC_OPTION =
  /^(none|nta gisubizo|aucun|all of|none of|\d+\s*km|\d+\s*km\/h)/i;

function isGenericOption(text) {
  const n = normalize(text);
  if (n.length < 10 && GENERIC_OPTION.test(n)) return true;
  if (GENERIC_OPTION.test(n)) return true;
  return false;
}

/** Prefer question text, then distinctive options/answers. */
function findTestPhrase(item, others) {
  const fromQuestion = uniquePhrase(item.q, others);
  if (fromQuestion) return fromQuestion;

  for (const opt of item.o || []) {
    if (isGenericOption(opt)) continue;
    const phrase = uniquePhrase(opt, others, 3);
    if (phrase) return phrase;
  }

  if (item.a && !isGenericOption(item.a)) {
    const phrase = uniquePhrase(item.a, others, 3);
    if (phrase) return phrase;
  }

  return uniquePhrase(entrySearchText(item), others, 3);
}

function duplicateStemCount(items, item) {
  const stem = normalize(item.q);
  return items.filter((i) => normalize(i.q) === stem).length;
}

function isNearDuplicate(itemA, itemB) {
  const a = normalize(itemA.q);
  const b = normalize(itemB.q);
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (longer.includes(shorter) && shorter.length / longer.length >= 0.8) {
    return true;
  }
  const tokensA = new Set(a.split(/\s+/).filter((t) => t.length > 2));
  const tokensB = new Set(b.split(/\s+/).filter((t) => t.length > 2));
  let shared = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) shared++;
  }
  const overlap = shared / Math.min(tokensA.size, tokensB.size);
  return overlap >= 0.85;
}

async function loadSearchModule() {
  const astroDir = path.join(root, 'dist', '_astro');
  const searchChunk = fs
    .readdirSync(astroDir)
    .find((f) => f.startsWith('search.') && f.endsWith('.js'));
  if (!searchChunk) {
    throw new Error('Build search chunk not found. Run npm run build first.');
  }
  return import(pathToFileURL(path.join(astroDir, searchChunk)).href);
}

const search = await loadSearchModule();
const locales = ['en', 'fr', 'rw'];
const samples = [0, 41, 83, 127, 197];
let failed = 0;

for (const lang of locales) {
  const indexPath = path.join(root, 'dist', lang, 'search-index.json');
  const payload = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const sizeKb = (fs.statSync(indexPath).size / 1024).toFixed(1);
  const tokenIndex = search.createClientTokenIndex(payload);

  console.log(`${lang}: ${sizeKb} KB index, ${payload.total} questions`);

  for (const idx of samples) {
    const qNum = idx + 1;
    const item = payload.items[idx];
    const others = payload.items
      .filter((_, i) => i !== idx)
      .map(entrySearchText);
    const phrase = findTestPhrase(item, others);

    if (!phrase) {
      console.error(`${lang} Q${qNum}: could not derive unique phrase`);
      failed++;
      continue;
    }

    const results = search.searchTokenIndex(tokenIndex, phrase, 8);
    const rank = results.findIndex((r) => r.n === qNum);
    const top = results[0];
    const sharedStem = duplicateStemCount(payload.items, item) > 1;
    const nearDupeTop =
      top && top.n !== qNum && isNearDuplicate(item, payload.items[top.n - 1]);

    if (rank === 0) {
      console.log(`  ✓ Q${qNum}: "${phrase}" → #${qNum}`);
    } else if (nearDupeTop && rank >= 1 && rank < 4) {
      console.log(
        `  ✓ Q${qNum}: "${phrase}" → #${top.n} (near-duplicate, #${qNum} rank ${rank + 1})`,
      );
    } else if (sharedStem && rank >= 1 && rank < 8) {
      console.log(
        `  ✓ Q${qNum}: "${phrase}" → #${results[0]?.n} (shared stem, #${qNum} rank ${rank + 1})`,
      );
    } else {
      console.error(
        `${lang} Q${qNum}: "${phrase}" → #${results[0]?.n ?? 'none'} (expected #${qNum}, rank ${rank + 1})`,
      );
      failed++;
    }
  }

  // Explicit verification for morphological search queries (e.g. Borders / border in en)
  if (lang === 'en') {
    const bordersResults = search.searchTokenIndex(tokenIndex, 'Borders', 8);
    const hasQ1 = bordersResults.some((r) => r.n === 1);
    if (!hasQ1) {
      console.error('en query "Borders" did NOT return Question 1');
      failed++;
    } else {
      console.log(`  ✓ en: "Borders" returned ${bordersResults.length} questions (including Q1)`);
    }

    const borderResults = search.searchTokenIndex(tokenIndex, 'border', 8);
    const hasQ1Singular = borderResults.some((r) => r.n === 1);
    if (!hasQ1Singular) {
      console.error('en query "border" did NOT return Question 1');
      failed++;
    } else {
      console.log(`  ✓ en: "border" returned ${borderResults.length} questions (including Q1)`);
    }

    // Strict locale isolation verification: French / Kinyarwanda queries on EN index must return NO results
    const foreignFrResults = search.searchTokenIndex(
      tokenIndex,
      'Les bords de la voie publique ou de la chaussée peuvent être signalés',
      8,
    );
    if (foreignFrResults.length > 0) {
      console.error(`en index incorrectly returned ${foreignFrResults.length} result(s) for French query`);
      failed++;
    } else {
      console.log('  ✓ en: French query correctly returned 0 results (strict locale)');
    }

    const foreignRwResults = search.searchTokenIndex(
      tokenIndex,
      'Inkombe z’inzira nyabagendwa cyangwa z’umuhanda',
      8,
    );
    if (foreignRwResults.length > 0) {
      console.error(`en index incorrectly returned ${foreignRwResults.length} result(s) for Kinyarwanda query`);
      failed++;
    } else {
      console.log('  ✓ en: Kinyarwanda query correctly returned 0 results (strict locale)');
    }
  }

  if (lang === 'fr') {
    const bordsResults = search.searchTokenIndex(tokenIndex, 'bords', 8);
    const hasQ1 = bordsResults.some((r) => r.n === 1);
    if (!hasQ1) {
      console.error('fr query "bords" did NOT return Question 1');
      failed++;
    } else {
      console.log(`  ✓ fr: "bords" returned ${bordsResults.length} questions (including Q1)`);
    }

    const bordResults = search.searchTokenIndex(tokenIndex, 'bord', 8);
    const hasQ1Singular = bordResults.some((r) => r.n === 1);
    if (!hasQ1Singular) {
      console.error('fr query "bord" did NOT return Question 1');
      failed++;
    } else {
      console.log(`  ✓ fr: "bord" returned ${bordResults.length} questions (including Q1)`);
    }

    // Strict locale isolation: English / Kinyarwanda queries on FR index must return NO results
    const foreignEnResults = search.searchTokenIndex(
      tokenIndex,
      'Borders of the public highway or the roadway must be signaled',
      8,
    );
    if (foreignEnResults.length > 0) {
      console.error(`fr index incorrectly returned ${foreignEnResults.length} result(s) for English query`);
      failed++;
    } else {
      console.log('  ✓ fr: English query correctly returned 0 results (strict locale)');
    }

    const foreignRwResults = search.searchTokenIndex(
      tokenIndex,
      'Inkombe z’inzira nyabagendwa cyangwa z’umuhanda',
      8,
    );
    if (foreignRwResults.length > 0) {
      console.error(`fr index incorrectly returned ${foreignRwResults.length} result(s) for Kinyarwanda query`);
      failed++;
    } else {
      console.log('  ✓ fr: Kinyarwanda query correctly returned 0 results (strict locale)');
    }
  }

  if (lang === 'rw') {
    const inkombeResults = search.searchTokenIndex(tokenIndex, 'inkombe', 8);
    const hasQ1 = inkombeResults.some((r) => r.n === 1);
    if (!hasQ1) {
      console.error('rw query "inkombe" did NOT return Question 1');
      failed++;
    } else {
      console.log(`  ✓ rw: "inkombe" returned ${inkombeResults.length} questions (including Q1)`);
    }

    // Strict locale isolation: English / French queries on RW index must return NO results
    const foreignEnResults = search.searchTokenIndex(
      tokenIndex,
      'Borders of the public highway or the roadway must be signaled',
      8,
    );
    if (foreignEnResults.length > 0) {
      console.error(`rw index incorrectly returned ${foreignEnResults.length} result(s) for English query`);
      failed++;
    } else {
      console.log('  ✓ rw: English query correctly returned 0 results (strict locale)');
    }

    const foreignFrResults = search.searchTokenIndex(
      tokenIndex,
      'Les bords de la voie publique ou de la chaussée peuvent être signalés',
      8,
    );
    if (foreignFrResults.length > 0) {
      console.error(`rw index incorrectly returned ${foreignFrResults.length} result(s) for French query`);
      failed++;
    } else {
      console.log('  ✓ rw: French query correctly returned 0 results (strict locale)');
    }
  }
}

const astroDir = path.join(root, 'dist', '_astro');
const questionsChunk = fs
  .readdirSync(astroDir)
  .find((f) => f.startsWith('questions.') && f.endsWith('.js'));
if (questionsChunk) {
  console.error(
    `FAIL: questions.json client chunk still present (${questionsChunk})`,
  );
  failed++;
} else {
  console.log('✓ No questions.json client chunk (index loaded via JSON only)');
}

const listChunk = fs
  .readdirSync(astroDir)
  .find((f) => f.startsWith('questionList.') && f.endsWith('.js'));
if (listChunk) {
  const kb = (
    fs.statSync(path.join(astroDir, listChunk)).size / 1024
  ).toFixed(1);
  console.log(`✓ Initial list script: ${kb} KB`);
}

const searchChunk = fs
  .readdirSync(astroDir)
  .find((f) => f.startsWith('search.') && f.endsWith('.js'));
if (searchChunk) {
  const kb = (
    fs.statSync(path.join(astroDir, searchChunk)).size / 1024
  ).toFixed(1);
  console.log(`✓ Lazy search module: ${kb} KB`);
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll search acceptance checks passed.');
