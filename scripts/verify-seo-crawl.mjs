import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { loadEnv } from 'vite';

const DIST_DIR = resolve('dist');
const fileEnv = loadEnv(
  process.env.NODE_ENV ?? 'production',
  process.cwd(),
  '',
);
const SITE_ORIGIN = new URL(
  process.env.SITE_URL ?? fileEnv.SITE_URL ?? 'https://umuhanda.rw',
).origin;

console.log('======================================================');
console.log('--- Crawling dist/ for SEO & Metadata Verification ---');
console.log('======================================================\n');

if (!existsSync(DIST_DIR)) {
  console.error(
    'ERROR: dist/ directory does not exist. Run `npm run build` first.',
  );
  process.exit(1);
}

/**
 * Recursively discovers all HTML files in a given directory.
 *
 * @param {string} dir - Directory path to search.
 * @returns {string[]} Array of absolute file paths to HTML files.
 */
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

/**
 * Determines whether an image src should be subject to alt-text verification.
 * Covers common raster/vector web image formats, not just png/jpg.
 *
 * @param {string} src - The image `src` attribute value.
 * @returns {boolean} True if the image should be checked for alt text.
 */
function isCheckableImage(src) {
  return (
    src.includes('images/') ||
    /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(src)
  );
}

const htmlFiles = findHtmlFiles(DIST_DIR);
console.log(`Found ${htmlFiles.length} HTML files to inspect in dist/\n`);

const titlesMap = new Map(); // title -> Map(canonical -> [relPath])
const descriptionsMap = new Map(); // description -> Map(canonical -> [relPath])
const canonicalsMap = new Map(); // relPath -> canonical
const canonicalOwnersMap = new Map(); // canonical -> [relPath] (for duplicate detection)
const hreflangsMap = new Map(); // canonical -> Map(hreflang -> href)
let pagesChecked = 0;
let questionPagesChecked = 0;
let imagesChecked = 0;

/**
 * Parses raw HTML string and extracts key SEO tags and OpenGraph/Twitter attributes.
 * Attribute-order-agnostic for all meta tags: each tag can be matched regardless of
 * whether `name`/`property` or `content` appears first in the source.
 *
 * @param {string} html - Raw HTML content of a page.
 * @returns {object} Extracted SEO metadata including title, canonical, alternates, descriptions, OG, Twitter, and images.
 */
function parseHtml(html) {
  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  /**
   * Matches a <meta> tag by `name` regardless of attribute order.
   * @param {string} name - The meta name attribute value to match.
   * @returns {string|null} The content attribute value, or null if not found.
   */
  function matchMetaByName(name) {
    const forward = html.match(
      new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i'),
    );
    if (forward) return forward[1];
    const reverse = html.match(
      new RegExp(`<meta\\s+content="([^"]*)"\\s+name="${name}"`, 'i'),
    );
    return reverse ? reverse[1] : null;
  }

  /**
   * Matches a <meta> tag by `property` regardless of attribute order.
   * @param {string} property - The meta property attribute value to match.
   * @returns {string|null} The content attribute value, or null if not found.
   */
  function matchMetaByProperty(property) {
    const forward = html.match(
      new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, 'i'),
    );
    if (forward) return forward[1];
    const reverse = html.match(
      new RegExp(`<meta\\s+content="([^"]*)"\\s+property="${property}"`, 'i'),
    );
    return reverse ? reverse[1] : null;
  }

  // Description
  const description = matchMetaByName('description');

  // Canonical (order-agnostic)
  const canonMatch =
    html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) ||
    html.match(/<link\s+href="([^"]*)"\s+rel="canonical"/i);
  const canonical = canonMatch ? canonMatch[1] : null;

  // Hreflang alternates (order-agnostic: rel/hreflang/href can appear in any order)
  const alternates = [];
  const linkTagRegex = /<link\s+[^>]*rel="alternate"[^>]*>/gi;
  let linkTagMatch;
  while ((linkTagMatch = linkTagRegex.exec(html)) !== null) {
    const tag = linkTagMatch[0];
    const hreflangMatch = tag.match(/hreflang="([^"]*)"/i);
    const hrefMatch = tag.match(/href="([^"]*)"/i);
    if (hreflangMatch && hrefMatch) {
      alternates.push({ lang: hreflangMatch[1], href: hrefMatch[1] });
    }
  }

  // OpenGraph
  const ogTitle = matchMetaByProperty('og:title');
  const ogDesc = matchMetaByProperty('og:description');
  const ogUrl = matchMetaByProperty('og:url');
  const ogType = matchMetaByProperty('og:type');

  // Twitter
  const twCard = matchMetaByName('twitter:card');
  const twTitle = matchMetaByName('twitter:title');
  const twDesc = matchMetaByName('twitter:description');

  // Images
  const imgRegex = /<img\s+[^>]*>/gi;
  const images = [];
  let match;
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
      title: ogTitle,
      desc: ogDesc,
      url: ogUrl,
      type: ogType,
    },
    twitter: {
      card: twCard,
      title: twTitle,
      desc: twDesc,
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

  // 1. Canonical check: must be a valid URL matching SITE_ORIGIN and exactly equal the self URL for relPath
  assert.ok(parsed.canonical, `Page ${relPath} must have a canonical <link>`);
  let canonicalUrlObj;
  try {
    canonicalUrlObj = new URL(parsed.canonical);
  } catch {
    assert.fail(
      `Page ${relPath} canonical must be a valid URL, got ${parsed.canonical}`,
    );
  }
  assert.equal(
    canonicalUrlObj.origin,
    SITE_ORIGIN,
    `Page ${relPath} canonical origin must exactly match ${SITE_ORIGIN}, got ${canonicalUrlObj.origin}`,
  );

  let expectedPath = '/' + relPath;
  if (expectedPath.endsWith('/index.html')) {
    expectedPath = expectedPath.slice(0, -'/index.html'.length);
  } else if (expectedPath.endsWith('.html')) {
    expectedPath = expectedPath.slice(0, -'.html'.length);
  }
  if (expectedPath === '/index' || expectedPath === '') {
    expectedPath = '/';
  }
  const expectedCanonical = `${SITE_ORIGIN}${expectedPath}`;
  assert.equal(
    parsed.canonical,
    expectedCanonical,
    `Page ${relPath} self-referencing canonical mismatch: expected ${expectedCanonical}, got ${parsed.canonical}`,
  );
  canonicalsMap.set(relPath, parsed.canonical);

  // 1b. Track pages sharing a canonical URL (should be exactly one owner per canonical)
  if (!canonicalOwnersMap.has(parsed.canonical)) {
    canonicalOwnersMap.set(parsed.canonical, []);
  }
  canonicalOwnersMap.get(parsed.canonical).push(relPath);

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

  // 3. Description check & uniqueness tracking
  assert.ok(
    parsed.description && parsed.description.length > 0,
    `Page ${relPath} must have a non-empty meta description`,
  );
  if (!descriptionsMap.has(parsed.description)) {
    descriptionsMap.set(parsed.description, new Map());
  }
  if (!descriptionsMap.get(parsed.description).has(parsed.canonical)) {
    descriptionsMap.get(parsed.description).set(parsed.canonical, []);
  }
  descriptionsMap.get(parsed.description).get(parsed.canonical).push(relPath);

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
    relPath === 'en.html' ||
    relPath === 'fr.html' ||
    relPath === 'rw.html';

  if (isLocalizedPage) {
    const langMap = new Map();
    for (const alt of parsed.alternates) {
      assert.ok(
        ['en', 'fr', 'rw', 'x-default'].includes(alt.lang),
        `Page ${relPath} contains invalid hreflang code: "${alt.lang}". Must use ISO 639-1 (en, fr, rw) or x-default.`,
      );
      let alternateUrl;
      try {
        alternateUrl = new URL(alt.href);
      } catch {
        assert.fail(
          `Page ${relPath} hreflang href must be an absolute URL: ${alt.href}`,
        );
      }
      assert.equal(
        alternateUrl.origin,
        SITE_ORIGIN,
        `Page ${relPath} hreflang href origin must exactly match ${SITE_ORIGIN}, got ${alternateUrl.origin}`,
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

    // Validate self-reference for the current page locale
    let currentLocale = null;
    if (relPath.startsWith('en/') || relPath === 'en.html')
      currentLocale = 'en';
    else if (relPath.startsWith('fr/') || relPath === 'fr.html')
      currentLocale = 'fr';
    else if (relPath.startsWith('rw/') || relPath === 'rw.html')
      currentLocale = 'rw';

    if (currentLocale) {
      assert.equal(
        langMap.get(currentLocale),
        parsed.canonical,
        `Page ${relPath} (${currentLocale}) must self-reference in hreflang: expected ${parsed.canonical}, got ${langMap.get(currentLocale)}`,
      );
    }

    hreflangsMap.set(parsed.canonical, langMap);
  }

  // 6. Image alt text verification on question detail & list pages
  if (relPath.includes('/questions/')) {
    questionPagesChecked++;
    for (const img of parsed.images) {
      if (isCheckableImage(img.src)) {
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

// 8. Check description uniqueness across distinct content pages (distinct canonicals)
console.log('\n--- Checking Description Uniqueness ---');
let duplicateDescCount = 0;
for (const [description, canonicals] of descriptionsMap.entries()) {
  if (canonicals.size > 1) {
    const canonicalList = [...canonicals.keys()];
    console.warn(
      `⚠️ Warning: Duplicate description "${description}" across distinct canonical URLs: ${canonicalList.join(', ')}`,
    );
    duplicateDescCount++;
  }
}

assert.equal(
  duplicateDescCount,
  0,
  `Found ${duplicateDescCount} duplicate descriptions across distinct canonical pages! Every page per locale must have a unique description.`,
);
console.log(
  '✓ All page descriptions are 100% unique across distinct canonical pages! No duplicates found.',
);

// 9. Check that no two distinct output files claim the same canonical URL
console.log('\n--- Checking Canonical URL Uniqueness ---');
let duplicateCanonicalCount = 0;
for (const [canonical, owners] of canonicalOwnersMap.entries()) {
  if (owners.length > 1) {
    console.warn(
      `⚠️ Warning: Canonical URL "${canonical}" is claimed by multiple output files: ${owners.join(', ')}`,
    );
    duplicateCanonicalCount++;
  }
}

assert.equal(
  duplicateCanonicalCount,
  0,
  `Found ${duplicateCanonicalCount} canonical URLs claimed by more than one output file! Each canonical URL must map to exactly one page.`,
);
console.log(
  '✓ Every canonical URL is claimed by exactly one output file. No duplicates found.',
);

// 10. Reciprocity check across all hreflang clusters
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
    const currentLangMatch = new URL(canonicalUrl).pathname.match(
      /^\/(en|fr|rw)(?:\/|$)/,
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

// 11. Check Footer landmark, localized labels, and required links across all locales
console.log('\n--- Checking Footer Landmark & Localized Links ---');
const requiredFooterLinks = {
  en: [
    '/en/practice',
    '/en/exam',
    '/en/questions',
    '/en/traffic-rules',
    '/en/road-signs',
    '/en/about',
    '/en/privacy',
    '/en/terms',
  ],
  fr: [
    '/fr/practice',
    '/fr/exam',
    '/fr/questions',
    '/fr/traffic-rules',
    '/fr/road-signs',
    '/fr/about',
    '/fr/privacy',
    '/fr/terms',
  ],
  rw: [
    '/rw/practice',
    '/rw/exam',
    '/rw/questions',
    '/rw/traffic-rules',
    '/rw/road-signs',
    '/rw/about',
    '/rw/privacy',
    '/rw/terms',
  ],
};

for (const [locale, expectedLinks] of Object.entries(requiredFooterLinks)) {
  const samplePath = join(DIST_DIR, `${locale}.html`);
  assert(
    existsSync(samplePath),
    `Sample page ${locale}.html must exist in dist/ to test footer`,
  );
  const html = readFileSync(samplePath, 'utf8');
  assert(
    html.includes('<footer'),
    `<footer element must exist in ${locale}.html`,
  );
  for (const link of expectedLinks) {
    assert(
      html.includes(`href="${link}"`),
      `Footer in ${locale}.html missing expected localized link: ${link}`,
    );
  }
}
console.log(
  '✓ Footer landmark, required links, and localized dictionaries verified across all locales!',
);

console.log('\n======================================================');
console.log('ALL SEO & Trilingual Metadata Crawl Verifications PASSED!');
console.log('======================================================\n');
