# V3 Artisan v1.1.0 — change boundary

Base: `customer-segment-studio-v3-light-v1.0.0.zip`, supplied in this conversation.

## Preserved

49 original runtime/config/asset files remain byte-identical to the V3 Light base. This includes all 35 model/texture assets, the nine character GLBs, original card-avatar renderer, header input controls, deterministic analysis, API route, group definitions, original light stylesheet, sample CSV, package.json and package-lock.json.

Protected executable ranges are hashed independently: page data-processing controller, original character-motion profiles, walk/rig kernel, character raycasts, and automatic conversation rotation. Their expected hashes are in `protected-behavior.json`.

## Existing runtime files changed

- `app/page.tsx`: decorative components/portrait engraving, an italic span in the existing title, selected-group style variables. Original business controller and field bindings are retained.
- `app/layout.tsx`: imports the additional `atelier.css` stylesheet.
- `src/components/SegmentGuildCanvas.tsx`: optional decorative-layer setup/update/disposal, light background/tone mapping, ambient-only UI state/control, count metadata and an initialization-error catch. No replacement character, new movement kernel, new business flow, new forecast or campaign execution is added.

## New runtime files

- `app/atelier.css`
- `src/components/AtelierChrome.tsx`
- `src/lib/createAtelierScene.ts`

The scene layer uses the existing renderer. It adds no new canvas, GPU post-processing chain, model download or service. Original card renderers remain the original implementation.

## Tooling/docs

The local launch script now runs a dependency-resolved type check and production build on the user's machine before launching. Verification tools and current reports are included. Previous-release reports are archived under `docs/previous-release` and are not evidence for the current runtime.

No GitHub write or Vercel deployment was performed.

## Engineering references

The new decorative module explicitly disposes owned GPU resources, following the Three.js resource-ownership guidance: https://threejs.org/manual/en/cleanup.html

New non-essential motion is gated using the OS preference: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion

## v1.1.1 — Persistent Hall Fix

- Fixed the actual cause of the hall jump: the two desktop columns stretched to the same row height while the hall canvas used flex growth.
- The buyer-detail panel can now grow or shrink without changing the 3D hall viewport height.
- The original Three.js scene lifecycle, nine characters, movement, selection, auto-rotation, assets, and business logic are unchanged.
- Added responsive regression checks for stable hall heights.
