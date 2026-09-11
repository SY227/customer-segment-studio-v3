# Local runtime acceptance before production replacement

These checks are pending; they are not claimed as completed by the delivered QA report.

1. Run `npm ci`, `node scripts/verify.cjs`, and `npm run build`; start on port 3016. Confirm the title and entire interface use the light theme.
2. Confirm the existing room and all nine characters load, with no missing-asset alert or browser-console error. Check that Dormant VIPs retain their original alternate texture and that every card has its original animated model, not an image.
3. Observe wandering, turns, pauses, and bubbles. Select characters and cards and verify the detail panel stays synchronized. Confirm the original automatic rotation remains and `Keep this group selected` stops rotation without freezing the world.
4. Open/close both sample dialogs and download the sample format. Test keyboard focus and local dialog/table scrolling on a small screen.
5. Run `Load sample data`. The unchanged built-in sample contains 29 orders, 19 unique customers, and $3,543 in total revenue. Confirm the provenance notice changes from demo to sample and the nine groups update.
6. Import a known CSV and a real Excel workbook. Check totals, first-worksheet behavior, malformed input feedback, disabled controls while processing, and repeated imports. Compare output with the original app for the same files.
7. With your original API configuration restored, test optional AI guidance and fallback. Never expect model-generated text to be byte-identical across runs; hard metrics must remain deterministic.
8. Test desktop Chrome/Safari and an actual iPhone/iPad. Check all groups, scrolling, touch selection, model framing, resize, sustained motion, and browser-console errors. CSS reduced-motion styling does not disable the pre-existing Three.js animation loop.
9. Use a separate preview deployment if desired. Do not replace the existing production app until the local/runtime checks pass. The ZIP has no inherited `.git` or `.vercel` linkage.
