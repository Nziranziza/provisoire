/**
 * Post-deploy acceptance checks for issue #16.
 *
 * Usage: npm run verify:deploy -- https://example.com
 *        (defaults to https://umuhanda.rw, or $SITE_URL)
 *
 * Verifies what the deployment itself controls: content rendered into the HTML,
 * the redirect and header rules, robots/sitemap wiring, and that Googlebot and
 * Bingbot are not being challenged by Cloudflare's bot protection.
 */
import questionBank from '../questions.json' with { type: 'json' };

const base = (
  process.argv[2] ??
  process.env.SITE_URL ??
  'https://umuhanda.rw'
).replace(/\/$/, '');

const GOOGLEBOT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BINGBOT =
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';

/**
 * Against a local emulator (`wrangler pages dev dist`) the build still carries
 * whatever origin `SITE_URL` had at build time, so origin-dependent checks are
 * reported as warnings rather than failures.
 */
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|$)/.test(base);

let failures = 0;
let warnings = 0;

function pass(label, detail = '') {
  console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label, detail = '') {
  failures++;
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
}

function warn(label, detail = '') {
  warnings++;
  console.log(`  ! ${label}${detail ? ` — ${detail}` : ''}`);
}

function check(condition, label, detail = '') {
  if (condition) pass(label, detail);
  else fail(label, detail);
}

/** A check that can only hold when the build's `SITE_URL` matches `base`. */
function checkOrigin(condition, label, detail = '') {
  if (condition) pass(label, detail);
  else if (isLocal)
    warn(label, `${detail} (build-time SITE_URL, not fatal locally)`);
  else fail(label, detail);
}

async function get(path, { ua, redirect = 'follow', method = 'GET' } = {}) {
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const response = await fetch(url, {
    method,
    redirect,
    headers: ua ? { 'User-Agent': ua } : {},
  });
  const body = method === 'HEAD' ? '' : await response.text().catch(() => '');
  return { response, body, url };
}

/** Cloudflare marks a challenged/blocked request with `cf-mitigated`. */
function mitigation(response) {
  return response.headers.get('cf-mitigated');
}

async function section(title, fn) {
  console.log(`\n${title}`);
  try {
    await fn();
  } catch (error) {
    fail(title, error.message);
  }
}

const questions = questionBank.questions;
const firstQuestion = questions[0];
const questionNumber = 1;
const questionPath = `/en/questions/${questionNumber}`;
const expectedPhrase = firstQuestion.translations.en.question
  .replace(/\s+/g, ' ')
  .trim();

console.log(`Verifying ${base}`);

await section('Canonical URLs resolve without a redirect', async () => {
  // The shape every link, canonical and sitemap entry uses must answer 200
  // directly. With Astro's default directory output, Cloudflare 308s these
  // onto a trailing slash, which costs a round trip per navigation and makes
  // Search Console report sitemap URLs that redirect and canonicals that
  // point at redirects. `build.format: 'file'` is what keeps this passing.
  for (const path of [
    '/en/questions',
    questionPath,
    '/en/traffic-rules',
    '/fr/road-signs',
  ]) {
    const { response } = await get(path, { redirect: 'manual' });
    check(
      response.status === 200,
      `GET ${path} is a direct 200`,
      `status ${response.status}${
        response.headers.get('location')
          ? ` → ${response.headers.get('location')}`
          : ''
      }`,
    );
  }

  // The trailing-slash variant should fold onto the canonical form, not 404.
  const { response: slashed } = await get(`${questionPath}/`, {
    redirect: 'manual',
  });
  const slashedLocation = slashed.headers.get('location');
  // Resolve against the request URL so a relative Location is comparable.
  const slashedDestination = slashedLocation
    ? new URL(slashedLocation, `${base}${questionPath}/`).href
    : null;
  check(
    [301, 308].includes(slashed.status) &&
      slashedDestination === `${base}${questionPath}`,
    `GET ${questionPath}/ redirects to the canonical form`,
    `status ${slashed.status} → ${slashedLocation ?? 'none'}`,
  );
});

await section('Content is in the HTML (no JS required)', async () => {
  const { response, body } = await get(questionPath);
  check(response.ok, `GET ${questionPath}`, `status ${response.status}`);
  check(
    body.includes(expectedPhrase.slice(0, 60)),
    'question text present in served HTML',
    expectedPhrase.slice(0, 48),
  );
  check(body.includes('"@type":"Quiz"'), 'Quiz JSON-LD present');
  const canonical = body.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  checkOrigin(
    canonical === `${base}${questionPath}`,
    'self-canonical matches deployed origin',
    canonical ?? 'missing',
  );
  const hreflangs = [...body.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
  const expected = ['en', 'fr', 'rw', 'x-default'];
  check(
    expected.every((lang) => hreflangs.includes(lang)),
    'hreflang cluster complete',
    hreflangs.join(', ') || 'none',
  );
});

await section('Home page and locale roots', async () => {
  const { response, body } = await get('/', { redirect: 'manual' });
  check(
    response.status === 200,
    'GET / serves the home page (not a redirect)',
    `status ${response.status}`,
  );
  check(body.includes('"@type":"WebSite"'), 'WebSite JSON-LD present on /');
  for (const lang of ['en', 'fr', 'rw']) {
    const { response: localeResponse } = await get(`/${lang}/questions`);
    check(
      localeResponse.ok,
      `GET /${lang}/questions`,
      `status ${localeResponse.status}`,
    );
  }
});

await section('robots.txt and sitemap', async () => {
  const { response, body } = await get('/robots.txt');
  check(response.ok, 'GET /robots.txt', `status ${response.status}`);
  const sitemapLine = body.match(/^Sitemap:\s*(\S+)/m)?.[1];
  checkOrigin(
    sitemapLine === `${base}/sitemap-index.xml`,
    'Sitemap line points at this origin',
    sitemapLine ?? 'missing',
  );
  check(
    !/^Disallow:\s*\/\s*$/m.test(body),
    'production robots.txt does not disallow crawling',
  );

  const index = await get('/sitemap-index.xml');
  check(
    index.response.ok,
    'GET /sitemap-index.xml',
    `status ${index.response.status}`,
  );
  const firstSitemap = index.body.match(/<loc>([^<]+)<\/loc>/)?.[1];
  if (!firstSitemap) {
    fail('sitemap index lists at least one sitemap');
    return;
  }
  // Fetch the listed sitemap from the origin under test, not from whatever
  // origin the build baked into <loc> — otherwise verifying a local emulator
  // silently checks the live site and reports a meaningless pass.
  const sitemapPath = new URL(firstSitemap).pathname;
  const sitemap = await get(sitemapPath);
  check(
    sitemap.response.ok,
    `GET ${sitemapPath}`,
    `status ${sitemap.response.status}`,
  );
  check(
    sitemap.body.includes('xhtml:link') &&
      sitemap.body.includes('hreflang="fr"'),
    'sitemap carries xhtml:link hreflang alternates',
  );
});

await section('Redirect rules (_redirects)', async () => {
  const legacy = '/en/questions/page/1';
  const { response } = await get(legacy, { redirect: 'manual' });
  const location = response.headers.get('location');
  if (response.status === 301 || response.status === 308) {
    pass(`${legacy} → ${location}`, `status ${response.status}`);
    // Compare the fully resolved destination, not a suffix: an absolute
    // Location on another origin would satisfy `endsWith`.
    const destination = location
      ? new URL(location, `${base}${legacy}`).href
      : null;
    check(
      destination === `${base}/en/questions`,
      'redirect target is the canonical list URL',
      location ?? 'missing',
    );
  } else if (response.status === 200) {
    // Astro also emits a meta-refresh HTML page for each of these, so a 200
    // here means the platform never applied `_redirects` and the deployment is
    // serving a soft redirect where a 301 is required. Not a warning: this is
    // the failure mode the rules exist to prevent. (`astro preview` ignores
    // `_redirects` — use `wrangler pages dev dist` to test them locally.)
    fail(
      `${legacy} returned 200`,
      'served the meta-refresh fallback — _redirects was not applied',
    );
  } else {
    fail(`${legacy}`, `unexpected status ${response.status}`);
  }
});

await section('Header rules (_headers)', async () => {
  const { body } = await get('/en/questions');
  const asset = body.match(/\/_astro\/[^"']+/)?.[0];
  if (asset) {
    const { response } = await get(asset, { method: 'HEAD' });
    const cacheControl = response.headers.get('cache-control') ?? '';
    check(
      cacheControl.includes('immutable'),
      'fingerprinted /_astro asset is immutable',
      cacheControl || 'no cache-control',
    );
  } else {
    warn('no /_astro asset referenced', 'skipped immutable-cache check');
  }

  const { response: swResponse } = await get('/sw.js', { method: 'HEAD' });
  check(
    (swResponse.headers.get('cache-control') ?? '').includes('no-cache'),
    'service worker is served no-cache',
    swResponse.headers.get('cache-control') ?? 'none',
  );

  const { response: pageResponse } = await get(questionPath, {
    method: 'HEAD',
  });
  check(
    pageResponse.headers.get('x-content-type-options') === 'nosniff',
    'security headers applied to HTML',
    pageResponse.headers.get('x-content-type-options') ?? 'missing',
  );
});

await section('Crawlers are not challenged (Bot Fight Mode off)', async () => {
  for (const [name, ua] of [
    ['Googlebot', GOOGLEBOT],
    ['Bingbot', BINGBOT],
  ]) {
    const { response } = await get(questionPath, { ua });
    const mitigated = mitigation(response);
    check(
      response.ok && !mitigated,
      `${name} can fetch ${questionPath}`,
      mitigated ? `cf-mitigated: ${mitigated}` : `status ${response.status}`,
    );
  }
});

await section('Image delivery (issue #4)', async () => {
  const withImage = questions.find((q) => q.image_url);
  if (!withImage) {
    warn('no question images in the bank', 'skipped');
    return;
  }
  const path = `/${withImage.image_url.replace(/^\//, '')}`;
  const { response } = await get(path, { method: 'HEAD' });
  const type = response.headers.get('content-type') ?? '';
  if (/webp|avif/.test(type)) {
    pass('question images served as WebP/AVIF', type);
  } else {
    warn(
      'question images still served as PNG',
      `${type} — blocked on issue #4 (astro:assets pipeline)`,
    );
  }
});

console.log(
  `\n${failures ? '✗' : '✓'} ${failures} failure(s), ${warnings} warning(s)`,
);
process.exit(failures ? 1 : 0);
