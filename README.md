# Provisoire — Rwanda Provisional Driving Test Prep

[![CI](https://github.com/Nziranziza/provisoire/actions/workflows/ci.yml/badge.svg)](https://github.com/Nziranziza/provisoire/actions/workflows/ci.yml)
[![Live Site](https://img.shields.io/badge/Production-umuhanda.rw-1d4ed8.svg)](https://umuhanda.rw)
[![Node Version](https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen.svg)](.nvmrc)
[![Astro Version](https://img.shields.io/badge/Astro-7.x-orange.svg)](https://astro.build)

**Provisoire** is a modern, fast, and accessible trilingual web application designed to help learners in Rwanda prepare for and pass their provisional driving license exam (_Ikizamini cy'uruhushya rw'agateganyo / Examen du permis de conduire provisoire_).

The platform provides a comprehensive question bank covering official Rwanda traffic rules and road signs, timed mock exam simulations, untimed practice quizzes with instant explanations, and full offline Progressive Web App (PWA) capabilities.

**Live site:** [https://umuhanda.rw](https://umuhanda.rw) (Mirror: [https://provisoire.pages.dev](https://provisoire.pages.dev))

---

## Features

- **Trilingual Driving Bank**: 198 curated questions available in **Kinyarwanda** (primary default), **English**, and **French**.
- **Interactive Practice Mode**: Untimed quiz session with instant feedback, explanations, and progress saving.
- **Timed Exam Simulator**: 20-minute timed mock test mirroring official Rwanda driving examination conditions.
- **Client-Side Instant Search**: Fast, locale-scoped search with token stemming, number matching, and keyword filtering without server roundtrips.
- **Offline PWA Support**: Service worker caching, installable on mobile and desktop, with on-demand road sign image pack downloading for complete offline studying.
- **SEO & Accessibility**: Fully pre-rendered static HTML, Schema.org (`Quiz`, `FAQPage`, `WebSite`, `BreadcrumbList`) JSON-LD structured data, complete `hreflang` reciprocity, and WCAG AA accessible design.

---

## Tech Stack

- **Framework**: [Astro 7](https://astro.build/) (Static Site Generation with i18n routing)
- **UI Islands**: [React 19](https://react.dev/) & TypeScript for interactive practice sessions, exam timers, and PWA prompts
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) via `@tailwindcss/vite`
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Hosting & CDN**: [Cloudflare Pages](https://pages.cloudflare.com/) (Static deployment with Kigali Edge PoP routing)
- **Tooling**: ESLint 10, Prettier 3, Astro Check

---

## Prerequisites

- **Node.js**: `>=22.12.0` (matching [.nvmrc](.nvmrc) and [package.json](package.json))
- **npm**: `>=9.6.5`

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Nziranziza/provisoire.git
cd provisoire
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser to view the application.

---

## Available Scripts

| Script                   | Command                                                  | Description                                                                      |
| ------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `dev`                    | `astro dev --host`                                       | Starts the local Astro development server accessible on local network            |
| `predev`                 | `node scripts/prepare-pwa.mjs`                           | Generates PWA icons, favicons, and syncs question bank data before dev           |
| `prebuild`               | `node scripts/prepare-pwa.mjs`                           | Prepares PWA icons and copies question data before building                      |
| `build`                  | `astro build`                                            | Compiles the production-ready static site into the `dist/` directory             |
| `preview`                | `astro preview --host`                                   | Serves the static `dist/` build locally for preview and validation               |
| `check`                  | `astro check`                                            | Runs TypeScript typechecking and Astro diagnostics across all files              |
| `lint`                   | `eslint .`                                               | Lints JavaScript, TypeScript, React, and Astro files with ESLint                 |
| `lint:fix`               | `eslint . --fix`                                         | Automatically fixes fixable ESLint errors across the codebase                    |
| `format`                 | `prettier --write .`                                     | Formats all code, markup, styles, and configurations using Prettier              |
| `format:check`           | `prettier --check .`                                     | Verifies that all files conform to Prettier code formatting standards            |
| `verify:search`          | `node scripts/verify-search.mjs`                         | Tests client search token indices, stemming, and ranking across all 3 locales    |
| `verify:structured-data` | `node scripts/verify-structured-data.mjs`                | Validates Schema.org JSON-LD structured data on rendered pages                   |
| `verify:crawl`           | `node scripts/verify-seo-crawl.mjs`                      | Crawls `dist/` verifying canonical tags, hreflang clusters, titles, and metadata |
| `verify:seo`             | `npm run verify:structured-data && npm run verify:crawl` | Runs both structured data and SEO crawl verification suites                      |
| `verify:deploy`          | `node scripts/verify-deployment.mjs`                     | Verifies deployed headers, robots.txt, 301 redirects, and crawler access         |

---

## Project Structure

```text
provisoire/
├── .github/              # GitHub Actions CI workflow definitions
├── docs/                 # Documentation (architecture, deployment guides)
│   └── deployment.md     # Cloudflare Pages production deployment guide
├── integrations/         # Custom Astro integrations
│   └── cloudflare-redirects.mjs # Emits 301 rules to dist/_redirects
├── public/               # Static public assets
│   ├── _headers          # Cloudflare Pages security & caching headers
│   ├── data/             # Synced offline question bank JSON
│   ├── icons/            # App icons, favicons, and PWA manifest assets
│   ├── images/           # Road sign illustrations and figures
│   ├── manifest.json     # Web app manifest
│   └── sw.js             # Service worker for offline precaching and runtime caching
├── questions.json        # Central source of truth for questions and translations
├── scripts/              # Build utilities, SEO audits, and verification tools
│   ├── generate-pwa-icons.mjs      # Generates SVG/PNG app icons
│   ├── prepare-pwa.mjs             # Pre-build asset preparation script
│   ├── verify-deployment.mjs       # Deployment verification suite
│   ├── verify-search.mjs           # Search token index validation
│   ├── verify-seo-crawl.mjs        # SEO crawler and metadata auditor
│   └── verify-structured-data.mjs  # JSON-LD Schema.org auditor
├── src/
│   ├── components/       # Astro and React UI components
│   │   ├── practice/     # Practice session state, reducers, and copy
│   │   ├── quiz/         # Question cards, option selectors, and toolbars
│   │   └── PracticeSession.tsx # React interactive exam & practice island
│   ├── layouts/          # Astro base HTML layout templates
│   ├── lib/              # Core business logic, i18n copy, search, and SEO helpers
│   │   ├── pwa.ts        # PWA lifecycle, install prompts, offline queue
│   │   ├── quiz.ts       # Question helpers, category constants, URL formatters
│   │   ├── redirect-map.mjs # Canonical redirect map source of truth
│   │   ├── search.ts     # Client search indexing and morphology engine
│   │   └── seo.ts        # Canonical, hreflang, OpenGraph, and JSON-LD builders
│   ├── pages/            # Astro file-based static routing
│   │   ├── index.astro   # Root homepage (serves Kinyarwanda default)
│   │   ├── en/           # English localized routes
│   │   ├── fr/           # French localized routes
│   │   ├── rw/           # Kinyarwanda localized routes
│   │   └── robots.txt.ts # Dynamic robots.txt endpoint
│   └── styles/           # Global styles and Tailwind configuration
├── astro.config.mjs      # Astro configuration (i18n, sitemap, Vite plugins)
├── eslint.config.js      # ESLint configuration
└── package.json          # Node dependencies, scripts, and engine specifications
```

---

## Content & Question Bank

All questions are maintained in [`questions.json`](questions.json), structured with:

- Unique UUID identifier (`id`)
- Category ID (`1`: Traffic Rules / _Amategeko y’umuhanda_, `2`: Road Signs / _Ibyapa byo ku muhanda_)
- Optional image path (`image_url`)
- 0-based and 1-based correct option indices
- Trilingual translation maps (`rw`, `en`, `fr`) containing:
  - `question`: Localized question statement
  - `options`: Array of 4 localized multiple-choice answer strings
  - `correct_answer`: Explicit correct answer text
  - `explanation`: Optional pedagogical explanation for the correct answer

When modifying or adding questions, validate the bank before submitting:

```bash
npm run build
npm run verify:seo
npm run verify:search
```

---

## Deployment

The application is statically built and deployed automatically via **Cloudflare Pages** on every push to `main` and preview branch.

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: `22` (specified in [.nvmrc](.nvmrc))
- **Production URL**: [https://umuhanda.rw](https://umuhanda.rw)

For comprehensive details on DNS configuration, custom apex domains, Microsoft Clarity analytics, caching headers, and robot crawler policies, refer to [docs/deployment.md](docs/deployment.md).

---

## Contributing

1. **Fork or create a branch**: Use feature or issue-based branch names:
   ```bash
   git checkout -b <issue-number>-<short-description>
   # Example: git checkout -b 35-default-rw-language
   ```
2. **Follow commit conventions**: Use clear [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: make Kinyarwanda the default language`
   - `fix: update site footer links and install guide`
   - `docs: add comprehensive root README`
3. **Verify locally**: Before opening a Pull Request, ensure all CI checks pass:
   ```bash
   npm run check
   npm run lint
   npm run format:check
   npm run build
   npm run verify:seo
   ```

---

## License

Private / Proprietary. All rights reserved.
