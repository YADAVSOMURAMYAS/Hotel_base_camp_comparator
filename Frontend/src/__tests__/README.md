# src/__tests__/

**Purpose:** Vitest tests. The API client is tested with a mocked global `fetch`; the hook with the client module mocked. Both use the real sample responses in `src/test/samples/`.
Files: `currency`, `wireValue`, `hotelLabels`, `client`, `useComparator` (incl. stale-response race, `isStale`), `ComparatorContext`, `App` (shell by role/label), `integration.workflow` (the real `<App/>` and provider with only the network functions faked from real backend responses; walks load, inspect, budget and importance what-ifs, exact budget, invalid inputs, no affordable hotel and reset, plus page-structure checks and the no-re-sort guards).
Run: `npm test`. Query by role/label/text, never CSS class.
