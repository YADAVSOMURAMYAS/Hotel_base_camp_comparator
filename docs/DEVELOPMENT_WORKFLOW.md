# Development Workflow

> **Purpose:** How each Claude Code session runs, how Git is used, and what can run in parallel.
> **Owner of:** the session loop, branch/merge rules, session inputs per task type, parallel-work rules, build order.
> **Read this when:** starting a session, branching, merging, or planning parallel work.

Task definitions and file ownership: [PROGRESS.md](PROGRESS.md). Prompt template: [TASK_TEMPLATE.md](TASK_TEMPLATE.md).

## One session per task
`/clear` → **plan mode** → paste task prompt (from TASK_TEMPLATE) → review plan → implement (test first) → run tests → review diff → commit (only when asked) → update `docs/PROGRESS.md` and `docs/interview/AI_PROMPTS.md`.

Definition of done: acceptance criteria met · real test output pasted and logged in `docs/interview/TEST_EVIDENCE.md` · no files outside the task list changed · PROGRESS and changed-folder READMEs updated · prompt logged · deviations logged in `docs/DECISIONS.md`.

## Git
| Branch | Purpose |
|---|---|
| `main` | Demo-ready only; tagged at the Phase A checkpoint (T14) |
| `development` | Integration; merge a feature only when green |
| `feature/<task-id>-<name>` | One per task, e.g. `feature/T06-engine` |

Rules:
- Merge `feature/*` → `development` only with all affected tests and lint green.
- **API-compatibility rule:** any contract change updates `docs/API_SPECIFICATION.md` and `Frontend/src/types/contracts.ts` in the **same commit**.
- Conflicts: resolve on the feature branch by merging `development` into it; never resolve by deleting the other side's tests. If two tasks touched one file, the later task rebases its edit onto the earlier one's version.
- Before merging `development` → `main`: run the full regression (`pytest -q`, `ruff check .`, `npx vitest run`, `npm run lint`, `npm run build`) and the manual checklist in [TESTING.md](TESTING.md).
- Commit format: see [CODING_STANDARDS.md](CODING_STANDARDS.md). The repo is not yet under Git (`git init` is the user's call).

## What to give each session
| Session type | Read | Do not load |
|---|---|---|
| Backend module (T04–T08, T15) | root + `Backend/CLAUDE.md`, `API_SPECIFICATION.md`, `CRITICAL_RULES.md`, `TESTING.md`, relevant source files | Frontend files |
| Frontend feature (T09–T13, T16) | root + `Frontend/CLAUDE.md`, `API_SPECIFICATION.md` (types), `CODING_STANDARDS.md`, mock data | Backend internals |
| Data (T02, T03) | `PROJECT_OVERVIEW.md` (story conditions), `DATABASE_DESIGN.md`, `TESTING.md` (verification method) | App code |
| Integration (T14) | `ARCHITECTURE.md`, `COMMANDS.md`, `TESTING.md` checklist, `API_SPECIFICATION.md` | None extra |
| Review (T17) | `PROJECT_OVERVIEW.md` (ACs), `TESTING.md`, `CRITICAL_RULES.md`; **fresh session that has not seen the code** | Prior chat |

## Parallel work
After T01, three tracks run on separate branches:
```
Data:      T02 -> T03 ---------------------------\
Backend:   T04 -> T05 ---> T06 -> T07 -> T08 ----+--> T14 -> T15 -> T16 -> T17
Frontend:  T09 -> T10 | T11 | T12 | T13 ---------/
```
| Parallel set | File ownership (no overlap) |
|---|---|
| T05 ‖ T06 | T05: `domain/validation.py`, `tests/unit/test_validation.py`. T06: `domain/engine.py`, `tests/unit/test_engine.py`, `test_ranking_ties.py`, `tests/fixtures/small_scenarios.py` |
| T10 ‖ T11 ‖ T12 ‖ T13 | Each owns only its `components/<Name>/` folder and tests; they build against mock data matching the API contract; `App.tsx` and `state/` are untouched until T14 |
| Data ‖ Backend ‖ Frontend | Data: `app/data/cities/`, `verification/`, `tests/fixtures/expected_demo.py`. Backend: `app/domain/`, `app/api/`. Frontend: `Frontend/` |
| Not parallel | T07 waits for T03 + T06; T08 waits for T03 + T05 + T06; T14 waits for T08 + T10–T13 |

Shared files (`docs/PROGRESS.md`, `docs/interview/AI_PROMPTS.md`, `docs/DECISIONS.md`) are append-only; on merge keep both sides.

## Build order
| Phase | Tasks | Outcome |
|---|---|---|
| **A: required Demo trip** | T01–T14 | Demo-ready end to end; merge to `main`, tag. Phase A alone is a complete submission |
| **B: extension and wrap-up** | T15–T17 (T18 optional) | Catalog, selection, evidence, live-change rehearsal |

The optional budget timeline (T18) starts only after every Required criterion is met.
