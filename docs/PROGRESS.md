# Progress

> **Purpose:** Track task status.
> **Owner of:** the task table, current state, next up, changelog.
> **Read this when:** starting a session (to find the next task) and finishing one (to update it).

Status values: Done · In progress · Pending. One task = one session. Definition of done: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

## Tasks
| ID | Objective | Depends on | Files | Status | Group | Phase |
|---|---|---|---|---|---|---|
| T01 | Documentation set | none | `docs/*.md`, `docs/interview/*.md`, `verification/README.md`, folder READMEs | In progress | Docs | A |
| T02 | Design the Demo trip on paper, with proof | T01 | `verification/DEMO_DESIGN_NOTES.md` | Done | Data | A |
| T03 | Freeze Demo data + independent expected results | T02 | `Backend/app/data/cities/<demo_city>.json`, `verification/expected_results.xlsx`, `verification/EXPECTED_RESULTS.md`, `Backend/tests/fixtures/expected_demo.py`, READMEs | Pending | Data | A |
| T04 | Backend skeleton, models, rounding | T01 | `Backend/pyproject.toml`, `app/main.py`, `app/domain/models.py`, `app/domain/rounding.py`, `tests/unit/test_rounding.py` | Done | Backend | A |
| T05 | Validation | T04 | `app/domain/validation.py`, `tests/unit/test_validation.py` | Done | Backend | A |
| T06 | Engine and ranking | T04 | `app/domain/engine.py`, `tests/unit/test_engine.py`, `test_ranking_ties.py`, `tests/fixtures/small_scenarios.py` (see D-12) | Done | Backend | A |
| T07 | Demo story tests (what-ifs) | T03, T06 | `tests/scenario/test_demo_story.py` | Done | Backend | A |
| T08 | API core (health, city, preset, compare) | T03, T05, T06 | `app/api/routes.py`, `app/api/schemas.py`, `app/data/loader.py`, `app/domain/compare.py`, `app/main.py` (unchanged: router already wired), `tests/api/*` | Done | Backend | A |
| T09 | Frontend scaffold, contracts, client, state hook | T01 | `Frontend/src/types/contracts.ts`, `api/client.ts`, `state/useComparator.ts`, `utils/currency.ts`, `App.tsx`, mocks, tests | Pending | Frontend | A |
| T10 | Controls and status banner | T09 | `components/Controls/*`, `components/StatusBanner/*` | Pending | Frontend | A |
| T11 | Ranking view | T09 | `components/HotelRanking/*` | Pending | Frontend | A |
| T12 | City map (SVG) | T09 | `components/CityMap/*` | Pending | Frontend | A |
| T13 | Explanation panel and travel table | T09 | `components/ExplanationPanel/*`, `components/TravelMatrixTable/*` | Pending | Frontend | A |
| T14 | Integration and Phase A demo-ready checkpoint | T08, T10–T13 | `Frontend/src/App.tsx`, `Frontend/vite.config.ts`, integration tests, `docs/COMMANDS.md` | Pending | Integration | A |
| T15 | Catalog data (2 cities), generator, catalog API, selection limits | T14 | `Backend/scripts/design_helper.py`, `app/data/cities/*.json`, `app/api/routes.py`, `app/domain/validation.py`, tests, docs | Pending | Backend | B |
| T16 | Selection UI (list and map click) | T15 | `components/Selection/*`, small edits to `CityMap`, `Controls`, `useComparator`, tests | Pending | Frontend | B |
| T17 | Evidence, review, interview docs, live-change rehearsal | T14 (T16 if done) | `docs/interview/*`, `docs/PROGRESS.md`, screenshots | Pending | Wrap-up | B |
| T18 | *Optional:* budget timeline | T07 | `app/domain/timeline.py`, timeline endpoint, `components/BudgetTimeline/*`, tests | Pending | Optional | B |

Parallel groups: see [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md). T05 ‖ T06; T10 ‖ T11 ‖ T12 ‖ T13; Data ‖ Backend ‖ Frontend after T01.

## Current state
- Docs, folder READMEs and `verification/README.md` are being written (T01). The three `CLAUDE.md` files exist.
- `Backend/` has a runnable FastAPI app (`GET /api/health` only), the domain models and the integer rounding function (T04). `engine.py` has `compare(scenario)` (T06: contributions, totals, ranks, recommendation, `NO_AFFORDABLE_HOTEL`). `schemas.py` is still an empty stub. `Frontend/` has the stock Vite + React scaffold (`dev`, `build`, `lint`, `preview`; no test setup yet). No Demo data exists. No Git repository yet.

- T08 done: `GET /api/cities/{id}`, `GET .../presets/demo` and `POST /api/compare` work on Surmapur (loader, `domain/compare.py`, 65 API tests, real sample responses in `tests/api/samples/`).

## Next up
1. Review T01 output, especially "Assumptions to confirm" in [DECISIONS.md](DECISIONS.md).
2. T06 (engine; T05 validation is done and returns the validated `Scenario`, D-13/D-17). T09 (frontend scaffold) is independent.

## Changelog
| Date | Change | Task |
|---|---|---|
| 2026-11-02 | Documentation set written; task list T01–T18 adopted from the task breakdown | T01 |
| 2026-11-02 | Demo trip (Surmapur) designed and proved on paper; approved at Checkpoints A and B; `verification/DEMO_DESIGN_NOTES.md` written | T02 |
| 2026-11-02 | `pyproject.toml`, FastAPI app factory with CORS, `GET /api/health`, domain models (raw vs validated), `rounded_tenths` / `format_average`; 32 tests | T04 |
| 2026-11-02 | `domain/engine.py` `compare()`, `tests/fixtures/small_scenarios.py`, `test_engine.py`, `test_ranking_ties.py` (21 tests); empty `app/data/small_scenarios.py` stub deleted (D-12, D-15) | T06 |
| 2026-11-02 | `domain/validation.py` (`validate_scenario`, `validate`, `ValidationOutcome`) and `tests/unit/test_validation.py` (116 tests); API spec path note | T05 |
| 2026-11-02 | `tests/scenario/conftest.py` + `test_demo_story.py` (35 tests): engine vs `expected_demo.py` for all 10 hotels, independent contributions, C1–C6, N1–N3, what-ifs, reset, boundary, budget 0, independence guard. Mutation check done on a scratch copy; no app files changed | T07 |
| 2026-11-02 | `data/loader.py` (cached, injectable), `domain/compare.py` (catalog + selection -> result, unknown-ID check), `api/schemas.py`, three new routes, `tests/api/` (65 tests) and `tests/api/samples/` | T08 |
