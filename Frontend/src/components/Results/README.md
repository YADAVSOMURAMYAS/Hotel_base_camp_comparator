# Results

**Purpose:** the Results screen: read-only summary chips (city, budget, hotel and place counts), the banner, `StatCards` (recommended hotel: weighted average, stay vs budget, longest trip), the map, ranked cards and a collapsible travel-time table.
**Rules:** no inputs of any kind (editing is on the Plan screen); everything shown is an API value; INVALID shows the banner and an empty state only; loading shows skeleton blocks; stale results are dimmed with `aria-busy`.
**Map:** the map is the hero (`<CityMap hero />`); the ranking panel sits beside it in a two-column grid (`clamp(320px, 28vw, 400px)` + `1fr`), no inner scrolling and no hide button; stacked under the map on narrow screens. The travel-time table opens below in its own scroll wrapper (`.results` columns are `minmax(0, 1fr)` so a wide table never stretches the page) with a 0fr to 1fr height animation.
**Edit:** `onEdit` opens the Edit drawer (from the top bar button and the empty-state buttons).
**Tests:** `Results.test.tsx`, plus `__tests__/integration.workflow.test.tsx` for the full flow.
