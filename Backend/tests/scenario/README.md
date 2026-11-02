# Backend/tests/scenario/

**Purpose:** Prove the real engine, run on the real frozen Demo trip, reproduces the independently recorded answers and tells the required story.

| Item | Detail |
|---|---|
| Contents | `conftest.py` (`demo` fixture: reads `surmapur.json` with plain `json`, builds and validates the Demo trip, `run(budget, importance_overrides)`), `test_demo_story.py` (35 tests) |
| Responsibilities | Per-hotel equality with `../fixtures/expected_demo.py`; contributions recomputed with plain loops; story conditions C1–C6 and N1–N3 computed from engine output; budget and importance what-ifs; reset; budget boundary; `NO_AFFORDABLE_HOTEL` at budget 0; static guard that `app/` never reads expected values |
| Dependencies | `app.domain` (engine, validation, models), `../fixtures/expected_demo.py`, `app/data/cities/surmapur.json` (read-only) |
| Naming | `test_<scenario>.py`; story tests `test_story_c1_…`, `test_story_n1_…` |
| Belongs | Tests that compare against expected constants |
| Does not belong | Feeding expected values into the engine; JSON data sanity (see T03 city-data test) |
| Known limit | The Demo trip has no tied totals (N3), so the stay-cost and ID tie-breaks are covered by `../unit/test_ranking_ties.py`, not here |
