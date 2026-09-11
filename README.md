# Customer Segment Studio V3
## Evidence + Action / Outreach Ready — local review release

A complete update of the existing purchase-history Studio, based on GitHub main commit `b587b86211c74cb0935d7b75eb0f8e9592aefc59`. Not a rebuild, CRM, coverage-health engine or deployment.

**Validation boundary:** source/asset checks, isolated business/API tests and CSS-layout checks passed in the delivery environment. Dependency installation was unavailable, so a complete Next.js build, full application typecheck, actual SheetJS Excel parsing and React/WebGL runtime acceptance were **not executed here**. Run `bash start-local.sh`; it requires the installed-dependency tests, full typecheck and production build to pass before starting. See `docs/QA_REPORT.md`.

## What changed

- Select a group and open the actual customer members behind it.
- Search IDs, switch selected/all scope, sort by spend/recency/ID, and paginate in groups of 25.
- Inspect last purchase, recency days, order count, historical spend, scores/bands and a deterministic assignment reason.
- Open **Analysis basis** for the as-of date, exact cut points, accepted/excluded records, issue counts, examples and limitations.
- Preview CSV/Excel columns and confirm a positional mapping, explicit date interpretation and currency before analysis. Ambiguous aliases stay unresolved.
- Download a selected-group, all-customer or filtered-result action CSV from the completed result in your browser.
- Use optional AI guidance only when explicitly requested. A server key alone does not enable it.
- Historical-metric language replaces unsupported recovery, churn and outcome claims.
- Opening demo and “Load sample data” use the same **29 synthetic transactions, 19 customers, historical total 3,543.00 USD, as of 2026-06-20**. The old decorative demo aggregates are not used to fabricate members.
- The existing nine labels, assets, mapping, room, movement, atmosphere and original quantile rules remain. “More strategy guidance” is progressively disclosed to keep the selected panel readable.

## Run locally — one terminal

Use Node.js 22 LTS (minimum 20.9), npm and an internet connection for package installation.

```bash
cd /path/to/customer-segment-studio-v3
bash start-local.sh
```

The launcher checks port availability without stopping another process, preserves an existing `.env.local`, installs using `npm ci`, runs source checks, all tests, TypeScript and the production build, then starts **http://localhost:3021**, bound to `127.0.0.1`. Control+C stops it. It does not touch GitHub or Vercel.

A different local port:

```bash
PORT=3022 bash start-local.sh
```

An explicitly chosen existing environment file can be copied only when `.env.local` is absent:

```bash
ENV_SOURCE="$HOME/Desktop/customer-segment-studio-v2/.env.local" bash start-local.sh
```

No environment values are printed. Without a key, the product still analyzes sample and uploaded transactions and exports reviewed strategy prompts.

## Optional environment values

Edit `.env.local` locally:

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
```

`GEMINI_MODEL` preserves the prior provider model by default; live model availability has not been tested in this delivery. Enable optional guidance in **How your data is used**, or on the import-confirmation screen. There is no need to add a key for deterministic analysis. Do not commit or share `.env.local`.

## Input and mapping

One transaction per row, in one currency. Required concepts:

| Studio field | Recognized aliases |
| --- | --- |
| Customer ID | `customer_uid`, `customer_id`, `customerid`, `account_id`, `accountid`, `client_id`, `buyer_id` |
| Purchase date | `purchase_date`, `order_date`, `transaction_date`, `date`, `purchase_dt` |
| Transaction value | `total`, `amount`, `order_value`, `transaction_value`, `revenue`, `net_sales`, `sales` |

Case, spaces and punctuation in headers are normalized for suggestions. Any column can be mapped manually. Two matches are not silently resolved. Three different source-column positions must be selected; repeated header text does not overwrite a column.

CSV: UTF-8, comma-separated, standard quoted fields/escaped quotes. Excel: `.xlsx`/`.xls`, first sheet only. Formula cells in required fields are excluded; paste values first. Numeric Excel IDs can already have lost leading zeros or precision; use text IDs. Direct contact data and notes are unnecessary.

Dates: use `YYYY-MM-DD`, an ISO timestamp with an explicit timezone, or an explicitly chosen month/day/year or day/month/year slash format. Excel serial dates respect 1900/1904 epochs; the fictitious 1900-02-29 is rejected. Impossible and unresolved dates are rejected, not guessed. Timestamp dates are normalized to UTC.

Amounts: dot decimal, at most two decimal places, optional comma thousands groups/leading `$`, parentheses for negatives. Blank is not zero. Numeric negatives and zero values are retained and disclosed. Choose the currency; there is no automatic detection or conversion. Split mixed currencies first.

**Order count means accepted transaction rows.** There is no supplied order ID, line-item consolidation, automatic deduplication or refund linking. Repeated rows and refunds affect counts and spend. Resolve business-specific granularity before interpreting frequency.

Review limits: 2 MiB file, 3 MiB JSON request, 50,000 nonblank records, 10,000 customers, 120 columns, 4,096 characters per cell, 24 MiB declared expanded workbook size, 3,500 KiB complete response. These are explicit bounds, not a scale/security certification. The response-size limit may bind before the customer limit. Large reviews must be split; members are never silently truncated.

## How RFM is calculated

The original V2 quantile algorithm is retained. The as-of date is the newest valid transaction supplied, **not today's date**. Recency ranks last purchase within the dataset; frequency ranks accepted rows per customer; monetary ranks historical spend. Scores are 1/2/3 with the original lower/upper cut-point and tie behavior.

The second grouping axis combines frequency and monetary scores: total >=5 is high purchase strength, >=3 is medium, otherwise low. It is not pure frequency. All-equal values receive score 2. Empty/uneven groups are valid results.

Names like New Buyers, Growing Buyers and At-Risk VIPs are retained labels; they do not establish first-time purchasing, a growth trend or future churn. A single-customer tied dataset remains in the original middle group. Nothing in this release is a renewal, LTV, CAC or profitability model.

## Evidence and export workflow

1. Start with the synthetic sample or inspect/confirm your own file.
2. Select a character/group. Click **View N customers**.
3. Read the customer list and expand **Why this assignment?**.
4. Open **Analysis basis** for source dates, exact thresholds and data-quality details.
5. Export the selected group, the entire result or a filtered search result.

Opening customer review pauses auto-selection so the table does not change underneath you. Original character movement continues. Changing group intentionally selects the new group; closing the review returns control to the existing selection toggle.

CSV columns: `customer_uid`, `segment`, `last_purchase_date`, `days_since_purchase`, `order_count`, `historical_spend`, `currency`, `analysis_as_of`, `recency_band`, `purchase_strength_band`, `reason`, `objective`, `suggested_action`, `review_window`, `guidance_source`.

The CSV includes every member of the requested scope, not just the visible page. It uses UTF-8 BOM, quoted cells and CRLF. Formula-like text is prefixed with an apostrophe; import customer IDs as text to preserve leading zeros. No owner, due date, renewal date or predicted outcome is invented. The file is a spreadsheet/operating-review handoff, **not a native CRM integration**.

## Deterministic vs. AI

Hard counts, totals, assignments, membership, scores, dates and reasons are calculated by the same server-side engine. No frontend scoring duplicate is used. AI cannot overwrite those fields. Template guidance remains useful without AI.

Optional Gemini receives only group labels/counts/revenue shares, historical total, currency and as-of date. It does not receive source filenames, IDs, transaction rows or member lists from this implementation. Only allowlisted soft fields are merged. Accepted AI fields are recorded per segment; the export labels the source of the suggested action, objective and review window instead of marking untouched templates as AI. Invalid/failed/unconfigured guidance falls back explicitly. The text screen is a conservative heuristic, not a guarantee that arbitrary AI wording is correct; review all suggestions.

## Data handling

Files are sent to the application server twice: inspection, then confirmed analysis. All chosen file columns are transmitted for parsing even though only three are analyzed. The inspection does not invoke AI. The application does not explicitly write uploads/results to a database or disk; that is not a zero-retention guarantee and does not describe hosting logs or provider policies.

The current result and selected file are kept in page memory, not autosaved to browser storage. Reloading returns to the synthetic sample. Exports are produced in-browser. Cancelling stops the browser waiting; work already received by a server may still complete. Use only authorized, minimized data. Remove personal contact fields and notes.

No authentication, database, native CRM connector, sending capability or production anti-abuse layer is introduced. Before public uploads, complete dependency/security review, request/rate-limit/cost controls, hosting retention/logging review and end-to-end acceptance. Do not treat same-origin checking or size bounds as authentication.

## Coverage pilot callout

A small link points to the requested flagship `?story=coverage` destination and labels that as a **separate exploratory review**, not functionality of this RFM Studio. The website was not modified. Confirm that the coverage campaign and contact flow are ready before using that link in outreach.

## Commands

```bash
npm ci
npm run check       # byte preservation + source/syntax checks
npm test            # behavioral/API tests; real Excel tests mandatory; original lifecycle/hall tests
npm run typecheck   # next typegen, then full installed application TypeScript check
npm run build       # full Next.js production build
npm run qa          # all four gates
npm run dev -- --hostname 127.0.0.1 --port 3021
```

The optional CSS-only fixture generator is `npm run qa:layout-fixtures`. It emits explicitly labeled layout fixtures into a temporary folder. It is not a replacement for a running React/Next/WebGL test.

## Dependency note

Next, React, Three and their existing supporting versions remain on the V2 dependency line. This release changes SheetJS from the legacy registry build to the publisher's `0.20.3` tarball, following its official installation guidance. The lock dependency graph is checked, but the tarball could not be downloaded here; the new entry therefore has no invented integrity digest. Run the real install/tests and review `npm audit --omit=dev` before deployment. This is not a claim that all inherited dependency vulnerabilities are resolved.

Official installation source: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/

## Documentation

- `docs/QA_REPORT.md`: executed vs. pending verification.
- `docs/V2_1_DECISIONS.md`: intentional behavioral changes and preserved contracts.
- `docs/SOURCE_PROVENANCE.md`: exact source recovery and Git tree matching.
- `docs/LOCAL_ACCEPTANCE.md`: local browser/Excel/security checks.
- `docs/qa-v2.1/`: logs from this release, with scope labels.
- `docs/previous-release/v2.0.0/`: original verifier, controller/API/core documentation snapshots.

Other inherited docs/results describe prior visual releases, not fresh V3 runtime validation. `docs/QA_REPORT.md` is the current validation record. All original model and texture licenses remain under `docs/licenses/`.

Type checking first runs `next typegen`, so a clean extraction does not depend on a pre-existing `.next/types/routes.d.ts`. Next may regenerate `next-env.d.ts`; it is checked structurally rather than treated as immutable application source.
