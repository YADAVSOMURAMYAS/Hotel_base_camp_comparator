# Commands

> **Purpose:** Copy-paste commands for setup, run, test, lint and build.
> **Owner of:** the command list. Only commands the chosen tools actually provide.
> **Read this when:** setting up, running, testing, or before reporting test results.

PowerShell is primary; bash equivalents are given where they differ. Items marked **(after Txx)** do not work until that task is done. Paths are relative to the repo root.

## Prerequisites and ports
- Python 3.10 or newer (developed on 3.10.11) and Node.js with npm (developed on Node 24).
- Backend: **http://127.0.0.1:8000** (`/docs` for the OpenAPI page). Frontend dev: **http://localhost:5173**. Production preview: **http://localhost:4173**.
- Open the frontend with `localhost`, not `127.0.0.1`: Vite listens on IPv6 `localhost` here, so `http://127.0.0.1:5173` and `http://127.0.0.1:4173` are refused.
- Both Vite servers proxy `/api` to `http://127.0.0.1:8000`, so the backend must be running.

## Backend (from `Backend\`)
| Action | PowerShell | bash |
|---|---|---|
| Create venv | `python -m venv .venv` | same |
| Activate | `.\.venv\Scripts\Activate.ps1` | `source .venv/Scripts/activate` (Git Bash) |
| Install | `pip install -e ".[dev]"` (reads `pyproject.toml`; pydantic arrives with FastAPI) | same |
| Run server | `uvicorn app.main:app --reload` → http://127.0.0.1:8000 (docs at `/docs`) | same |
| Tests | `pytest -q` | same |
| One folder | `pytest -q tests/scenario` | same |
| Lint / format check | `ruff check .; ruff format --check .` | `ruff check . && ruff format --check .` |
| Format | `ruff format .` | same |
| Call API (`/api/health` works since T04; other endpoints after T08) | `Invoke-RestMethod http://127.0.0.1:8000/api/health` | `curl http://127.0.0.1:8000/api/health` |
| Regenerate matrix **(after T15)** | `python scripts/design_helper.py` | same |

## Frontend (from `Frontend\`)
| Action | Command |
|---|---|
| Install | `npm install` |
| Dev server | `npm run dev` -> http://localhost:5173 (use `localhost`, not `127.0.0.1`; `/api` is proxied to port 8000) |
| Tests | `npm test` (= `vitest run`) |
| Tests, watch | `npm run test:watch` |
| Test one file | `npx vitest run src/__tests__/<file>` |
| Lint (oxlint) | `npm run lint` |
| Type-check | `npm run typecheck` (`tsc -b`) |
| Format / check | `npm run format` / `npm run format:check` (Prettier, code only) |
| Type-check + build | `npm run build` |
| Preview the production build | `npm run build; npm run preview` -> http://localhost:4173 (`/api` is proxied to port 8000; check with `Invoke-RestMethod http://localhost:4173/api/health`) |
| Page accessibility lint (ad hoc, not in `npm run lint`) | `npx oxlint --jsx-a11y-plugin` |

## Run both together
Two terminals (simplest, and logs stay visible):
```powershell
# Terminal 1
cd Backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload
# Terminal 2
cd Frontend; npm run dev
```
Production build instead of the dev server (Terminal 1 unchanged):
```powershell
# Terminal 2
cd Frontend; npm run build; npm run preview     # http://localhost:4173
```
Single-shell alternative: `Start-Process powershell -ArgumentList '-NoExit','-Command','cd Backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload'` then `cd Frontend; npm run dev` **(Backend since T04; Frontend since T09)**.

## Calling the API by hand (Backend running on port 8000)
```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/cities/surmapur/presets/demo
$p = Invoke-RestMethod http://127.0.0.1:8000/api/cities/surmapur/presets/demo
Invoke-RestMethod http://127.0.0.1:8000/api/compare -Method Post -ContentType 'application/json' -Body ($p | ConvertTo-Json -Depth 5)
```

## Regenerating the flow samples (Backend running on port 8000)
`Frontend/src/test/samples/flow_*.json` are real `POST /api/compare` responses for the Demo trip; see [that folder's README](../Frontend/src/test/samples/README.md) for the exact parameters and the PowerShell snippet.

## Logs
Backend request logs print in the uvicorn terminal; frontend logs in the Vite terminal and the browser console. No log files are written.

## Before reporting a task done
`pytest -q`, `ruff check .`, `ruff format --check .` (Backend) and `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` (Frontend), as affected. Paste the real output (core rule 10).
