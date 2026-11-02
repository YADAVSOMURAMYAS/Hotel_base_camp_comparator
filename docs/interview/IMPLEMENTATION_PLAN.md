# Implementation Plan

> **Purpose:** The 3–5 step plan presented at the interview, with checkpoints and honest changes.
> **Owner of:** the ordered steps, their checkpoints and verification, and the "Changes from plan" log.
> **Read this when:** preparing the interview presentation or when work deviates from the plan.

The fine-grained task list (T01–T18) is in [../PROGRESS.md](../PROGRESS.md); the five steps below group it.

| Step | What | Tasks | Checkpoint (working evidence) | How verified |
|---|---|---|---|---|
| 1. Specify and design the Demo trip | Docs, API contract, data design; design the fictional city on paper and prove the six story conditions | T01–T03 | Docs consistent; proof table approved; frozen JSON; expected results agree between spreadsheet and typed constants | Manual doc review; spreadsheet vs constants cross-check; data-structure test |
| 2. Build the calculation core | Rounding, validation, engine, ranking; story tests against independent expected values | T04–T07 | `pytest -q` and `ruff check .` green; Demo trip matches expected results for every hotel; S1–S6 pass | Real pytest output in `TEST_EVIDENCE.md` |
| 3. Expose the API and build the UI pieces | FastAPI endpoints; React contracts, state hook, controls, ranking, SVG map, explanation, time table (built in parallel against the contract) | T08–T13 | API tests green (OK / NO_AFFORDABLE_HOTEL / INVALID); each component test green | pytest + vitest output; mock-data screenshots |
| 4. Integrate and demo-ready checkpoint | Wire frontend to backend, walk the whole workflow, merge to `main` and tag | T14 | Manual checklist in [../TESTING.md](../TESTING.md) passes click by click; what-ifs and reset match expected results | Walkthrough + screenshots; full regression run |
| 5. Extend, then prove | Catalog (30/50 per city) and selection UI if time allows; fresh-session AC review; interview docs; live-change rehearsal | T15–T17 (T18 optional) | Every AC maps to a passing test or screenshot; regenerated matrix identical; a 10-minute change rehearsed | Full pytest/vitest/lint; AC review table |

Phase A (steps 1–4) is a complete submission on its own; step 5 is the extension.

## Changes from plan
| Date | Step/Task | What changed | Why | Impact |
|---|---|---|---|---|
| | | | | |
