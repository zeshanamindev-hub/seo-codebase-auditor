---
name: sheet
description: Use when the user wants to turn an existing codebase SEO audit's action plan into a spreadsheet tracker (CSV for Google Sheets, Excel, or Numbers) with task priorities, assignees, and status. Triggers on "export the SEO action plan to a Google Sheet", "make a spreadsheet from the audit", "put the SEO tasks in a sheet", "create a tracker for the SEO fixes", "assign the SEO tasks to my team". Runs AFTER the audit skill has produced reports/codebase-seo-evidence.json (or reports/codebase-seo-action-plan.md). Fully local — no network calls, no credentials; never invents assignees.
tools: Read, Glob, Bash
---

# Export SEO action plan to a spreadsheet (CSV)

Turn the action plan from a codebase SEO audit into two CSV files the user can
import into Google Sheets, Excel, or any spreadsheet app:

- **`reports/codebase-seo-tasks.csv`** — Task Tracker: one row per task with
  Bucket, Priority, Impact/Effort/Confidence, Files to update, Assignee, Status,
  Due date, Notes.
- **`reports/codebase-seo-summary.csv`** — Summary: task counts by
  priority/status/assignee and the category grades from the audit.

Tasks, priorities, and scores come **only** from the audit reports — this skill
never invents tasks, and assignees come only from a roster the user provides.

This skill is **fully local**: the script reads the audit reports and writes CSV
files into the project. It makes no network calls and needs no credentials or
API keys. Uploading to Google Sheets is done by the user, by importing the CSV.

This skill **does not run the audit**. It consumes the audit's output. If the
reports are missing, tell the user to run the audit first (the `audit` skill in
this plugin, e.g. "run a codebase SEO audit on this repo").

## Prerequisites

1. **Audit reports exist.** Look for `reports/codebase-seo-evidence.json`
   (preferred — it carries the structured `actionPlan` array) or
   `reports/codebase-seo-action-plan.md` in the project being worked on.
2. **Node.js 18 or newer** is available (`node --version`). The script has zero
   npm dependencies.

## Workflow

### Step 1 — Locate the audit reports

Use `Glob` to find `reports/codebase-seo-evidence.json` (and
`reports/codebase-seo-action-plan.md`) under the current project. If neither
exists, stop and tell the user to run the audit first. Note the path — you pass
it to the script as `--input`.

### Step 2 — Gather inputs from the user

Ask the user for (these cannot be inferred from the codebase):

- **Team roster** — names and/or emails of the people tasks can be assigned to,
  e.g. `Ana <ana@acme.com>, Ravi <ravi@acme.com>`. Optional; if omitted, the
  Assignee column is left blank. Only the name part is written to the CSV.
- **Assignment** — `round-robin` (distribute tasks across the roster, highest
  priority first) or `none` (leave Assignee blank for manual fill). Default
  `none` when no roster is given.
- **Title** — optional title for the summary file. Defaults to
  `SEO Action Plan — <project>`.

Never guess assignees. If the user gives no roster, proceed with Assignee blank.

### Step 3 — Build the CSV files

Run the bundled script:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/build-sheet.mjs" \
  --input "reports/codebase-seo-evidence.json" \
  --title "Acme SEO Action Plan" \
  --roster "Ana <ana@acme.com>,Ravi <ravi@acme.com>" \
  --assign round-robin
```

Adjust flags to the user's answers. Omit `--roster`/`--assign` if no roster was
given. If only the markdown action plan exists, add
`--md "reports/codebase-seo-action-plan.md"`.

The script:
- Reads tasks from the evidence JSON `actionPlan` array (falls back to parsing
  `codebase-seo-action-plan.md` if that array is absent).
- Sorts tasks High → Medium → Low, then by priority score.
- Round-robin assigns tasks across the roster (if requested).
- Writes the two CSV files next to the input file (UTF-8 with BOM so Excel
  displays characters correctly).
- Prefixes any cell starting with `=`, `+`, `-`, or `@` with `'` so task text
  can't run as a spreadsheet formula.

### Step 4 — Report back

Give the user:
- The paths of both CSV files.
- A short summary: total tasks and the High/Medium/Low split, and who tasks were
  assigned to (if round-robin was used).
- How to import into Google Sheets:
  1. Open https://sheets.new (creates a blank spreadsheet).
  2. **File → Import → Upload** → select `codebase-seo-tasks.csv`.
  3. Choose **Replace current sheet** → **Import data**. Rename the tab
     "Task Tracker".
  4. Repeat with `codebase-seo-summary.csv`, choosing **Insert new sheet(s)**.
  5. Optional: select the Status column → **Data → Data validation** →
     dropdown with `Not started, In progress, Blocked, Done`.
- A one-line reminder that this tracker is derived from a **codebase-only** audit
  — it contains no live traffic, rankings, backlinks, or Search Console data.

## Error handling

- **No reports found** → tell the user to run the `audit` skill first; do not
  fabricate tasks.
- **`node` not found or older than 18** → tell the user to install Node.js 18+
  (https://nodejs.org) and retry.
- **Script error** → surface the script's error message verbatim; do not
  hand-write the CSV as a substitute.
