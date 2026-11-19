// Self-contained unit tests for the rule regexes and stripCommentsFromLine logic.
// Run with: node scripts/_test-verify-design.mjs
// Exits 0 on all-pass, 1 on any failure.

let failures = 0;
function ok(label, got, expected) {
  if (got !== expected) {
    console.error(
      `FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`,
    );
    failures++;
  } else {
    console.log(`pass [${label}]`);
  }
}

// ── border rule ──────────────────────────────────────────────────────────────
const borderRe = /\bborder(?:-[trblxyse])?-slate-900\b/g;
function borderCount(s) {
  return (s.match(borderRe) || []).length;
}
ok('border bare', borderCount('border-slate-900'), 1);
ok('border-t', borderCount('border-t-slate-900'), 1);
ok('border-x', borderCount('border-x-slate-900'), 1);
ok('border-y', borderCount('border-y-slate-900'), 1);
ok('border-s', borderCount('border-s-slate-900'), 1);
ok('border-e', borderCount('border-e-slate-900'), 1);
ok('border-l', borderCount('border-l-slate-900'), 1);
ok('border-r', borderCount('border-r-slate-900'), 1);
ok('border-b', borderCount('border-b-slate-900'), 1);
ok('border wrong shade', borderCount('border-slate-800'), 0);
ok('border no boundary', borderCount('xborder-slate-900'), 0);
ok('border wrong variant', borderCount('border-z-slate-900'), 0); // z not in set

// ── inline-handler rule ──────────────────────────────────────────────────────
const handlerRe = /(?<![a-zA-Z0-9_-])on(?:change|click)\s*=/g;
function handlerCount(s) {
  return (s.match(handlerRe) || []).length;
}
ok('handler onclick compact', handlerCount('onclick="f()"'), 1);
ok('handler onchange compact', handlerCount('onchange="g()"'), 1);
ok('handler onclick space', handlerCount('onclick ='), 1);
ok('handler onclick tab', handlerCount('onclick\t='), 1);
ok('handler data-onclick', handlerCount('data-onclick="f()"'), 0);
ok('handler myonclick', handlerCount('myonclick='), 0);
ok('handler mid-word', handlerCount('xonclick='), 0);

// ── select rule ──────────────────────────────────────────────────────────────
const selectRe = /<select(?=[\s>]|$)/g;
function selectCount(s) {
  return (s.match(selectRe) || []).length;
}
ok('select close tag', selectCount('<select>'), 1);
ok('select with attr', selectCount('<select class='), 1);
ok('select end-of-line', selectCount('<select'), 1);
ok('select-menu', selectCount('<select-menu>'), 0);
ok('selected', selectCount('<selected>'), 0);

// ── stripCommentsFromLine (string-aware) ─────────────────────────────────────
function strip(raw, state) {
  let out = '',
    i = 0,
    len = raw.length;
  while (i < len) {
    if (state.inBlock) {
      const end = raw.indexOf('*/', i);
      if (end === -1) {
        i = len;
      } else {
        state.inBlock = false;
        i = end + 2;
      }
      continue;
    }
    const ch = raw[i];
    if (state.inQuote) {
      if (ch === '\\') {
        out += ch + (raw[i + 1] ?? '');
        i += 2;
      } else if (ch === state.inQuote) {
        out += ch;
        state.inQuote = null;
        i++;
      } else {
        out += ch;
        i++;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      state.inQuote = ch;
      out += ch;
      i++;
      continue;
    }
    if (raw[i] === '/' && raw[i + 1] === '/' && raw[i - 1] !== ':') {
      i = len;
      continue;
    }
    if (raw[i] === '/' && raw[i + 1] === '*') {
      state.inBlock = true;
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  if (state.inQuote !== '`') state.inQuote = null;
  return out;
}
const emojiRe = /\p{Extended_Pictographic}|[←→↑↓✓✔✗✕⋮]/gu;
function emojiInStripped(raw, state) {
  return (strip(raw, state).match(emojiRe) || []).length;
}

ok(
  'real // comment strips emoji',
  emojiInStripped('// 🎉 hello', { inBlock: false, inQuote: null }),
  0,
);

ok(
  'emoji after URL on same line',
  emojiInStripped('see https://example.com 🎉', {
    inBlock: false,
    inQuote: null,
  }),
  1,
);

ok(
  '/* in double-quoted string not a comment',
  emojiInStripped('const s = "a/*b" + "🎉"', { inBlock: false, inQuote: null }),
  1,
);

ok(
  '// in single-quoted string not a line comment',
  emojiInStripped("const u = 'http://x'; // 🎉", {
    inBlock: false,
    inQuote: null,
  }),
  0,
);

ok(
  'block comment hides emoji',
  emojiInStripped('/* 🎉 */ code', { inBlock: false, inQuote: null }),
  0,
);

ok(
  'emoji before // comment counted',
  emojiInStripped('const x = "✓"; // not ✓', { inBlock: false, inQuote: null }),
  1,
);

// ── summary ──────────────────────────────────────────────────────────────────
if (failures === 0) {
  console.log('\nAll tests passed.');
} else {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
