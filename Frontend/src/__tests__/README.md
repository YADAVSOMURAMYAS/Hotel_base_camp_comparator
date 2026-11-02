# src/__tests__/

**Purpose:** Vitest tests. The API client is tested with a mocked global `fetch`; the hook with the client module mocked. Both use the real sample responses in `src/test/samples/`.
Files: `currency`, `wireValue`, `client`, `useComparator` (incl. stale-response race, `isStale`), `ComparatorContext`, `App` (smoke).
Run: `npm test`. Query by role/label/text, never CSS class.
