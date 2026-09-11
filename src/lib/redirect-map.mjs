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

const DEFAULT_LOCALES = ['en', 'fr', 'rw'];

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
        `/${lang}/questions/category/${slug}`,
      ]),
    ]),
  );

  /** Legacy /page/N/category/... paths → /category/...[/page/N] */
  const categoryRedirects = Object.fromEntries(
    locales.flatMap((lang) =>
      Object.entries(categoryPageCounts).flatMap(([slug, totalPages]) => {
        const entries = [
          [
            `/${lang}/questions/page/1/category/${slug}`,
            `/${lang}/questions/category/${slug}`,
          ],
        ];
        for (let page = 2; page <= totalPages; page++) {
          entries.push([
            `/${lang}/questions/page/${page}/category/${slug}`,
            `/${lang}/questions/category/${slug}/page/${page}`,
          ]);
        }
        return entries;
      }),
    ),
  );

  return { ...pageOneRedirects, ...categoryRedirects };
}
