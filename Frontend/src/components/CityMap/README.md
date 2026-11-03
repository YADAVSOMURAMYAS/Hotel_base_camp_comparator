# CityMap

**U6b:** hover/focus tooltips and spring scale, click popup + ripple + fly-to, click on empty map clears the inspection, links that march and get thicker with importance (`MapCards.tsx`, `CityMap.css`). The map and ranked cards light each other up through `state/linkedView.tsx`. Tests: `CityMapInteract.test.tsx`.

**U6a:** the SVG is drawn inside `MapViewport` (`MapViewport.tsx`, `MapViewport.css`, pure maths in `camera.ts`): pan with inertia, wheel / pinch / double-click / right-click zoom, arrows, `+` `-` `0`, floating Zoom / Fit / Reset / Fullscreen buttons, auto-fit to the selected markers, `prefers-reduced-motion`. `<CityMap hero />` is the Results look (at least 70vh). Tests: `camera.test.ts`, `MapViewport.test.tsx`.

**U4:** `<CityMap selectable />` (Plan screen) adds the Inspect/Select mode switch; the default (Results) is the comparison view only.


**Purpose:** schematic SVG map of the selected hotels and places (25 markers for the Demo trip) and the inspected hotel's comparison links.
**Contents:**
- `index.tsx`: component (default export). Empty state before load; markers, status badges, links, legend and caption after.
- `labelLayout.ts`: `placeLabels` greedy label placement (right/left by x, then below, above). Drawing only.
- `CityMap.css`: styles (`citymap-` prefix, tokens from `styles.css`).
- `CityMap.test.tsx`, `labelLayout.test.ts`: Vitest tests using the real sample JSON.

**Responsibilities:** read state via `useComparatorContext()`; draw API values as given (`<minutes> min · <contribution>`, ★ / ✕ from `label`); hotel markers call `inspectHotel(id)` on click, Enter or Space.
**Dependencies:** `state/ComparatorContext`, `types/contracts`. `utils/hotelLabels` (status symbols and wording). Tests import `src/test/renderWithComparator`.
**Belongs here:** drawing and label layout. **Does not belong here:** totals, ranks, affordability or anything derived from coordinates (positions are layout-only), place selection, map-point creation.
**Notes:** link labels sit at 60% along each line and are not collision-checked.

**T16:** a "Map mode" radio group. *Inspect* (default) is the Phase A view. *Select* draws every catalog marker as a `role="checkbox"` (selected: large, labelled; unselected: small, label on hover or focus, name always in the SVG `<title>`); click or Enter/Space toggles through `toggleHotel` / `togglePlace`, blocked at the limits with a polite notice (`data-testid="map-notice"`). With an empty selection the map behaves as Select. No links in Select mode. Tests: `CityMapSelect.test.tsx`.
**Background:** the grid is drawn by `MapViewport` as a rect that always covers the current `viewBox` (pattern in user space), on a `--color-surface` container, so there is no edge to drag past. Panning and zooming keep the view centre on the map (`camera.ts`).
