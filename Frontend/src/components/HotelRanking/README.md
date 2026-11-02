# HotelRanking

**Purpose:** the "Ranked hotels" panel. One card per hotel from `result.hotels`, in exactly the order the API returns them (never re-sorted).
**Contents:** `index.tsx` (panel + `HotelCard`), `HotelRanking.css` (`ranking-` classes, tokens from `styles.css`), `HotelRanking.test.tsx` (uses the shared `src/test/renderWithComparator.tsx`). Status and shortfall wording come from `utils/hotelLabels`.
**Shows per card:** rank `#n` or "–"/Unranked, name and ID, complete-stay price, status (`★ Recommended` / `✓ Within budget` / `✕ Over budget`), money line (`₹X left in budget` / `Over budget by ₹X`), weighted total, average, longest trip, a CSS price bar against a budget marker with a text equivalent, and an "Inspecting" tag.
**States:** idle, loading without result, INVALID or request error, stale (dimmed, `aria-busy`), NO_AFFORDABLE_HOTEL ("No hotel fits this budget", no star, no ranks).
**Rules:** state only from `useComparatorContext()`; no totals, ranks, affordability or shortfalls computed here. Bar percentages are presentation only on one shared scale. Each card is a native button; `inspectHotel(id)` on click, Enter or Space; the inspected card has `aria-current="true"`.
**Does not belong here:** sorting, explanation details, map code.
