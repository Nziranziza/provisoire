import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';

const DIST_DIR = resolve('dist');
const SITE_ORIGIN = 'https://provisoire.pages.dev';

console.log('======================================================');
console.log('--- Crawling dist/ for SEO & Metadata Verification ---');
console.log('======================================================\n');

if (!existsSync(DIST_DIR)) {
  console.error(
    'ERROR: dist/ directory does not exist. Run `npm run build` first.',
  );
  process.exit(1);
}

function findHtmlFiles(dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = findHtmlFiles(DIST_DIR);
console.log(`Found ${htmlFiles.length} HTML files to inspect in dist/\n`);

const titlesMap = new Map(); // title -> [filePath]
const canonicalsMap = new Map(); // filePath -> canonical
const hreflangsMap = new Map(); // canonical -> Map(hreflang -> href)
let pagesChecked = 0;
let questionPagesChecked = 0;
let imagesChecked = 0;

function parseHtml(html) {
  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Description
  const descMatch =
    html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
    html.match(/<meta\s+content="([^"]*)"\s+name="description"/i);
  const description = descMatch ? descMatch[1] : null;

  // Canonical
  const canonMatch =
    html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) ||
    html.match(/<link\s+href="([^"]*)"\s+rel="canonical"/i);
  const canonical = canonMatch ? canonMatch[1] : null;

  // Hreflang alternates
  const alternates = [];
  const altRegex =
    /<link\s+rel="alternate"\s+hreflang="([^"]*)"\s+href="([^"]*)"/gi;
  let match;
  while ((match = altRegex.exec(html)) !== null) {
    alternates.push({ lang: match[1], href: match[2] });
  }

  // OpenGraph
  const ogTitleMatch = html.match(
    /<meta\s+property="og:title"\s+content="([^"]*)"/i,
  );
  const ogDescMatch = html.match(
    /<meta\s+property="og:description"\s+content="([^"]*)"/i,
  );
  const ogUrlMatch = html.match(
    /<meta\s+property="og:url"\s+content="([^"]*)"/i,
  );
  const ogTypeMatch = html.match(
    /<meta\s+property="og:type"\s+content="([^"]*)"/i,
  );

  // Twitter
  const twCardMatch = html.match(
    /<meta\s+name="twitter:card"\s+content="([^"]*)"/i,
  );
  const twTitleMatch = html.match(
    /<meta\s+name="twitter:title"\s+content="([^"]*)"/i,
  );
  const twDescMatch = html.match(
    /<meta\s+name="twitter:description"\s+content="([^"]*)"/i,
  );

  // Images
  const imgRegex = /<img\s+[^>]*>/gi;
  const images = [];
  while ((match = imgRegex.exec(html)) !== null) {
    const imgTag = match[0];
    const srcMatch = imgTag.match(/src="([^"]*)"/i);
    const altMatch = imgTag.match(/alt="([^"]*)"/i);
    if (srcMatch) {
      images.push({
        src: srcMatch[1],
        alt: altMatch ? altMatch[1] : null,
        tag: imgTag,
      });
    }
  }

  return {
    title,
    description,
    canonical,
    alternates,
    og: {
      title: ogTitleMatch ? ogTitleMatch[1] : null,
      desc: ogDescMatch ? ogDescMatch[1] : null,
      url: ogUrlMatch ? ogUrlMatch[1] : null,
      type: ogTypeMatch ? ogTypeMatch[1] : null,
    },
    twitter: {
      card: twCardMatch ? twCardMatch[1] : null,
      title: twTitleMatch ? twTitleMatch[1] : null,
      desc: twDescMatch ? twDescMatch[1] : null,
    },
    images,
  };
}

for (const filePath of htmlFiles) {
  const relPath = relative(DIST_DIR, filePath).replace(/\\/g, '/');
  const html = readFileSync(filePath, 'utf8');

  // Skip redirect stubs
  if (html.includes('<meta http-equiv="refresh"')) {
    continue;
  }

  const parsed = parseHtml(html);
  pagesChecked++;

  // 1. Canonical check
  assert.ok(parsed.canonical, `Page ${relPath} must have a canonical <link>`);
  assert.ok(
    parsed.canonical.startsWith(SITE_ORIGIN),
    `Page ${relPath} canonical must be absolute starting with ${SITE_ORIGIN}, got ${parsed.canonical}`,
  );
  canonicalsMap.set(relPath, parsed.canonical);

  // 2. Title check
  assert.ok(
    parsed.title && parsed.title.length > 0,
    `Page ${relPath} must have a non-empty <title>`,
  );
  if (!titlesMap.has(parsed.title)) {
    titlesMap.set(parsed.title, new Map());
  }
  if (!titlesMap.get(parsed.title).has(parsed.canonical)) {
    titlesMap.get(parsed.title).set(parsed.canonical, []);
  }
  titlesMap.get(parsed.title).get(parsed.canonical).push(relPath);

  // 3. Description check
  assert.ok(
    parsed.description && parsed.description.length > 0,
    `Page ${relPath} must have a non-empty meta description`,
  );

  // 4. OpenGraph & Twitter tags check
  assert.ok(parsed.og.title, `Page ${relPath} missing og:title`);
  assert.ok(parsed.og.desc, `Page ${relPath} missing og:description`);
  assert.ok(parsed.og.url, `Page ${relPath} missing og:url`);
  assert.ok(parsed.twitter.card, `Page ${relPath} missing twitter:card`);
  assert.ok(parsed.twitter.title, `Page ${relPath} missing twitter:title`);
  assert.ok(parsed.twitter.desc, `Page ${relPath} missing twitter:description`);

  // 5. Hreflang alternates check for localized pages
  const isLocalizedPage =
    relPath.startsWith('en/') ||
    relPath.startsWith('fr/') ||
    relPath.startsWith('rw/') ||
    relPath === 'index.html';

  if (isLocalizedPage && parsed.alternates.length > 0) {
    const langMap = new Map();
    for (const alt of parsed.alternates) {
      assert.ok(
        ['en', 'fr', 'rw', 'x-default'].includes(alt.lang),
        `Page ${relPath} contains invalid hreflang code: "${alt.lang}". Must use ISO 639-1 (en, fr, rw) or x-default.`,
      );
      assert.ok(
        alt.href.startsWith(SITE_ORIGIN),
        `Page ${relPath} hreflang href must be absolute: ${alt.href}`,
      );
      langMap.set(alt.lang, alt.href);
    }

    assert.ok(
      langMap.has('en') &&
        langMap.has('fr') &&
        langMap.has('rw') &&
        langMap.has('x-default'),
      `Page ${relPath} must contain a complete 4-entry hreflang set (en, fr, rw, x-default). Found: ${[...langMap.keys()].join(', ')}`,
    );

    // x-default must point to the en version
    assert.equal(
      langMap.get('x-default'),
      langMap.get('en'),
      `Page ${relPath} x-default must point to en version`,
    );

    hreflangsMap.set(parsed.canonical, langMap);
  }

  // 6. Image alt text verification on question detail & list pages
  if (relPath.includes('/questions/')) {
    questionPagesChecked++;
    for (const img of parsed.images) {
      if (
        img.src.includes('images/') ||
        img.src.includes('.png') ||
        img.src.includes('.jpg')
      ) {
        imagesChecked++;
        assert.ok(
          img.alt !== null &&
            img.alt !== undefined &&
            img.alt.trim().length > 0,
          `Image ${img.src} in ${relPath} must have non-empty descriptive alt text! Found: "${img.alt}" in ${img.tag}`,
        );
      }
    }
  }
}

console.log(
  `✓ Checked ${pagesChecked} pages for canonical, title, description, OG, Twitter`,
);
console.log(
  `✓ Verified ${questionPagesChecked} question pages and ${imagesChecked} question image alt attributes`,
);

// 7. Check title uniqueness across distinct content pages (distinct canonicals)
console.log('\n--- Checking Title Uniqueness ---');
let duplicateTitleCount = 0;
for (const [title, canonicals] of titlesMap.entries()) {
  if (canonicals.size > 1) {
    const canonicalList = [...canonicals.keys()];
    console.warn(
      `⚠️ Warning: Duplicate title "${title}" across distinct canonical URLs: ${canonicalList.join(', ')}`,
    );
    duplicateTitleCount++;
  }
}

assert.equal(
  duplicateTitleCount,
  0,
  `Found ${duplicateTitleCount} duplicate titles across distinct canonical pages! Every page per locale must have a unique title.`,
);
console.log(
  '✓ All page titles are 100% unique across distinct canonical pages! No duplicates found.',
);

// 8. Reciprocity check across all hreflang clusters
console.log('\n--- Checking hreflang Reciprocity ---');
let clustersChecked = 0;
for (const [canonicalUrl, langMap] of hreflangsMap.entries()) {
  for (const [lang, targetHref] of langMap.entries()) {
    if (lang === 'x-default') continue;
    const targetLangMap = hreflangsMap.get(targetHref);
    if (!targetLangMap) {
      // It might be a page without its own entry or mismatched canonical
      throw new Error(
        `Broken reciprocal hreflang: ${canonicalUrl} links to ${targetHref} (${lang}), but ${targetHref} has no hreflang map!`,
      );
    }
    // Verify target points back to canonicalUrl for current page's lang
    // Determine the current page's locale from canonicalUrl
    const currentLangMatch = canonicalUrl.match(
      /https:\/\/provisoire\.pages\.dev\/(en|fr|rw)\//,
    );
    const currentLang = currentLangMatch
      ? currentLangMatch[1]
      : canonicalUrl === SITE_ORIGIN || canonicalUrl === `${SITE_ORIGIN}/`
        ? 'en'
        : null;
    if (currentLang) {
      const backLink = targetLangMap.get(currentLang);
      assert.equal(
        backLink,
        canonicalUrl,
        `Hreflang reciprocity failure: ${canonicalUrl} links to ${targetHref} (${lang}), but ${targetHref} links back to ${backLink} instead of ${canonicalUrl} for lang "${currentLang}"`,
      );
    }
  }
  clustersChecked++;
}

console.log(
  `✓ Verified full 3-way reciprocity across ${clustersChecked} hreflang clusters!`,
);

console.log('\n======================================================');
console.log('ALL SEO & Trilingual Metadata Crawl Verifications PASSED!');
console.log('======================================================\n');
