# src/test/

**Purpose:** test support.
- `setup.ts` loads jest-dom matchers and cleans up after each test.
- `renderWithComparator.tsx`: the one shared helper. `loadedComparator()` / `idleComparator()` build a typed `Comparator` with spies, `renderWithProvider()` renders inside the real provider, and the typed sample results (`okResult`, `noHotelResult`, `invalidResult`, `sampleCity`, `samplePreset`) are exported from it.
- `samples/` holds real backend responses (see its README for the refresh and capture commands).

**T16:** `renderWithComparator.tsx` exports `sampleCity` (the Demo selection narrowed from the catalog, D-43), `fullSurmapurCity`, `shikharpurCity` and `sampleCities`.
