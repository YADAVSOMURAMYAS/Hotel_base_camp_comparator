# Decisions

> **Purpose:** Log decisions, deviations and unconfirmed assumptions.
> **Owner of:** ADR entries (D-xx) and the "Assumptions to confirm" list (A-xx), plus hand-tuned data cells.
> **Read this when:** you are about to deviate from a doc, tune a data cell, or wonder why something is the way it is. Append only; never rewrite history.

## Decisions
| ID | Date | Decision | Reason | Alternatives | Consequence |
|---|---|---|---|---|---|
| D-01 | 2026-11-02 | No database; city data in JSON files under `Backend/app/data/cities/` | Spec forbids databases; static data is enough | SQLite | `data/` only loads files; data changes are commits |
| D-02 | 2026-11-02 | All calculation in `Backend/app/domain/`; frontend only renders | One testable source of truth; spec requires app to calculate from inputs | Duplicate logic in frontend for responsiveness | Every edit makes a request; need stale-response handling |
| D-03 | 2026-11-02 | Integer rounding: `(20*T + I) // (2*I)` | Exact round-half-up without floats; ranking uses exact total | `Decimal`, `round()` (banker's rounding) | No `/` or `round()` in the engine; tests cover `.x5` |
| D-04 | 2026-11-02 | Hand-written SVG/CSS for map and bars | No map/chart libraries approved; schematic map needs no tiles | Leaflet, D3, Recharts | More custom code, fewer dependencies |
| D-05 | 2026-11-02 | Capitalised folders `Backend/` and `Frontend/` everywhere | Matches the existing repo | lowercase | All docs and paths use these names |
| D-06 | 2026-11-02 | Currency ₹, whole rupees; backend integers, frontend `en-IN` grouping | One currency, no float money | Decimal rupees/paise | `Over budget by ₹X` rendered by frontend from `shortfall` |
| D-07 | 2026-11-02 | Scope extension: 2+ cities × (30 hotels, 50 places); select ≤10 hotels, ≤15 places | User decision (CLAUDE.md) | Demo trip only | Needs generator, catalog endpoints, selection validation, selection UI |
| D-08 | 2026-11-02 | Users cannot add map points; selection toggles existing markers | Spec excludes custom editors; keeps data trusted | Free-form markers | Selection mode shows all catalog markers |
| D-09 | 2026-11-02 | Phase A (T01–T14, Demo trip) before Phase B (T15–T17) | Phase A alone is a complete submission | Catalog first | Phase A city JSON uses final schema with short arrays |
| D-10 | 2026-11-02 | The 13 spec docs stay separate; one owns each topic, others link | Avoids duplicated, drifting content | One big doc | Cross-references by path |
| D-11 | 2026-11-02 | `errors[]` entries are `{field, code, message}` (user-confirmed) | Tests assert on stable codes, not message text | `{field, message}` per `Backend/CLAUDE.md` | `Backend/CLAUDE.md` updated to match in T01b |
| D-12 | 2026-11-02 | Small tie/edge-case scenarios live in `Backend/tests/fixtures/small_scenarios.py` (planned, T06); `Backend/app/data/` holds no scenarios | Test data must not sit in production code; matches `Backend/CLAUDE.md` | `Backend/app/data/small_scenarios.py` (named in the T06 task text) | The empty stub `Backend/app/data/small_scenarios.py` is unused and may be deleted by the user |

## Hand-tuned data cells
None yet. Log any matrix cell changed by hand here (hotel, place, old → new, reason).

## Assumptions to confirm
Inferred by Claude and not stated in the sources. Review each; reply keep / change.

| ID | Assumption | Where used |
|---|---|---|
| A-01 | **Resolved (T01b):** the 12 core rules were supplied and are Part 1 of `CRITICAL_RULES.md`; project-specific rules are Part 2 | `CRITICAL_RULES.md` |
| A-02 | **Accepted by user.** Per-hotel average field is `weighted_average_display` (as in `CLAUDE.md`); the shortened variant in the T01 prompt was not adopted | API spec |
| A-03 | **Accepted by user.** `INVALID` returns `importance_total`, `budget`, `recommended_hotel_id`, `default_inspected_hotel_id` all `null` and `hotels: []` | API spec |
| A-04 | **Accepted by user.** `label` is a code (`RECOMMENDED`/`RANKED`/`OVER_BUDGET`); frontend builds the text, including "₹X" from `shortfall` | API spec |
| A-05 | `remaining_budget` is non-null only when affordable (≥0); `shortfall` is non-null only when over budget (>0) | API spec |
| A-06 | `hotels[]` order: ranked by rank, then over-budget by `weighted_total`, `stay_cost`, `id` ascending; frontend never re-sorts | API spec |
| A-07 | Error code names (e.g. `BUDGET_INVALID`, `MAPPING_MISSING_PLACE`, `FIELD_TYPE`) and dotted `field` paths are my naming | API spec |
| A-08 | **Decided: see D-12** (small scenarios live in `Backend/tests/fixtures/small_scenarios.py`) | `PROGRESS.md` |
| A-09 | **Accepted by user.** `npm test` is an alias for `npx vitest run`, added in T09 (`package.json` has no `test` script yet) | `COMMANDS.md` |
| A-10 | Linter is oxlint (CLAUDE.md, already in scaffold). ESLint, Prettier and Playwright are listed as not approved | `TECH_STACK.md` |
| A-11 | City JSON field names: `map`, `districts`, `position {x,y}`, `default_importance`, `round_trip_minutes`, `demo_preset`; catalog response adds `has_demo_preset`; map viewBox 1000×700 in examples | `DATABASE_DESIGN.md`, API spec |
| A-12 | **Accepted by user.** `GET /api/cities/{city_id}` ships in T08 (the map needs it); `GET /api/cities` ships in T15. T15's file list also names the former | API spec |
| A-13 | Only the primary city owns the Demo trip; `presets/demo` on any other city returns 404 | API spec |
| A-14 | Unparseable body, non-object body or missing/non-string `city_id` → 422; unknown city → 404 | API spec |
| A-15 | Python ≥ 3.10 (3.10.11 installed); ruff line length 100, rules `E,F,I,UP,B`; ports 8000/5173 | `CODING_STANDARDS.md`, `COMMANDS.md` |
| A-16 | Timeline endpoint (`GET /api/cities/{city_id}/timeline`) path is a placeholder; schema defined before T18 | API spec |
| A-17 | Reset/Load both re-fetch the preset; `verification/DEMO_DESIGN_NOTES.md` is created by T02 after approval | `ARCHITECTURE.md`, `PROGRESS.md` |
| A-18 | `city_id` is lowercase `[a-z0-9_]+`; the Phase B 30/50 counts are enforced by a test, not by the loader | `DATABASE_DESIGN.md` |
| A-19 | Examples use an illustrative 3-hotel/3-place city (`example_city`, `H_RIVER` etc.), not the Demo trip, which is designed in T02 | API spec, DATABASE_DESIGN |
| A-20 | The workspace is not a Git repository; `git status` cannot be shown until `git init` | T01 report |
