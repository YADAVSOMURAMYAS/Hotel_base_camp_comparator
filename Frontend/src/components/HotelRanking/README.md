# HotelRanking

**Purpose:** the "Ranked hotels" panel: one card per hotel from `result.hotels`, in exactly the order the API returns them (never re-sorted). Renders nothing without a result (Results owns empty states).
**Shows per card:** rank `#n` or "–"/Unranked, name and ID, the weighted average as the large score, status (`★ Recommended` / `✓ Within budget` / `✕ Over budget`), complete-stay price, money line (`₹X left in budget` / `Over budget by ₹X`), a budget-fit bar with a text equivalent, weighted total, longest trip, and a "Why this score?" toggle. The recommended card has the orange accent.
**Accordion:** only the inspected card can be open; the toggle on another card inspects it first. The open body is `HotelExplanation`.
**Linked to the map:** hovering a card pulses its marker; a card whose marker is hovered gets an orange outline; an inspected card scrolls into view.
**Motion:** cards stagger in on first display, the score counts up once, and a changed order slides (FLIP; `flip.ts` is the pure part). All off under reduced motion.
**Rules:** state only from `useComparatorContext()`; nothing is computed here. Bar lengths are CSS ratios of API numbers (`--v`, `--max`, `--budget`). The card summary is a native button (`inspectHotel`, `aria-current`).
**Tests:** `HotelRanking.test.tsx`.
