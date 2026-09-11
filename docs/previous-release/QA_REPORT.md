# Customer Segment Studio — V3 Light: QA report

## Delivery boundary

This is a complete source/assets package with presentation updates. It is **not a claim of completed production-runtime acceptance**. No GitHub write or Vercel deployment was performed.

## Verified

- **53 unchanged original files**, compared by SHA-256 against the restored source baseline.
- **35 original binary assets** retained exactly: nine GLB models, one character texture, and 25 dungeon model/texture files.
- **Nine GLB structures** inspected: valid header/version/length, mesh data, and skeleton skin records. This does not prove animation playback.
- The scene file differs only by the allowed background, fog, light, material-color, and responsive camera-fit replacements recorded in `visual-changes.json`. Reversing those replacements recovers its original SHA-256. Character motion/selection code and room geometry were not rewritten.
- **Nine TypeScript files** passed syntax/transpilation checks using the installed TypeScript compiler. This is not a dependency-resolved type check or a Next.js build.
- Isolated deterministic tests cover nine labels/default selection, equal-value ties, invalid rows, date anchoring, empty data, customer coverage, and revenue conservation.
- Isolated API tests cover the real handler code with a `NextResponse` adapter: no-key sample analysis, quoted CSV upload, duplicate customer aggregation, invalid-upload errors, and a mocked AI response attempting to alter hard metrics. No real provider was called.
- The unchanged sample was independently parsed: **29 rows, 19 distinct customers, $3,543 total**.
- **87 source/asset/syntax/isolated-business checks passed**. Run `node scripts/verify.cjs` after `npm ci` to repeat them.

## CSS-only browser inspection

Chromium rendered the actual page JSX through a small isolated static-markup adapter with the final stylesheet. **Three.js and React/Next.js were not executed; the room and avatar areas were labeled placeholders.** These tests must not be represented as end-to-end browser or WebGL tests.

The following CSS states were checked at widths **320, 360, 390, 430, 640, 768, 980, 1024, 1180, 1280, 1440, and 1600 px**: the default page, sample-format dialog, sample-data dialog, and processing state. Each of the nine selected-group layouts was also inspected at 390 and 1440 px. Keyboard focus styling and reduced-motion CSS transition removal were checked.

**68 recorded CSS-only cases passed**, with no whole-page horizontal overflow in those fixtures. Dialog tables intentionally allow local horizontal scrolling at small widths. Desktop and mobile layout images were visually inspected, but are not distributed as running-product screenshots because WebGL was not loaded.

Results: `layout-only-results.json`.

## Not verified in the delivery environment

The environment could not resolve/reach `registry.npmjs.org` (`EAI_AGAIN` / DNS connectivity failure), so `npm ci` could not finish. The original dependency versions and lockfile were not changed to work around that restriction.

Consequently, the following are pending:

- Complete dependency installation, dependency-resolved type checking, Next.js build, React hydration, and local production-server launch.
- Real Three.js material appearance, model loading, live animation, click/bubble/detail synchronization, renderer/context lifecycle, and performance.
- Real Excel parsing, live AI-provider success/retry/fallback, and real network timing.
- Safari, physical iPhone/iPad, touch interactions, real-device performance, and sustained WebGL behavior.

Use `ACCEPTANCE.md` for the local runtime acceptance pass. Do not equate unchanged code with proven runtime correctness, or source-preservation tests with a security audit.

## Package integrity

The release ZIP is checked for structural integrity and re-extracted for the same source/asset verification. It contains source files, original assets/licenses, and documentation/test tools. It excludes `.env.local`, credentials, `.git`, `.vercel`, `node_modules`, `.next`, raw all-files exports, and any font files.
