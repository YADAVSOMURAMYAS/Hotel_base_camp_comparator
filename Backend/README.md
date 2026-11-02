# Backend/

**Purpose:** FastAPI service that validates scenarios and calculates every result.

| Item | Detail |
|---|---|
| Contents | `app/` (service code), `scripts/` (one-time generator), `tests/`, `pyproject.toml` *(planned, T04)*, `CLAUDE.md` |
| Responsibilities | Own all calculation, validation and city data |
| Dependencies | FastAPI, uvicorn, pydantic, pytest, httpx, ruff (see [../docs/TECH_STACK.md](../docs/TECH_STACK.md)) |
| Naming | `snake_case` modules; tests `test_*.py` |
| Belongs | Python code, JSON city data, backend tests |
| Does not belong | Frontend code, expected results (`../verification/`), docs |

Run and test commands: [../docs/COMMANDS.md](../docs/COMMANDS.md). Rules: [CLAUDE.md](CLAUDE.md).
