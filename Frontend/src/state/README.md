# src/state/

**Purpose:** `useComparator.ts` is the only place that holds comparison state; `ComparatorContext.tsx` shares it with components (`ComparatorProvider`, `useComparatorContext`).

**State:** `loaded, city, preset, inputs, selection, inspectedHotelId, result, phase, error, isStale`.
**Actions:** `loadDemo, setBudgetText, setImportanceText, inspectHotel, reset`.

**Rules**
- Every edit re-runs `compare`; each call gets an increasing sequence number and its own `AbortController`. Older responses are ignored.
- `inspectHotel` changes only `inspectedHotelId` and never calls the API. The default inspected hotel is the API `default_inspected_hotel_id`, applied on load and reset only.
- Typed text goes to the backend through `utils/wireValue.ts`; the hook never judges validity.
- `isStale` is true while a recompute is in flight and the previous result is still shown (dim it, set `aria-busy`).
- On `INVALID` the result holds the API empty `hotels`; on a request error the result is `null`. Typed text is always kept.

**T16:** `useComparator` adds `cities`, `citiesError`, `selectCity`, `toggleHotel`, `togglePlace`, `clearSelection` and `readiness`. Selection is stored in catalog order; compare is gated (D-42); `loadDemo()` loads the city that owns the preset; `reset()` restores the preset or clears. Tests: `useComparator.selection.test.tsx`.

**T19/U6b:** `linkedView.tsx` (`LinkedViewProvider`, `useLinkedView`) holds view-only state shared by the map and the ranked cards: the hovered hotel (with its source) and a card folded shut. `inspectHotel(null)` clears the inspection. Tests: `CityMapInteract.test.tsx`, `useComparator.inspect.test.tsx`.

**T19/U2:** `useViewMode.ts` (screen and drawer state), `savedTrip.ts` / `storage.ts` (guarded `localStorage`); `useComparator` saves the trip when a city is showing and restores it on mount (D-48). Tests: `savedTrip.test.ts`, `useViewMode.test.ts`, `useComparator.restore.test.tsx`.

**T19/U1:** `useTheme.ts` sets `data-theme` on `<html>` and remembers it in `localStorage` (`hbc.theme`); presentation only.
