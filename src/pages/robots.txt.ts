import type { APIRoute } from 'astro';

export const prerender = true;

/**
 * robots.txt is generated rather than static so the `Sitemap:` line always
 * matches `site` in astro.config.mjs (and the `SITE_URL` override used by
 * preview deployments), instead of drifting when the domain changes.
 *
 * Preview deployments are excluded from indexing so *.pages.dev branch URLs
 * cannot compete with the production domain in search results.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('/sitemap-index.xml', site).href;
  const isProduction = process.env.CF_PAGES_BRANCH
    ? process.env.CF_PAGES_BRANCH === 'main'
    : true;

  const body = isProduction
    ? `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`
    : `User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
