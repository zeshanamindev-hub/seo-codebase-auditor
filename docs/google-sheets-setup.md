# Google Sheets export — one-time setup

The `sheet` skill (`/seo-codebase-auditor:sheet`) turns an SEO audit's action
plan into a Google Sheet using a **Google service account**. This is a one-time
setup; after it's done, sheet creation is fully automatic and headless (no
browser prompts).

> Want to preview without any of this? Run the builder with `--dry-run` — it
> writes a local CSV + payload preview and makes **no** Google API calls and
> needs **no** credentials.

## 1. Create / pick a Google Cloud project

1. Go to <https://console.cloud.google.com/>.
2. Create a new project (or select an existing one).

## 2. Enable the APIs

In the same project, enable **both**:

- **Google Sheets API** — <https://console.cloud.google.com/apis/library/sheets.googleapis.com>
- **Google Drive API** — <https://console.cloud.google.com/apis/library/drive.googleapis.com>

(The Drive API is needed to share the created sheet with your email.)

## 3. Create a service account + key

1. Go to **APIs & Services → Credentials**
   (<https://console.cloud.google.com/apis/credentials>).
2. **Create credentials → Service account.** Give it any name (e.g.
   `seo-sheet-bot`). No roles are required for this use case.
3. Open the new service account → **Keys → Add key → Create new key → JSON**.
4. A `.json` key file downloads. Keep it private — treat it like a password.
   **Do not commit it to git.**

## 4. Point the plugin at the key

Set an environment variable to the key's path (add it to your shell profile so
it persists):

```bash
export SEO_SHEET_SA_KEY="/absolute/path/to/seo-sheet-bot-key.json"
# (GOOGLE_APPLICATION_CREDENTIALS is also accepted as a fallback)
```

Verify:

```bash
echo "$SEO_SHEET_SA_KEY"
```

That's it. Now run the `sheet` skill (or the builder directly) and it will create
and share the sheet automatically.

## How sharing works

A spreadsheet created by a service account is **owned by the service account**,
not by you, so it won't appear in your "My Drive" until it's shared. The builder
shares it with the `--share-with <email>` address as an editor and sends a
notification, so it shows up in that account's "Shared with me". Always pass
`--share-with` (the `sheet` skill prompts you for it).

## Troubleshooting

- **`Google Sheets API has not been used in project ...`** — you missed step 2;
  enable the Sheets API (and Drive API).
- **`The caller does not have permission`** when sharing — enable the Drive API.
- **`Service Accounts do not have storage quota`** — some accounts can't own
  Drive files directly. Two fixes:
  1. **Use a Shared Drive:** create one, add the service account as a member, and
     the file can live there. (Requires a Google Workspace org.)
  2. **Use OAuth instead of a service account** so the file is created in your own
     Drive. (Not built into this plugin's default flow; ask if you need it.)
- **`invalid_grant` / token errors** — the key JSON is malformed or the system
  clock is far off. Re-download the key and check the clock.

## Security notes

- The key grants write access to Sheets/Drive for that service account. Store it
  outside the repo and never commit it.
- The plugin reads the key only to mint a short-lived (1 hour) access token; it is
  never written anywhere or sent except to Google's token endpoint.
- To revoke access, delete the key (or the service account) in the Cloud Console.
