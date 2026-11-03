# Backend/tests/api/

**Purpose:** Test endpoint shapes and HTTP rules with FastAPI `TestClient`.

| Item | Detail |
|---|---|
| Contents | `test_compare_api.py`, `test_city_api.py` (T08); `test_cities_list_api.py`, `test_selection_api.py` (T15: list endpoint, selection limits on the 30x50 catalogs, hand-computed second-city check) |
| Responsibilities | OK / NO_AFFORDABLE_HOTEL / INVALID shapes, per-status null/empty fields, 200 vs 404 vs 422, field names exactly as in the API spec |
| Dependencies | `app.main`, httpx |
| Naming | `test_<endpoint group>_api.py` |
| Belongs | Contract tests |
| Does not belong | Calculation tests (use `../unit/`) |
