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
| `npm run preview` | serves the build on http://localhost:4173 with the same `/api` proxy (backend must run) |

Use `localhost`, not `127.0.0.1`: Vite listens on IPv6 localhost here. `VITE_API_BASE` overrides the API base URL (default: same origin via the proxy).

## Layout
`src/types` contracts · `src/api` fetch client · `src/state` the one hook + context · `src/utils` formatting only (`currency.ts`, `wireValue.ts`, `hotelLabels.ts` for the shared status and place-type wording) · `src/components` one folder per UI part · `src/__tests__` hook, utility, App and integration tests · `src/test` test setup, the shared `renderWithComparator.tsx` helper and real sample API responses.

## Page structure
`<header>` with the one `<h1>`, then `<main>` holding the whole workspace: controls and status banner on top, map beside the ranking, then explanation and the travel-time table. Below 900 px everything stacks in the same order. The banner is the only live region.

Status: Phase A complete (T09–T14): all panels, the integration workflow test and the production preview work. Catalog selection arrives in Phase B (T16).
