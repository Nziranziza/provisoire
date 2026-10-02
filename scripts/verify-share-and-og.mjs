import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { OG_IMAGE_DEFINITIONS } from './generate-og-images.mjs';
import { getShareMessage, getWhatsAppShareUrl } from '../src/lib/share-card.ts';

console.log('======================================================');
console.log('--- Verifying Shareable Result Cards & OG Images ---');
console.log('======================================================\n');

// 1. Verify all 31 OG image files exist in public/og and dist/og
const DIST_DIR = resolve('dist');
const PUBLIC_DIR = resolve('public');

console.log('1. Verifying build-time static OG images existence...');
for (const def of OG_IMAGE_DEFINITIONS) {
  const publicPath = resolve(PUBLIC_DIR, 'og', def.fileName);
  const distPath = resolve(DIST_DIR, 'og', def.fileName);

  assert.ok(
    existsSync(publicPath),
    `OG image ${def.fileName} must exist in public/og/`,
  );
  if (existsSync(DIST_DIR)) {
    assert.ok(
      existsSync(distPath),
      `OG image ${def.fileName} must exist in dist/og/ after build`,
    );
  }
}
console.log(
  `✓ All ${OG_IMAGE_DEFINITIONS.length} static OG image files verified on disk.\n`,
);

// 2. Sample key pages in dist/ and verify OG & Twitter meta tags
console.log('2. Verifying OG & Twitter meta tags across key page types...');
const samplePages = [
  { path: 'index.html', expectedOg: 'og-default.png', desc: 'Root home' },
  { path: 'rw/index.html', expectedOg: 'og-rw-home.png', desc: 'RW Home' },
  { path: 'en/index.html', expectedOg: 'og-en-home.png', desc: 'EN Home' },
  { path: 'fr/index.html', expectedOg: 'og-fr-home.png', desc: 'FR Home' },
  {
    path: 'rw/traffic-rules.html',
    expectedOg: 'og-rw-traffic-rules.png',
    desc: 'RW Traffic Rules Hub',
  },
  {
    path: 'en/traffic-rules.html',
    expectedOg: 'og-en-traffic-rules.png',
    desc: 'EN Traffic Rules Hub',
  },
  {
    path: 'fr/traffic-rules.html',
    expectedOg: 'og-fr-traffic-rules.png',
    desc: 'FR Traffic Rules Hub',
  },
  {
    path: 'rw/road-signs.html',
    expectedOg: 'og-rw-road-signs.png',
    desc: 'RW Road Signs Hub',
  },
  {
    path: 'en/road-signs.html',
    expectedOg: 'og-en-road-signs.png',
    desc: 'EN Road Signs Hub',
  },
  {
    path: 'fr/road-signs.html',
    expectedOg: 'og-fr-road-signs.png',
    desc: 'FR Road Signs Hub',
  },
  {
    path: 'rw/questions.html',
    expectedOg: 'og-rw-questions.png',
    desc: 'RW Questions Bank',
  },
  {
    path: 'en/questions.html',
    expectedOg: 'og-en-questions.png',
    desc: 'EN Questions Bank',
  },
  {
    path: 'fr/questions.html',
    expectedOg: 'og-fr-questions.png',
    desc: 'FR Questions Bank',
  },
  {
    path: 'rw/signs.html',
    expectedOg: 'og-rw-signs.png',
    desc: 'RW Signs Glossary',
  },
  {
    path: 'en/signs.html',
    expectedOg: 'og-en-signs.png',
    desc: 'EN Signs Glossary',
  },
  {
    path: 'fr/signs.html',
    expectedOg: 'og-fr-signs.png',
    desc: 'FR Signs Glossary',
  },
  {
    path: 'rw/practice.html',
    expectedOg: 'og-rw-practice.png',
    desc: 'RW Practice Mode',
  },
  {
    path: 'en/practice.html',
    expectedOg: 'og-en-practice.png',
    desc: 'EN Practice Mode',
  },
  {
    path: 'fr/practice.html',
    expectedOg: 'og-fr-practice.png',
    desc: 'FR Practice Mode',
  },
  { path: 'rw/exam.html', expectedOg: 'og-rw-exam.png', desc: 'RW Mock Exam' },
  { path: 'en/exam.html', expectedOg: 'og-en-exam.png', desc: 'EN Mock Exam' },
  { path: 'fr/exam.html', expectedOg: 'og-fr-exam.png', desc: 'FR Mock Exam' },
  { path: 'rw/about.html', expectedOg: 'og-rw-about.png', desc: 'RW About' },
  { path: 'en/about.html', expectedOg: 'og-en-about.png', desc: 'EN About' },
  { path: 'fr/about.html', expectedOg: 'og-fr-about.png', desc: 'FR About' },
  {
    path: 'rw/privacy.html',
    expectedOg: 'og-rw-privacy.png',
    desc: 'RW Privacy',
  },
  {
    path: 'en/privacy.html',
    expectedOg: 'og-en-privacy.png',
    desc: 'EN Privacy',
  },
  {
    path: 'fr/privacy.html',
    expectedOg: 'og-fr-privacy.png',
    desc: 'FR Privacy',
  },
  { path: 'rw/terms.html', expectedOg: 'og-rw-terms.png', desc: 'RW Terms' },
  { path: 'en/terms.html', expectedOg: 'og-en-terms.png', desc: 'EN Terms' },
  { path: 'fr/terms.html', expectedOg: 'og-fr-terms.png', desc: 'FR Terms' },
  {
    path: 'rw/questions/1.html',
    expectedOg: 'og-rw-traffic-rules.png',
    desc: 'RW Question 1 (Traffic Rules fallback)',
  },
  {
    path: 'en/questions/1.html',
    expectedOg: 'og-en-traffic-rules.png',
    desc: 'EN Question 1 (Traffic Rules fallback)',
  },
  {
    path: 'fr/questions/1.html',
    expectedOg: 'og-fr-traffic-rules.png',
    desc: 'FR Question 1 (Traffic Rules fallback)',
  },
];

for (const sample of samplePages) {
  let filePath = join(DIST_DIR, sample.path);
  if (!existsSync(filePath) && sample.path.endsWith('/index.html')) {
    const flatPath = join(
      DIST_DIR,
      sample.path.replace(/\/index\.html$/, '.html'),
    );
    if (existsSync(flatPath)) filePath = flatPath;
  } else if (!existsSync(filePath) && sample.path.endsWith('.html')) {
    const nestedPath = join(
      DIST_DIR,
      sample.path.replace(/\.html$/, '/index.html'),
    );
    if (existsSync(nestedPath)) filePath = nestedPath;
  }
  assert.ok(
    existsSync(filePath),
    `Page file ${sample.path} must exist in dist/`,
  );
  const html = readFileSync(filePath, 'utf8');

  // Verify og:image tag
  const ogImgMatch = html.match(
    /<meta\s+property="og:image"\s+content="([^"]*)"/i,
  );
  assert.ok(ogImgMatch, `Page ${sample.path} missing property="og:image"`);
  assert.ok(
    ogImgMatch[1].includes(sample.expectedOg) ||
      ogImgMatch[1].includes('images/'),
    `Page ${sample.path} expected og:image to contain ${sample.expectedOg}, got ${ogImgMatch[1]}`,
  );

  // Verify twitter:card tag is summary_large_image
  const twCardMatch = html.match(
    /<meta\s+name="twitter:card"\s+content="([^"]*)"/i,
  );
  assert.ok(twCardMatch, `Page ${sample.path} missing name="twitter:card"`);
  assert.equal(
    twCardMatch[1],
    'summary_large_image',
    `Page ${sample.path} expected twitter:card="summary_large_image", got "${twCardMatch[1]}"`,
  );

  // Verify twitter:image tag
  const twImgMatch = html.match(
    /<meta\s+name="twitter:image"\s+content="([^"]*)"/i,
  );
  assert.ok(twImgMatch, `Page ${sample.path} missing name="twitter:image"`);
  assert.ok(
    twImgMatch[1].includes(sample.expectedOg) ||
      twImgMatch[1].includes('images/'),
    `Page ${sample.path} expected twitter:image to contain ${sample.expectedOg}, got ${twImgMatch[1]}`,
  );

  // Verify og:title tag
  const ogTitleMatch = html.match(
    /<meta\s+property="og:title"\s+content="([^"]*)"/i,
  );
  assert.ok(
    ogTitleMatch && ogTitleMatch[1].length > 0,
    `Page ${sample.path} missing property="og:title"`,
  );

  // Verify og:description tag
  const ogDescMatch = html.match(
    /<meta\s+property="og:description"\s+content="([^"]*)"/i,
  );
  assert.ok(
    ogDescMatch && ogDescMatch[1].length > 0,
    `Page ${sample.path} missing property="og:description"`,
  );
}
console.log(
  `✓ Verified OG image & Twitter meta tags across ${samplePages.length} representative pages.\n`,
);

// 3. Verify Share Message & WhatsApp generator logic
console.log(
  '3. Verifying Share Message & WhatsApp URL formatting across locales...',
);
const testScores = [
  {
    score: 18,
    total: 20,
    isPassed: true,
    rulesScore: 11,
    rulesTotal: 12,
    signsScore: 7,
    signsTotal: 8,
    timeSpent: 840,
    mode: 'mock_exam',
    locale: 'rw',
  },
  {
    score: 15,
    total: 20,
    isPassed: true,
    rulesScore: 9,
    rulesTotal: 12,
    signsScore: 6,
    signsTotal: 8,
    timeSpent: 620,
    mode: 'practice',
    locale: 'en',
  },
  {
    score: 9,
    total: 20,
    isPassed: false,
    rulesScore: 5,
    rulesTotal: 12,
    signsScore: 4,
    signsTotal: 8,
    timeSpent: 1100,
    mode: 'mock_exam',
    locale: 'fr',
  },
];

for (const s of testScores) {
  const msg = getShareMessage(s);
  assert.ok(
    msg.includes(String(s.score)),
    `Share message must include score ${s.score}`,
  );
  assert.ok(
    msg.includes(String(s.total)),
    `Share message must include total ${s.total}`,
  );
  assert.ok(
    msg.includes('https://umuhanda.rw'),
    `Share message must include umuhanda.rw URL`,
  );

  const waUrl = getWhatsAppShareUrl(s);
  assert.ok(
    waUrl.startsWith('https://api.whatsapp.com/send?text='),
    'WhatsApp URL must use official API format',
  );
  assert.ok(
    waUrl.includes(encodeURIComponent('https://umuhanda.rw')),
    'WhatsApp URL must encode share text and URL',
  );
}
console.log(
  `✓ Verified share messages and WhatsApp URL generators for all locales.\n`,
);

console.log('======================================================');
console.log('ALL Result Card & OG Image verifications PASSED!');
console.log('======================================================\n');
