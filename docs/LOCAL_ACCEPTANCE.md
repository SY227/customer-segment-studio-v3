# Local acceptance before outreach or public deployment

## Required automated gate

Run `bash start-local.sh`. It must complete npm ci, source checks, all behavioral tests including the four actual SheetJS tests, full TypeScript and the Next production build. It then starts a loopback-only server on port 3021. Do not use the delivery-only missing-dependency skip flag for acceptance.

## Browser review

Use Chrome and Safari on desktop, plus an actual iPhone/iPad where possible.

1. Opening synthetic view: 19 customers, 29 transactions, USD 3,543.00, as of 2026-06-20. Select all nine cards and confirm the matching character/details. Empty groups must remain readable and not display fabricated members.
2. Confirm all nine 3D characters, room props, motion, raycast selection, atmosphere toggle and original 4.8-second auto-selection behavior. Check WebGL console errors and network asset failures. Reduced-motion controls retain their existing boundary: new decorative effects reduce; this is not a promise to pause all legacy motion.
3. Open the member table. Group auto-selection pauses, movement remains. Change group deliberately; the table follows. Search an ID, sort, switch to all, change pages with a larger synthetic file. Close and confirm sensible focus restoration.
4. Expand Analysis basis. Thresholds, source date, counts and warning descriptions must match the actual input. “All records accepted” is validation status, not source-data completeness.
5. Load the sample again and compare all counters/exports. Demo must not flip to unrelated preset metrics.
6. Upload a small valid CSV using aliases. Confirm mapping before analysis. Upload a file with Customer ID and Account ID: the ID dropdown must require a choice. Cancel; prior analysis remains. Repeat with duplicate amount headers.
7. Import a CSV containing blanks, invalid dates, a negative adjustment and a valid transaction. Inspect rejected row counts/reasons, blank records, negative count, sums and export. Do not silently treat blank as zero. Test MDY/DMY explicitly.
8. Test real XLSX and legacy XLS, first-sheet policy, text IDs with zeros, numeric date cells, a second ignored tab, and a formula in a required field. Test an empty/password-protected/corrupted file.
9. Export group and all customers. Verify row counts, full membership (not just current page), currency/date, reason and suggested action. Test commas/quotes and formula-like IDs. Import the ID column as text. No fabricated owner/date/risk fields.
10. Optional AI off: no provider request even with a configured key. Optional on with no key: successful deterministic result and labeled fallback. With an authorized key: test real provider success and failure; inspect server requests without logging customer payloads. Member facts must stay identical.
11. Mapping dialog: keyboard labels/focus, Escape, Cancel, close button and scroll. Focus stays in native modal while open and returns afterward. Check 320/390/768/1024/1440/1920 widths; horizontal scrolling is contained within the table.
12. Failed/cancelled/repeated imports must not replace a newer result with an older response. Reload resets to the sample; no autosaved customer data is claimed.

## Before public/client-data use

Review current dependency advisories and `npm audit --omit=dev`, install provenance, request/rate limits, AI spending controls, logging/retention, authorization for real records, provider terms and hosting body/time limits. Same-origin and file-size checks are not a full security boundary. There is no new auth or tenant isolation in this release.

Check the separate flagship `?story=coverage` link. This product release does not create that campaign or qualify customers for a new coverage service.

Record acceptance outcomes, failures and actual devices. Do not call the application production-ready solely from static or mocked tests.
