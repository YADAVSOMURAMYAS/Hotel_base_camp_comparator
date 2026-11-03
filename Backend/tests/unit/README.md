# Backend/tests/unit/

**Purpose:** Test `domain/` functions in isolation.

| Item | Detail |
|---|---|
| Contents | *(planned)* `test_rounding.py`, `test_validation.py`, `test_engine.py`, `test_ranking_ties.py`; T15: `test_demo_freeze.py` (pinned SHA-256 of the Demo block), `test_catalog_data.py` (both cities, json only), `test_catalog_generator.py` (byte-identical regeneration, static checks) |
| Responsibilities | Arithmetic, round-half-up, validation rules, sorting, ties, budget equality, clearing on INVALID |
| Dependencies | `app.domain`, `../fixtures/` |
| Naming | `test_<module>.py` |
| Belongs | Pure-function tests, data-structure checks |
| Does not belong | HTTP calls, Demo-trip expected-value comparisons (use `../scenario/`) |
