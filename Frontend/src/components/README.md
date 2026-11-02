# src/components/

**Purpose:** one folder per UI part, each `Name/index.tsx` (default export) plus its own `README.md`. Components read the shared state with `useComparatorContext()` and render API values as given.

| Folder | Task | Status |
|---|---|---|
| Controls | T10 | done |
| StatusBanner | T10 | done |
| HotelRanking | T11 | done |
| CityMap | T12 | done |
| ExplanationPanel | T13 | done |
| TravelMatrixTable | T13 | done |

Shared status and place-type wording lives in `../utils/hotelLabels.ts`; the shared test helper is `../test/renderWithComparator.tsx`. Later tasks edit only their own folder.
