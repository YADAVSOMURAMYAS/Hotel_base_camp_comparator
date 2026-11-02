# Test Evidence

> **Purpose:** Real, pasted proof of tests and edge cases.
> **Owner of:** test plan summary, commands run with output, screenshot list, edge-case table linked to AC IDs.
> **Read this when:** finishing any task (append output) and during T17. Never record results that were not run.

Strategy and AC → test mapping: [../TESTING.md](../TESTING.md). AC definitions: [../PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md).

## 1. Test plan summary
Backend pytest (unit, scenario, api) · Frontend Vitest + RTL · manual demo checklist · independent expected results in `verification/`.

## 2. Commands run
Append one block per run. Paste the real output.

```text
Date:
Task:
Command:
Output:
```

## 3. Screenshots
| # | Shot | File | AC |
|---|---|---|---|
| 1 | Initial Demo trip | | AC-01, 04, 05 |
| 2 | Inspected hotel | | AC-04, 21 |
| 3 | Budget what-if (exact boundary) | | AC-06 |
| 4 | Importance what-if | | AC-07 |
| 5 | Exactly on budget / ₹1 over | | AC-09 |
| 6 | Tie cases | | AC-10, 11 |
| 7 | NO_AFFORDABLE_HOTEL | | AC-12 |
| 8 | Invalid input | | AC-13, 20 |
| 9 | Reset | | AC-08 |

## 4. Edge-case table
| Edge case | AC | Test or evidence | Result (fill from real run) |
|---|---|---|---|
| Budget equals stay cost | AC-09 | | |
| Budget one ₹ below stay cost | AC-09 | | |
| Equal totals, different cost | AC-10 | | |
| Equal totals and cost, different ID | AC-11 | | |
| Equal displayed averages, different totals | AC-18 | | |
| `.x5` half-up boundary | AC-17 | | |
| No affordable hotel | AC-12 | | |
| Budget `-5`, `1000001`, `12.5`, empty, `"4500"`, `true` | AC-13, 22 | | |
| Importance `0`, `6`, `5.0`, `"3"` | AC-13, 22 | | |
| Duplicate ID (hotel vs place) | AC-14 | | |
| Missing / unknown mapping key | AC-15 | | |
| INVALID clears everything | AC-20 | | |
| Stale response ignored | (frontend) | | |

### T07 run (2026-11-02), Demo story tests
```text
Command: pytest -q tests/scenario            (from Backend/, venv active)
Output:  ...................................                                      [100%]
         35 passed in 0.13s

Command: pytest -q
Output:  267 passed, 1 warning in 3.04s       (includes tests added by other tasks)

Command: ruff check . ; ruff format --check .
Output:  All checks passed!
         42 files already formatted
```

Mutation check (scratch copy of Backend outside the repo; `pytest -q tests/scenario` on each):

| Mutation of `engine.py` | Result | Caught by |
|---|---|---|
| Sort key `(stay_cost, weighted_total, id)` | 14 failed, 21 passed | per-hotel equality (6 hotels), `test_summary_matches_expected`, C3, C5, C6, N1, both budget what-ifs, importance what-if |
| Sort key without the stay_cost tie-break | 35 passed | not caught: the Demo trip has no tied totals (N3); covered by `unit/test_ranking_ties.py` |
| Sort key without the ID tie-break | 35 passed | not caught, same reason |
| `stay_cost < budget` instead of `<=` | 3 failed, 32 passed | `test_story_c5_budget_boundary_at_most_accessible_hotel`, `test_whatif_budget[case0]`, `test_budget_equality_is_affordable_and_minus_one_is_not` |
| Rank by displayed average, then cost, then ID | 6 failed, 29 passed | per-hotel equality for H_CIVIL and H_RIVERBRZ, `test_summary_matches_expected`, N1, both budget what-ifs |


### T08 run (2026-11-02), API core
```text
Test-first: pytest -q tests/api (before loader.py existed)
Output:  ImportError while loading conftest ... ModuleNotFoundError: No module named 'app.data.loader'
         (collection error; a per-test failing list was not captured)

Command: pytest -q tests/api            (from Backend/, venv active)
Output:  65 passed, 1 warning in 0.71s

Command: pytest -q
Output:  267 passed, 1 warning in 2.28s

Command: ruff check .
Output:  All checks passed!
Command: ruff format --check .
Output:  43 files already formatted
```
Notes: "11 hotels" is tested as the 10-hotel list plus a duplicate (`HOTEL_COUNT` + `DUPLICATE_ID`), because the catalog has 10 hotels. No test builds hotels beyond the catalog except through duplicates and unknown IDs.

Live calls against `uvicorn app.main:app --port 8000` (PowerShell `Invoke-RestMethod`; server stopped afterwards):
```text
--- GET /api/health
{"status":"ok"}
--- GET /api/cities/surmapur
hotels=10 places=15 has_demo_preset=True
--- GET /api/cities/surmapur/presets/demo
{"city_id":"surmapur","hotel_ids":["H_GHANTA",...10],"place_ids":["CLOCK",...15],"importances":{...},"budget":30000}
--- POST /api/compare (demo): status=OK recommended=H_GARDEN I=40
id         rank label       weighted_total weighted_average_display remaining_budget shortfall
H_GARDEN      1 RECOMMENDED           2234 55.9                                13500
H_STEPWELL    2 RANKED                2327 58.2                                 2500
H_CIVIL       3 RANKED                2514 62.9                                 5800
H_RIVERBRZ    4 RANKED                2517 62.9                                10200
H_NEELGHAT    5 RANKED                2917 72.9                                  500
H_HILLTOP     6 RANKED                3327 83.2                                17600
H_GHANTA        OVER_BUDGET           1942 48.6                                      6500
H_HAVELI        OVER_BUDGET           2102 52.6                                      800
H_MAHAL         OVER_BUDGET           2887 72.2                                      22000
H_LAKEVIEW      OVER_BUDGET           3727 93.2                                      3000
--- POST /api/compare (budget 0): status=NO_AFFORDABLE_HOTEL recommended= inspected=H_CIVIL
H_GHANTA OVER_BUDGET shortfall 36500 | H_HAVELI OVER_BUDGET 30800 | H_GARDEN OVER_BUDGET 16500 (first 3 of 10)
--- POST /api/compare (budget -5)
{"status":"INVALID","errors":[{"field":"budget","code":"BUDGET_INVALID","message":"Budget must be a whole number from 0 to 1,000,000"}],"importance_total":null,"budget":null,"recommended_hotel_id":null,"default_inspected_hotel_id":null,"hotels":[]}
--- GET /api/cities/nowhere  -> 404
--- POST /api/compare with body {bad  -> 422
```

### T09 run (2026-11-02), Frontend foundation
```text
Command: npm test            (from Frontend/, before implementation)
Output:  FAIL src/__tests__/*.test.ts(x)   Error: Failed to resolve import "../api/client" / "../utils/wireValue" ... Does the file exist?
         Test Files  6 failed (6)
         Tests  no tests

Command: npm test            (after implementation)
Output:  RUN  v5.0.5
         Test Files  6 passed (6)
              Tests  55 passed (55)
           Duration  3.75s

Command: npm run lint
Output:  (no output: clean; one react/only-export-components warning silenced with a stated reason in ComparatorContext.tsx)

Command: npm run typecheck   (tsc -b)
Output:  (no output: clean)

Command: npm run format:check
Output:  Checking formatting...
         All matched files use Prettier code style!

Command: npm run build
Output:  vite v8.3.5 building client environment for production...
         ✓ 27 modules transformed.
         dist/index.html                   0.47 kB │ gzip:  0.30 kB
         dist/assets/index-CGfLKjqg.css    1.81 kB │ gzip:  0.74 kB
         dist/assets/index-Bm3d4I-p.js   226.18 kB │ gzip: 70.63 kB
         ✓ built in 313ms
```
Smoke test through the Vite proxy (backend :8000, `npm run dev`):
```text
GET  http://localhost:5173/api/health                   -> {"status":"ok"}
GET  http://localhost:5173/api/cities/surmapur/presets/demo -> {"city_id":"surmapur","hotel_ids":["H_GHANTA",...
POST http://localhost:5173/api/compare (demo preset)   -> {"status":"OK",...,"recommended_hotel_id":"H_GARDEN","default_inspected_hotel_id":"H_GARDEN",...
POST http://localhost:5173/api/compare (budget -5)     -> {"status":"INVALID","errors":[{"field":"budget","code":"BUDGET_INVALID",...
```
Note: `http://127.0.0.1:5173` refuses connections (Vite binds `localhost`); both servers were stopped afterwards. The browser click-through of the DevPanel Load button was not run by me.
Frontend tests by area: currency 13, wireValue 11, client 10, useComparator 19, ComparatorContext 1, App 1 (stale-response race, `isStale`, abort, raw wire values `-5` / `12.5` / `abc`, inspect without API call, reset).
