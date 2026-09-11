# V2.1 QA report — executed scope and remaining gates

## Verdict

**Complete source/assets release for local review. Not yet a verified full Next.js/WebGL runtime release.** The delivery environment could not install the app's dependencies. Tests below explicitly separate executed checks from blocked verification.

## Source baseline

GitHub main `b587b86211c74cb0935d7b75eb0f8e9592aefc59` was read and matched by recursive Git object hashes, including the complete app/public/src/docs/scripts trees. Generated tsbuildinfo was omitted. Details: SOURCE_PROVENANCE.md.

## Executed

| Check | Result | What it establishes |
| --- | --- | --- |
| Source, asset, protected 3D ranges, syntax | 107 passed | Original asset/renderer/style preservation; new TS/JSX syntax; metadata/structural invariants |
| Node behavioral + mocked API suite | 61 registered: 57 passed, 4 explicitly skipped, 0 failed | Deterministic scoring regressions, sample/member reconciliation, CSV/mapping/date/quality/export logic, mocked provider boundaries and API validation |
| Original isolated atmosphere lifecycle adapter | 8 passed | Resource ownership/disposal and actor non-mutation in the adapter; not GPU rendering |
| Original persistent-hall constraints | 7 passed | Existing fixed viewport/CSS layout constraints remain |
| Limited core semantic check | 11 files; 0 diagnostics | Core/data/API TypeScript with real Node types but mocked external Next/xlsx declarations; not full app typechecking |
| Chromium CSS/JSX layout fixtures | 114/114 no page-level horizontal overflow | 19 states at widths 320, 390, 768, 1024, 1440, 1920; native dialog/layout rendering with stubbed hooks and blank 3D placeholders |
| npm lock virtual graph | 69 nodes, 0 invalid mandatory edges | Structural dependency graph agreement, not downloaded package integrity or install success |
| Shell syntax | Passed | start-local.sh parses in Bash |

Visual inspection covered desktop mapping, member evidence/export and full-page layout, plus mobile mapping/member screenshots. All visual outputs were labeled CSS fixtures. They are **not screenshots of a running Next/React/Three application**. No actual WebGL pixels are represented by the placeholders.

The four skipped cases are the actual SheetJS XLSX/XLS parser tests. Skips were enabled explicitly only for the restricted delivery environment. `start-local.sh` unsets that flag and requires the real parser tests after installation.

## Not executed / not certified

- Successful npm ci and verification of the publisher tarball download.
- Full installed-dependency TypeScript check for React/Next/Three/SheetJS.
- Next.js production build or live local app boot.
- Real XLSX/XLS decoding by SheetJS.
- End-to-end React event/focus/selection behavior or real browser exports.
- Real Three/WebGL room, models, interactions, GPU performance or device memory.
- Safari, iPhone, iPad and real-device accessibility acceptance.
- Live Gemini success, provider availability or costs; only mocked boundary/fallback tests ran.
- Complete dependency audit, public production security/retention posture or traffic/load certification.
- The separately planned flagship coverage campaign and its contact workflow.

## Repeat the proper full check locally

```bash
npm ci
npm run qa
```

The QA command runs source checks, real installed-dependency tests, original lifecycle/hall checks, full tsc and Next build. The launcher refuses to start after a failing gate. Use LOCAL_ACCEPTANCE.md for the real browser/device review.

## Intentional prior-test changes

The original whole-page-controller byte hash and old API expectations do not describe the expanded product. The old verifier/source are retained under previous-release/v2.0.0. The current explicit edit allowlist does not permit character/model/renderer/atmosphere/style changes. Original quantile calculations are compared against the archived executable engine, not a newly fabricated expected answer. See V2_1_DECISIONS.md.

All inherited QA files outside qa-v2.1 are historical; they must not be read as new V2.1 build claims.
