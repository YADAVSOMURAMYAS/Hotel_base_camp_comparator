# Tech Stack

> **Purpose:** The approved tools, why each is needed, and what we deliberately skip.
> **Owner of:** dependency approvals and rejected alternatives.
> **Read this when:** about to add, upgrade or replace any library or tool. Any addition needs the user's approval first.

**Version policy:** use the versions installed by the scaffold/`pyproject.toml`; pin a compatible range, do not chase latest. The Frontend scaffold's `package.json` is authoritative for JS versions. Python ≥ 3.10.

## Backend
| Tool | Purpose | Why needed | Skipped / not used |
|---|---|---|---|
| FastAPI | HTTP API, automatic `/docs` page | Small, typed, easy to test with TestClient | Django/Flask: heavier or less typed |
| Uvicorn | ASGI server | Runs FastAPI locally with `--reload` | Gunicorn: no production deploy |
| Pydantic | Request/response schemas in `api/` only | Comes with FastAPI; loose types so the domain judges input | Pydantic in `domain/`: forbidden |
| pytest | Tests | Fast, simple | unittest: more boilerplate |
| httpx | Backs FastAPI `TestClient` | Required by TestClient | requests: not needed |
| ruff | Lint + format | One fast tool | flake8/black/isort: replaced by ruff |

## Frontend
| Tool | Purpose | Why needed | Skipped / not used |
|---|---|---|---|
| React | UI | Familiar, component model | Vue/Svelte: team familiarity |
| Vite | Dev server, build | Quick startup | CRA/webpack: slow |
| TypeScript (strict) | Type safety; contracts mirror the API | Catches contract drift | Plain JS |
| Vitest | Tests | Native to Vite, fast | Jest: extra config |
| React Testing Library | Component tests by role/label | Accessible queries | Enzyme |
| jsdom | DOM for Vitest | Required by RTL under Vitest | Real browser for unit tests |
| oxlint | Lint (`npm run lint`) | Already in the Vite scaffold; approved in CLAUDE.md | ESLint: **not approved**; ask first |
| Prettier | `npm run format` / `format:check` (code only) | Approved for T09 (D-23) | `eslint-config-prettier`: not needed |
| @testing-library/jest-dom, user-event, dom | DOM matchers, user events; `dom` is a required peer of RTL | Approved set | none |

Added in T09 (dev dependencies, see `Frontend/package.json`): `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`, `prettier`.

## Optional / not approved
| Tool | Status |
|---|---|
| Playwright (screenshots) | Not approved. Screenshots are taken manually (browser/OS tool) unless the user approves |
| ESLint | Not approved; oxlint is the linter (Prettier was approved in T09) |

## Rejected alternatives
| Alternative | Reason |
|---|---|
| Database (SQLite, Postgres) | Out of scope; static JSON city files are enough ([DATABASE_DESIGN.md](DATABASE_DESIGN.md)) |
| Redux / Zustand | One custom hook is enough for this state |
| Axios | `fetch` is sufficient; no new dependency |
| Leaflet / Mapbox | Live maps out of scope; schematic map is hand-written SVG |
| D3 / Recharts / Chart.js | Contribution bars are plain CSS/SVG |
| Docker | Local two-command startup is faster and simpler |
| CSS frameworks (Tailwind, MUI) | Plain CSS with variables; fewer moving parts |
