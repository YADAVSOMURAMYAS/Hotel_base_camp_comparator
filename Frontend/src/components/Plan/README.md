# Plan

**Purpose:** the Selection screen. `index.tsx` has three step cards (city + Load Demo/Reset; hotels and places via `Picker` chips and the map in Select mode; budget and 1-5 segmented importance) and the "Compare hotels" button. `StepIndicator.tsx` renders progress in the top bar.
**Rules:** reads and writes only through `useComparatorContext()`; hints come from `readiness` and API errors; nothing is computed. Compare is disabled until `readiness.canCompare` and the result is not `INVALID`.
**Drawer:** `variant="drawer"` is the same steps inside the Edit drawer (no headline, no map, "Update results").
**Tests:** `Plan.test.tsx`.
