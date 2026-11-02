# Controls

**Status:** done (T10). Reads everything from `useComparatorContext()`; no calculation.
**Renders:** Load Demo trip (disabled while loading), Reset (disabled before load), a plain text budget input (`type="text"`, `inputMode="numeric"`) with the backend-applied budget beside it, and a fieldset with one importance row per selected place (name, text+symbol type chip, text input, `original: N`).
**Errors:** `budget` and `importances.<PLACE_ID>` entries of `result.errors` set `aria-invalid` + `aria-describedby` on that input and show the API message beside it. Other fields show only in `StatusBanner`.
**Files:** `index.tsx`, `Controls.css` (classes prefixed `controls-`), `Controls.test.tsx`, `ControlsLoad.test.tsx`, `renderWithComparator.tsx` (test helper, also used by StatusBanner tests; T14 moves it to `src/test/`, D-28).
**Temporary:** `data-testid="controls-stub"` stays on the root until T14 (D-27).
