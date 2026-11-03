# src/components/

**Purpose:** one folder per UI part, each `Name/index.tsx` (default export) plus its own `README.md`. Components read the shared state with `useComparatorContext()` and render API values as given.

| Folder | Task | Status |
|---|---|---|
| StatusBanner | T10 | done |
| HotelRanking | T11 | done |
| CityMap | T12 | done |
| ExplanationPanel | T13, T19/U4 | done (now `HotelExplanation`, shown inside a ranked card) |
| TravelMatrixTable | T13 | done |
| TopBar | T19/U1 | done (sticky bar, theme toggle, slot for step indicator and Edit) |
| Plan | T19/U3 | done (Selection screen; replaced Controls + Selection) |
| Results | T19/U4 | done (Results screen) |
| Drawer | T19/U5 | done (modal side drawer / bottom sheet; holds Plan on Results) |
| ui | T19/U1 | done (PillButton, Card, Chip, ChipToggle) |

Shared status and place-type wording lives in `../utils/hotelLabels.ts`; the shared test helper is `../test/renderWithComparator.tsx`. Later tasks edit only their own folder.
