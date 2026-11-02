# Backend/tests/api/

**Purpose:** Test endpoint shapes and HTTP rules with FastAPI `TestClient`.

| Item | Detail |
|---|---|
| Contents | *(planned, T08/T15)* `test_compare_api.py`, `test_catalog_api.py` |
| Responsibilities | OK / NO_AFFORDABLE_HOTEL / INVALID shapes, per-status null/empty fields, 200 vs 404 vs 422, field names exactly as in the API spec |
| Dependencies | `app.main`, httpx |
| Naming | `test_<endpoint group>_api.py` |
| Belongs | Contract tests |
| Does not belong | Calculation tests (use `../unit/`) |
