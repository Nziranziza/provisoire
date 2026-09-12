# Deployment — Cloudflare Pages

Static export (`astro build` → `dist/`), served by Cloudflare Pages. The
platform choice is deliberate: the free tier permits commercial use and has
unlimited bandwidth, and Cloudflare has a point of presence in Kigali, so
Rwandan traffic is not round-tripped to Europe. Nothing in the repo is
Cloudflare-specific beyond `public/_headers` and the generated `dist/_redirects`,
so the site stays portable.

## 1. Connect the project

Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.

| Setting           | Value                |
| ----------------- | -------------------- |
| Production branch | `main`               |
| Build command     | `npm run build`      |
| Output directory  | `dist`               |
| Node version      | `22` (from `.nvmrc`) |

`prebuild` runs `scripts/prepare-pwa.mjs` automatically, so `npm run build` is
the only command needed.

### Environment variables

Set under Settings → Environment variables. Production and Preview are separate
scopes — see `.env.example` for the same list.

| Variable                          | Scope      | Notes                                                                                                                                                  |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SITE_URL`                        | Production | Absolute origin, no trailing slash. Drives canonicals, hreflang, sitemap, robots.txt. Defaults to `https://umuhanda.rw`, so production needs no value. |
| `PUBLIC_CLARITY_PROJECT_ID`       | Production | Optional override; empty string disables Clarity.                                                                                                      |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Production | Only needed for the HTML-tag verification method.                                                                                                      |
| `PUBLIC_BING_SITE_VERIFICATION`   | Production | Same, for Bing (`msvalidate.01`).                                                                                                                      |

`CF_PAGES_BRANCH` is injected by Cloudflare. The build uses it to keep preview
branches out of the index (`robots.txt` becomes `Disallow: /`) and out of
Clarity.

### How these reach the build

Every variable here is consumed **at build time** — the output is a static
export, so nothing is read at request time and no secret can leak into the
bundle beyond what is deliberately inlined.

- **`.env` is never deployed.** It is gitignored, Cloudflare clones the repo, so
  it simply is not there. `.env.example` is documentation only — nothing reads
  it. On Cloudflare the values come from the dashboard as real environment
  variables.
- **A deploy with zero variables set is valid.** Every one has a default in
  code: `site` falls back to `https://umuhanda.rw`, Clarity to the id
  in `Analytics.astro`, and the verification tags are simply omitted. Setting
  `SITE_URL` is the only thing needed to move to the real domain.
- **Precedence** is real environment variable → `.env` → default in code, so a
  local `.env` can never override what Cloudflare or CI sets.
- **`PUBLIC_*` vars are inlined into the HTML** via `import.meta.env`. That is
  correct for these three (a Clarity id and two verification tokens are public
  by nature). Never put a secret behind a `PUBLIC_` prefix.
- **Non-prefixed vars** (`SITE_URL`, `CF_PAGES_BRANCH`) are read from
  `process.env` in Node-side code: `astro.config.mjs`, the `robots.txt`
  endpoint, and `Analytics.astro`'s frontmatter. Vite does not expose
  unprefixed vars to `import.meta.env`, which is why these use `process.env`.
  `astro.config.mjs` is evaluated _before_ Vite loads `.env`, so it calls
  Vite's `loadEnv` itself — without that, `SITE_URL` in a local `.env` would be
  silently ignored while `PUBLIC_*` vars worked, which is a confusing trap.

## 2. Custom domain — umuhanda.rw

`https://umuhanda.rw` (apex, no `www`) is the canonical origin and is the
default baked into `astro.config.mjs`, so no `SITE_URL` variable is needed for
production. Set `SITE_URL` only to point a deployment somewhere else.

Settings → Domains → Set up a domain → `umuhanda.rw`. HTTPS is automatic;
Cloudflare issues the certificate.

**Already attached as of 2026-09-10** — `https://umuhanda.rw` serves the site
today. It was serving a build whose canonicals and sitemap all pointed at
`provisoire.pages.dev`, because `site` still defaulted to the pages.dev origin
and no `SITE_URL` was set. Making `umuhanda.rw` the default in
`astro.config.mjs` fixes that; **the next deploy is what applies it**, so
re-run `npm run verify:deploy -- https://umuhanda.rw` afterwards and confirm
the two origin warnings are gone.

**Add `www.umuhanda.rw` too, and redirect it to the apex.** If `www` resolves
but is not redirected, it becomes a second crawlable copy of the whole site.
Add it as a custom domain, then a Redirect Rule (Rules → Redirects) from
`www.umuhanda.rw/*` to `https://umuhanda.rw/$1` with a 301. The same applies to
the `*.pages.dev` origin: it stays reachable, but every page self-canonicalizes
to `umuhanda.rw`, so it will not be indexed in its own right.

After the domain resolves:

1. `curl -s https://umuhanda.rw/en/questions/1 | grep canonical` — must show
   the apex domain.
2. `curl -sI https://www.umuhanda.rw/` — must be a 301 to the apex.
3. Run the full check: `npm run verify:deploy -- https://umuhanda.rw`.

`.rw` note: Cloudflare cannot register `.rw`, so the domain stays at its
current registrar with Cloudflare's nameservers set there. Keep the registrar
renewal on the same calendar reminder as the certificate — an expired `.rw`
registration takes the site down and drops the search rankings with it.

## 3. ⚠️ Cloudflare settings that silently damage SEO

Check these in the zone dashboard after the domain is attached. Each fails
invisibly — pages simply never get indexed.

- **Bot Fight Mode / Super Bot Fight Mode → OFF** (Security → Bots). Googlebot
  is on the verified-bot list and passes, but Bingbot, Yandex and tools such as
  Ahrefs get challenged or blocked outright.
- **Rocket Loader → OFF** (Speed → Optimization). It defers and reorders JS
  execution. Content pages ship almost no JS by design, so there is nothing to
  gain and real breakage to lose.
- **Email Obfuscation → OFF**. It rewrites page content and injects script.
- **Auto Minify** is retired platform-wide; if the toggle is still present,
  leave it off — the build already minifies.

### Managed robots.txt is ON (and that is fine)

Cloudflare is currently **prepending** its managed block to `/robots.txt`
(AI Crawl Control → robots.txt). Verified on the live domain: it adds a
`Content-Signal: search=yes,ai-train=no,use=reference` policy plus
`Disallow: /` for named AI crawlers (GPTBot, ClaudeBot, CCBot, Bytespider,
Amazonbot, meta-externalagent, …), then our own file follows intact —
`User-agent: *` / `Allow: /` and the `Sitemap:` line both survive at the end.

So search crawlers are unaffected and the sitemap is still discoverable. Worth
knowing because the file served is **not** byte-identical to
`src/pages/robots.txt.ts`: if a `Disallow` ever appears to come from nowhere,
this is where it comes from. `verify:deploy` asserts the `Sitemap:` line and
the absence of a blanket `Disallow: /` against the live response, so a change
in Cloudflare's managed content will be caught.

`npm run verify:deploy` checks the bot-protection part of this by requesting a
question page as Googlebot and as Bingbot and failing on a `cf-mitigated`
response header.

## 4. Analytics — Microsoft Clarity

`src/components/Analytics.astro` injects the Clarity tag only from a Cloudflare
Pages build of the production branch — it requires `CF_PAGES=1` _and_
`CF_PAGES_BRANCH=main`, so a local build, `astro preview` and the
`wrangler pages dev` flow below all stay silent rather than sending activity to
the real project. To exercise the tag locally, build with
`CF_PAGES=1 CF_PAGES_BRANCH=main`. The project id is public by design and
defaulted in that file.

**Consent note:** Clarity sets first-party cookies (`_clck`, `_clsk`) and
records sessions, so it is _not_ cookieless. The original plan assumed
Cloudflare Web Analytics, which is, and therefore needed no consent banner.
If EU/UK traffic becomes material, either add a consent gate before the Clarity
tag or switch to Cloudflare Web Analytics (Dashboard → Web Analytics; it
auto-injects its own beacon and needs no code change here).

## 5. Google Search Console

1. Add a **Domain property** (`umuhanda.rw`) and verify by DNS TXT — the domain
   is already on Cloudflare DNS, so this is one record and it covers every
   subdomain and protocol. Use `PUBLIC_GOOGLE_SITE_VERIFICATION` only if you
   must use the HTML-tag method instead.
2. Sitemaps → submit `sitemap-index.xml`.
3. URL Inspection → request indexing for one question page and confirm
   "URL is available to Google" with the rendered content present.
4. International Targeting → confirm the `en`/`fr`/`rw` + `x-default` cluster is
   read with no "no return tags" errors. Errors here take days to clear after a
   fix, so check it early.

## 6. Bing Webmaster Tools

1. Add the site; import from Search Console if the GSC property is already
   verified (fastest path).
2. Submit `sitemap-index.xml`.
3. URL Inspection → fetch a question page as Bingbot. **This is the check that
   catches Bot Fight Mode** — Bing is not on Cloudflare's verified-bot list.

## 7. Verification checklist

Run against the deployed origin:

```sh
npm run verify:deploy -- https://umuhanda.rw
```

`_headers` and `_redirects` are Cloudflare features, so `astro preview` ignores
them. To exercise them locally, serve the build through the Pages emulator
first:

```sh
npm run build
npx wrangler pages dev dist --port 8789
npm run verify:deploy -- http://127.0.0.1:8789
```

Origin-dependent checks (canonical, `robots.txt` sitemap line) are reported as
warnings against a localhost origin, since the build carries the `SITE_URL` it
was built with.

It checks: canonical URLs answering 200 with no redirect hop (and the
trailing-slash variant folding onto them), question content present in the
served HTML, `Quiz` JSON-LD,
self-canonical matching the deployed origin, the full hreflang cluster, `/`
serving the home page, all three locale roots, `robots.txt` sitemap line,
sitemap index + `xhtml:link` alternates, `_redirects` returning a real 301,
`_headers` (immutable `/_astro`, no-cache `sw.js`, `nosniff`), Googlebot and
Bingbot both unchallenged, and image content types.

Manually, once:

- Lighthouse mobile ≥95 Performance and SEO on a question page.
- `curl -s https://umuhanda.rw/en/questions/1 | grep -i "<some question text>"` —
  content in the HTML, no JS needed.

## Build and plan notes

- Free plan: 500 builds/month, 1 concurrent build, 20,000 files per deployment.
  Current deployment is roughly 2,000 files, so there is ample headroom.
  Per-question OG images (issue #21) would add ~600 files and lengthen the
  build.
- **Images are still PNG.** Build-time AVIF/WebP conversion via `astro:assets`
  is issue #4 and is not part of this deploy; `verify:deploy` reports it as a
  warning rather than a failure. When that lands, re-check build duration —
  Cloudflare's build container is slower than most, and `sharp` over ~200
  images is the slowest step. If it becomes painful, commit the optimized
  derivatives instead of generating them per build.

## URL shape: no trailing slashes

`astro.config.mjs` sets `trailingSlash: 'never'` with `build.format: 'file'`,
so the build emits `en/questions/1.html` rather than
`en/questions/1/index.html`.

This is not cosmetic. Cloudflare Pages serves a `.html` file at its
extensionless path with a **200** and 308s the trailing-slash variant onto it.
The directory layout does the exact opposite — it 308s every extensionless URL
onto a trailing slash. Since every link, canonical and sitemap entry this site
generates is slash-free (`/en/questions/1`, from the helpers in
`src/lib/quiz.ts`), the directory layout meant:

- every canonical URL was a 308, so Search Console saw a sitemap full of
  redirecting URLs and canonicals pointing at redirects;
- every navigation paid an extra round trip before the HTML started arriving —
  worst on the mobile connections this site is built for;
- the service worker precached slash-free URLs (`/en/questions`) that no longer
  matched what a navigation actually requested.

Measured against the Pages emulator, before and after:

| Request            | `format: 'directory'`    | `format: 'file'` (now)  |
| ------------------ | ------------------------ | ----------------------- |
| `/en/questions/1`  | 308 → `/en/questions/1/` | **200**                 |
| `/en/questions/1/` | 200                      | 308 → `/en/questions/1` |

`verify:deploy` asserts both halves, so the regression cannot return quietly.
Keep `trailingSlash`, `build.format` and the href helpers in step.

## Redirects: why `/` is not redirected

The original plan called for `_redirects` to send `/` → `/en`. That is now
wrong, and deliberately not done:

- `/` renders the English home page (`src/pages/index.astro`) and is the only
  page carrying the `WebSite` and `Organization` JSON-LD.
- `/` is the PWA `start_url` and is precached by the service worker.
- Cloudflare follows `_redirects` **before** serving a matching asset
  ("Redirects are always followed, regardless of whether or not an asset
  matches the incoming request"), so such a rule would shadow the home page
  entirely rather than acting as a fallback.

`/` self-canonicalizes to `/en/questions`, which resolves the duplication
without a redirect.

The rules that _are_ in `dist/_redirects` are the legacy pagination paths, and
they are generated at build time by `integrations/cloudflare-redirects.mjs`
from `src/lib/redirect-map.mjs` — the same map `astro.config.mjs` uses for its
meta-refresh fallback pages, so the two cannot drift. Hand-written rules can be
added to `public/_headers`' sibling `public/_redirects`; the integration
appends the generated rules to that file rather than overwriting it.
