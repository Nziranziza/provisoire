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
// Allowlist — per-declaration emoji exemptions.
//
// Each entry names a source file (relative to root) and a declaration name
// whose lines should be skipped by the emoji rule. Only the specific
// declarations listed here are exempt; everything else in the same file
// (e.g. examMode in share-card.ts) is still scanned.
//
//   share-card.ts  — shareTextPassed / shareTextFailed hold viral share copy
//   pwa.ts         — installGuideCopy describes the OS's own install UI chrome
// ---------------------------------------------------------------------------
const EMOJI_ALLOWLIST = [
  {
    file: 'src/lib/share-card.ts',
    declarations: ['shareTextPassed', 'shareTextFailed'],
    reason: 'viral share text — intentional emoji for social messages',
  },
  {
    file: 'src/lib/pwa.ts',
    declarations: ['installGuideCopy'],
    reason: 'install instructions — describes OS UI chrome (\u2191 \u22ee \u2295)',
  },
];

/**
 * Build a per-file map of line ranges that are exempt from the emoji rule.
 * We scan each allowlisted file and collect the line extents of each named
 * declaration (from the line containing "declarationName:" or
 * "declarationName(" up to a balanced-brace close or the next top-level key).
 *
 * This is intentionally simple: we find the first line that *contains* the
 * declaration name as a word, then walk forward tracking brace/bracket depth
 * until depth returns to zero. That covers both object properties and function
 * bodies without a full parser.
 *
 * @returns {Map<string, Set<number>>} absPath -> Set of 0-based line indices
 */
function buildEmojiExemptLines() {
  /** @type {Map<string, Set<number>>} */
  const exempt = new Map();

  for (const { file, declarations } of EMOJI_ALLOWLIST) {
    const absPath = path.resolve(root, file);
    if (!fs.existsSync(absPath)) continue;

    const lines = fs.readFileSync(absPath, 'utf8').split('\n');
    const exemptSet = new Set();

    for (const decl of declarations) {
      // Find the first line that mentions this declaration as a whole word.
      const startRe = new RegExp(`\\b${decl}\\b`);
      let startIdx = lines.findIndex((l) => startRe.test(l));
      if (startIdx === -1) continue;

      // Walk forward tracking brace/bracket/paren depth.
      let depth = 0;
      for (let i = startIdx; i < lines.length; i++) {
        const l = lines[i];
        for (const ch of l) {
          if (ch === '{' || ch === '[' || ch === '(') depth++;
          else if (ch === '}' || ch === ']' || ch === ')') depth--;
        }
        exemptSet.add(i);
        // Stop once we've closed the top-level structure opened on the first line.
        // depth goes negative if we exit the containing object — that's fine too.
        if (i > startIdx && depth <= 0) break;
      }
    }

    if (exemptSet.size > 0) exempt.set(absPath, exemptSet);
  }

  return exempt;
}

const EMOJI_EXEMPT_LINES = buildEmojiExemptLines();

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
    // border color utilities using slate-900 on any axis or logical side:
    // border-slate-900, border-t-slate-900, border-r-slate-900,
    // border-b-slate-900, border-l-slate-900, border-x-slate-900,
    // border-y-slate-900, border-s-slate-900, border-e-slate-900
    test: (line) =>
      (line.match(/\bborder(?:-[trblxyse])?-slate-900\b/g) || []).length,
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
    // emoji and arrow/check symbols in UI code — skipped in JS/CSS comments
    // and in allowlisted per-declaration line ranges.
    test: (line, lineno, filePath, strippedLine) => {
      const exemptSet = EMOJI_EXEMPT_LINES.get(filePath);
      // lineno is 1-based; Set stores 0-based indices.
      if (exemptSet && exemptSet.has(lineno - 1)) return 0;
      return (
        strippedLine.match(/\p{Extended_Pictographic}|[\u2190\u2192\u2191\u2193\u2713\u2714\u2717\u2715\u22ee]/gu) || []
      ).length;
    },
  },
  {
    id: 'bounce',
    label: 'animate-bounce/scale-95',
    test: (line) =>
      (line.match(/\banimate-bounce\b/g) || []).length +
      (line.match(/\bactive:scale-95\b/g) || []).length,
  },
  {
    id: 'typography',
    label: 'font-extrabold/tracking-wide*',
    test: (line) =>
      (line.match(/\bfont-(?:extrabold|black)\b/g) || []).length +
      (line.match(/\btracking-(?:wide|wider|widest)\b/g) || []).length,
  },
  {
    id: 'select',
    label: '<select',
    // Match <select followed by whitespace (including newlines, captured via
    // the per-file full-source scan below), '>', or end-of-line.
    // The per-line test catches <select> and <select attr=...; the multi-line
    // case (<select\n  ...) is caught by matching <select at end of line.
    test: (line) =>
      (line.match(/<select(?=[\s>]|$)/g) || []).length,
  },
  {
    id: 'inline-handler',
    label: 'onchange=/onclick=',
    // Require a word boundary before the name so "data-onclick=" is excluded.
    // Allow optional whitespace (including newlines handled by multi-line scan)
    // between the attribute name and "=".
    test: (line) =>
      (line.match(/(?<![a-zA-Z0-9_-])on(?:change|click)\s*=/g) || []).length,
  },
];

// ---------------------------------------------------------------------------
// Comment-stripping helpers (single-pass, line-aware, string-aware)
//
// We track whether we are inside a quoted string or template literal so that
// comment-like sequences inside strings do not truncate the scan or flip
// block-comment state.  Supported quote contexts: ', ", ` (with naive nesting
// — no nested template expressions).
//
// State object fields (mutated across lines of the same file):
//   inBlock  {boolean}  — currently inside a /* ... */ block comment
//   inQuote  {string|null} — the opening quote character if inside a string,
//                            or null when not in a quoted context
// ---------------------------------------------------------------------------

/**
 * Remove JS/CSS comment content from one line, respecting quoted strings.
 * Returns the non-comment portion of the line.
 *
 * @param {string} raw   The raw source line
 * @param {{ inBlock: boolean, inQuote: string|null }} state  Mutable cross-line state
 * @returns {string}
 */
function stripCommentsFromLine(raw, state) {
  let out = '';
  let i = 0;
  const len = raw.length;

  while (i < len) {
    // Inside a block comment
    if (state.inBlock) {
      const end = raw.indexOf('*/', i);
      if (end === -1) {
        // Entire rest of line is block-comment content -- consume and stop.
        i = len;
      } else {
        state.inBlock = false;
        i = end + 2;
      }
      continue;
    }

    const ch = raw[i];

    // Inside a quoted string
    if (state.inQuote) {
      if (ch === '\\') {
        // Escaped character -- keep both and skip next.
        out += ch + (raw[i + 1] ?? '');
        i += 2;
      } else if (ch === state.inQuote) {
        // Closing quote.
        out += ch;
        state.inQuote = null;
        i++;
      } else {
        out += ch;
        i++;
      }
      continue;
    }

    // Outside any comment or string

    // Check for opening quotes.
    if (ch === '"' || ch === "'" || ch === '`') {
      state.inQuote = ch;
      out += ch;
      i++;
      continue;
    }

    // Check for line comment // — but not when preceded by ':' (URL scheme, e.g. https://).
    if (raw[i] === '/' && raw[i + 1] === '/' && raw[i - 1] !== ':') {
      // Rest of line is a line comment -- stop outputting.
      i = len;
      continue;
    }

    // Check for block comment /*
    if (raw[i] === '/' && raw[i + 1] === '*') {
      state.inBlock = true;
      i += 2;
      continue;
    }

    out += ch;
    i++;
  }

  // If a template literal or single/double-quoted string spans multiple lines
  // (unusual but possible with template literals), preserve the inQuote state.
  // For single/double quotes that don't close on the same line, reset them
  // (they'd be a syntax error in real JS, but let's not get stuck).
  if (state.inQuote !== '`') state.inQuote = null;

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

/** @type {Map<string, number[]>} filePath -> counts per rule */
const results = new Map();

for (const filePath of walkSrc(srcDir)) {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');
  const counts = new Array(RULES.length).fill(0);
  const blockState = { inBlock: false, inQuote: null };

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
// Table rendering -- column widths derived from each rule's label
// ---------------------------------------------------------------------------

const COL_FILE = 44;
// Each value column is at least as wide as the rule's label, minimum 5.
const COL_WIDTHS = RULES.map((r) => Math.max(r.label.length + 1, 5));
const COL_TOTAL_W = Math.max('TOTAL'.length + 1, 7);

function padL(str, len) {
  return String(str).padStart(len);
}
function padR(str, len) {
  return String(str).padEnd(len);
}

const header =
  padR('File', COL_FILE) +
  RULES.map((r, i) => padL(r.label, COL_WIDTHS[i])).join('') +
  padL('TOTAL', COL_TOTAL_W);

const separator = '-'.repeat(header.length);

console.log('\nDesign-system anti-pattern audit\n');
console.log(header);
console.log(separator);

for (const [filePath, counts] of [...results.entries()].sort()) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  const display =
    rel.length > COL_FILE - 1 ? '\u2026' + rel.slice(-(COL_FILE - 2)) : rel;
  const rowTotal = counts.reduce((a, b) => a + b, 0);
  console.log(
    padR(display, COL_FILE) +
      counts.map((c, i) => padL(c === 0 ? '\u00b7' : c, COL_WIDTHS[i])).join('') +
      padL(rowTotal, COL_TOTAL_W),
  );
}

console.log(separator);
console.log(
  padR('TOTAL', COL_FILE) +
    totals.map((c, i) => padL(c === 0 ? '\u00b7' : c, COL_WIDTHS[i])).join('') +
    padL(grandTotal, COL_TOTAL_W),
);
console.log();

// ---------------------------------------------------------------------------
// Allowlist summary (informational)
// ---------------------------------------------------------------------------
console.log('Emoji allowlist (not counted above):');
for (const { file, declarations, reason } of EMOJI_ALLOWLIST) {
  console.log(`  ${file} [${declarations.join(', ')}] -- ${reason}`);
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
  console.log('--strict: no anti-patterns found. \u2713');
}
