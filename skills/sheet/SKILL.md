---
name: sheet
description: Use when the user wants to turn an existing codebase SEO audit's action plan into a Google Sheet — a shared project tracker with task priorities, assignees, and status. Triggers on "export the SEO action plan to a Google Sheet", "make a Google Sheet from the audit", "put the SEO tasks in a sheet", "create a tracker for the SEO fixes", "assign the SEO tasks to my team". Runs AFTER the audit skill has produced reports/codebase-seo-evidence.json (or reports/codebase-seo-action-plan.md). Requires a Google service-account key; never invents assignees.
tools: Read, Glob, Bash
---

# Export SEO action plan to a Google Sheet

Turn the action plan from a codebase SEO audit into a formatted, shared Google
Sheet: a **Summary** tab (counts by priority/status/assignee, category grades)
and a **Task Tracker** tab (one row per task, with Assignee and Status
dropdowns). Tasks, priorities, and scores come **only** from the audit reports —
this skill never invents tasks, and assignees come only from a roster the user
provides.

This skill **does not run the audit**. It consumes the audit's output. If the
reports are missing, tell the user to run the audit first (the `audit` skill in
this plugin, e.g. "run a codebase SEO audit on this repo").

## Prerequisites

1. **Audit reports exist.** Look for `reports/codebase-seo-evidence.json`
   (preferred — it carries the structured `actionPlan` array) or
   `reports/codebase-seo-action-plan.md` in the project being worked on.
2. **A Google service-account key is configured.** The env var `SEO_SHEET_SA_KEY`
   (or `GOOGLE_APPLICATION_CREDENTIALS`) must point to a service-account JSON key
   with the Google Sheets API and Drive API enabled. One-time setup is documented
   in `docs/google-sheets-setup.md` in this plugin.

## Workflow

### Step 1 — Locate the audit reports

Use `Glob` to find `reports/codebase-seo-evidence.json` (and
`reports/codebase-seo-action-plan.md`) under the current project. If neither
exists, stop and tell the user to run the audit first. Note the path — you pass
it to the script as `--input`.

### Step 2 — Check for credentials

Check whether `SEO_SHEET_SA_KEY` or `GOOGLE_APPLICATION_CREDENTIALS` is set:

```bash
[ -n "$SEO_SHEET_SA_KEY" ] || [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && echo "creds: set" || echo "creds: missing"
```

- If **missing**, do not attempt a live run. Show the user the one-time setup
  steps from `docs/google-sheets-setup.md`, and offer a **`--dry-run`** instead
  (builds a local CSV + payload preview, no Google calls, no creds needed).
- If **set**, continue.

### Step 3 — Gather inputs from the user

Ask the user for (these cannot be inferred from the codebase):

- **Team roster** — names and/or emails of the people tasks can be assigned to,
  e.g. `Ana <ana@acme.com>, Ravi <ravi@acme.com>`. Optional; if omitted, the
  Assignee column is left blank (no dropdown).
- **Assignment** — `round-robin` (distribute tasks across the roster, highest
  priority first) or `none` (leave Assignee blank for manual fill). Default
  `none` when no roster is given.
- **Share with** — the Google account email to share the new sheet with. This is
  important: a service-account-owned sheet is otherwise not visible in anyone's
  Drive. Strongly recommend providing it.
- **Title** — optional spreadsheet title. Defaults to `SEO Action Plan — <project>`.

Never guess assignees. If the user gives no roster, proceed with Assignee blank.

### Step 4 — Build the sheet

Run the bundled script (it has zero npm dependencies):

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/build-sheet.mjs" \
  --input "reports/codebase-seo-evidence.json" \
  --title "Acme SEO Action Plan" \
  --roster "Ana <ana@acme.com>,Ravi <ravi@acme.com>" \
  --assign round-robin \
  --share-with "owner@acme.com"
```

Adjust flags to the user's answers. Omit `--roster`/`--assign` if no roster was
given. For a no-credentials preview, add `--dry-run` (writes
`reports/codebase-seo-tasks-preview.csv` and a payload JSON; makes no network
calls).

The script:
- Reads tasks from the evidence JSON `actionPlan` array (falls back to parsing
  `codebase-seo-action-plan.md` if that array is absent).
- Round-robin assigns tasks across the roster (if requested).
- Creates the spreadsheet with **Summary** + **Task Tracker** tabs.
- Applies header styling, frozen headers, bucket conditional formatting
  (High=red, Medium=amber, Low=green), and Assignee/Status dropdowns.
- Shares it with `--share-with` and prints the URL (also saved to
  `reports/codebase-seo-sheet-url.txt`).

### Step 5 — Report back

Give the user:
- The **spreadsheet URL** (from the script output / `reports/codebase-seo-sheet-url.txt`).
- A short summary: total tasks and the High/Medium/Low split, and who tasks were
  assigned to (if round-robin was used).
- A one-line reminder that this tracker is derived from a **codebase-only** audit
  — it contains no live traffic, rankings, backlinks, or Search Console data.

## Error handling

- **No reports found** → tell the user to run the `audit` skill first; do not
  fabricate tasks.
- **Credentials missing/invalid** → point to `docs/google-sheets-setup.md`; offer
  `--dry-run`.
- **Google API error** (e.g. service-account storage quota, API not enabled) →
  surface the script's error message verbatim and point to the troubleshooting
  notes in `docs/google-sheets-setup.md` (enable the APIs; for quota errors use a
  Shared Drive or OAuth).
- **`--share-with` omitted** → warn that the sheet was created but is only
  reachable via the printed URL until it is shared.
