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

### T10 run (2026-11-02), Controls and StatusBanner
Tests first, against the T09 stubs: `Test Files 3 failed (3)`, `Tests 29 failed | 1 passed (30)` (the pass was "hides applied budget when result.budget is null", vacuous on a stub).
After implementing and fixing one over-strict assertion (the field message is read with its "✕" prefix):
```text
npm test              Test Files  9 passed (9)   Tests  85 passed (85)
npm run lint          (no output: clean)
npm run typecheck     (no output: clean)
npm run format:check  All matched files use Prettier code style!
npm run build         ✓ 30 modules transformed; dist/assets/index-CEkvnxUS.js 230.01 kB │ gzip: 71.81 kB; ✓ built in 219ms
```
New tests: `Controls.test.tsx` 20, `ControlsLoad.test.tsx` 2 (real provider, mocked client), `StatusBanner.test.tsx` 8; `App.test.tsx` has one changed assertion (D-27).
Covered: Load flow and disabled states; budget `-5` / `12.5` / `abc` forwarded exactly as typed; importance `0` / `6`; 15 importance rows in selection order with chips and "original: N"; `aria-invalid` + `aria-describedby` on budget and on one importance input only; banner idle / loading / stale (`aria-busy`, no old text) / OK / NO_AFFORDABLE_HOTEL / INVALID (all errors listed) / service error; no "Recommended" text for INVALID or NO_AFFORDABLE_HOTEL; Reset calls `reset()`.
Smoke: backend :8000 and `npm run dev` :5173 started; `GET http://localhost:5173/api/cities/surmapur/presets/demo` -> 200 through the proxy. The browser click-through was not run by me.

### T11 run (2026-11-02), HotelRanking
Tests first, against the T09 stub: `Test Files 1 failed (1)`, `Tests 17 failed (17)`.
After implementing (Prettier applied):
```text
npm test              Test Files  10 passed (10)   Tests  102 passed (102)
npm run lint          (no output: clean)
npm run typecheck     (no output: clean)
npm run format:check  All matched files use Prettier code style!
npm run build         ✓ 31 modules transformed; dist/assets/index-CHH_MJXf.js 232.92 kB │ gzip: 72.66 kB; ✓ built in 154ms
```
New tests (`HotelRanking.test.tsx`, 17): API order; shuffled input keeps input order (no sorting); recommended is `#1` with `★ Recommended`; ranked `#2` with `✓ Within budget`; four over-budget cards with `✕ Over budget`, exact `Over budget by ₹…`, no rank and `Unranked`; `₹0 left in budget` (sample hotel overridden to 0) and `₹13,500 left in budget`; price and the three numbers; bar text equivalents (within / over); click, Enter and Space call `inspectHotel`; only the inspected card has `aria-current` and `Inspecting`; summary `6 of 10 hotels fit the budget`; NO_AFFORDABLE_HOTEL (no star, no `#n`, `No hotel fits this budget`, shortfalls); idle, INVALID and error messages; `aria-busy` true when stale and false when fresh.
Smoke: backend :8000 and `npm run dev` :5173 started; `/` and `/api/cities/surmapur/presets/demo` returned 200 through the proxy; both servers stopped. The visual check was not run by me.

### T12 run (2026-11-02), CityMap
Tests first, against the T09 stub: `Test Files 2 failed (2)`, `Tests 18 failed | 1 passed (19)` (the pass was vacuous on the stub).
After implementing (Prettier applied): `src/components/CityMap` alone `Tests 24 passed (24)`; full suite and checks:
```text
npm test              Test Files  12 passed (12)   Tests  126 passed (126)
npm run lint          (no output: clean)
npm run typecheck     (no output: clean)
npm run format:check  All matched files use Prettier code style!
npm run build         ✓ 33 modules transformed; dist/assets/index-8eMUCeL6.js 238.55 kB │ gzip: 74.42 kB; ✓ built in 219ms
```
New tests: `CityMap.test.tsx` 19, `labelLayout.test.ts` 5. Covered: empty state before load; exactly 10 hotel + 15 place markers; every name visible; svg name and description pointing to the Travel times table; legend and the "not routes" caption; ★ only on `H_GARDEN`; ✕ on exactly the 4 over-budget hotels; NO_AFFORDABLE_HOTEL (no ★, ✕ on all 10, `H_CIVIL` inspected); `result` null and INVALID (25 markers, no links, no symbols); 15 links whose text equals the sample `minutes` and `contribution`; links move to `H_GHANTA` with 25 markers kept; `aria-current` on one hotel only; changed catalog positions leave every link text identical; `aria-busy` and dimmed links when stale; click, Enter and Space call `inspectHotel` with the hotel ID; place markers have no tabindex and never call it; label layout: side rule, no label overlap and no label over another marker on the Demo positions, and a label moves away from a close neighbour.
Smoke: backend :8000 and `npm run dev` :5173 started; `/`, `/api/cities/surmapur` and the same path through the Vite proxy returned 200. The visual check in a browser was not run by me.

### T13 run (2026-11-02), ExplanationPanel + TravelMatrixTable
Tests first, against the T09 stubs: both files failed, `27 failed` (15 ExplanationPanel, 12 TravelMatrixTable).
After implementing (Prettier applied): full suite and checks:
```text
npm test              Test Files  14 passed (14)   Tests  153 passed (153)
npm run lint          (no output: clean)
npm run typecheck     (no output: clean)
npm run format:check  All matched files use Prettier code style!
npm run build         36 modules transformed; dist/assets/index-CB_16hkl.css 11.09 kB; dist/assets/index-tIKM5LBv.js 244.33 kB, gzip 75.65 kB; built in 227ms
```
New tests: `ExplanationPanel.test.tsx` 15, `TravelMatrixTable.test.tsx` 12. Covered: reason sentence for RECOMMENDED, RANKED (differing total, equal total, equal cost via small hand-built results), OVER_BUDGET and NO_AFFORDABLE_HOTEL; 15 walk-through rows equal to the sample; footer total and average line equal the API; 15 chart items with printed values; mocked odd totals (777, 9, "86.3") shown verbatim; empty states (idle, INVALID, error, unknown inspected id); `aria-busy` when stale; table caption, `scope` col/row, labelled focusable scroll region; every cell equals `city.round_trip_minutes`; inspected row marked and clicking another row header calls `inspectHotel`; status column and importance row, blank / "-" on INVALID with times still visible.
Smoke: backend :8000 was already running and `npx vite --port 5175` served `/` and the proxied `POST /api/compare` with 200. The visual check in a browser was not run by me.

### T14 run (2026-11-02), Integration and the Phase A checkpoint
**Baseline before any change** (Backend venv active; Frontend from `Frontend\`):
```text
pytest -q             267 passed, 1 warning in 2.36s
ruff check .          All checks passed!
ruff format --check . 43 files already formatted
npm test              Test Files  14 passed (14)   Tests  153 passed (153)
npm run lint          (no output: clean)
npm run typecheck     (no output: clean)
npm run format:check  All matched files use Prettier code style!
npm run build         36 modules transformed; dist/assets/index-tIKM5LBv.js 244.33 kB, gzip 75.65 kB; built in 228ms
```
**Test first.** `src/__tests__/integration.workflow.test.tsx` was written before the cleanup and run against the T13 tree:
```text
 ❯ src/__tests__/integration.workflow.test.tsx (23 tests | 23 failed)
 FAIL ... > page structure > has one h1, a header outside <main>, and every workspace panel inside <main>
 FAIL ... > page structure > has no temporary scaffolding
 FAIL ... > a. before loading > enables only Load and shows an empty state in every panel
   TestingLibraryElementError: Found multiple elements with the role "button" and name "Load Demo trip"
```
(The temporary DevPanel had a second Load button, so every test that renders the app failed at its first query; the landmark and scaffolding tests failed on their own assertions.)

**Flow samples** were captured from the running backend and compared with `Backend/tests/fixtures/expected_demo.py` (nothing disagreed):
```text
flow_budget_at_best_cost budget 36500 rec_ok=True order_ok=True rem_ok=True short_ok=True
flow_budget_one_less budget 36499 rec_ok=True order_ok=True rem_ok=True short_ok=True
flow_importance_whatif budget 30000 rec_ok=True order_ok=True totals_ok=True imp_total_ok=True
flow_exact_budget_hotel 29500 rank 5 rem 0 short None label RANKED ranked ['H_GARDEN', 'H_STEPWELL', 'H_CIVIL', 'H_RIVERBRZ', 'H_NEELGHAT', 'H_HILLTOP']
flow_one_over_budget_hotel 29499 rank None rem None short 1 label OVER_BUDGET ranked ['H_GARDEN', 'H_STEPWELL', 'H_CIVIL', 'H_RIVERBRZ', 'H_HILLTOP']
compare_ok ranked == EXPECTED_RANK_ORDER: True
```
Re-running the regeneration snippet from `src/test/samples/README.md` reproduced every `flow_*.json` byte for byte (SHA-256 compared).

**Mutation check.** Replacing `result.hotels.map` in `HotelRanking` by a copy sorted on `stay_cost`:
```text
 Test Files  1 failed (1)
      Tests  7 failed | 16 passed (23)
```
The file was restored afterwards.

**Final verification after the cleanup** (full output of every command):
```text
pytest -q             267 passed, 1 warning in 2.19s
ruff check .          All checks passed!
ruff format --check . 43 files already formatted
npm test              Test Files  16 passed (16)   Tests  180 passed (180)
npm run lint          (no output: clean)
npm run typecheck     (no output: clean)
npm run format:check  All matched files use Prettier code style!
npm run build         dist/assets/index-CS2HZBVn.js 243.20 kB, gzip 75.45 kB; built in 170ms
git status --short -- Backend verification    only " M Backend/README.md" (no change under Backend/app, Backend/tests or verification/)
```
New tests: `integration.workflow.test.tsx` 23, `hotelLabels.test.ts` 4; `App.test.tsx` now asserts by role and label.

**Production preview** (`npm run build; npm run preview`, backend on :8000):
```text
http://localhost:4173/api/health          {"status":"ok"}
http://localhost:4173/                    200
http://localhost:4173/api/cities/surmapur/presets/demo   budget 30000
http://127.0.0.1:4173/api/health          FAILED: Unable to connect to the remote server   (preview listens on IPv6 localhost only, see D-36)
```
**Backend smoke test** with `Invoke-RestMethod` against :8000:
```text
1) GET /api/health                          {"status":"ok"}
2) GET /api/cities/surmapur/presets/demo    budget=30000 hotels=10 places=15
3) OK (budget 30000)                        status=OK recommended=H_GARDEN inspected=H_GARDEN importance_total=40
   ranks: 1=H_GARDEN, 2=H_STEPWELL, 3=H_CIVIL, 4=H_RIVERBRZ, 5=H_NEELGHAT, 6=H_HILLTOP
   unranked: H_GHANTA(+6500), H_HAVELI(+800), H_MAHAL(+22000), H_LAKEVIEW(+3000)
4) INVALID (budget -5)                      status=INVALID errors=budget:BUDGET_INVALID hotels=0 recommended= importance_total=
5) NO_AFFORDABLE_HOTEL (budget 0)           status=NO_AFFORDABLE_HOTEL recommended= ranked=0 hotels=10 min_shortfall=12400
extra: budget 1000001 -> INVALID: Budget must be a whole number from 0 to 1,000,000
extra: importance 0 -> INVALID: importances.MUSEUM Importance for MUSEUM must be a whole number from 1 to 5
```
**Text contrast** (WCAG 2.x relative luminance computed with a short Python script over the `styles.css` tokens; 4.5:1 needed for text):
```text
text on bg 14.45 | text on surface 15.65 | muted on bg 6.97 | muted on surface 7.55 | muted on #eff4ff 6.85 | muted on #dbeafe 6.19
accent on surface 6.70 | accent on #eff4ff 6.08 | accent on #dbeafe 5.49 | white on accent 6.70
success on surface 5.02 | success on bg 4.63 | warning on surface 7.09 | warning on bg 6.54 | error on surface 6.47 | error on bg 5.97
panel border on surface 1.54 (decorative; inputs use muted at 7.55)
```
**Accessibility lint:** `npx oxlint --jsx-a11y-plugin` reports 9 warnings (8 `prefer-tag-over-role`, 1 `no-noninteractive-tabindex`), all intentional (D-38). Checks in code: one `h1`, headings never skip a level, no duplicate ids, exactly one live region (the banner), all in `integration.workflow.test.tsx::page structure`.

Not run by me: a visual check of the layout in a browser at 1440, 1280, 1024 and 900 px, and the manual demo checklist in `docs/TESTING.md`.

## T15: Catalog, generator, cities list, selection limits

**Failing run before implementation** (new tests written first; `test_demo_freeze.py` passed on the untouched file):
```text
tests/unit/test_demo_freeze.py ....                          4 passed
full suite: 32 failed, 295 passed, 1 warning, 16 errors      (all 48 are new T15 tests; the 271 older tests passed)
```
**After implementation** (from `Backend\`, venv active):
```text
pytest -q                          344 passed, 1 warning in 3.47s     (267 older + 77 new)
ruff check .                       All checks passed!
ruff format --check .              49 files already formatted
```
From `Frontend\`: `npm test` 180 passed (16 files); `npm run lint` clean; `npm run typecheck` clean; `npm run build` built in 200 ms.

**Generator:** two runs of `python scripts/design_helper.py` gave identical SHA-256 sums; the formatter reproduced the original T03 `surmapur.json` byte-for-byte before any change; minutes range 15..135 (Surmapur) and 9..110 (Shikharpur); closest marker pair 56.6 px and 69.5 px.

**Real API responses** (uvicorn on port 8011):
```text
GET /api/cities
{"cities":[{"city_id":"shikharpur","name":"Shikharpur","hotel_count":30,"place_count":50,"has_demo_preset":false},
           {"city_id":"surmapur","name":"Surmapur","hotel_count":30,"place_count":50,"has_demo_preset":true}]}
GET /api/cities/shikharpur (summary)
districts 6, hotels 30, places 50, matrix_rows 30, cells_per_row {50}, has_demo_preset False
GET /api/cities/shikharpur/presets/demo      404 {"detail":"City 'shikharpur' has no demo preset"}
POST /api/compare  shikharpur, H_ROPEWAY/H_BARRACK/H_MALLROAD x TOYTRAIN 5/MONASTERY 2/FALLS 4/CHOLE 3, budget 13000
status OK, importance_total 14, recommended H_MALLROAD
  H_MALLROAD rank 1 RECOMMENDED T=501 avg 35.8 remaining 200
  H_BARRACK  rank 2 RANKED      T=753 avg 53.8 remaining 6100
  H_ROPEWAY  unranked OVER_BUDGET T=778 avg 55.6 shortfall 1400
```
The totals match the hand arithmetic in `test_second_city_selection_matches_hand_computed_totals` (501 = 75+74+268+84, 753, 778).

**Frontend read-only check:** `CityMap` filters `city.hotels` / `city.places` by `selection` before drawing; `TravelMatrixTable` iterates `selection.hotel_ids` / `selection.place_ids`. Both already show only the selection. T16 selection mode needs all 80 markers without printing 80 labels (D-41).

**Not done:** Frontend sample copies are refreshed in T16; nothing was committed.

### T16 run (2026-11-02), Selection UI
**Failing first** (new tests before implementation): `Tests 46 failed | 185 passed (231)`. One failure was an existing test (`CityMap.test.tsx` "gives every marker a visible name label") broken by the refreshed 30 x 50 sample; fixed in the fixture (D-43). After the hook and UI: two existing tests conflicted with the spec (empty budget, live regions); resolved by D-42 (rule, test kept) and D-44 (one test amended).

**Final run:**
```text
npm test               Test Files 24 passed (24) | Tests 251 passed (251)
npm run lint           oxlint, no findings
npm run typecheck      tsc -b, no errors
npm run format:check   All matched files use Prettier code style!
npm run build          built in ~150ms
pytest -q              344 passed, 1 warning
```
Hand-computed Shikharpur check (`Backend/tests/api/test_selection_api.py`): H_MALLROAD 501, H_BARRACK 753, H_ROPEWAY 778 (over by 1,400); asserted as literals in `integration.selection.test.tsx`.


## T19 UI redesign (U1 to U7)

**Automated** (last full run in the build session):
```text
npm test               Test Files 35 passed (35) | Tests 327 passed (327)
npm run lint           oxlint, no findings
npm run typecheck      tsc -b, no errors
npm run format:check   All matched files use Prettier code style!
npm run build          built in ~400ms
```
New coverage: Plan screen, Results screen, Edit drawer (focus trap, Esc, inert page behind), map viewport (camera maths, drag, wheel, pinch-free gestures, keyboard, buttons, fit, fullscreen fallback), marker hover/click effects with the two-way link to ranked cards, count-up, FLIP deltas, button ripple, and WCAG AA contrast of every colour pair in both themes. The Plan -> Results -> Edit -> Update flow, reset, INVALID and NO_AFFORDABLE_HOTEL are in `integration.workflow.test.tsx`.

### T19 visual check (manual, NOT yet run: needs a real browser)
Run `npm run dev` (Frontend) and `uvicorn app.main:app` (Backend), open http://localhost:5173, then tick and attach a screenshot for each:
- [ ] Plan screen (light): headline, three step cards, step indicator in the top bar, black "Compare hotels" pill, orange accents only on step, arrows and pins.
- [ ] Load Demo trip: one click lands on Results with the count-up, staggered cards and the map fitted to the 25 markers.
- [ ] Results (light): stat cards, map at least 70% of the window height, glass ranking panel over the left, controls top-right, legend bottom-right, top-ranked card in orange.
- [ ] Map: drag (inertia), wheel zoom toward the cursor, double-click, Shift+double-click and right-click zoom out, arrows and + / - / 0, Fit, Reset, Fullscreen (Esc exits).
- [ ] Hover a marker (spring + card + ranked card lights), hover a ranked card (marker pulses), click a marker (ripple, fly-to, popup, card opens), click empty map (clears), dashed links thicker for important places.
- [ ] Edit drawer: opens with the current values, Tab stays inside, Esc closes, Update results closes and the cards re-order with a slide.
- [ ] Budget 0: no stat cards, shortfalls, no star. Invalid budget in the drawer: message at the field, Update disabled, Results shows the empty state.
- [ ] Dark mode: toggle in the top bar; check text, cards, map, legend, drawer.
- [ ] Narrow window (about 390 px): top bar fits, map above the ranking, ranking collapsible, drawer is a bottom sheet.
- [ ] Reduced motion (OS setting): no ripples, no marching dashes, no slides or count-up.
- [ ] Browser console shows no errors.
