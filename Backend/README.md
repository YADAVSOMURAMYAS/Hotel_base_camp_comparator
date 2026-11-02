# Backend/

**Purpose:** FastAPI service that validates scenarios and calculates every result.

| Item | Detail |
|---|---|
| Contents | `app/` (service code), `scripts/` (one-time generator), `tests/`, `pyproject.toml` (deps, ruff, pytest config), `CLAUDE.md` |
| Responsibilities | Own all calculation, validation and city data |
| Dependencies | FastAPI (brings pydantic), uvicorn; dev extras: pytest, httpx, ruff, openpyxl (see [../docs/TECH_STACK.md](../docs/TECH_STACK.md)) |
| Naming | `snake_case` modules; tests `test_*.py` |
| Belongs | Python code, JSON city data, backend tests |
| Does not belong | Frontend code, expected results (`../verification/`), docs |

From this folder (PowerShell, Python 3.10+): `python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -e ".[dev]"`, then `uvicorn app.main:app --reload` (http://127.0.0.1:8000) and `pytest -q; ruff check .; ruff format --check .`. The frontend dev and preview servers proxy `/api` to port 8000.

All commands: [../docs/COMMANDS.md](../docs/COMMANDS.md). Rules: [CLAUDE.md](CLAUDE.md).
