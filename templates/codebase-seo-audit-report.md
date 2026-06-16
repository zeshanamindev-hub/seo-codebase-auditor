<!--
Codebase SEO Audit Report — TEMPLATE
Fill every {{placeholder}}. Replace any unverifiable value with: Not available from codebase
Use N/A for any category without enough codebase evidence to score honestly.
Severity ∈ {Critical, High, Medium, Low}.  Status ∈ {Pass, Warn, Fail, N/A}.
Confidence ∈ {High, Medium, Low}.
-->

# Codebase SEO Audit Report

## 1. Audit scope

- **Project name:** {{project_name}}
- **Project type:** {{project_type}}
- **Audit source:** Codebase only
- **Date:** {{YYYY-MM-DD}}
- **What was audited:** {{summary of files/areas reviewed}}
- **What was not audited:** Live traffic, keyword rankings, backlinks, domain authority, AI citations, GA4, Google Search Console, real SERP performance.

> This audit is based only on codebase evidence. It does not include live traffic, keyword rankings, backlinks, real SERP performance, GA4, or Google Search Console data.

## 2. Executive summary

- **Overall codebase SEO health:** {{grade}} — {{one-line verdict}}
- **Top strengths:**
  - {{strength}}
- **Top risks:**
  - {{risk}}
- **Top 5 fixes:**
  1. {{fix}}
  2. {{fix}}
  3. {{fix}}
  4. {{fix}}
  5. {{fix}}

## 3. Audit results

**How to read this table** — one row per SEO category.

- **Category** — the SEO area being assessed.
- **Score** — 0–100. Calculated as the **weighted sum of that category's sub-criteria**: each sub-criterion is scored 0–100, then multiplied by its weight (the weights within a category total 100). See the Scoring model in the skill and the Scoring reference at the end. `N/A` means there was not enough codebase evidence to score honestly.
- **Grade** — letter grade mapped directly from **Score**: A = 90–100, B = 80–89, C = 70–79, D = 60–69, F = 0–59.
- **Status** — at-a-glance verdict: **Pass** (no significant issues), **Warn** (fixable issues found), **Fail** (serious or crawl-blocking issue), **N/A** (not evaluable from code).
- **Confidence** — how directly the finding was verified: **High** (read directly in files), **Medium** (inferred from partial evidence), **Low** (weak or ambiguous evidence).
- **Evidence** — the file path(s) the score traces to. Every score must point to a real file.

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

## 4. Technical SEO

**What is working**
- {{...}}

**Issues found**

**How to read this table** — one row per issue. These columns are judgments based on code evidence, not calculated scores. The same columns apply to every *Issues found* table in this report.

- **Issue** — the specific problem found in the code.
- **Severity** — how damaging it is if left unfixed: **Critical**, **High**, **Medium**, or **Low**.
- **Status** — current state of the check: **Pass**, **Warn**, **Fail**, or **N/A**.
- **Evidence file** — the file (and line number where useful) that proves the issue.
- **Why it matters** — the SEO consequence of the issue.
- **Recommendation** — the concrete fix to apply.

| Issue | Severity | Status | Evidence file | Why it matters | Recommendation |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

**Recommendations**
- {{...}}

## 5. Metadata audit

- **Title implementation:** {{...}}
- **Meta description implementation:** {{...}}
- **Open Graph:** {{...}}
- **Twitter cards:** {{...}}
- **Robots metadata:** {{...}}
- **Duplicate/generic metadata risks:** {{...}}
- **Missing metadata:** {{...}}
- **Weak placeholder metadata:** {{...}}

*Columns are the same as the **Issues found** table in §4 — see the column guide there.*

| Issue | Severity | Status | Evidence file | Why it matters | Recommendation |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## 6. Schema audit

- **JSON-LD usage:** {{...}}
- **Organization schema:** {{...}}
- **WebSite schema:** {{...}}
- **Article schema:** {{...}}
- **BlogPosting schema:** {{...}}
- **Product schema:** {{...}}
- **BreadcrumbList schema:** {{...}}
- **FAQPage schema:** {{...}}
- **Missing schema:** {{...}}
- **Invalid or risky schema:** {{...}}

## 7. Sitemap and robots audit

- **Sitemap status:** {{...}}
- **Robots.txt status:** {{...}}
- **Sitemap declaration inside robots.txt:** {{...}}
- **Accidental blocking:** {{...}}
- **Indexation risks:** {{...}}
- **Recommended fixes:** {{...}}

## 8. Canonical audit

- **Current canonical implementation:** {{...}}
- **Missing canonical risks:** {{...}}
- **Wrong canonical risks:** {{...}}
- **Environment URL risks:** {{...}}
- **localhost/staging URL leaks:** {{...}}

## 9. Internal linking audit

- **Navigation links:** {{...}}
- **Footer links:** {{...}}
- **Blog/content links:** {{...}}
- **Breadcrumbs:** {{...}}
- **Empty href values:** {{...}}
- **Broken-looking links:** {{...}}
- **Orphan page risks:** {{...}}
- **External links with target blank and rel:** {{...}}

## 10. Image optimization audit

- **next/image (or framework image component) usage:** {{...}}
- **Raw img usage:** {{...}}
- **Missing alt text:** {{...}}
- **Empty alt misuse:** {{...}}
- **LCP image risks:** {{...}}
- **Remote image config:** {{...}}
- **Width/height attributes:** {{...}}
- **Lazy loading:** {{...}}

## 11. Accessibility basics audit

- **Heading structure:** {{...}}
- **h1 usage:** {{...}}
- **Forms:** {{...}}
- **Buttons:** {{...}}
- **Links:** {{...}}
- **Images:** {{...}}
- **Semantic HTML:** {{...}}
- **ARIA usage:** {{...}}

## 12. Performance setup audit

- **Static rendering:** {{...}}
- **ISR/revalidate:** {{...}}
- **Dynamic rendering risks:** {{...}}
- **Image optimization:** {{...}}
- **Font loading:** {{...}}
- **Script loading:** {{...}}
- **Third-party scripts:** {{...}}
- **Dependency/bundle risk:** {{...}}
- **Caching setup where visible:** {{...}}

## 13. Framework-specific SEO audit

> Keep the block that matches the detected framework; remove the others.

**Next.js**
- App Router vs Pages Router: {{...}}
- metadata API: {{...}}
- generateMetadata: {{...}}
- sitemap.ts: {{...}}
- robots.ts: {{...}}
- revalidate: {{...}}
- dynamic rendering: {{...}}
- next/image: {{...}}
- next/font: {{...}}
- not-found page: {{...}}
- Open Graph images: {{...}}

**Shopify**
- theme.liquid: {{...}}
- canonical_url: {{...}}
- Product schema: {{...}}
- Collection metadata: {{...}}
- Image alt handling: {{...}}
- Lazy loading: {{...}}
- Section performance: {{...}}
- App script risks: {{...}}

**WordPress**
- wp_head: {{...}}
- title handling: {{...}}
- Schema: {{...}}
- Template structure: {{...}}
- Breadcrumbs: {{...}}
- enqueue scripts/styles: {{...}}
- Image sizes: {{...}}

## 14. Content structure audit

- **Page hierarchy:** {{...}}
- **Blog/article structure:** {{...}}
- **Heading structure:** {{...}}
- **Author/date/freshness signals:** {{...}}
- **Topic cluster readiness:** {{...}}
- **Internal linking between content:** {{...}}
- **Thin content risks:** {{...}}
- **FAQ sections:** {{...}}
- **Comparison pages:** {{...}}
- **Glossary pages:** {{...}}
- **Pillar pages:** {{...}}

## 15. AI visibility readiness

> Readiness only. This does not measure real AI visibility, citations, or LLM mentions.

- **Entity clarity:** {{...}}
- **About/company signals:** {{...}}
- **Author signals:** {{...}}
- **Organization schema:** {{...}}
- **Article schema:** {{...}}
- **FAQ content:** {{...}}
- **Comparison pages:** {{...}}
- **Glossary/explainer pages:** {{...}}
- **Citation-friendly structure:** {{...}}
- **Original data/statistics:** {{...}}
- **llms.txt if present:** {{...}}
- **AI crawler rules if present:** {{...}}
- **Content freshness:** {{...}}
- **Topical authority structure:** {{...}}

## 16. Action plan

> Priority score = Impact + Confidence − Effort. Impact/Effort/Confidence each 1–5.

**How to read these tables** — one row per task, sorted by descending **Priority**. The same columns apply to the High, Medium, and Low tables below.

- **Priority** — the priority score, **calculated as `Impact + Confidence − Effort`** (possible range −4 to 9). Higher = do it sooner. Bucketing: **≥ 6 → High**, **3–5 → Medium**, **< 3 → Low** — except Critical-severity fixes, which always stay in High regardless of score.
- **Task** — the concrete action to take.
- **Impact** — 1–5: how much this improves SEO (5 = biggest improvement). **Added** in the formula.
- **Effort** — 1–5: how much work it takes (5 = most work). **Subtracted** in the formula, so higher effort lowers priority.
- **Confidence** — 1–5: how certain we are the fix is needed and correct (5 = certain). **Added** in the formula.
- **Files to update** — the file(s) the developer should change.

**High priority**

| Priority | Task | Impact | Effort | Confidence | Files to update |
|---|---|---:|---:|---:|---|
|  |  |  |  |  |  |

**Medium priority**

| Priority | Task | Impact | Effort | Confidence | Files to update |
|---|---|---:|---:|---:|---|
|  |  |  |  |  |  |

**Low priority**

| Priority | Task | Impact | Effort | Confidence | Files to update |
|---|---|---:|---:|---:|---|
|  |  |  |  |  |  |

## 17. Evidence summary

- **Verified from codebase:**
  - {{...}}
- **Not available from codebase:**
  - Organic traffic, keyword rankings, backlinks, domain authority, AI citations, GA4, Google Search Console, real SERP performance.
- **Files reviewed:**
  - {{...}}
- **Assumptions:**
  - {{...}}

## 18. Final checklist

- [ ] {{actionable developer item}}
- [ ] {{actionable developer item}}
- [ ] {{actionable developer item}}

---

### Scoring reference

How each category's numeric **Score** maps to its letter **Grade** (used in the Audit results table):

| Score | Grade |
|---:|---|
| 90–100 | A |
| 80–89 | B |
| 70–79 | C |
| 60–69 | D |
| 0–59 | F |
| N/A | Not enough codebase evidence |
