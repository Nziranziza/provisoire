import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

// Note: eslint-plugin-jsx-a11y is deliberately absent — its current release
// caps out at ESLint 9. Revisit once it supports ESLint 10.
export default defineConfig(
  globalIgnores(['dist/**', '.astro/**', 'node_modules/**', 'tools/**']),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
