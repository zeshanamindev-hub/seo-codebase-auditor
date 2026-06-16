<!--
Sample output of /seo-codebase-auditor:audit run against a FICTIONAL Next.js project ("northwind-store").
This is illustrative. All findings below trace to (fictional) files in that repo.
No traffic, rankings, backlinks, domain authority, or AI-visibility metrics appear — those are not knowable from a codebase.
-->

# Codebase SEO Audit Report

## 1. Audit scope

- **Project name:** northwind-store
- **Project type:** Next.js 14 (App Router)
- **Audit source:** Codebase only
- **Date:** 2026-06-16
- **What was audited:** `package.json`, `next.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/(marketing)/**`, `app/blog/[slug]/page.tsx`, `app/products/[handle]/page.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `app/sitemap.ts`, `public/robots.txt`, `content/blog/*.mdx`. 24 files read; blog/product pages sampled (8 of ~60 routes).
- **What was not audited:** Live traffic, keyword rankings, backlinks, domain authority, AI citations, GA4, Google Search Console, real SERP performance.

> This audit is based only on codebase evidence. It does not include live traffic, keyword rankings, backlinks, real SERP performance, GA4, or Google Search Console data.

## 2. Executive summary

- **Overall codebase SEO health:** C (74/100) — solid foundations, with two crawl-blocking issues that should be fixed before launch.
- **Top strengths:**
  - App Router `metadata` API is used on most routes, with a sensible root template in `app/layout.tsx`.
  - `app/sitemap.ts` generates a dynamic sitemap from content sources.
  - `next/image` is used for product imagery with `width`/`height` set.
- **Top risks:**
  - `public/robots.txt` contains `Disallow: /` — this blocks the entire site from crawling.
  - Canonical base URL is read from a hardcoded `http://localhost:3000` fallback in `lib/seo.ts`, risking localhost canonicals in production.
  - Blog post pages have no `Article`/`BlogPosting` JSON-LD.
- **Top 5 fixes:**
  1. Remove `Disallow: /` from `public/robots.txt` and add the production `Sitemap:` line.
  2. Replace the `localhost:3000` canonical fallback with `NEXT_PUBLIC_SITE_URL` and fail loudly if unset.
  3. Add `BlogPosting` JSON-LD to `app/blog/[slug]/page.tsx`.
  4. Add `alt` text to the three raw `<img>` tags in `components/Hero.tsx`.
  5. Add `metadata.openGraph.images` / an `opengraph-image` for blog and product routes.

## 3. Audit results

| Category | Score | Grade | Status | Confidence | Evidence |
|---|---:|---|---|---|---|
| Technical SEO | 68 | D | Warn | High | `public/robots.txt`, `app/layout.tsx`, `lib/seo.ts` |
| Metadata | 80 | B | Pass | High | `app/layout.tsx`, `app/blog/[slug]/page.tsx` |
| Schema | 55 | F | Fail | High | `app/layout.tsx` (Organization only) |
| Sitemap | 90 | A | Pass | High | `app/sitemap.ts` |
| Robots.txt | 40 | F | Fail | High | `public/robots.txt` |
| Canonicals | 60 | D | Warn | High | `lib/seo.ts` |
| Internal links | 78 | C | Pass | Medium | `components/Header.tsx`, `components/Footer.tsx` |
| Image optimization | 72 | C | Warn | High | `components/Hero.tsx`, `app/products/[handle]/page.tsx` |
| Accessibility basics | 75 | C | Warn | Medium | `components/Header.tsx`, `app/contact/page.tsx` |
| Performance setup | 82 | B | Pass | Medium | `next.config.mjs`, `app/blog/[slug]/page.tsx` |
| Framework SEO implementation | 78 | C | Pass | High | `app/**`, `app/sitemap.ts` |
| Content structure | 76 | C | Pass | Medium | `content/blog/*.mdx` |
| AI visibility readiness | 58 | F | Warn | Medium | `app/layout.tsx`, `content/**` |

## 4. Technical SEO

**What is working**
- Most routes are statically generated; `app/blog/[slug]/page.tsx` uses `generateStaticParams` and `export const revalidate = 3600`.
- A single root `metadata` template provides title templating via `title.template`.

**Issues found**

| Issue | Severity | Status | Evidence file | Why it matters | Recommendation |
|---|---|---|---|---|---|
| `Disallow: /` blocks all crawling | Critical | Fail | `public/robots.txt` | Search engines cannot index any page | Remove the blanket disallow; allow crawl of public routes |
| Localhost canonical fallback | High | Warn | `lib/seo.ts` | Production pages may emit `localhost` canonicals | Use `NEXT_PUBLIC_SITE_URL`; throw if missing in prod |
| No 404 metadata | Low | Warn | `app/not-found.tsx` | Minor; soft-404 clarity | Add a `noindex` and a title to the not-found route |

**Recommendations**
- Gate `noindex` behind an explicit `VERCEL_ENV !== 'production'` check rather than a hardcoded robots file.

## 5. Metadata audit

- **Title implementation:** `app/layout.tsx` sets `title.template = "%s · Northwind"`; routes export `metadata.title`. Verified on home, blog, product.
- **Meta description implementation:** Present on home and product routes; **missing** on `app/(marketing)/about/page.tsx`.
- **Open Graph:** `og:title`/`og:description` present via root metadata; **no `og:image`** on blog/product routes.
- **Twitter cards:** `twitter.card = "summary_large_image"` set in root; image inherits the missing OG image.
- **Robots metadata:** Not set per-route; relies on the (currently broken) robots.txt.
- **Duplicate/generic metadata risks:** `app/(marketing)/about/page.tsx` falls back to the root description, duplicating it.
- **Missing metadata:** About page description.
- **Weak placeholder metadata:** None found ("TODO"/"Lorem" not present in scanned files).

## 6. Schema audit

- **JSON-LD usage:** One block — `Organization` — in `app/layout.tsx`.
- **Organization schema:** Present, with `name`, `url`, `logo`.
- **WebSite schema:** Missing (no `WebSite` + `SearchAction`).
- **Article / BlogPosting schema:** Missing on `app/blog/[slug]/page.tsx`.
- **Product schema:** Missing on `app/products/[handle]/page.tsx` (no `Product`/`Offer`).
- **BreadcrumbList schema:** Missing.
- **FAQPage schema:** Not applicable to scanned routes.
- **Invalid or risky schema:** None observed; existing Organization block is valid JSON.

## 7. Sitemap and robots audit

- **Sitemap status:** `app/sitemap.ts` builds entries for static pages, blog posts, and products. Good.
- **Robots.txt status:** `public/robots.txt` exists but contains `User-agent: *` / `Disallow: /` — **blocks everything**.
- **Sitemap declaration inside robots.txt:** Missing `Sitemap:` line.
- **Accidental blocking:** Yes — the blanket `Disallow: /`.
- **Indexation risks:** Critical until robots.txt is fixed.
- **Recommended fixes:** Replace with an allow-by-default robots file and add `Sitemap: https://<prod-domain>/sitemap.xml`. Consider migrating to `app/robots.ts` so env logic is explicit.

## 8. Canonical audit

- **Current canonical implementation:** `lib/seo.ts` builds `alternates.canonical` from `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`.
- **Missing canonical risks:** Product filter/sort query routes have no explicit canonical.
- **Wrong canonical risks:** Localhost fallback can ship to production.
- **Environment URL risks:** Hardcoded `http://localhost:3000` fallback in `lib/seo.ts`.
- **localhost/staging URL leaks:** Confirmed risk via the fallback above.

## 9. Internal linking audit

- **Navigation links:** `components/Header.tsx` links to Home, Products, Blog, About, Contact — all resolvable routes.
- **Footer links:** `components/Footer.tsx` links to legal pages and social; social links use `rel="noopener noreferrer"`. Good.
- **Blog/content links:** MDX posts cross-link to related posts in `content/blog/*.mdx`.
- **Breadcrumbs:** No breadcrumb component found.
- **Empty href values:** One `href="#"` placeholder in `components/Header.tsx` (mobile menu toggle should be a `<button>`).
- **Broken-looking links:** None detected in scanned files.
- **Orphan page risks:** `app/(marketing)/careers/page.tsx` has no inbound link in nav/footer/content sampled.
- **External links with target blank and rel:** Footer social links correct; no other external links found.

## 10. Image optimization audit

- **next/image usage:** Used in product and blog templates with `width`/`height`.
- **Raw img usage:** Three `<img>` tags in `components/Hero.tsx`.
- **Missing alt text:** The three `Hero.tsx` images have no `alt`.
- **Empty alt misuse:** None found.
- **LCP image risks:** Hero image lacks `priority`; likely the LCP element.
- **Remote image config:** `next.config.mjs` sets `images.remotePatterns` for the CDN host. Good.
- **Width/height attributes:** Present where `next/image` is used.
- **Lazy loading:** Default lazy loading active; ensure hero is `priority` (eager) instead.

## 11. Accessibility basics audit

- **Heading structure:** One `<h1>` per scanned page; logical order.
- **h1 usage:** Verified on home, blog, product.
- **Forms:** `app/contact/page.tsx` inputs use associated `<label htmlFor>`. Good.
- **Buttons:** Mobile menu uses an `<a href="#">` instead of `<button>`.
- **Links:** Link text is descriptive (no "click here" found).
- **Images:** See image audit — three missing `alt`.
- **Semantic HTML:** `<header>`, `<nav>`, `<main>`, `<footer>` present in layout.
- **ARIA usage:** Minimal and not misused; mobile toggle would benefit from `aria-expanded`.

## 12. Performance setup audit

- **Static rendering:** Default for marketing routes.
- **ISR/revalidate:** `revalidate = 3600` on blog; products revalidate on-demand via tag.
- **Dynamic rendering risks:** None forced; no `force-dynamic` found in scanned routes.
- **Image optimization:** `next/image` + remotePatterns configured.
- **Font loading:** `next/font/google` (Inter) with `display: swap`. Good.
- **Script loading:** Analytics loaded via `next/script` with `strategy="afterInteractive"`.
- **Third-party scripts:** One analytics script; no chat/pixel scripts found.
- **Dependency/bundle risk:** `package.json` is lean; no obviously duplicate or oversized deps in scanned manifest.
- **Caching setup where visible:** ISR + fetch cache tags in product data layer.

## 13. Framework-specific SEO audit (Next.js)

- **App Router vs Pages Router:** App Router only.
- **metadata API:** Used widely; one route (`about`) missing a description.
- **generateMetadata:** Used in `app/blog/[slug]/page.tsx` for dynamic titles.
- **sitemap.ts:** Present and dynamic.
- **robots.ts:** Not used — relies on a static `robots.txt` that is currently misconfigured.
- **revalidate:** Used on blog (3600s).
- **dynamic rendering:** No unintended `force-dynamic`.
- **next/image:** Used except in `Hero.tsx`.
- **next/font:** Used (Inter, `display: swap`).
- **not-found page:** Exists; lacks `noindex` + title.
- **Open Graph images:** No `opengraph-image` files; OG images missing on blog/product.

## 14. Content structure audit

- **Page hierarchy:** Clear top-level sections (products, blog, marketing).
- **Blog/article structure:** MDX with consistent layout; frontmatter includes `title`, `date`, `excerpt`.
- **Heading structure:** Consistent H1→H2 within posts.
- **Author/date/freshness signals:** `date` present; **`author` missing** from frontmatter.
- **Topic cluster readiness:** Posts cross-link, but no pillar/hub page.
- **Internal linking between content:** Present via related-posts block.
- **Thin content risks:** Two sampled posts under ~250 words.
- **FAQ sections:** None found.
- **Comparison pages:** None found.
- **Glossary pages:** None found.
- **Pillar pages:** None found.

## 15. AI visibility readiness

> Readiness only. This does not measure real AI visibility, citations, or LLM mentions.

- **Entity clarity:** Brand name consistent; `Organization` schema present.
- **About/company signals:** About page exists but thin and missing a description.
- **Author signals:** Missing author frontmatter and no `Person` schema.
- **Organization schema:** Present.
- **Article schema:** Missing.
- **FAQ content:** None.
- **Comparison pages:** None.
- **Glossary/explainer pages:** None.
- **Citation-friendly structure:** Posts use headings and lists; few original data points/statistics.
- **Original data/statistics:** Not found in sampled content.
- **llms.txt if present:** Not present (`public/llms.txt` absent).
- **AI crawler rules if present:** None (robots.txt blanket-blocks all agents anyway).
- **Content freshness:** Dates present; no "updated" signal.
- **Topical authority structure:** Early-stage; no clusters/pillars yet.

## 16. Action plan

> Priority score = Impact + Confidence − Effort. Impact/Effort/Confidence each 1–5.

**High priority**

| Priority | Task | Impact | Effort | Confidence | Files to update |
|---|---|---:|---:|---:|---|
| 8 | Remove `Disallow: /` and add `Sitemap:` line | 5 | 2 | 5 | `public/robots.txt` |
| 7 | Replace localhost canonical fallback with env var | 5 | 3 | 5 | `lib/seo.ts` |
| 6 | Add `BlogPosting` JSON-LD to posts | 4 | 3 | 5 | `app/blog/[slug]/page.tsx` |

**Medium priority**

| Priority | Task | Impact | Effort | Confidence | Files to update |
|---|---|---:|---:|---:|---|
| 5 | Add `alt` + `priority` to hero images (use `next/image`) | 4 | 3 | 4 | `components/Hero.tsx` |
| 5 | Add OG images for blog/product | 4 | 3 | 4 | `app/blog/[slug]/`, `app/products/[handle]/` |
| 4 | Add meta description to About page | 3 | 2 | 4 | `app/(marketing)/about/page.tsx` |

**Low priority**

| Priority | Task | Impact | Effort | Confidence | Files to update |
|---|---|---:|---:|---:|---|
| 3 | Add `author` frontmatter + `Person` schema | 3 | 3 | 3 | `content/blog/*.mdx`, blog template |
| 2 | Add breadcrumbs + `BreadcrumbList` | 2 | 3 | 3 | `components/`, route templates |
| 2 | Convert mobile menu `a href="#"` to `<button>` | 2 | 2 | 3 | `components/Header.tsx` |

## 17. Evidence summary

- **Verified from codebase:**
  - robots.txt blanket disallow; localhost canonical fallback; Organization-only schema; dynamic sitemap; `next/image` + remotePatterns; `next/font` swap; ISR on blog; missing OG images; three `<img>` without alt.
- **Not available from codebase:**
  - Organic traffic, keyword rankings, backlinks, domain authority, AI citations, GA4, Google Search Console, real SERP performance.
- **Files reviewed:**
  - `package.json`, `next.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/(marketing)/about/page.tsx`, `app/blog/[slug]/page.tsx`, `app/products/[handle]/page.tsx`, `app/contact/page.tsx`, `app/not-found.tsx`, `app/sitemap.ts`, `lib/seo.ts`, `components/Header.tsx`, `components/Footer.tsx`, `components/Hero.tsx`, `public/robots.txt`, `content/blog/*.mdx` (sampled).
- **Assumptions:**
  - The hero image is the LCP element (inferred from above-the-fold placement; not measured).
  - Blog/product routes follow the sampled templates (8 of ~60 routes inspected).

## 18. Final checklist

- [ ] robots.txt allows crawling and declares the production sitemap
- [ ] Canonicals use a production base URL (no localhost fallback)
- [ ] `BlogPosting` and `Product` JSON-LD added to dynamic routes
- [ ] `WebSite` + `BreadcrumbList` schema added
- [ ] Every meaningful image has descriptive `alt`; hero uses `next/image` + `priority`
- [ ] OG/Twitter images present on blog and product routes
- [ ] About page has a unique meta description
- [ ] Blog frontmatter includes `author`; consider `Person` schema
- [ ] Mobile menu toggle is a `<button>` with `aria-expanded`

---

### Scoring reference

| Score | Grade |
|---:|---|
| 90–100 | A |
| 80–89 | B |
| 70–79 | C |
| 60–69 | D |
| 0–59 | F |
| N/A | Not enough codebase evidence |
