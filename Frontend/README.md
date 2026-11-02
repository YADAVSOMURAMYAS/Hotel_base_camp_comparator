# Frontend

**Purpose:** React + Vite + TypeScript UI that renders the backend comparison result. It never calculates (see `CLAUDE.md`).

| Command | What |
|---|---|
| `npm run dev` | dev server on http://localhost:5173 (`/api` is proxied to http://127.0.0.1:8000) |
| `npm test` / `npm run test:watch` | Vitest (jsdom + React Testing Library) |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b` |
| `npm run format` / `format:check` | Prettier on code (Markdown is excluded) |
| `npm run build` | type-check + production build |

`VITE_API_BASE` overrides the API base URL (default: same origin via the proxy).

## Layout
`src/types` contracts · `src/api` fetch client · `src/state` the one hook + context · `src/utils` formatting only · `src/components` one folder per UI part · `src/__tests__` tests · `src/test` test setup and sample API responses.

Status: T09 foundation done. Components are stubs until T10-T13; `DevPanel` is temporary (remove in T14).
