/**
 * Legacy/duplicate URL paths and where they now belong.
 *
 * Shared by two consumers so the two can never drift:
 *  - `astro.config.mjs` (`redirects`), which emits a meta-refresh HTML page for
 *    each entry so `npm run preview` and any non-Cloudflare host still work.
 *  - `integrations/cloudflare-redirects.mjs`, which writes the same map to
 *    `dist/_redirects` as real 301s. Cloudflare Pages follows `_redirects`
 *    before serving an asset, so on production the 301 wins over the HTML page.
 */

const DEFAULT_LOCALES = ['rw', 'en', 'fr'];

/**
 * @param {object} options
 * @param {{ questions: { category_id: number }[] }} options.questionBank
 * @param {Record<number | string, string>} options.categorySlugs
 * @param {number} options.pageSize
 * @param {string[]} [options.locales]
 * @returns {Record<string, string>} source path → destination path
 */
export function buildRedirectMap({
  questionBank,
  categorySlugs,
  pageSize,
  locales = DEFAULT_LOCALES,
}) {
  /** @type {Record<string, number>} */
  const categoryPageCounts = Object.fromEntries(
    Object.entries(categorySlugs).map(([id, slug]) => {
      const count = questionBank.questions.filter(
        (q) => q.category_id === Number(id),
      ).length;
      return [slug, Math.max(1, Math.ceil(count / pageSize))];
    }),
  );

  /** Page 1 redirects → canonical root URLs (page 1 has no /page/1 route). */
  const pageOneRedirects = Object.fromEntries(
    locales.flatMap((lang) => [
      [`/${lang}/questions/page/1`, `/${lang}/questions`],
      ...Object.values(categorySlugs).map((slug) => [
        `/${lang}/questions/category/${slug}/page/1`,
        `/${lang}/${slug}`,
      ]),
      ...Object.values(categorySlugs).map((slug) => [
        `/${lang}/${slug}/page/1`,
        `/${lang}/${slug}`,
      ]),
    ]),
  );

  /** Legacy /page/N/category/... paths → /category/...[/page/N] */
  const categoryRedirects = Object.fromEntries(
    locales.flatMap((lang) =>
      Object.entries(categoryPageCounts).flatMap(([slug, totalPages]) => {
        const entries = [
          [`/${lang}/questions/page/1/category/${slug}`, `/${lang}/${slug}`],
        ];
        for (let page = 2; page <= totalPages; page++) {
          entries.push([
            `/${lang}/questions/page/${page}/category/${slug}`,
            `/${lang}/${slug}/page/${page}`,
          ]);
        }
        return entries;
      }),
    ),
  );

  /** Legacy category routes → locale category hub URLs. */
  const legacyCategoryRedirects = Object.fromEntries(
    locales.flatMap((lang) =>
      Object.entries(categoryPageCounts).flatMap(([slug, totalPages]) => [
        [`/${lang}/questions/category/${slug}`, `/${lang}/${slug}`],
        ...Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;
          const target =
            page > 1 ? `/${lang}/${slug}/page/${page}` : `/${lang}/${slug}`;
          return [`/${lang}/questions/category/${slug}/page/${page}`, target];
        }),
        ...Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;
          const target =
            page > 1 ? `/${lang}/${slug}/page/${page}` : `/${lang}/${slug}`;
          return [`/${lang}/questions/page/${page}/category/${slug}`, target];
        }),
      ]),
    ),
  );

  /** Unprefixed root aliases → default locale (rw) pages */
  const rootAliases = {
    '/terms': '/rw/terms',
    '/privacy': '/rw/privacy',
    '/about': '/rw/about',
    '/practice': '/rw/practice',
    '/exam': '/rw/exam',
    '/traffic-rules': '/rw/traffic-rules',
    '/road-signs': '/rw/road-signs',
  };

  return {
    ...rootAliases,
    ...pageOneRedirects,
    ...categoryRedirects,
    ...legacyCategoryRedirects,
  };
}
