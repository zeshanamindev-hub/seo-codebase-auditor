#!/usr/bin/env node
/**
 * build-sheet.mjs — Export an SEO codebase audit action plan to CSV files
 * that can be imported into Google Sheets, Excel, or any spreadsheet app.
 *
 * Fully local: no network calls, no credentials, no dependencies (Node 18+).
 *
 * Input: the audit's `reports/codebase-seo-evidence.json` (preferred — it carries
 * a structured `actionPlan` array). If that array is missing (older audits), the
 * script falls back to parsing `reports/codebase-seo-action-plan.md`.
 *
 * Output (written next to the input file):
 *   reports/codebase-seo-tasks.csv    — Task Tracker (one row per task)
 *   reports/codebase-seo-summary.csv  — Summary (counts + category grades)
 *
 * Usage:
 *   node build-sheet.mjs \
 *     --input reports/codebase-seo-evidence.json \
 *     --title "Acme SEO Action Plan" \
 *     --roster "Ana <ana@acme.com>,Ravi <ravi@acme.com>" \
 *     --assign round-robin
 *
 * To use in Google Sheets: File → Import → Upload → select the CSV.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const STATUS_OPTIONS = ['Not started', 'In progress', 'Blocked', 'Done'];
const DEFAULT_STATUS = 'Not started';

const TRACKER_HEADERS = [
  'Bucket', 'Priority', 'Task', 'Category', 'Impact', 'Effort', 'Confidence',
  'Files to update', 'Assignee', 'Status', 'Due date', 'Notes',
];

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    input: 'reports/codebase-seo-evidence.json',
    md: null,
    title: null,
    roster: [],
    assign: 'none',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--input': args.input = next(); break;
      case '--md': args.md = next(); break;
      case '--title': args.title = next(); break;
      case '--roster': args.roster = parseRoster(next()); break;
      case '--assign': args.assign = next(); break;
      // Accepted for backward compatibility with older instructions; no effect.
      case '--dry-run': break;
      case '--help': case '-h': printHelp(); process.exit(0); break;
      default:
        if (a.startsWith('--')) fail(`Unknown flag: ${a}`);
    }
  }
  if (args.assign !== 'none' && args.assign !== 'round-robin') {
    fail(`--assign must be "round-robin" or "none" (got "${args.assign}")`);
  }
  return args;
}

function parseRoster(raw) {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function printHelp() {
  process.stdout.write(
    'build-sheet.mjs — export an SEO audit action plan to CSV (local only)\n\n' +
    'Flags:\n' +
    '  --input <path>        evidence JSON (default reports/codebase-seo-evidence.json)\n' +
    '  --md <path>           action-plan markdown for fallback parsing\n' +
    '  --title <string>      title written into the summary CSV\n' +
    '  --roster "<a,b,...>"  comma-separated assignees (names and/or emails)\n' +
    '  --assign <mode>       round-robin | none (default none)\n',
  );
}

function fail(msg) {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load + normalize tasks
// ---------------------------------------------------------------------------

function loadAuditData(args) {
  const inputPath = resolve(args.input);
  const outDir = dirname(inputPath);
  let project = 'project';
  let generatedAt = new Date().toISOString().slice(0, 10);
  let categories = null;
  let tasks = [];

  let evidence = null;
  try {
    evidence = JSON.parse(readFileSync(inputPath, 'utf8'));
  } catch {
    evidence = null;
  }

  if (evidence) {
    project = evidence.project?.name || project;
    generatedAt = (evidence.generatedAt || generatedAt).slice(0, 10);
    categories = evidence.categories || null;
    if (Array.isArray(evidence.actionPlan) && evidence.actionPlan.length) {
      tasks = evidence.actionPlan.map(normalizeTask);
    }
  }

  if (!tasks.length) {
    const mdPath = args.md
      ? resolve(args.md)
      : join(outDir, 'codebase-seo-action-plan.md');
    try {
      tasks = parseMarkdownActionPlan(readFileSync(mdPath, 'utf8'));
    } catch {
      // leave tasks empty; reported below
    }
  }

  if (!tasks.length) {
    fail(
      'No action-plan tasks found. Provide --input pointing at a ' +
      'codebase-seo-evidence.json with an "actionPlan" array, or --md pointing ' +
      'at a codebase-seo-action-plan.md. Run the audit first.',
    );
  }

  return { project, generatedAt, categories, tasks, outDir };
}

function normalizeTask(t) {
  const impact = num(t.impact);
  const effort = num(t.effort);
  const confidence = num(t.confidence);
  const priority = t.priority != null ? num(t.priority) : impact + confidence - effort;
  return {
    bucket: t.bucket || bucketForScore(priority),
    priority,
    task: String(t.task || '').trim(),
    category: String(t.category || '').trim(),
    impact, effort, confidence,
    files: Array.isArray(t.files) ? t.files.join(', ') : String(t.files || '').trim(),
    severity: String(t.severity || '').trim(),
  };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function bucketForScore(score) {
  if (score >= 6) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

/**
 * Parse the High/Medium/Low tables from codebase-seo-action-plan.md.
 * Table columns: Priority | Task | Impact | Effort | Confidence | Files to update
 *
 * Only rows that are (a) under a "**High/Medium/Low priority**" heading and
 * (b) inside a table whose header matches the action-plan columns are captured.
 */
function parseMarkdownActionPlan(md) {
  const lines = md.split(/\r?\n/);
  const tasks = [];
  let bucket = null;
  let inTable = false;
  for (const raw of lines) {
    const line = raw.trim();
    const b = /^\*\*(High|Medium|Low)\s+priority\*\*/i.exec(line);
    if (b) { bucket = cap(b[1]); inTable = false; continue; }
    if (!line.startsWith('|')) { inTable = false; continue; }

    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 6) { inTable = false; continue; }

    const lower = cells.map((c) => c.toLowerCase());
    const isHeader = lower[0] === 'priority' && lower.includes('task') &&
      lower.some((c) => c.includes('files'));
    const isSeparator = cells.every((c) => c === '' || /^:?-{2,}:?$/.test(c));
    if (isHeader) { inTable = true; continue; }
    if (isSeparator) continue;
    if (!inTable || !bucket) continue;

    const [priority, task, impact, effort, confidence, files] = cells;
    if (!task) continue;
    tasks.push(normalizeTask({
      bucket, priority, task, impact, effort, confidence,
      files: stripBackticks(files),
    }));
  }
  return tasks;
}

function stripBackticks(s) {
  return String(s || '').replace(/`/g, '').trim();
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Assignment + table builders
// ---------------------------------------------------------------------------

function rosterName(entry) {
  // "Ana <ana@acme.com>" -> "Ana"; "ravi@acme.com" -> "ravi@acme.com"
  const m = /^(.*?)\s*<[^>]+>$/.exec(entry);
  return (m ? m[1] : entry).trim() || entry;
}

function orderTasks(tasks) {
  const rank = { High: 0, Medium: 1, Low: 2 };
  return [...tasks].sort((a, b) => {
    const r = (rank[a.bucket] ?? 3) - (rank[b.bucket] ?? 3);
    return r !== 0 ? r : b.priority - a.priority;
  });
}

function assignTasks(tasks, roster, mode) {
  if (mode !== 'round-robin' || roster.length === 0) {
    return tasks.map((t) => ({ ...t, assignee: '' }));
  }
  const names = roster.map(rosterName);
  return tasks.map((t, i) => ({ ...t, assignee: names[i % names.length] }));
}

function buildTrackerValues(tasks) {
  const rows = [TRACKER_HEADERS];
  for (const t of tasks) {
    rows.push([
      t.bucket, t.priority, t.task, t.category, t.impact, t.effort, t.confidence,
      t.files, t.assignee || '', DEFAULT_STATUS, '', '',
    ]);
  }
  return rows;
}

// Counts are computed here (not as spreadsheet formulas) because a CSV import
// lands each file in its own sheet, so cross-sheet formulas would break.
function buildSummaryValues({ title, generatedAt, categories, roster, tasks }) {
  const count = (pred) => tasks.filter(pred).length;
  const rows = [];
  rows.push([title]);
  rows.push(['Audit source', 'Codebase only']);
  rows.push(['Generated', generatedAt]);
  rows.push(['']);
  rows.push(['Tasks by priority']);
  for (const b of ['High', 'Medium', 'Low']) rows.push([b, count((t) => t.bucket === b)]);
  rows.push(['Total', tasks.length]);
  rows.push(['']);
  rows.push(['Tasks by status (at export)']);
  for (const s of STATUS_OPTIONS) {
    rows.push([s, s === DEFAULT_STATUS ? tasks.length : 0]);
  }
  if (roster.length) {
    rows.push(['']);
    rows.push(['Tasks by assignee']);
    for (const entry of roster) {
      const name = rosterName(entry);
      rows.push([name, count((t) => t.assignee === name)]);
    }
  }
  if (categories && typeof categories === 'object') {
    rows.push(['']);
    rows.push(['Category grades (from audit)']);
    rows.push(['Category', 'Grade', 'Score']);
    for (const [key, c] of Object.entries(categories)) {
      rows.push([prettyCategory(key), c?.grade ?? '', c?.score ?? '']);
    }
  }
  rows.push(['']);
  rows.push(['Note: derived from a codebase-only SEO audit. No live traffic, ' +
    'rankings, backlinks, or Search Console data are represented here.']);
  return rows;
}

function prettyCategory(key) {
  return String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// CSV output
// ---------------------------------------------------------------------------

function toCsv(rows) {
  // Leading BOM so Excel opens UTF-8 (e.g. the em dash) correctly.
  return '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

function csvCell(v) {
  let s = String(v ?? '');
  // Neutralise spreadsheet formula injection from task text (=, +, -, @).
  if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const data = loadAuditData(args);

  const ordered = orderTasks(data.tasks);
  const assigned = assignTasks(ordered, args.roster, args.assign);
  const title = args.title || `SEO Action Plan — ${data.project}`;

  const tasksPath = join(data.outDir, 'codebase-seo-tasks.csv');
  const summaryPath = join(data.outDir, 'codebase-seo-summary.csv');

  writeFileSync(tasksPath, toCsv(buildTrackerValues(assigned)));
  writeFileSync(summaryPath, toCsv(buildSummaryValues({
    title,
    generatedAt: data.generatedAt,
    categories: data.categories,
    roster: args.roster,
    tasks: assigned,
  })));

  const n = (b) => assigned.filter((t) => t.bucket === b).length;
  process.stdout.write(
    `CSV export complete (local only, no network calls).\n` +
    `  Tasks:    ${assigned.length} (High ${n('High')}, Medium ${n('Medium')}, Low ${n('Low')})\n` +
    `  Tracker:  ${tasksPath}\n` +
    `  Summary:  ${summaryPath}\n` +
    `  Google Sheets: File → Import → Upload → choose each CSV.\n`,
  );
}

main();
