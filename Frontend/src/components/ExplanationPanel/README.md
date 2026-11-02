# ExplanationPanel

**Status:** done (T13).
**Shows:** the inspected hotel's header (name, ID, symbol + text status), a plain-language reason built from API values, a per-place calculation table (`3 × 40 = 120`), the weighted total and average line, and CSS contribution bars with the numbers printed.
**Files:** `index.tsx`, `hotelStatus.ts` (status wording, also used by `TravelMatrixTable`), `ExplanationPanel.css` (`explain-*`), `ExplanationPanel.test.tsx`.
**Rules:** data only from `useComparatorContext()`. The only arithmetic is a count of affordable flags, one subtraction for the "why not" line, and the CSS bar ratio (D-32). Totals, average and shortfall are shown as given.
**States:** no result, INVALID/error, no inspected hotel, stale (dimmed, `aria-busy`).
