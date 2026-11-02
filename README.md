# Hotel Base-Camp Comparator

A local web app that helps a friend group pick a base-camp hotel in a fictional Indian city (Surmapur): complete-stay price against weighted round-trip times to every wishlist place. Backend (FastAPI) does all calculation; the React frontend only renders the result.

**Prerequisites:** Python 3.10+, Node.js with npm. Commands are Windows PowerShell; run each block from the repo root.

```powershell
# 1. Backend: create the venv, install, run (http://127.0.0.1:8000)
cd Backend; python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -e ".[dev]"
uvicorn app.main:app --reload

# 2. Frontend, in a second terminal (http://localhost:5173)
cd Frontend; npm install; npm run dev
```

Open **http://localhost:5173** (use `localhost`, not `127.0.0.1`) and click **Load Demo trip**.

| Task | Command |
|---|---|
| Backend tests, lint, format check | `cd Backend; pytest -q; ruff check .; ruff format --check .` |
| Frontend tests, lint, types, format | `cd Frontend; npm test; npm run lint; npm run typecheck; npm run format:check` |
| Production build and preview (http://localhost:4173, backend must run) | `cd Frontend; npm run build; npm run preview` |

Docs: [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) (what and why), [docs/COMMANDS.md](docs/COMMANDS.md) (all commands), [docs/TESTING.md](docs/TESTING.md) (tests and the manual demo script), [docs/PROGRESS.md](docs/PROGRESS.md) (status).
