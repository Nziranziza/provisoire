/**
 * Design-system anti-pattern audit.
 *
 * Scans src/**\/*.{astro,tsx,ts} and counts occurrences of patterns that the
 * redesign (issue #40) is progressively removing.
 *
 * Usage:
 *   node scripts/verify-design.mjs            # print table, exit 0
 *   node scripts/verify-design.mjs --strict   # exit 1 if any count > 0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// Allowlist — emoji occurrences in these files are intentional and must NOT
// be flagged. The strings live in UI-facing copy that describes the OS's own
// install UI (pwa.ts) or in shareable result messages (share-card.ts).
// ---------------------------------------------------------------------------
const EMOJI_ALLOWLIST = [
  {
    file: 'src/lib/share-card.ts',
    reason: 'getShareMessage / COPY — viral share text',
  },
  {
    file: 'src/lib/pwa.ts',
    reason: 'install instructions — describes OS UI chrome',
  },
];

const ALLOWLIST_FILES = new Set(
  EMOJI_ALLOWLIST.map((e) => path.resolve(root, e.file)),
);

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------
const RULES = [
  {
    id: 'arb-size',
    label: 'text-[Npx]',
    // arbitrary pixel font sizes: text-[10px], text-[1.5px], etc.
    test: (line) => (line.match(/text-\[\d+(\.\d+)?px\]/g) || []).length,
  },
  {
    id: 'border-slate',
    label: 'border-*-slate-900',
    // border color utilities using slate-900 (used as divider/stroke)
    test: (line) =>
      (line.match(/\bborder(?:-[trbl])?-slate-900\b/g) || []).length,
  },
  {
    id: 'stone',
    label: 'stone-*',
    // any Tailwind stone-* utility (dropped neutral ramp)
    test: (line) => (line.match(/\bstone-\d{1,4}\b/g) || []).length,
  },
  {
    id: 'emoji',
    label: 'emoji',
    // emoji and arrow/check symbols in UI code — skipped in comments and allowlisted files
    test: (line, _lineno, filePath, strippedLine) => {
      if (ALLOWLIST_FILES.has(filePath)) return 0;
      return (
        strippedLine.match(/\p{Extended_Pictographic}|[←→↑↓✓✔✗✕⋮]/gu) || []
      ).length;
    },
  },
  {
    id: 'bounce',
    label: 'animate-bounce / active:scale-95',
    test: (line) =>
      (line.match(/\banimate-bounce\b/g) || []).length +
      (line.match(/\bactive:scale-95\b/g) || []).length,
  },
  {
    id: 'typography',
    label: 'font-extrabold/black tracking-wide*',
    test: (line) =>
      (line.match(/\bfont-(?:extrabold|black)\b/g) || []).length +
      (line.match(/\btracking-(?:wide|wider|widest)\b/g) || []).length,
  },
  {
    id: 'select',
    label: '<select',
    test: (line) => (line.match(/<select[\s>]/g) || []).length,
  },
  {
    id: 'inline-handler',
    label: 'onchange=/onclick=',
    test: (line) => (line.match(/\bon(?:change|click)=/g) || []).length,
  },
];

// ---------------------------------------------------------------------------
// Comment-stripping helpers (single-pass, line-aware)
// ---------------------------------------------------------------------------

/**
 * Remove content inside block comments from a *single line* fragment,
 * given a mutable state object that tracks whether we are inside a block comment.
 */
function stripCommentsFromLine(raw, state) {
  let out = '';
  let i = 0;
  while (i < raw.length) {
    if (state.inBlock) {
      const end = raw.indexOf('*/', i);
      if (end === -1) {
        // entire rest of line is inside block comment
        i = raw.length;
      } else {
        state.inBlock = false;
        i = end + 2;
      }
    } else {
      // Check for line comment
      const lc = raw.indexOf('//', i);
      const bc = raw.indexOf('/*', i);
      if (lc !== -1 && (bc === -1 || lc <= bc)) {
        // rest of line is a line comment — stop
        out += raw.slice(i, lc);
        i = raw.length;
      } else if (bc !== -1) {
        out += raw.slice(i, bc);
        state.inBlock = true;
        i = bc + 2;
      } else {
        out += raw.slice(i);
        i = raw.length;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function* walkSrc(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkSrc(full);
    } else if (/\.(astro|tsx|ts)$/.test(entry.name)) {
      yield full;
    }
  }
}

// ---------------------------------------------------------------------------
// Main scan
// ---------------------------------------------------------------------------

const srcDir = path.join(root, 'src');
const strict = process.argv.includes('--strict');

/** @type {Map<string, number[]>} filePath → counts per rule */
const results = new Map();

for (const filePath of walkSrc(srcDir)) {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');
  const counts = new Array(RULES.length).fill(0);
  const blockState = { inBlock: false };

  for (let lineno = 0; lineno < lines.length; lineno++) {
    const raw = lines[lineno];
    const stripped = stripCommentsFromLine(raw, blockState);

    for (let r = 0; r < RULES.length; r++) {
      counts[r] += RULES[r].test(raw, lineno + 1, filePath, stripped);
    }
  }

  if (counts.some((c) => c > 0)) {
    results.set(filePath, counts);
  }
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

const totals = new Array(RULES.length).fill(0);
for (const counts of results.values()) {
  for (let r = 0; r < RULES.length; r++) totals[r] += counts[r];
}
const grandTotal = totals.reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------------------
// Table rendering
// ---------------------------------------------------------------------------

const COL_FILE = 42;
const COL_VAL = 7;

function pad(str, len, right = false) {
  str = String(str);
  if (right) return str.padStart(len);
  return str.padEnd(len);
}

const header =
  pad('File', COL_FILE) +
  RULES.map((r) => pad(r.label, COL_VAL, true)).join('') +
  pad('TOTAL', COL_VAL, true);

const separator = '-'.repeat(header.length);

console.log('\nDesign-system anti-pattern audit\n');
console.log(header);
console.log(separator);

for (const [filePath, counts] of [...results.entries()].sort()) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  const display =
    rel.length > COL_FILE - 1 ? '…' + rel.slice(-(COL_FILE - 2)) : rel;
  const rowTotal = counts.reduce((a, b) => a + b, 0);
  console.log(
    pad(display, COL_FILE) +
      counts.map((c) => pad(c === 0 ? '·' : c, COL_VAL, true)).join('') +
      pad(rowTotal, COL_VAL, true),
  );
}

console.log(separator);
console.log(
  pad('TOTAL', COL_FILE) +
    totals.map((c) => pad(c === 0 ? '·' : c, COL_VAL, true)).join('') +
    pad(grandTotal, COL_VAL, true),
);
console.log();

// ---------------------------------------------------------------------------
// Allowlist summary (informational)
// ---------------------------------------------------------------------------
console.log('Emoji allowlist (not counted above):');
for (const { file, reason } of EMOJI_ALLOWLIST) {
  console.log(`  ${file} — ${reason}`);
}
console.log();

// ---------------------------------------------------------------------------
// Strict mode / exit
// ---------------------------------------------------------------------------
if (strict) {
  if (grandTotal > 0) {
    console.error(
      `--strict: ${grandTotal} anti-pattern(s) found across ${results.size} file(s). Fix before merging.`,
    );
    process.exit(1);
  }
  console.log('--strict: no anti-patterns found. ✓');
}
