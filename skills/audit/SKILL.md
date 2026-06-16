---
name: audit
description: Use when the user wants a codebase-only SEO audit of a website or web app repository. Audits technical SEO, metadata, schema, sitemap, robots.txt, canonicals, internal links, images, accessibility basics, performance setup, framework-specific SEO (Next.js, Shopify, WordPress, Astro, Nuxt, Remix, Gatsby, Vite/React, static HTML), content structure, and AI visibility readiness — using ONLY evidence found inside the repository. Generates reports/codebase-seo-audit.md, reports/codebase-seo-action-plan.md, and reports/codebase-seo-evidence.json. Never invents traffic, rankings, backlinks, domain authority, GA4, or Search Console data.
tools: Read, Glob, Grep, Bash, Write
---

# Codebase SEO Auditor

Audit a website or web-app repository for SEO using **only evidence that exists inside the codebase**. Produce an honest, reproducible report that a developer can act on immediately.

## The Iron Rule: evidence only

This skill audits **code**, not a live website. You have no access to analytics, crawlers, or search engines.

**NEVER invent, estimate, or imply any of the following:**

- Organic traffic, sessions, users, pageviews
- Keyword rankings, positions, impressions, clicks, CTR
- Backlinks, referring domains, link velocity
- Domain authority, domain rating, page authority, trust flow
- AI citation counts, "AI visibility score", LLM mention frequency
- Google Search Console data
- GA4 / analytics data
- Conversion rates, revenue, or any business metric
- Real SERP performance or competitor comparisons

When any of these would normally appear, write exactly:

> **Not available from codebase**

Every claim in the report MUST be traceable to a file path (and, where useful, a line number or code snippet). If you cannot point to a file as evidence, you cannot make the claim. When a check is partially verifiable, lower the **Confidence** rating rather than guessing.

A score of `N/A` ("Not enough codebase evidence") is an acceptable and honest result. Do not pad scores to look complete.

## Workflow overview

1. **Detect project type** from manifest and signature files.
2. **Inventory** the relevant SEO-affecting files (only those that exist).
3. **Audit** each category against codebase evidence.
4. **Score** each category using the weighted model below.
5. **Generate** three report files inside the audited project.
6. **Summarize** results to the user with the top fixes.

Use `Glob` and `Grep` to discover files, and `Read` to inspect them. Prefer reading real files over assuming conventions. Never fabricate file contents — if a file is absent, record it as absent.

---

## Step 1 — Detect project type

Inspect these signals (in order) and classify the project. A repo may match more than one; pick the dominant framework and note the others.

| Project type | Primary signals |
|---|---|
| **Next.js** | `next` in `package.json` deps; `next.config.{js,mjs,ts}`; `app/` or `pages/` directory |
| **Nuxt** | `nuxt` in deps; `nuxt.config.{js,ts}` |
| **Remix** | `@remix-run/*` in deps; `remix.config.js`; `app/routes/` |
| **Astro** | `astro` in deps; `astro.config.{mjs,ts}`; `src/pages/*.astro` |
| **Gatsby** | `gatsby` in deps; `gatsby-config.js` |
| **Vite/React (SPA)** | `vite` + `react` in deps; `vite.config.*`; `index.html` with a root mount node |
| **Shopify (Liquid theme)** | `layout/theme.liquid`; `templates/`, `sections/`, `snippets/`; `config/settings_schema.json` |
| **Shopify (Hydrogen)** | `@shopify/hydrogen` in deps |
| **WordPress** | `style.css` theme header; `functions.php`, `header.php`, `footer.php`, `single.php`, `page.php`; or `wp-content/` |
| **Static HTML** | Raw `*.html` files, no JS framework manifest |
| **Unknown** | None of the above match confidently |

Read `package.json` first when present. If there is no `package.json`, look for Liquid, PHP, or raw HTML signatures. Record the evidence (which file proved the type) in the evidence JSON.

---

## Step 2 — File inventory

Discover and record which of the following exist. **Only inspect files that are actually present.** Do not assume a file exists because the framework usually has one — its absence is itself evidence.

**Universal / config**
- `package.json`, `tsconfig.json`, `.env*` (note presence of hardcoded URLs, never print secrets)
- `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, `public/.well-known/`
- `public/manifest.json`, `public/site.webmanifest`

**Next.js / React**
- `next.config.{js,mjs,ts}`, `next-sitemap.config.js`
- `app/layout.{tsx,jsx,js}`, `app/**/page.{tsx,jsx,js}`, `app/**/layout.*`
- `app/sitemap.{ts,js}`, `app/robots.{ts,js}`, `app/manifest.{ts,js}`
- `app/**/not-found.{tsx,jsx,js}`, `app/**/opengraph-image.*`, `app/**/icon.*`
- `pages/**/*.{tsx,jsx,js}`, `pages/_app.*`, `pages/_document.*`, `pages/api/**`
- `components/**`, `src/**`, `lib/**`, `utils/**`

**Shopify (Liquid)**
- `layout/theme.liquid`, `templates/**`, `sections/**`, `snippets/**`
- `config/settings_schema.json`, `assets/**`

**WordPress**
- `functions.php`, `header.php`, `footer.php`, `single.php`, `page.php`, `index.php`, `archive.php`
- `theme.json`, `style.css`, `inc/**`, `template-parts/**`

**Content**
- `content/**`, `posts/**`, `blog/**`, `articles/**`, `data/**`, `_posts/**`, `src/content/**`
- Markdown/MDX: `*.md`, `*.mdx`

Use `Glob` patterns and cap large enumerations (e.g. sample representative files when there are hundreds of pages). Note the sample size in the report so the audit is honest about coverage.

---

## Step 3 — Category audits

For each category, collect evidence, then describe **What is working**, **Issues found**, and **Recommendations**. Tie every issue to an evidence file.

### Technical SEO
- Indexability: are pages server-rendered / statically generated, or client-only? Look for `'use client'` at route roots, SPA-only `index.html`, missing SSR.
- Crawlability: robots rules, `noindex` usage (`<meta name="robots">`, `robots` in metadata, `X-Robots-Tag`).
- Routing/structure: clean routes vs hash routing; presence of error/404 handling.
- Trailing-slash / URL consistency config.

### Metadata
- Title implementation (static `<title>`, Next `metadata.title` / `generateMetadata`, Liquid `{{ page_title }}`, WP `wp_title`/`add_theme_support('title-tag')`).
- Meta description presence and whether it's dynamic or a hardcoded placeholder.
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`).
- Twitter cards (`twitter:card`, `twitter:title`, `twitter:image`).
- Robots metadata.
- Duplicate / generic / placeholder metadata risks (same title across pages, "Lorem", "TODO", default template strings).
- Missing metadata on key routes.

### Schema (structured data)
- JSON-LD `<script type="application/ld+json">` usage.
- `Organization`, `WebSite`, `Article`, `BlogPosting`, `Product`, `BreadcrumbList`, `FAQPage`.
- Missing schema for obvious content types (e.g. blog without `Article`/`BlogPosting`, store without `Product`).
- Invalid/risky schema: malformed JSON, hardcoded placeholder values, `@type` mismatches.

### Sitemap & robots
- Sitemap status: static `sitemap.xml`, `app/sitemap.ts`, `next-sitemap`, plugin-generated, or none.
- robots.txt status and contents.
- Sitemap declared inside robots.txt (`Sitemap:` line).
- Accidental blocking (`Disallow: /` in production, blocking CSS/JS, blocking key paths).
- Indexation risks (`noindex` left on, staging guards leaking to prod).

### Canonicals
- Current canonical implementation (`<link rel="canonical">`, Next `metadata.alternates.canonical`, Liquid `{{ canonical_url }}`, WP `rel_canonical`).
- Missing canonical risks on paginated/filtered/duplicate routes.
- Wrong canonical risks (all pages pointing to home, self-canonical errors).
- Environment URL risks: `localhost`, `127.0.0.1`, `:3000`, staging/preview domains hardcoded as base URL.

### Internal links
- Primary navigation and footer link inventory.
- Blog/content cross-links and breadcrumbs.
- Empty `href=""`, `href="#"`, or `href="javascript:void(0)"`.
- Broken-looking/relative links that won't resolve.
- Orphan page risk (routes with no inbound links found in nav/footer/content).
- External links: `target="_blank"` without `rel="noopener"`/`rel="noreferrer"`.

### Image optimization
- `next/image` (or framework image component) vs raw `<img>`.
- Missing `alt`, and empty-`alt` misuse on meaningful images.
- LCP image risks (no `priority`/preload on hero images).
- Remote image config (`next.config` `images.remotePatterns`/`domains`).
- `width`/`height` attributes (CLS prevention).
- Lazy loading (`loading="lazy"`) and whether it's wrongly applied to LCP images.

### Accessibility basics (SEO-adjacent)
- Heading structure and single meaningful `<h1>` per page.
- Forms: labels for inputs.
- Buttons vs clickable `div`s; links with discernible text.
- Images: alt coverage (cross-reference image audit).
- Semantic HTML (`<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`).
- ARIA usage and obvious misuse.

### Performance setup
- Static rendering / SSG, ISR (`revalidate`, `export const revalidate`), or fully dynamic (`dynamic = 'force-dynamic'`, `cookies()`/`headers()` forcing SSR).
- Image optimization (cross-reference).
- Font loading (`next/font`, `font-display`, preconnect to font hosts).
- Script loading (`next/script` strategy, `async`/`defer`, render-blocking scripts).
- Third-party scripts (analytics, chat, pixels) and their loading strategy.
- Dependency/bundle risk (very large or duplicate deps in `package.json`).
- Caching headers/config where visible.

### Content structure
- Page hierarchy and route depth.
- Blog/article structure (consistent layout, frontmatter completeness).
- Heading hierarchy within content.
- Author / date / freshness signals in frontmatter or templates.
- Topic-cluster / pillar readiness, internal linking between related content.
- Thin content risks (very short pages/posts).
- FAQ, comparison, and glossary page presence.

### AI visibility readiness (readiness only — never claim real AI visibility)
- Entity clarity (clear name/brand usage, About/company signals).
- Author signals and `Person`/author schema.
- `Organization` and `Article` schema.
- FAQ content, comparison pages, glossary/explainer pages.
- Citation-friendly structure (clear headings, definitions, lists, original data/statistics).
- `llms.txt` presence and AI crawler rules in robots (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, etc.).
- Content freshness signals and topical-authority structure.

---

## Step 4 — Framework-specific audit

Run the section matching the detected project type. If multiple apply, run each relevant block.

### Next.js
- App Router vs Pages Router (or hybrid).
- `metadata` export and `generateMetadata` coverage.
- `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`.
- `revalidate` usage / rendering mode per route; unintended `force-dynamic`.
- `next/image` and `next/font` adoption.
- `not-found.tsx` presence.
- Open Graph images (`opengraph-image.*`, `metadata.openGraph.images`).

### Shopify (Liquid)
- `theme.liquid`: `<head>` completeness, `{{ content_for_header }}`, meta tags.
- `{{ canonical_url }}` usage.
- Product schema (JSON-LD in product templates/snippets).
- Collection metadata and pagination handling.
- Image `alt` handling (`{{ image.alt }}`), responsive images, lazy loading.
- Section/snippet performance (loops, nested includes).
- App script injection risks (render-blocking third-party scripts).

### WordPress
- `wp_head()` present in `header.php`; `wp_footer()` in `footer.php`.
- Title handling (`add_theme_support('title-tag')` vs hardcoded `<title>`).
- Schema output (theme or plugin-driven; note if it depends on a plugin).
- Template structure (`single.php`, `page.php`, `archive.php`, template parts).
- Breadcrumbs implementation.
- `wp_enqueue_script` / `wp_enqueue_style` vs hardcoded tags.
- Image sizes (`add_image_size`, `the_post_thumbnail` sizes).

### Other frameworks
Apply the universal checks (metadata, schema, sitemap, robots, canonicals, images, links) using that framework's idioms (Nuxt `useHead`/`useSeoMeta`, Astro `<head>` + integrations, Remix `meta` export, Gatsby `gatsby-plugin-sitemap`/`react-helmet`). For SPAs (Vite/React) with no SSR, flag client-only rendering as a crawlability risk and note whether prerendering is configured.

---

## Step 5 — Scoring model

Score each category 0–100 using the weighted sub-criteria below, then map to a grade. Use `N/A` when there is not enough codebase evidence to score honestly (do not guess a number).

**Grade scale**

| Score | Grade |
|---:|---|
| 90–100 | A |
| 80–89 | B |
| 70–79 | C |
| 60–69 | D |
| 0–59 | F |
| N/A | Not enough codebase evidence |

**Confidence** (report per category): `High` (directly verified in files), `Medium` (inferred from partial evidence), `Low` (weak/ambiguous evidence). Never report `High` confidence for something you did not read.

**Weights** — each category's score is the weighted sum of its sub-criteria (each sub-criterion rated 0–100, then weighted).

*Technical SEO*
- Indexability & crawlability — 20
- Sitemap & robots — 15
- Canonicals — 15
- Metadata — 20
- Schema — 15
- Internal links — 10
- Error/page structure — 5

*Image SEO*
- Alt text — 25
- Optimized image component — 25
- Width/height / LCP readiness — 20
- Lazy loading — 15
- Remote image config — 15

*Accessibility basics*
- Semantic HTML / headings — 25
- Alt / form / link labels — 25
- Button / link accessibility — 20
- ARIA usage — 10
- Navigation structure — 20

*Performance setup*
- Static / ISR / caching setup — 25
- Image optimization — 25
- Font / script loading — 20
- Dependency / bundle risk — 15
- Third-party script control — 15

*Content structure*
- Page hierarchy — 20
- Blog / article structure — 20
- Headings — 15
- Author / date / freshness — 15
- Internal linking — 15
- Topic cluster readiness — 15

*AI visibility readiness*
- Entity clarity — 15
- Schema — 15
- Author / company credibility — 15
- FAQ / comparison / glossary content — 15
- Citation-friendly formatting — 10
- Content freshness — 10
- Topical authority structure — 10
- llms.txt / AI crawler readiness — 10

The summary "Audit results" table also reports **Metadata**, **Schema**, **Sitemap**, **Robots.txt**, **Canonicals**, and **Framework SEO implementation** as their own rows. Derive each from the relevant evidence (you may reuse the Technical SEO sub-criteria for the shared rows). Keep scoring consistent between the per-row scores and the detailed sections.

---

## Step 6 — Generate outputs

Create the `reports/` directory inside the audited project and write **three** files. Use the report template at `templates/codebase-seo-audit-report.md` (in this plugin) as the structure for the main report.

**Column guides are required.** The template places a short "How to read this table" block above every table that explains each column and how each number (Score, Grade, Priority) is calculated. Reproduce these guides above the matching table in the generated report — they are part of the deliverable, not template scaffolding, so never strip them. If you add an *Issues found* table in a section that doesn't have one in the template, copy the Issues-table column guide above it too.

### 1. `reports/codebase-seo-audit.md`

Full report with these sections, in order:

1. **Audit scope** — project name, project type, audit source (Codebase only), date, what was audited, what was not audited. Include this exact warning verbatim:

   > This audit is based only on codebase evidence. It does not include live traffic, keyword rankings, backlinks, real SERP performance, GA4, or Google Search Console data.

2. **Executive summary** — overall codebase SEO health, top strengths, top risks, top 5 fixes.
3. **Audit results** — the results table, preceded by its column guide:

   > **How to read this table** — one row per SEO category. **Score** is 0–100, the weighted sum of the category's sub-criteria (each sub-criterion 0–100 × its weight; weights total 100 per category). **Grade** maps from Score (A 90–100, B 80–89, C 70–79, D 60–69, F 0–59). **Status** = Pass / Warn / Fail / N/A. **Confidence** = High / Medium / Low (how directly it was verified). **Evidence** = the file path(s) the score traces to.

   | Category | Score | Grade | Status | Confidence | Evidence |
   |---|---:|---|---|---|---|
   | Technical SEO |  |  |  |  |  |
   | Metadata |  |  |  |  |  |
   | Schema |  |  |  |  |  |
   | Sitemap |  |  |  |  |  |
   | Robots.txt |  |  |  |  |  |
   | Canonicals |  |  |  |  |  |
   | Internal links |  |  |  |  |  |
   | Image optimization |  |  |  |  |  |
   | Accessibility basics |  |  |  |  |  |
   | Performance setup |  |  |  |  |  |
   | Framework SEO implementation |  |  |  |  |  |
   | Content structure |  |  |  |  |  |
   | AI visibility readiness |  |  |  |  |  |

4. **Technical SEO** — What is working / Issues found / Recommendations + issues table. Precede the table with its column guide (reuse it above every issues table in the report):

   > **How to read this table** — one row per issue; these are judgments from code evidence, not scores. **Issue** = the problem found. **Severity** = Critical / High / Medium / Low. **Status** = Pass / Warn / Fail / N/A. **Evidence file** = the file (and line) that proves it. **Why it matters** = the SEO consequence. **Recommendation** = the concrete fix.

   | Issue | Severity | Status | Evidence file | Why it matters | Recommendation |
   |---|---|---|---|---|---|

5. **Metadata audit**
6. **Schema audit**
7. **Sitemap and robots audit**
8. **Canonical audit**
9. **Internal linking audit**
10. **Image optimization audit**
11. **Accessibility basics audit**
12. **Performance setup audit**
13. **Framework-specific SEO audit** (Next.js / Shopify / WordPress / other)
14. **Content structure audit**
15. **AI visibility readiness**
16. **Action plan** — High / Medium / Low priority with the table below.
17. **Evidence summary** — Verified from codebase / Not available from codebase / Files reviewed / Assumptions.
18. **Final checklist** — practical developer checklist.

Use the issues table everywhere issues are listed. `Severity` ∈ {Critical, High, Medium, Low}. `Status` ∈ {Pass, Warn, Fail, N/A}.

### 2. `reports/codebase-seo-action-plan.md`

A focused, prioritized plan. Begin the tables with the column guide below, then group tasks into **High priority**, **Medium priority**, **Low priority** using this table:

> **How to read this table** — one row per task, sorted by descending **Priority**. **Priority** is calculated as `Impact + Confidence − Effort` (range −4 to 9); higher = do sooner. **Task** = the action. **Impact** = 1–5 SEO upside (added). **Effort** = 1–5 work required (subtracted, so more effort lowers priority). **Confidence** = 1–5 certainty the fix is needed/correct (added). **Files to update** = the file(s) to change. Bucketing: ≥ 6 → High, 3–5 → Medium, < 3 → Low (Critical-severity fixes always go in High).

| Priority | Task | Impact | Effort | Confidence | Files to update |
|---|---|---:|---:|---:|---|

Rate **Impact**, **Effort**, **Confidence** each 1–5. Compute a priority score:

```
Priority score = Impact + Confidence - Effort
```

Sort within each group by descending priority score. Put each task in the High/Medium/Low bucket based on its score (e.g. ≥6 High, 3–5 Medium, <3 Low) — but always keep Critical-severity fixes in High regardless of score.

### 3. `reports/codebase-seo-evidence.json`

Machine-readable evidence so the audit is reproducible. Suggested shape:

```json
{
  "auditSource": "codebase-only",
  "generatedAt": "<ISO-8601 date>",
  "project": {
    "name": "<from package.json/theme/dir>",
    "type": "<detected type>",
    "typeEvidence": "<file that proved it>"
  },
  "filesReviewed": ["<relative paths actually read>"],
  "filesMissing": ["<expected-but-absent files>"],
  "categories": {
    "technicalSeo": { "score": 0, "grade": "F", "confidence": "High", "status": "Warn", "evidence": [{ "file": "", "note": "" }] }
  },
  "actionPlan": [
    { "id": "T1", "bucket": "High", "priority": 8, "task": "", "category": "Technical SEO", "impact": 5, "effort": 2, "confidence": 5, "files": [""], "severity": "Critical" }
  ],
  "notAvailableFromCodebase": [
    "Organic traffic", "Keyword rankings", "Backlinks", "Domain authority",
    "AI citation counts", "Google Search Console data", "GA4 data", "Real SERP performance"
  ],
  "assumptions": []
}
```

Populate `filesReviewed` with paths you actually read, `filesMissing` with expected files that were absent, and one entry per category under `categories`. Always include the `notAvailableFromCodebase` array as an honesty guard.

The `actionPlan` array is the **machine-readable mirror of the action plan tables** — one object per task, with the same `bucket` (High/Medium/Low), `priority` (= `impact + confidence − effort`), `task`, `category`, `impact`, `effort`, `confidence`, `files`, and `severity` values you put in the markdown. Keep it in sync with `reports/codebase-seo-action-plan.md`. The `sheet` skill in this plugin reads this array to build a Google Sheet tracker, so emitting it lets users export the plan with assignees and status without re-parsing markdown.

---

## Step 7 — Report to the user

After writing the files, give a short summary in chat:

- Detected project type (and the evidence).
- Overall health and the per-category grades.
- The top 5 fixes (highest priority-score items).
- The three report paths.
- A one-line reminder that this is a codebase-only audit and external SEO metrics were not evaluated.
- That they can export the action plan to a shared **Google Sheet** tracker (with assignees and status) on demand via the `sheet` skill.

Keep the chat summary concise; the detail lives in the report files.

## Honesty checklist (run before finishing)

- [ ] Every score traces to files you actually read.
- [ ] No traffic, rankings, backlinks, DA, AI citations, GSC, or GA4 numbers anywhere.
- [ ] Unverifiable items say **Not available from codebase**.
- [ ] `N/A` used where evidence was insufficient — no padded scores.
- [ ] Confidence ratings reflect how directly each item was verified.
- [ ] All three report files were written to `reports/` in the audited project.
- [ ] The exact scope warning appears in the main report.
