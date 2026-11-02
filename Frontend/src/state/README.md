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
