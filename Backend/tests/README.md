# Backend/tests/

**Purpose:** Fast, offline pytest suite.

| Item | Detail |
|---|---|
| Contents | `unit/`, `scenario/`, `api/`, `fixtures/` |
| Responsibilities | Prove each acceptance criterion; mapping in [../../docs/TESTING.md](../../docs/TESTING.md) |
| Dependencies | pytest, httpx (TestClient), `app` package |
| Naming | `test_<topic>.py`, functions `test_<behaviour>` |
| Belongs | Tests and hand-written test data |
| Does not belong | Production code; engine input read from `verification/` (tests compare only) |

Run: `pytest -q`. Write the failing test first.
