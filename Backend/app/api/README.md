# Backend/app/api/

**Purpose:** HTTP layer only.

| Item | Detail |
|---|---|
| Contents | `routes.py` (endpoints), `schemas.py` (loose request/response shapes) |
| Responsibilities | Parse request → load city via `data/` → build scenario → call `domain/` → return result. Map unknown city to 404 |
| Dependencies | `data/`, `domain/`, FastAPI, pydantic |
| Naming | Paths exactly as in [../../../docs/API_SPECIFICATION.md](../../../docs/API_SPECIFICATION.md) |
| Belongs | Request parsing, serialization, HTTP status |
| Does not belong | Arithmetic, comparisons, ranking, validation rules, new fields or endpoints not in the spec |

`INVALID` and `NO_AFFORDABLE_HOTEL` are HTTP 200 results.
