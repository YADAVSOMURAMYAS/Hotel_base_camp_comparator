# Backend/app/domain/

**Purpose:** The pure calculation core.

| Item | Detail |
|---|---|
| Contents | `models.py` (dataclasses), `validation.py`, `engine.py`, `rounding.py` |
| Responsibilities | Validate the whole scenario, compute contributions/totals/averages, affordability, ranking, recommendation. Integer arithmetic only |
| Dependencies | Python stdlib only. No FastAPI, pydantic, I/O or globals |
| Naming | Functions are verbs (`validate_scenario`, `compare`); error codes `UPPER_SNAKE` |
| Belongs | Anything that decides a number, a rank or validity |
| Does not belong | Coordinates/positions, file reading, HTTP, `float`, `round()`, reading `verification/` |

Rules: [../../../docs/CRITICAL_RULES.md](../../../docs/CRITICAL_RULES.md). Search before adding; each function lives once.
