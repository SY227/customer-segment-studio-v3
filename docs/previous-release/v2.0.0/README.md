# Customer Segment Studio V2

**V2.0.0 · Guild Atelier production release**

This release keeps the existing nine 3D characters, business logic, upload workflow, RFM analysis, character movement, selection behavior and Persistent Hall fix while establishing the redesigned Studio as Customer Segment Studio V2.

**V3 Artisan visual release · v1.1.0**

The real Customer Segment Studio, with an artistic light presentation inspired by the V3 flagship. This is a complete Next.js source/assets project, not a landing page, mockup, patch or screenshot-only implementation.

## What stays yours

All nine original character GLBs, the original textures, the room props, original character-card rendering, character motion, selection, conversation rotation and lock behavior are retained. All 35 model/texture assets are byte-identical to the V3 Light base. Nine group labels, character mappings, business fields, sample data, upload flow, CSV/Excel parsing, deterministic RFM analysis, AI guidance and its fallback remain the existing implementation.

There are no fake customer profiles, new navigation tabs, campaign-launch buttons, forecasts, ROI gauges, or invented metrics. Those appeared in earlier generated concept images, but they are not part of the actual product or this release. This release does not claim to be a pixel-identical implementation of those images.

## What changes

- An ivory, indigo and brass editorial presentation with a nine-facet seal, subtle paper texture, engraved lines and more deliberate typography.
- Framed live character portraits with an ornamental backdrop, group-color tint, responsive lighting sheen, and a tiny pointer-driven tilt confined to the portrait stage. Metrics and text never tilt.
- The original 3D room is supplemented with an arched-window backdrop behind the existing props, fine floor inlays, a small observatory instrument, soft procedural contact shadows and a selected-character ring. No original model or texture is replaced.
- Very restrained rays and drifting dust share the original scene renderer. **Ambient effects on/off** controls only these new atmospheric accents, not original character movement or conversation selection.
- New pointer effects and atmosphere respect reduced-motion preferences. The original character animation and conversation rules are preserved; the new switch is intentionally not labeled “Pause all motion.”
- The details panel keeps a calm reading surface, with a clearer distinction between historical metrics and recommended next actions. No claim of recovered or predicted revenue is added.

## Run on your Mac

Use Node.js 22 LTS (minimum Node.js 20.9) and npm. After extracting this directory:

```bash
cd /path/to/customer-segment-studio-v3-artisan-v1.1.0
bash start-local.sh
```

The script installs the original lockfile, runs source/asset and isolated tests, runs a full local type check and production build, then opens a local-only server at **http://localhost:3016**. It does not open a browser automatically. Press Control + C to stop it.

For a different port:

```bash
PORT=3017 bash start-local.sh
```

The script never deletes an older project, changes GitHub, links Vercel, or deploys production.

## API configuration

The no-key sample/CSV analysis path works deterministically in the existing implementation. AI-written soft guidance uses the existing `GEMINI_API_KEY` configuration.

To retain your current AI setup, copy your existing `.env.local` into this project root before launching. Alternatively, copy `.env.example` to `.env.local` and enter your own key locally. Do not commit or share that file. No credentials are included in this package.

Provider endpoint, retry behavior and dependency versions were not changed in a visual-only release. Live AI provider availability was not tested here.

## Manual commands

```bash
npm ci
node scripts/verify.cjs
node scripts/test-atelier-layer.cjs
npx --no-install tsc --noEmit
npm run build
npm run start -- --hostname 127.0.0.1 --port 3016
```

For development after installation:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3016
```

## Verification boundary

See `docs/QA_REPORT.md`. The delivery environment could not reach the npm registry, so a complete Next.js build or actual Three.js/WebGL browser run was not possible here. The included source-preservation, syntax, isolated-business, decorative-lifecycle and CSS-layout checks are not substitutes for that runtime pass. The launch script performs the real build on your Mac and stops on errors.

This is a complete code/assets delivery with explicit runtime-validation limits, not a claim of completed production or real-device acceptance.

## Where to adjust the art direction

| File | Responsibility |
|---|---|
| `app/atelier.css` | Additive artistic theme over the previous light stylesheet |
| `src/components/AtelierChrome.tsx` | SVG engraving/seal and non-business pointer effects |
| `src/lib/createAtelierScene.ts` | Optional decorative 3D layer; explicit resource disposal |
| `src/components/SegmentGuildCanvas.tsx` | Existing scene plus isolated visual-layer integration |
| `app/page.tsx` | Existing page with decorative wrappers and selected-color variables |

Original `app/globals.css` is retained as the fallback base. The npm package name/version and dependency lockfile are intentionally unchanged; `v1.1.0` identifies this downloadable visual release.

Original asset licenses are in `docs/licenses/`. Do not replace the actual models with the generated concept images. No external font files, remote art dependencies, analytics or new API services were added.

### v1.1.1 stability note
Switching between customer groups now changes only the selected group and detail content. The all-character 3D hall keeps a stable responsive viewport, so different detail-panel heights no longer resize the renderer or visually shift the room background.
