# Changelog

All notable changes to **seo-codebase-auditor** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-06-16

### Added

- **Google Sheet export** for the action plan via a new `sheet` skill
  (`/seo-codebase-auditor:sheet`). Creates a formatted, shared spreadsheet with a
  **Summary** tab (counts by priority/status/assignee + category grades) and a
  **Task Tracker** tab (per-task rows with Assignee and Status dropdowns and
  color-coded priority buckets).
- Roster-based **assignees** with optional **round-robin** assignment — assignees
  come only from a roster the user supplies, never invented.
- Dependency-free sheet builder (`scripts/build-sheet.mjs`): mints a Google
  service-account JWT and calls the Sheets + Drive REST APIs directly (no
  `npm install`). Includes a `--dry-run` mode that writes a local CSV + payload
  preview with no credentials and no network calls.
- One-time setup guide (`docs/google-sheets-setup.md`) for the service account,
  including the service-account storage-quota gotcha and fallbacks.
- Structured `actionPlan` array added to `reports/codebase-seo-evidence.json` so
  the export reads tasks reliably (with a markdown-parsing fallback for older
  reports). Writes `reports/codebase-seo-sheet-url.txt` with the new sheet URL.
- "How to read this table" column guides above every report table, documenting
  each column and how Score / Grade / Priority are calculated.

### Changed

- Bumped plugin version to 0.2.0; added the `google-sheets` keyword.

## [0.1.0] — 2026-06-16

### Added

- Initial release of the `seo-codebase-auditor` Claude Code plugin.
- `/seo-codebase-auditor:audit` command via the `audit` skill.
- Project-type detection for Next.js, Nuxt, Remix, Astro, Gatsby, Vite/React (SPA),
  Shopify (Liquid & Hydrogen), WordPress, static HTML, and Unknown.
- Codebase-only audit across 13 areas: Technical SEO, Metadata, Schema, Sitemap,
  Robots.txt, Canonicals, Internal links, Image optimization, Accessibility basics,
  Performance setup, Framework-specific SEO, Content structure, and AI visibility readiness.
- Weighted scoring model with A–F grades, per-category confidence, and an `N/A`
  ("not enough codebase evidence") result.
- Three generated outputs: `reports/codebase-seo-audit.md`,
  `reports/codebase-seo-action-plan.md`, and `reports/codebase-seo-evidence.json`.
- Prioritized action plan ranked by `Impact + Confidence − Effort`.
- Evidence-first honesty policy: unverifiable data is marked
  **"Not available from codebase"**; no traffic, rankings, backlinks, domain authority,
  AI citation, GA4, or Search Console data is ever invented.
- Reusable report template (`templates/codebase-seo-audit-report.md`).
- Realistic, honest sample audit for a fictional Next.js project
  (`examples/sample-codebase-audit.md`).
- Community-ready README and MIT license.

[0.2.0]: https://example.com/seo-codebase-auditor/releases/0.2.0
[0.1.0]: https://example.com/seo-codebase-auditor/releases/0.1.0
