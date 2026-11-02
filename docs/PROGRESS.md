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
| T04 | Backend skeleton, models, rounding | T01 | `Backend/pyproject.toml`, `app/main.py`, `app/domain/models.py`, `app/domain/rounding.py`, `tests/unit/test_rounding.py` | Pending | Backend | A |
| T05 | Validation | T04 | `app/domain/validation.py`, `tests/unit/test_validation.py` | Pending | Backend | A |
| T06 | Engine and ranking | T04 | `app/domain/engine.py`, `tests/unit/test_engine.py`, `test_ranking_ties.py`, `tests/fixtures/small_scenarios.py` (see D-12) | Pending | Backend | A |
| T07 | Demo story tests (what-ifs) | T03, T06 | `tests/scenario/test_demo_story.py` | Pending | Backend | A |
| T08 | API core (health, city, preset, compare) | T03, T05, T06 | `app/api/routes.py`, `app/api/schemas.py`, `app/main.py` (wiring), `tests/api/test_compare_api.py` | Pending | Backend | A |
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
- `Backend/` contains empty stub files and empty folders (no code yet). `Frontend/` has the stock Vite + React scaffold (`dev`, `build`, `lint`, `preview`; no test setup yet). No Demo data exists. No Git repository yet.

## Next up
1. Review T01 output, especially "Assumptions to confirm" in [DECISIONS.md](DECISIONS.md).
2. T03 (freeze the Demo data into JSON and record independent expected results from `verification/DEMO_DESIGN_NOTES.md`), in parallel with T04 and T09.

## Changelog
| Date | Change | Task |
|---|---|---|
| 2026-11-02 | Documentation set written; task list T01–T18 adopted from the task breakdown | T01 |
| 2026-11-02 | Demo trip (Surmapur) designed and proved on paper; approved at Checkpoints A and B; `verification/DEMO_DESIGN_NOTES.md` written | T02 |
