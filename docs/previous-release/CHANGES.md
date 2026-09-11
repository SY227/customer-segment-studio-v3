# V3 Light — presentation changes

## Interface

Warm paper replaces the dark outer interface. White panels, quieter borders, and soft shadows separate work areas without a heavy dashboard treatment. The product title uses the same editorial serif direction as the V3 flagship site, while working text remains system sans-serif. No bundled or remotely fetched fonts are required.

The original two data-entry buttons and two sample/help controls stay in their original functional roles. Navy and violet distinguish the main buttons. The original dataset provenance notice, progress feedback, and error states stay visible.

The three existing map summaries sit in a readable horizontal row on desktop. The selected group's facts remain in the adjacent detail panel. Historical revenue is not reframed as a prediction or a recovery promise.

Nine original 3D character cards now have pale group-colored backdrops, a thin identity accent, clearer numeric hierarchy, and an understated selected state. Original card animation code and all character materials/rigging are unchanged. The new CSS shadow is decorative, not a real-time 3D shadow or a representation of customer value.

The existing sample dialogs receive a light theme, readable table styling, bounded height, and local scrolling. Hover lift and keyboard focus are presentation effects. Reduced-motion preferences remove the added CSS transitions; the original 3D animation and group-lock semantics are deliberately not redefined.

## Original 3D room

The same floor, shelving, props, character geometry, textures, positions, and paths remain. Only presentation parameters change: a pale blue-gray background and fog, warm light stone/wood tinting, a soft violet rug tint, and balanced daylight illumination. The actual 3D material/lighting changes have not been visually verified in a live Three.js runtime in this environment.

On narrow viewports the orthographic view widens to reduce horizontal cropping. The camera's original position and look-at direction are unchanged. No camera travel, autoplay cutscene, new room, new character, or gameplay system was introduced.

## Functional freeze

`app/page.tsx`, the data controls, all segment data, the API handler, the deterministic RFM engine, the avatar component, the sample CSV, dependencies, and lockfile are identical to the retrieved original source. The scene change manifest can be reversed by the verification script to recover its exact original hash; this guards against incidental edits to the movement or selection code.
