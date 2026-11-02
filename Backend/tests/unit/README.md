# Backend/tests/unit/

**Purpose:** Test `domain/` functions in isolation.

| Item | Detail |
|---|---|
| Contents | *(planned)* `test_rounding.py`, `test_validation.py`, `test_engine.py`, `test_ranking_ties.py`, `test_city_data.py` |
| Responsibilities | Arithmetic, round-half-up, validation rules, sorting, ties, budget equality, clearing on INVALID |
| Dependencies | `app.domain`, `../fixtures/` |
| Naming | `test_<module>.py` |
| Belongs | Pure-function tests, data-structure checks |
| Does not belong | HTTP calls, Demo-trip expected-value comparisons (use `../scenario/`) |
