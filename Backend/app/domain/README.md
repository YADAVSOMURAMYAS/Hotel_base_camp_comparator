# Backend/app/domain/

**Purpose:** The pure calculation core.

| Item | Detail |
|---|---|
| Contents | `models.py` (frozen dataclasses: raw vs validated input, results, `ComparisonResult.invalid`; T04), `rounding.py` (`rounded_tenths`, `format_average`; T04), `validation.py` (`validate_scenario` → `ValidationOutcome`, `validate`; T05), `engine.py` (`compare(scenario) -> ComparisonResult`: contributions, totals, affordability, ranks, recommendation; T06), `compare.py` (`compare_request(city, hotel_ids, place_ids, importances, budget)`: catalog + raw selection -> validator -> engine; unknown-ID check; T08) |
| Responsibilities | Validate the whole scenario, compute contributions/totals/averages, affordability, ranking, recommendation. Integer arithmetic only |
| Dependencies | Python stdlib only. No FastAPI, pydantic, I/O or globals |
| Naming | Functions are verbs (`validate_scenario`, `compare`); error codes `UPPER_SNAKE` |
| Belongs | Anything that decides a number, a rank or validity |
| Does not belong | Coordinates/positions, file reading, HTTP, `float`, `round()`, reading `verification/` |

Rules: [../../../docs/CRITICAL_RULES.md](../../../docs/CRITICAL_RULES.md). Search before adding; each function lives once.
