# StatusBanner

**Status:** done (T10). Reads `phase`, `result`, `error`, `isStale` from `useComparatorContext()`; no calculation.
**States:** idle; Loading…; Updating… (`aria-busy`, never the old status); OK (`✓ Recommended: <name>` + remaining budget from the API); NO_AFFORDABLE_HOTEL (`⚠`, no winner); INVALID (`✕`, `role="alert"`, every error as field · code · message); service error (`✕`, `role="alert"`, the readable `ApiError` message).
**Files:** `index.tsx`, `StatusBanner.css` (classes prefixed `statusbanner-`), `StatusBanner.test.tsx`.
**Live region:** the only one on the page: `role="status"` normally, `role="alert"` for INVALID and service errors.
