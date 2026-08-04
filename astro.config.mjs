// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// TODO: replace with the production domain once it is registered.
// `site` must be an absolute URL for @astrojs/sitemap to emit canonical
// and hreflang entries.
const SITE = 'https://provisoire.pages.dev';

export default defineConfig({
  site: SITE,

  // Static output is the default: no adapter, `astro build` emits `dist/`,
  // which is the directory Cloudflare Pages serves.
  output: 'static',

  // English is served from the bare path (`/`), French and Kinyarwanda from
  // `/fr/` and `/rw/`. Matches the three locales in questions.json.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'rw'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', fr: 'fr', rw: 'rw' },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
