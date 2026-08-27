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

/** Page 1 redirects → canonical root URLs (page 1 has no /page/1 route). */
const pageOneRedirects = Object.fromEntries(
  locales.flatMap((lang) => [
    [`/${lang}/questions/page/1`, `/${lang}/questions`],
    ...Object.values(CATEGORY_SLUGS).map((slug) => [
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
      filter: (page) => {
        // Exclude client-only interactive routes (practice sessions, exam simulators, results)
        // and internal API endpoints from the XML sitemap.
        const isClientOnlyRoute =
          page.includes('/practice') ||
          page.includes('/exam') ||
          page.includes('/results') ||
          page.includes('/session');
        const isApiEndpoint =
          page.includes('/q-index') ||
          page.includes('/search-index') ||
          page.endsWith('.json');

        return !isClientOnlyRoute && !isApiEndpoint;
      },
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
