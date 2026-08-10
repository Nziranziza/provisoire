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
const totalListPages = Math.max(
  1,
  Math.ceil(questionBank.questions.length / PAGE_SIZE),
);
const locales = ['en', 'fr', 'rw'];

/** Extra list pagination URLs (page 2+) so crawlers discover them. */
const listPageUrls = locales.flatMap((lang) =>
  Array.from({ length: Math.max(0, totalListPages - 1) }, (_, i) => {
    const page = i + 2;
    return `${SITE}/${lang}/questions/page/${page}`;
  }),
);

export default defineConfig({
  site: SITE,

  // Static output is the default: no adapter, `astro build` emits `dist/`,
  // which is the directory Cloudflare Pages serves.
  output: 'static',

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
      filter: (page) => !page.includes('/practice'),
      customPages: listPageUrls,
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
