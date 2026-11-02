# Backend/tests/fixtures/

**Purpose:** Hand-written test scenarios and constants.

| Item | Detail |
|---|---|
| Contents | `__init__.py`; `small_scenarios.py` (already-valid tie, equality and ranking scenarios built from the models, T06); `expected_demo.py` (T03) |
| Responsibilities | Small readable scenarios (ties, budget equality, duplicate ID, missing/unknown mapping); hand-typed expected Demo results |
| Dependencies | None (plain Python data) |
| Naming | `snake_case.py`; scenario names describe the case (`tie_on_cost`) |
| Belongs | Test data only |
| Does not belong | Imports from production code that compute expected values; anything imported by `app/` |
