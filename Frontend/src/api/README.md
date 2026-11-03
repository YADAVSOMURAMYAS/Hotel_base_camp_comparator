# src/api/

**Purpose:** `client.ts`, a plain `fetch` wrapper: `getCity`, `getDemoPreset`, `compare`.
**Behaviour:** 200 JSON is returned typed (`INVALID` and `NO_AFFORDABLE_HOTEL` are normal results). Network failure or non-2xx throws `ApiError` with a readable message. Aborts rethrow the original `AbortError` (`isAbortError`). Base URL is `""` (Vite proxy), overridable with `VITE_API_BASE`.
**Does not belong here:** data shaping, retries, caching.

**T16:** `getCities()` returns the list inside `GET /api/cities`.
