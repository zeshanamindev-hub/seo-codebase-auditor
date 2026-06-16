# Changelog

All notable changes to **seo-codebase-auditor** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://example.com/seo-codebase-auditor/releases/0.1.0
