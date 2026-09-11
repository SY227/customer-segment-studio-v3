# V2.1 product and implementation decisions

## Preserve the real product; add evidence and a handoff

The product remains a transaction-history RFM Studio. It does not become a B2B account-health or weekly-coverage engine. The pilot callout is explicit about that boundary. Existing characters are not remapped into invented coverage categories.

## One truthful sample

V2 opened on a static aggregate demonstration (1,240,000 historical revenue and preset segment counts), while its downloadable/API sample comprised 29 transactions for 19 IDs totaling 3,543.00. There are no source transactions behind the larger decorative counts. V2.1 starts from the actual API sample, computed server-side, and uses the same sample for initial view, sample reload, drilldown and export. It does not synthesize fake member records to preserve decorative totals. The old presets stay in the archived baseline/config but are overridden by actual analyzed counts in the current view.

## Algorithm stability

The original V2 quantile scoring function, latest-transaction as-of reference, recency mapping, tie behavior and frequency+monetary combination remain. Golden comparisons cover datasets of 1, 2, 3, 8, 19, 90 and 201 customers plus invalid normalized input. New customer detail and basis metadata extend the result rather than recalculate it on the client.

The imported-data contract is intentionally stricter: blank amounts are not zero; impossible/ambiguous dates and required-field formulas are rejected; duplicate header positions survive; repeated rows and negatives are disclosed. These corrections may change results for previously silently coerced or ambiguous files. They are not an undocumented quantile change.

The view explicitly restores deterministic signed revenue proportions after applying legacy soft guidance, avoiding the old helper's percentage heuristic for values over 1. Zero/negative total datasets do not display meaningful revenue-share percentages.

## Import and privacy

Inspection is a server-side, no-AI read. Confirmation sends the file again with the selected mapping; no server session/database is introduced. Users select a date policy and currency. Displaying a preview does not imply the file stayed in the browser.

## AI is opt-in, not key-triggered

A key no longer automatically causes a provider request. Guidance needs explicit includeAI=true. Filenames are removed from the provider prompt along with IDs and raw/member rows. Hard metrics and membership cannot be provider-written. Two bounded attempts replace the original potentially long retry sequence. Live provider behavior remains untested; fallback is part of the product.

## Templates and claims

| Previous presentation | V2.1 treatment |
| --- | --- |
| Revenue at stake | Historical revenue represented |
| Recovered revenue in 14 days | 14-day reactivation response, a suggested KPI |
| Quickest growth opportunity | Recent-buyer group to review; not predicted growth |
| Highest reactivation need | Reactivation group to review; not a calculated risk ranking |
| New/Growing/At-Risk literal assertions | Retained labels with their actual relative-bin meaning |
| Customer-voice certainty | Strategy illustration, not observed customer testimony |
| Best channel | Suggested channel |

## Interaction and performance

The hall renderer, character avatars, art layer, GLBs and original atmosphere/motion code are byte-for-byte preserved. Memoized segments change when analysis changes, not when the customer table is filtered. Opening member review or mapping pauses auto-selection but not character movement. The table has its own search/page/sort state and renders 25 rows at once. Row/cell/customer/payload limits are explicit.

## Export

Exports take canonical member facts from the completed analysis, reject foreign/duplicate member IDs, then attach clearly labeled group suggestions. Selected/all exports do not silently export only the visible page. Textual formula-like values are neutralized. Users still need to preserve ID column types in their spreadsheet and decide owners/dates themselves.

## Why the old verifier changed

The original verifier is preserved in `docs/previous-release/v2.0.0/scripts/verify.cjs`. Some of its byte expectations already predate the V2 metadata rename. Its full-page-controller hash, automatic-AI-on-key behavior, 500 validation-error expectation and no-member response contract are intentionally superseded. The current verifier pins actual V2 file hashes with an explicit changed-file allowlist; all four protected renderer/motion/raycast/rotation ranges remain checked. Golden original-engine comparisons and new API/import/export tests replace obsolete assumptions. No old asset hash is reset to make modified art pass.

## Dependency change

The official SheetJS 0.20.3 tarball is pinned by publisher URL instead of retaining the outdated registry 0.18.5 build. Its real parser tests are required after npm ci and never silently skipped in the local launcher. The install and full dependency audit were blocked here. Other inherited dependencies are not claimed security-cleared. No database/authentication/CRM/analytics dependencies were introduced.

The full typecheck first runs `next typegen` to create generated route declarations for a clean extraction. `next-env.d.ts` is Next-managed generated content and is checked structurally, not by a stale byte hash. No build-error suppression is enabled.

AI field provenance is tracked per segment. CSV guidance_source describes whether each exported action/objective/window is AI or a reviewed prompt; a partial provider response does not relabel all rows as AI.
