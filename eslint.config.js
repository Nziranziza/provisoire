import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

// Note: eslint-plugin-jsx-a11y is deliberately absent — its current release
// caps out at ESLint 9. Revisit once it supports ESLint 10.
export default defineConfig(
  // `.wrangler/**` holds the Pages emulator's generated bundles — linting them
  // fails the run for code we do not own.
  globalIgnores([
    'dist/**',
    '.astro/**',
    '.wrangler/**',
    'node_modules/**',
    'tools/**',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Build-time Node code: scripts, the Astro config, and build integrations.
    files: [
      'scripts/**/*.{js,mjs}',
      'integrations/**/*.{js,mjs}',
      'astro.config.mjs',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['public/sw.js', '**/sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.builtin,
      },
    },
  },
);
