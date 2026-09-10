import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import questionBank from './questions.json' with { type: 'json' };
import { buildRedirectMap } from './src/lib/redirect-map.mjs';
import cloudflareRedirects from './integrations/cloudflare-redirects.mjs';

// This file is evaluated before Vite loads `.env`, so a local `.env` would not
// reach `process.env` here — unlike in components, where `import.meta.env`
// picks up `PUBLIC_*` vars. Load it explicitly so both behave the same way.
// A real environment variable (Cloudflare Pages, CI, the shell) still wins.
const fileEnv = loadEnv(
  process.env.NODE_ENV ?? 'production',
  process.cwd(),
  '',
);

// The production domain. Override per deployment with the `SITE_URL` build
// environment variable (set it in Cloudflare Pages → Settings → Environment
// variables) so preview branches can emit their own canonicals.
// `site` must be an absolute URL for @astrojs/sitemap to emit canonical
// and hreflang entries.
const SITE = process.env.SITE_URL ?? fileEnv.SITE_URL ?? 'https://umuhanda.rw';
const PAGE_SIZE = 20;
const locales = ['en', 'fr', 'rw'];
const CATEGORY_SLUGS = {
  1: 'traffic-rules',
  2: 'road-signs',
};

const redirects = buildRedirectMap({
  questionBank,
  categorySlugs: CATEGORY_SLUGS,
  pageSize: PAGE_SIZE,
  locales,
});

export default defineConfig({
  site: SITE,

  // Static output is the default: no adapter, `astro build` emits `dist/`,
  // which is the directory Cloudflare Pages serves.
  output: 'static',

  // Emit `en/questions/1.html` rather than `en/questions/1/index.html`.
  // Cloudflare Pages serves a `.html` file at its extensionless path with a
  // 200 and 308s the trailing-slash variant onto it — the opposite of the
  // directory layout, which 308s every extensionless URL onto a trailing
  // slash. Since every link, canonical and sitemap entry this site generates
  // is extensionless and slash-free (`/en/questions/1`), the directory layout
  // made each canonical URL a redirect: Search Console then sees a sitemap
  // whose URLs redirect and canonicals pointing at redirects, and every
  // navigation pays an extra round trip. Keep these two in step with the
  // href helpers in src/lib/quiz.ts.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },

  server: {
    host: true,
  },

  devToolbar: {
    enabled: false,
  },

  redirects,

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
          page.endsWith('.json') ||
          page.endsWith('.txt');

        return !isClientOnlyRoute && !isApiEndpoint;
      },
    }),
    cloudflareRedirects(redirects),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
