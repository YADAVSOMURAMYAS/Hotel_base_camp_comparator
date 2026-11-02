# Backend/tests/

**Purpose:** Fast, offline pytest suite.

| Item | Detail |
|---|---|
| Contents | `unit/` (`test_rounding.py`, `test_models.py`, `test_engine.py`, `test_ranking_ties.py`), `scenario/`, `api/` (`test_health.py`, `test_city_api.py`, `test_compare_api.py`, `conftest.py`, `samples/`), `fixtures/` (`small_scenarios.py`) |
| Responsibilities | Prove each acceptance criterion; mapping in [../../docs/TESTING.md](../../docs/TESTING.md) |
| Dependencies | pytest, httpx (TestClient), `app` package |
| Naming | `test_<topic>.py`, functions `test_<behaviour>` |
| Belongs | Tests and hand-written test data |
| Does not belong | Production code; engine input read from `verification/` (tests compare only) |

Run: `pytest -q`. Write the failing test first.
