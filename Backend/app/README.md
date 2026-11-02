# Backend/app/

**Purpose:** The application package.

| Item | Detail |
|---|---|
| Contents | `main.py` (app + CORS), `api/`, `domain/`, `data/` |
| Responsibilities | `main.py` only creates the app and wires routers |
| Dependencies | Layers point down: `api` → `data`, `domain`; `domain` imports nothing outside stdlib |
| Naming | `snake_case` |
| Belongs | Runtime code |
| Does not belong | Imports of `../scripts/`, `../tests/` or `../../verification/` |

See [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).
