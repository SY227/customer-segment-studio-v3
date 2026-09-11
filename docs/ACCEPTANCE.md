# Runtime acceptance — Guild Atelier

Run this checklist locally after `bash start-local.sh`. These are pending acceptance steps, not completed checks in the delivery environment.

## Original workflows

1. Confirm all nine original characters load and move. In the browser console there should be no failed local model/texture requests.
2. Confirm the default group is At-Risk VIPs. Click a character and then a group card; the right panel and speech bubble must show the same group.
3. Allow the existing 4.8-second conversation cycle to run. Enable “Keep this group selected”: the selected group must stay fixed while original character motion continues. Disable the lock and verify the cycle resumes.
4. Open and close both original sample dialogs. Check the sample CSV link.
5. Load sample data; check the busy/disabled state and completion. The backend sample contains 29 orders, 19 unique customers and $3,543 revenue. Do not confuse it with the larger initial demo view.
6. Load a real CSV using customer_uid, purchase_date and total; then a supported Excel file with the first-tab data. Check an invalid file and a repeated upload of the same file.
7. Compare hard metrics with the previous app for the same input. With an existing API key, verify optional AI text guidance and a failed-provider fallback locally. The hard metrics must not be changed by provider text.

## New visuals

1. Confirm original low-poly models and clothing are retained — not the invented characters from the generated mockups.
2. Confirm the added arch backdrop does not obscure foreground characters or original props. The original camera angle and walk paths remain.
3. Check the contact shadows and selected-character ring align with the feet. New scenery must not intercept character clicks.
4. Toggle Ambient effects. Only rays/dust should change; data, selected group, original movement and rotation rules must remain the same.
5. On a fine pointer, move across a card: the portrait alone tilts slightly. Labels, metrics and reading text must remain level and legible.
6. Turn on the OS reduced-motion preference: new pointer tilt and ambient motion must stop. The ambient control is disabled and labeled “Ambient effects reduced”; original character behavior is intentionally unchanged.
7. Inspect widths 320, 390, 768, 1024 and 1440 pixels, including touch scrolling and dialogs. Check real Safari, iPhone and iPad, not only desktop emulation.
8. Repeatedly upload, resize, navigate away and back. Watch for renderer leaks/context loss or unexpectedly high memory/CPU use. The existing multi-renderer architecture was not redesigned in this theme release.

A console error, missing character, incorrect figure, displaced hit target, unreadable field or blocked workflow is a release blocker. Do not deploy over production until this runtime pass is complete.
