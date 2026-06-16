#!/usr/bin/env node
/**
 * build-sheet.mjs — Export an SEO codebase audit action plan to a Google Sheet.
 *
 * Zero dependencies: uses Node 18+ global `fetch` and the built-in `crypto`
 * module to mint a service-account JWT and call the Google Sheets + Drive REST
 * APIs directly. No `npm install` required.
 *
 * Input: the audit's `reports/codebase-seo-evidence.json` (preferred — it carries
 * a structured `actionPlan` array). If that array is missing (older audits), the
 * script falls back to parsing `reports/codebase-seo-action-plan.md`.
 *
 * Output: a formatted Google Sheet with a Summary tab and a Task Tracker tab,
 * shared with the requested email. The spreadsheet URL is printed and written to
 * `reports/codebase-seo-sheet-url.txt`.
 *
 * Usage:
 *   node build-sheet.mjs \
 *     --input reports/codebase-seo-evidence.json \
 *     --title "Acme SEO Action Plan" \
 *     --roster "Ana <ana@acme.com>,Ravi <ravi@acme.com>" \
 *     --assign round-robin \
 *     --share-with you@acme.com
 *
 *   node build-sheet.mjs --dry-run        # build + preview locally, no network
 *
 * Credentials (live runs only): set SEO_SHEET_SA_KEY (or GOOGLE_APPLICATION_CREDENTIALS)
 * to the path of a Google service-account JSON key. See docs/google-sheets-setup.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import crypto from 'node:crypto';

const STATUS_OPTIONS = ['Not started', 'In progress', 'Blocked', 'Done'];
const DEFAULT_STATUS = 'Not started';

const TRACKER_HEADERS = [
  'Bucket', 'Priority', 'Task', 'Category', 'Impact', 'Effort', 'Confidence',
  'Files to update', 'Assignee', 'Status', 'Due date', 'Notes',
];
// 0-based column indices into TRACKER_HEADERS, reused by the formatting requests.
const COL = { bucket: 0, priority: 1, task: 2, assignee: 8, status: 9, due: 10 };

const BUCKET_COLORS = {
  High: { red: 0.96, green: 0.80, blue: 0.80 },
  Medium: { red: 1.0, green: 0.90, blue: 0.70 },
  Low: { red: 0.82, green: 0.94, blue: 0.80 },
};
const HEADER_BG = { red: 0.17, green: 0.24, blue: 0.31 };
const HEADER_FG = { red: 1, green: 1, blue: 1 };

const SUMMARY_SHEET_ID = 0;
const TRACKER_SHEET_ID = 1;

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
    shareWith: null,
    dryRun: false,
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
      case '--share-with': args.shareWith = next(); break;
      case '--dry-run': args.dryRun = true; break;
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
    'build-sheet.mjs — export an SEO audit action plan to a Google Sheet\n\n' +
    'Flags:\n' +
    '  --input <path>        evidence JSON (default reports/codebase-seo-evidence.json)\n' +
    '  --md <path>           action-plan markdown for fallback parsing\n' +
    '  --title <string>      spreadsheet title\n' +
    '  --roster "<a,b,...>"  comma-separated assignees (names and/or emails)\n' +
    '  --assign <mode>       round-robin | none (default none)\n' +
    '  --share-with <email>  Google account to share the sheet with\n' +
    '  --dry-run             build + write a local preview, no network calls\n',
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
 * (b) inside a table whose header matches the action-plan columns are captured,
 * so other 6-column tables (Audit results, Issues found) are never mistaken for
 * tasks even if the file is a full audit report rather than the action plan.
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
// Assignment + sheet payloads
// ---------------------------------------------------------------------------

function rosterName(entry) {
  // "Ana <ana@acme.com>" -> "Ana"; "ravi@acme.com" -> "ravi@acme.com"
  const m = /^(.*?)\s*<[^>]+>$/.exec(entry);
  return (m ? m[1] : entry).trim() || entry;
}

function rosterEmail(entry) {
  const m = /<([^>]+)>/.exec(entry) || /([^\s<>@]+@[^\s<>]+)/.exec(entry);
  return m ? m[1] : null;
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

function buildSummaryValues({ project, generatedAt, categories, roster, tasks }) {
  const tracker = "'Task Tracker'";
  const rows = [];
  rows.push([`SEO Action Plan — ${project}`]);
  rows.push(['Audit source', 'Codebase only']);
  rows.push(['Generated', generatedAt]);
  rows.push(['']);
  rows.push(['Tasks by priority']);
  rows.push(['High', `=COUNTIF(${tracker}!A:A,"High")`]);
  rows.push(['Medium', `=COUNTIF(${tracker}!A:A,"Medium")`]);
  rows.push(['Low', `=COUNTIF(${tracker}!A:A,"Low")`]);
  rows.push(['Total', `=COUNTA(${tracker}!C2:C)`]);
  rows.push(['']);
  rows.push(['Tasks by status']);
  for (const s of STATUS_OPTIONS) {
    rows.push([s, `=COUNTIF(${tracker}!J:J,"${s}")`]);
  }
  if (roster.length) {
    rows.push(['']);
    rows.push(['Tasks by assignee']);
    for (const entry of roster) {
      const name = rosterName(entry);
      rows.push([name, `=COUNTIF(${tracker}!I:I,"${name.replace(/"/g, '""')}")`]);
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

function buildFormatRequests(taskCount, roster) {
  const requests = [];
  const lastRow = taskCount + 1; // header + data rows (exclusive end index)
  const rosterNames = roster.map(rosterName);

  // Freeze header rows on both tabs.
  for (const sheetId of [SUMMARY_SHEET_ID, TRACKER_SHEET_ID]) {
    requests.push({
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount',
      },
    });
  }

  // Header styling — Task Tracker.
  requests.push(headerFormatRequest(TRACKER_SHEET_ID, TRACKER_HEADERS.length));
  // Title styling — Summary (single cell).
  requests.push(headerFormatRequest(SUMMARY_SHEET_ID, 1));

  if (taskCount > 0) {
    // Assignee dropdown (only when a roster was provided).
    if (rosterNames.length) {
      requests.push(dataValidationRequest(COL.assignee, lastRow, rosterNames, false));
    }
    // Status dropdown.
    requests.push(dataValidationRequest(COL.status, lastRow, STATUS_OPTIONS, false));

    // Conditional formatting by bucket.
    for (const [bucket, color] of Object.entries(BUCKET_COLORS)) {
      requests.push({
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId: TRACKER_SHEET_ID,
              startRowIndex: 1, endRowIndex: lastRow,
              startColumnIndex: COL.bucket, endColumnIndex: COL.bucket + 1,
            }],
            booleanRule: {
              condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: bucket }] },
              format: { backgroundColor: color },
            },
          },
        },
      });
    }

    // Date format on the Due date column.
    requests.push({
      repeatCell: {
        range: {
          sheetId: TRACKER_SHEET_ID,
          startRowIndex: 1, endRowIndex: lastRow,
          startColumnIndex: COL.due, endColumnIndex: COL.due + 1,
        },
        cell: { userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } } },
        fields: 'userEnteredFormat.numberFormat',
      },
    });

    // Filter over the tracker data range.
    requests.push({
      setBasicFilter: {
        filter: {
          range: {
            sheetId: TRACKER_SHEET_ID,
            startRowIndex: 0, endRowIndex: lastRow,
            startColumnIndex: 0, endColumnIndex: TRACKER_HEADERS.length,
          },
        },
      },
    });
  }

  // Auto-size tracker columns.
  requests.push({
    autoResizeDimensions: {
      dimensions: {
        sheetId: TRACKER_SHEET_ID, dimension: 'COLUMNS',
        startIndex: 0, endIndex: TRACKER_HEADERS.length,
      },
    },
  });

  return requests;
}

function headerFormatRequest(sheetId, colCount) {
  return {
    repeatCell: {
      range: {
        sheetId, startRowIndex: 0, endRowIndex: 1,
        startColumnIndex: 0, endColumnIndex: colCount,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: HEADER_BG,
          textFormat: { bold: true, foregroundColor: HEADER_FG },
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat)',
    },
  };
}

function dataValidationRequest(colIndex, lastRow, values, strict) {
  return {
    setDataValidation: {
      range: {
        sheetId: TRACKER_SHEET_ID,
        startRowIndex: 1, endRowIndex: lastRow,
        startColumnIndex: colIndex, endColumnIndex: colIndex + 1,
      },
      rule: {
        condition: { type: 'ONE_OF_LIST', values: values.map((v) => ({ userEnteredValue: v })) },
        showCustomUi: true,
        strict,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Google auth + REST helpers
// ---------------------------------------------------------------------------

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function loadServiceAccount() {
  const path = process.env.SEO_SHEET_SA_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    fail(
      'No service-account key found. Set SEO_SHEET_SA_KEY (or ' +
      'GOOGLE_APPLICATION_CREDENTIALS) to your key file path. ' +
      'See docs/google-sheets-setup.md. (Tip: run with --dry-run to preview without creds.)',
    );
  }
  let sa;
  try {
    sa = JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (e) {
    fail(`Could not read service-account key at ${path}: ${e.message}`);
  }
  if (!sa.client_email || !sa.private_key) {
    fail('Service-account key is missing client_email / private_key.');
  }
  return sa;
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ].join(' '),
    aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(sa.private_key);
  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    fail(`Token request failed (${res.status}): ${body.error_description || body.error || 'unknown'}`);
  }
  return body.access_token;
}

async function api(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.error?.message || JSON.stringify(json);
    fail(`Google API ${method} ${url} failed (${res.status}): ${msg}`);
  }
  return json;
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function toCsv(rows) {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function summarize(tasks) {
  const counts = { High: 0, Medium: 0, Low: 0 };
  for (const t of tasks) counts[t.bucket] = (counts[t.bucket] || 0) + 1;
  return counts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const data = loadAuditData(args);

  const ordered = orderTasks(data.tasks);
  const assigned = assignTasks(ordered, args.roster, args.assign);
  const title = args.title || `SEO Action Plan — ${data.project}`;

  const trackerValues = buildTrackerValues(assigned);
  const summaryValues = buildSummaryValues({
    project: data.project,
    generatedAt: data.generatedAt,
    categories: data.categories,
    roster: args.roster,
    tasks: assigned,
  });
  const formatRequests = buildFormatRequests(assigned.length, args.roster);
  const counts = summarize(assigned);

  if (args.dryRun) {
    const csvPath = join(data.outDir, 'codebase-seo-tasks-preview.csv');
    const payloadPath = join(data.outDir, 'codebase-seo-sheet-payload.json');
    writeFileSync(csvPath, toCsv(trackerValues));
    writeFileSync(payloadPath, JSON.stringify({
      title,
      sheets: ['Summary', 'Task Tracker'],
      summaryValues,
      trackerValues,
      formatRequests,
      shareWith: args.shareWith,
    }, null, 2));
    process.stdout.write(
      `DRY RUN — no Google API calls made.\n` +
      `  Title:        ${title}\n` +
      `  Tasks:        ${assigned.length} (High ${counts.High || 0}, Medium ${counts.Medium || 0}, Low ${counts.Low || 0})\n` +
      `  Assignment:   ${args.assign}${args.roster.length ? ` across ${args.roster.length} people` : ''}\n` +
      `  CSV preview:  ${csvPath}\n` +
      `  Payload:      ${payloadPath}\n`,
    );
    return;
  }

  const sa = loadServiceAccount();
  const token = await getAccessToken(sa);

  // 1) Create the spreadsheet with two named tabs.
  const created = await api('POST', 'https://sheets.googleapis.com/v4/spreadsheets', token, {
    properties: { title },
    sheets: [
      { properties: { sheetId: SUMMARY_SHEET_ID, title: 'Summary' } },
      { properties: { sheetId: TRACKER_SHEET_ID, title: 'Task Tracker' } },
    ],
  });
  const spreadsheetId = created.spreadsheetId;
  const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2) Write values.
  await api('POST',
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    token, {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Summary!A1', values: summaryValues },
        { range: "'Task Tracker'!A1", values: trackerValues },
      ],
    });

  // 3) Apply formatting, dropdowns, conditional formatting.
  await api('POST',
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    token, { requests: formatRequests });

  // 4) Share with the requested user (service-account-owned files are otherwise invisible).
  if (args.shareWith) {
    await api('POST',
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions?sendNotificationEmail=true`,
      token, { role: 'writer', type: 'user', emailAddress: args.shareWith });
  }

  const urlFile = join(data.outDir, 'codebase-seo-sheet-url.txt');
  writeFileSync(urlFile, `${spreadsheetUrl}\n`);

  process.stdout.write(
    `Google Sheet created.\n` +
    `  URL:        ${spreadsheetUrl}\n` +
    `  Tasks:      ${assigned.length} (High ${counts.High || 0}, Medium ${counts.Medium || 0}, Low ${counts.Low || 0})\n` +
    `  Shared with:${args.shareWith ? ` ${args.shareWith}` : ' (not shared — pass --share-with <email>)'}\n` +
    `  URL saved:  ${urlFile}\n`,
  );
}

main().catch((e) => fail(e?.stack || String(e)));
