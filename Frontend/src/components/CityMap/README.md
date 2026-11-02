# CityMap

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
