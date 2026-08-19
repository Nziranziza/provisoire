// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import questionBank from './questions.json' with { type: 'json' };

// TODO: replace with the production domain once it is registered.
// `site` must be an absolute URL for @astrojs/sitemap to emit canonical
// and hreflang entries.
const SITE = 'https://provisoire.pages.dev';
const PAGE_SIZE = 20;
const locales = ['en', 'fr', 'rw'];
const CATEGORY_SLUGS = {
  1: 'traffic-rules',
  2: 'road-signs',
};

/** @type {Record<string, number>} */
const categoryPageCounts = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([id, slug]) => {
    const count = questionBank.questions.filter(
      (q) => q.category_id === Number(id),
    ).length;
    return [slug, Math.max(1, Math.ceil(count / PAGE_SIZE))];
  }),
);

/**
 * @param {string} basePath
 * @param {number} questionCount
 * @param {number} [fromPage=2]
 */
function pageUrlsForCount(basePath, questionCount, fromPage = 2) {
  const total = Math.max(1, Math.ceil(questionCount / PAGE_SIZE));
  return Array.from({ length: Math.max(0, total - fromPage + 1) }, (_, i) => {
    const page = fromPage + i;
    return `${SITE}${basePath}/page/${page}`;
  });
}

/** Extra list pagination URLs so crawlers discover them. */
const listPageUrls = locales.flatMap((lang) => {
  const all = pageUrlsForCount(
    `/${lang}/questions`,
    questionBank.questions.length,
  );
  const byCategory = Object.entries(categoryPageCounts).flatMap(
    ([slug, totalPages]) =>
      Array.from({ length: totalPages }, (_, i) => {
        const page = i + 1;
        return `${SITE}/${lang}/questions/page/${page}/category/${slug}`;
      }),
  );
  return [...all, ...byCategory];
});

/** /questions/page/1 → canonical /questions (page 1 has no /page/1 route). */
const pageOneRedirects = Object.fromEntries(
  locales.map((lang) => [`/${lang}/questions/page/1`, `/${lang}/questions`]),
);

/** Old /category/... paths → /page/N/category/... */
const categoryRedirects = Object.fromEntries(
  locales.flatMap((lang) =>
    Object.entries(categoryPageCounts).flatMap(([slug, totalPages]) => {
      const entries = [
        [
          `/${lang}/questions/category/${slug}`,
          `/${lang}/questions/page/1/category/${slug}`,
        ],
      ];
      for (let page = 2; page <= totalPages; page++) {
        entries.push([
          `/${lang}/questions/category/${slug}/page/${page}`,
          `/${lang}/questions/page/${page}/category/${slug}`,
        ]);
      }
      return entries;
    }),
  ),
);

export default defineConfig({
  site: SITE,

  // Static output is the default: no adapter, `astro build` emits `dist/`,
  // which is the directory Cloudflare Pages serves.
  output: 'static',

  redirects: { ...pageOneRedirects, ...categoryRedirects },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'rw'],
    routing: {
      prefixDefaultLocale: true,
    },
  },

  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', fr: 'fr', rw: 'rw' },
      },
      filter: (page) => !page.includes('/practice') && !page.includes('/exam'),
      customPages: listPageUrls,
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    esbuild: {
      jsx: 'automatic',
      // Avoid _jsxDEV runtime mismatch when NODE_ENV is inconsistent (e.g. Tailwind/PostCSS).
      jsxDev: false,
    },
  },
});
