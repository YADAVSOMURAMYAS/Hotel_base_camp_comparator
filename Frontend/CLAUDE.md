# Frontend — Claude Code guide (React, Vite, TypeScript, Vitest, React Testing Library)

The root `CLAUDE.md` rules always apply. The frontend **renders API output only**.

## Folder layout
```
src/
  api/          fetch wrappers for each endpoint; no data shaping beyond JSON parse
  types/        contracts.ts — mirrors docs/API_SPECIFICATION.md exactly
  state/        app state (selection, budget, importances, inspected hotel, last response)
  utils/        formatting only (₹ en-IN grouping, labels); no arithmetic on results
  components/
    CityMap/            hand-written SVG: markers, inspected hotel's links
    Controls/           Load Demo trip, Reset, budget input, importance inputs, selection
    ExplanationPanel/   selected hotel's contributions (CSS/SVG bars) and reasons
    HotelRanking/       ranked cards/rows, Recommended and Over budget labels
    StatusBanner/       OK / NO_AFFORDABLE_HOTEL / INVALID messages with errors
    TravelMatrixTable/  accessible hotel-by-place time table
  __tests__/    Vitest + React Testing Library tests
```

## Rules
- **`types/contracts.ts` mirrors `docs/API_SPECIFICATION.md` field-for-field.** Change the doc first, then the type. Never invent fields.
- **No calculation.** Never compute totals, contributions, averages, ranks, affordability, shortfalls or rounding. Show `weighted_average_display` as given. The only allowed transform is formatting integer rupees with `Intl.NumberFormat('en-IN')` (₹1,25,000).
- **Ignore out-of-order responses.** Each request gets an increasing sequence number; a response is applied only if it belongs to the latest request.
- **INVALID clears everything derived**: ranks, recommendation, contributions, explanation and map highlights. Inputs stay editable so the user can fix them, and the errors are shown in `StatusBanner`.
- **Not colour alone.** Recommended gets a "★ Recommended" text badge; over-budget hotels get "Over budget by ₹X" text plus a symbol. Every unranked hotel shows its reason.
- **Accessible table:** a real `<table>` with `<caption>`, `<th scope="col">` / `<th scope="row">`, and labelled inputs (`<label for>`). Keyboard-focusable markers and rows.
- **Map modes:**
  - Comparison mode shows **all 25 selected markers**, labelled, but highlights **only the inspected hotel's links**.
  - Each highlighted link shows the supplied round-trip minutes **and** the weighted contribution from the API.
  - Selection mode shows all 80 catalog markers; clicking one toggles selection.
  - There is no way to add new points.
- Marker coordinates are layout-only. Never derive anything from line length or distance.
- Inspecting a hotel changes only the explanation and highlights, never the result. The default inspected hotel is the API's `default_inspected_hotel_id`.
- No map, chart, state or UI libraries; plain React state and hand-written SVG/CSS. No new dependencies without asking.
- Keep components small and readable. Match the existing naming: `ComponentName/ComponentName.tsx`.

## Testing
- Test first with Vitest + React Testing Library; mock `src/api/` (no real backend in unit tests).
- Cover at least:
  - render of an OK response (rank, Recommended badge, Over budget text);
  - hotel inspection (only that hotel's links highlighted, time + contribution shown);
  - Reset (Demo trip restored);
  - INVALID clears derived UI;
  - NO_AFFORDABLE_HOTEL shows no winner;
  - stale responses ignored;
  - table accessibility (query by role/label).
- Query by role, label and text, not by CSS class.
- Run `npx vitest run`, `npm run lint` and `npm run build`, and paste the real output.
