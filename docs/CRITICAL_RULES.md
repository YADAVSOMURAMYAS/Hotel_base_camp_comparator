# Critical Rules

> **Purpose:** The enforceable rules. Breaking one fails the project.
> **Owner of:** the numbered rule list, why each exists, and how a reviewer checks it.
> **Read this when:** starting any task and before any review or merge.

Part 1 holds the 12 core rules from the original project brief (wording unchanged). Part 2 holds the project-specific rules; rules that only restated a core rule were merged into it (see the table at the end).

## Part 1: Core rules (from the original project brief)

| # | Rule | Why it exists | How a reviewer checks it |
|---|---|---|---|
| 1 | Never start coding without understanding the existing architecture. | Code that ignores the layers breaks them and creates rework | The session's plan cites [ARCHITECTURE.md](ARCHITECTURE.md), the task's docs and the files it will touch; the first diff matches that plan |
| 2 | Never invent requirements, APIs, functions or database fields. | Frontend and backend drift apart; invented scope cannot be defended in the interview | Every new field, endpoint or error code appears in [API_SPECIFICATION.md](API_SPECIFICATION.md) or [DATABASE_DESIGN.md](DATABASE_DESIGN.md) in the same change; unexplained requirements go to the "Assumptions" list in [DECISIONS.md](DECISIONS.md) |
| 3 | Never modify unrelated files. | Small diffs we can explain line by line | The diff's file list is a subset of the task's file list in [PROGRESS.md](PROGRESS.md) |
| 4 | Never duplicate existing functionality. | One definition per behaviour keeps fixes in one place | `grep` for the function or constant before adding; the reviewer finds no second copy (e.g. one rounding function, one validator) |
| 5 | Never introduce unnecessary dependencies. | Simplicity and explainability; new tools cost startup time | `pyproject.toml` and `package.json` diffs add nothing beyond the approved set in [TECH_STACK.md](TECH_STACK.md); no map or chart libraries; anything new was approved first |
| 6 | Follow consistent coding standards. | Readable, uniform code is quick to change in a 10-minute live edit | `ruff check .`, `ruff format --check .`, `npm run lint`, `npm run build` are clean; the diff follows [CODING_STANDARDS.md](CODING_STANDARDS.md) |
| 7 | Keep business logic separate from API routes and UI components. | One testable source of truth: all calculation lives in `Backend/app/domain/` as pure functions; routes and components only pass data through | `Backend/app/api/` has no arithmetic or comparisons; `Frontend/src` never computes totals, ranks, averages, affordability or rounding (`grep` for `reduce(`, `sort(`, `Math.` and `*` on result fields finds nothing). The only allowed transform is `en-IN` rupee formatting |
| 8 | Write appropriate tests for every module. | Each acceptance criterion needs repeatable evidence | Each module has a test file named in [TESTING.md](TESTING.md); the test was written first and fails without the change |
| 9 | Update relevant folder README files and documentation. | Fresh sessions rely on the docs | The closing checklist is ticked: the README of each changed folder, [PROGRESS.md](PROGRESS.md), [interview/AI_PROMPTS.md](interview/AI_PROMPTS.md); deviations logged in [DECISIONS.md](DECISIONS.md) |
| 10 | Never claim tests passed unless they were actually executed. | Honesty; interview credibility | Real command output is pasted in the session and in [interview/TEST_EVIDENCE.md](interview/TEST_EVIDENCE.md), from this session |
| 11 | Preserve existing functionality when making changes. | New work must not break finished work | The full regression (`pytest -q`, `npx vitest run`, lint, build) is green before merging; earlier tests are not deleted or weakened to pass |
| 12 | Treat project documentation and API contracts as the source of truth. | Code and docs must agree | Docs are updated first; any contract change updates [API_SPECIFICATION.md](API_SPECIFICATION.md) and `Frontend/src/types/contracts.ts` in the same commit; where code and doc disagree, the doc wins until the user decides otherwise |

## Part 2: Project-specific rules

| # | Rule | Why | Reviewer check |
|---|---|---|---|
| P1 | **Rank by the exact integer `weighted_total`**: no floats, no `round()`, no `/` in the engine | Display rounding must never change order | `grep -nE "round\(\|float\(\| / " Backend/app/domain` finds nothing |
| P2 | **Rounding formula:** `rounded_tenths = (20*T + I) // (2*I)`; display `f"{t//10}.{t%10}"` | Integer round-half-up, exactly as the spec | `test_rounding.py` covers `.x5` boundaries and `28.0` for T=140, I=5 |
| P3 | **Affordable iff `stay_cost <= budget`** (equality included) | Spec contract | Tests: budget equal → affordable; budget − 1 → unranked |
| P4 | **Sort:** `weighted_total` asc, then `stay_cost` asc, then hotel ID in ASCII order. Names, input order, map position and displayed average never break ties | Deterministic, spec-defined | Tie tests (cost tie, full tie); input-order shuffle test |
| P5 | **Ranks are 1..n with no gaps; rank 1 is the single Recommended hotel.** Over-budget hotels have no rank and are never recommended | Spec contract | Rank-sequence assertion in engine tests |
| P6 | **Coordinates, pixel distance and line length are never used in any calculation** | Spec contract; the map is presentation | `grep -n "position" Backend/app/domain` finds nothing |
| P7 | **`INVALID` clears every derived field** (ranks, recommendation, totals, contributions, highlights, default inspected hotel), in the API and the UI | No stale or partial output | API test asserts empty/null fields; UI test asserts cleared panels |
| P8 | **No partial ranking.** Validate the complete scenario before ranking; collect all errors | Spec contract | A scenario with one bad record returns `INVALID`, no `hotels` |
| P9 | **`NO_AFFORDABLE_HOTEL` is a valid result** (HTTP 200): shortfalls kept, no ranks, no recommendation | Spec contract | API and engine tests |
| P10 | **`verification/` is never calculation input.** Only tests may compare against it | The independent check must stay independent | `grep -rn "verification\|expected_demo" Backend/app Frontend/src` finds nothing |
| P11 | **Keep it simple:** no extra layers, frameworks or abstractions beyond the scope | Over-engineering is penalised | The reviewer can explain each file in one sentence |
| P12 | **Raw values are judged by the domain.** Reject `bool`, float, numeric strings, `None`, NaN; IDs via `re.fullmatch` | Python traps | Validation tests per type |
| P13 | **Users cannot add map points.** Selection toggles existing markers only | Scope decision | The UI has no add-point control; a test asserts it |
| P14 | **Not colour alone.** Text or symbols for Recommended and Over budget | Accessibility, spec | RTL tests query by text and role |
| P15 | **Ignore out-of-order responses** in the frontend | Prevents stale results | Stale-response test |

## Merged into core rules
| Old project rule | Now part of | Detail kept there |
|---|---|---|
| Engine only in the backend; frontend only renders | Core 7 | the `grep` check for logic in `Frontend/src` and `Backend/app/api/` |
| Never invent fields or endpoints | Core 2 and 12 | same-change doc update check |
| No unrelated file edits; no duplication | Core 3 and 4 | file-list subset check; `grep` before adding |
| No new dependencies without asking | Core 5 | approved-set check on `pyproject.toml` / `package.json` |
| Never claim tests passed | Core 10 | real output pasted and logged |
