# AI Prompts

> **Purpose:** Prompt history with iterations, as the student guide requires.
> **Owner of:** the log of key prompts, what was wrong or missing, and refined prompts.
> **Read this when:** finishing any task (append an entry) and preparing the interview.

Append-only. Start broad, then add constraints. Record honestly what the assistant got wrong. Prompts are quoted verbatim, including field names the project later replaced.

## Entry template
| Field | Content |
|---|---|
| Date | |
| Task | |
| Prompt | |
| What was wrong or missing | |
| Refined prompt | |
| Result | |

---

## Entry 1: T01 Documentation set
| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T01: Documentation set (docs only, no application code) |
| Prompt | Verbatim below |
| What was wrong or missing | The prompt referred to "the 12 rules from my original brief" and to "T01-T17 from our plan", which the assistant could not see. The task list (T01–T18) was pasted mid-session; the 12 rules were supplied later (T01b). The prompt's `{field, code, message}` error shape and its shortened average-field name conflicted with `Backend/CLAUDE.md` and `CLAUDE.md` (DECISIONS D-11, A-02). The Frontend scaffold already existed although the prompt expected it later |
| Refined prompt | Step 0 was followed first: the assistant listed ambiguities, asked three questions (missing inputs, Phase A data shape, error shape), proposed outlines, and waited for approval before writing |
| Result | 13 spec docs, 4 interview docs, `verification/README.md` and folder READMEs written; assumptions logged as A-01…A-20 in [../DECISIONS.md](../DECISIONS.md) |

**Prompt (verbatim):**
````text
Task T01: Documentation set (docs only, NO application code).

Context: CLAUDE.md files are already loaded. Also read fully:
- docs/source/PROBLEM_STATEMENT.md
- docs/source/STUDENT_GUIDE.md
All files in docs/ already exist but are empty. Fill them in. Do not merge, rename or add docs beyond those listed here. Use "Backend/" and "Frontend/" (capitalised) in every path.

## Step 0: Before writing anything
List ambiguities, conflicts or missing information you found, and your proposed answer for each. Ask me the ones that are genuinely mine to decide. Then show me a one-line outline per file and wait for my approval.

## Global writing rules
- Each doc is a source of truth for an AI assistant in a fresh session: precise, concrete, scannable. Target one to two screens per file; API_SPECIFICATION and DATABASE_DESIGN may be longer.
- Tables and code blocks over prose. No marketing language. No duplicated content: where two docs overlap, one owns the content and the other links to it by path.
- Never invent requirements. Anything not in the problem statement, the student guide, CLAUDE.md or my scope decisions goes in DECISIONS.md under "Assumptions" for my review.
- Start each file with: purpose (1 line), owner-of (what this doc is the source of truth for), read-this-when (which task types need it).

## Files and required content

docs/PROJECT_OVERVIEW.md
- Problem in plain words; what the tool is and is not (not an itinerary planner/router/cost estimator).
- Users and the full user workflow as numbered steps with a worked example using the CLOCK/MARKET example from the problem statement.
- Feature list split into: Required (from the problem statement), Scope extension (catalog of 30 hotels/50 places per city, selection by list or map click, up to 10 hotels/15 places), Optional (budget timeline). Mark every item as Required / Extension / Optional.
- Out of scope list (accounts, DB, live maps, geocoding, booking, traffic, routing, external APIs, city editor, file importer, custom map points).
- The 6 main-scenario story conditions plus the importance what-if, as a checklist table with a "how verified" column.
- The acceptance criteria list from the problem statement, each with an ID (AC-01...) so tests and evidence can reference them.

docs/ARCHITECTURE.md
- System diagram in ASCII or Mermaid: React (Frontend) -> HTTP/JSON -> FastAPI (Backend/app/api) -> domain (validation, engine, rounding) -> JSON city files. Show that the engine is stateless and only the backend calculates.
- Layer responsibilities and allowed dependencies (arrows only point downward).
- Folder structure for Backend/, Frontend/, verification/, docs/ with one line per folder/file.
- Data flow for four scenarios: load demo trip, change budget, change one importance, invalid input.
- Request sequencing/stale-response handling on the frontend.
- How the frontend keeps map, ranking, table and explanation panel in sync (single state hook, one source of result data).

docs/API_SPECIFICATION.md (the contract; most important doc)
- Endpoints: GET /api/health, GET /api/cities, GET /api/cities/{city_id} (full catalog: hotels, places, positions, districts, matrix), GET /api/cities/{city_id}/presets/demo (the required 10 hotels/15 places selection + budget + importances), POST /api/compare. Optional: GET timeline.
- For each: method, path, request JSON schema, response JSON schema, field types and ranges, example request and response (use realistic ₹ values), error cases.
- POST /api/compare body: city_id, hotel_ids, place_ids, importances (map place_id -> raw value), budget (raw). Raw values are typed loosely on the wire and judged by the domain validator.
- ComparisonResult: status OK | NO_AFFORDABLE_HOTEL | INVALID; errors [{field, code, message}]; importance_total; budget; recommended_hotel_id; per-hotel fields (id, name, stay_cost, affordable, rank, remaining_budget, shortfall, label, weighted_total, weighted_avg_display, longest_trip, contributions[{place_id, minutes, importance, contribution}]). State exactly which fields are null/empty for each status (INVALID must clear ranks, recommendation, contributions, highlights).
- Validation error code table (one code per rule in the problem statement, plus selection-limit errors: too many/few hotels or places, unknown ID for the city).
- Rule that INVALID and NO_AFFORDABLE_HOTEL are HTTP 200 results, not HTTP errors; HTTP 4xx/5xx only for malformed JSON, unknown city or server faults.
- Currency/number formatting responsibilities: backend returns integers; frontend formats ₹ with Indian grouping.

docs/DATABASE_DESIGN.md
- State clearly: there is no database; this doc defines the JSON data design.
- City JSON schema (city id/name, districts, hotels[30], places[50], positions as presentation data only, matrix 30x50, demo preset reference) with a field table and a small example.
- ID rules and uniqueness across hotels AND places; type enum attraction | food; ranges.
- Deterministic matrix generation method (district base table + hotel offset + place offset, integer only, no randomness, no geometry) and the rule that the generated matrix is frozen into JSON and checked by tests; the Demo trip 10x15 block is hand-authored overrides.
- Demo preset structure and the constraints it must satisfy.
- Relationship diagram of entities (City, District, Hotel, Place, TravelTime, Preset, Selection, ComparisonResult).
- Rules for adding a new city.

docs/CODING_STANDARDS.md
- Python: typing everywhere, pure functions in domain, dataclasses or Pydantic models, naming, docstring policy, ruff config expectations, integer-only arithmetic in the engine, error handling style.
- TypeScript/React: strict mode, functional components, hooks, no `any`, props types, file/component naming, no business logic in components, CSS approach (plain CSS, CSS variables), accessibility requirements (table semantics, aria labels, text/symbols alongside colour).
- Comment and README conventions; commit message format (type(scope): summary, e.g. feat(engine): ...).

docs/CRITICAL_RULES.md
- A numbered, enforceable list (merge the 12 rules from my original brief with the rules in CLAUDE.md). For each rule: the rule, why it exists, how a reviewer can check it. Include: engine-only-in-backend, rank-by-integer-total, rounding formula, coordinates-never-used, INVALID-clears-everything, no-partial-ranking, expected-results-never-engine-input, no-invented-APIs, no-unrelated-file-edits, no-new-dependencies-without-asking, never-claim-tests-passed.

docs/TECH_STACK.md
- Table: library/tool, version policy, purpose, why needed, what we deliberately skip and why. Backend: FastAPI, Uvicorn, Pydantic, pytest, httpx, ruff. Frontend: React, Vite, TypeScript, Vitest, React Testing Library, jsdom, ESLint, Prettier. Optional: Playwright for screenshots.
- Explicitly list rejected alternatives (database, Redux, Axios, Leaflet, D3, Recharts, Docker) and the reason.

docs/DEVELOPMENT_WORKFLOW.md
- The one-session-per-task loop: /clear -> plan mode -> task prompt -> review plan -> implement -> run tests -> review diff -> commit -> update PROGRESS.md and AI_PROMPTS.md.
- Git workflow: main, development, feature/<task-id>-<name>; merge rules; API-compatibility rule (any contract change updates API_SPECIFICATION.md and Frontend/src/types/contracts.ts in the same commit); conflict resolution; regression run before merging to main.
- Which docs and files to give each type of session (backend module, frontend feature, integration, review).
- Parallel work rules: which tasks can run in parallel and which files each owns.
- Build order: Phase A = required Demo trip end-to-end and demo-ready; Phase B = catalog and selection extension.

docs/TESTING.md
- Test pyramid for this project; tools; where tests live.
- A traceability table: each acceptance criterion (AC-xx) -> test name/file (planned) -> how evidence is captured. Must cover: contribution arithmetic, round-half-up display, exact ranking despite rounded averages, both tie-breaks, budget equality and +1, budget change, importance change, invalid-state clearing, no-affordable result, hotel inspection, reset, duplicate ID, incomplete/unknown mapping, story conditions, what-if flips.
- Independent verification method: spreadsheet with formulas + hand-typed constants in Backend/tests/fixtures; the engine never reads them.
- Frontend test list and a manual demo checklist (click-by-click) for the interview.
- Rule: record real command output in docs/interview/TEST_EVIDENCE.md, never claimed results.

docs/COMMANDS.md
- Windows PowerShell commands (and bash equivalents where different): create venv and install, run backend, run frontend, run tests, lint/format, build, run both together, view logs. Mark any command not yet usable as "(after task Txx)". Do not invent scripts that do not exist; use only commands the chosen tools actually provide.

docs/PROGRESS.md
- Task table: ID, objective, depends on, files, status (Done/In progress/Pending), parallel group. Use T01-T17 from our plan, adjusted for the catalog extension (add tasks for: catalog data and deterministic generator, city/preset endpoints, selection UI with list and map click, selection-limit validation). T01 = this task, mark In progress.
- "Current state" and "Next up" sections. Include a changelog table.

docs/DECISIONS.md
- ADR-style entries (ID, date, decision, reason, alternatives, consequence) for: no database/JSON files, backend-only engine, integer rounding, SVG without libraries, folder names, currency, catalog scope extension, no custom map points, Phase A before Phase B, docs not merged.
- An "Assumptions to confirm" section for anything you inferred.

docs/TASK_TEMPLATE.md
- A reusable fill-in prompt for every future Claude Code session: Task ID and objective; which docs to read; dependencies; files allowed to create/modify; files forbidden to touch; implementation expectations; acceptance criteria; test commands to run; "ask before assuming" clause; closing checklist (update PROGRESS.md, folder README, AI_PROMPTS.md). Include one filled-in example for the engine task.

docs/interview/IMPLEMENTATION_PLAN.md
- The 3-5 step plan with a checkpoint and verification method per step, exactly as the student guide requires, plus an empty "Changes from plan" table.
docs/interview/AI_PROMPTS.md
- Template for logging prompts: date, task, prompt, what was wrong or missing, refined prompt, result. Add T01 as the first entry using this very prompt.
docs/interview/DESIGN_SUMMARY.md
- Skeleton: architecture decisions, AI influence, trade-offs, deferred items, each with prompts for me to fill in.
docs/interview/TEST_EVIDENCE.md
- Skeleton: test plan, commands run, output samples, screenshots list, edge-case table linked to AC IDs.

verification/README.md
- What lives here, that it is never read by app code, how expected results are produced independently (spreadsheet) and recorded (EXPECTED_RESULTS.md, to be filled in the data task).

Folder READMEs (purpose, contents, responsibilities, dependencies, naming conventions, what belongs / does not belong):
Backend/, Backend/app/, Backend/app/api/, Backend/app/domain/, Backend/app/data/, Backend/app/data/cities/, Backend/scripts/, Backend/tests/ (and unit/, scenario/, api/, fixtures/), Frontend/ (leave to the Vite scaffold task: do NOT create files inside Frontend/ yet), docs/, docs/source/, docs/interview/. Create the missing folders only if needed for these READMEs; do not create any .py/.ts files.

## Consistency check (do this last)
- Every endpoint, field name and status value must be spelled identically across API_SPECIFICATION, DATABASE_DESIGN, ARCHITECTURE, TESTING and TASK_TEMPLATE. List any mismatch you fixed.
- Every acceptance criterion in PROJECT_OVERVIEW must appear in the TESTING traceability table.
- Every file path mentioned must exist or be marked "(planned)".
- Confirm no application code was written and no files outside docs/, verification/, and the folder READMEs were modified.

## Finish
Report: files created, assumptions you added to DECISIONS.md that I must review, and any open questions. Do not commit. Show me `git status` output.
````

---

## Entry 2: T01b Follow-up fixes to T01
| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T01b: Follow-up fixes to T01 (docs only) |
| Prompt | Verbatim below |
| What was wrong or missing | The 12 core rules were missing from the first prompt, so `CRITICAL_RULES.md` was built from `CLAUDE.md` alone. The T06 file list named `Backend/app/data/small_scenarios.py` against `Backend/CLAUDE.md`. `Backend/CLAUDE.md` still had the old error shape |
| Refined prompt | The follow-up below: precise per-file changes, with "say which rules you merged" and a final report |
| Result | `CRITICAL_RULES.md` restructured into 12 core rules plus 15 project rules; small scenarios moved to `Backend/tests/fixtures/small_scenarios.py` (D-12); `Backend/CLAUDE.md` error shape fixed; this log updated; A-02, A-03, A-04, A-09, A-12 marked accepted |

**Prompt (verbatim):**
````text
Follow-up fixes to T01. Docs only, no application code. Do not commit.

1. docs/CRITICAL_RULES.md: restructure it.
   Part 1, "Core rules (from the original project brief)": these 12, numbered 1-12, wording unchanged, each with
   "why it exists" and "how a reviewer checks it":
   1. Never start coding without understanding the existing architecture.
   2. Never invent requirements, APIs, functions or database fields.
   3. Never modify unrelated files.
   4. Never duplicate existing functionality.
   5. Never introduce unnecessary dependencies.
   6. Follow consistent coding standards.
   7. Keep business logic separate from API routes and UI components.
   8. Write appropriate tests for every module.
   9. Update relevant folder README files and documentation.
   10. Never claim tests passed unless they were actually executed.
   11. Preserve existing functionality when making changes.
   12. Treat project documentation and API contracts as the source of truth.
   Part 2, "Project-specific rules": keep the existing 20 rules, but remove any that merely restate one of the 12
   (merge the "how to check" detail into the matching core rule instead) and renumber as P1, P2, ...
   Say in your summary which rules you merged.

2. A-08: move the small tie/edge-case scenarios to Backend/tests/fixtures/small_scenarios.py (planned).
   Update every doc that mentions Backend/app/data/small_scenarios.py (docs, folder READMEs, PROGRESS.md T06 file list,
   Backend/CLAUDE.md), and delete the stale mention.

3. Backend/CLAUDE.md: change the error shape from {field, message} to {field, code, message} to match D-11 and
   docs/API_SPECIFICATION.md. Change nothing else in that file.

4. Spelling: confirm `weighted_average_display` (not weighted_avg_display) is the only spelling in docs/, all CLAUDE.md
   files and docs/interview/. Fix any leftover and list what you changed.

5. docs/interview/AI_PROMPTS.md: replace the abridged T01 prompt with the full verbatim text of the prompt I gave you
   for T01 (the one starting "Task T01: Documentation set"). Add this follow-up as entry T01b, verbatim, with the reason
   ("12 core rules were missing from the first prompt").

6. docs/DECISIONS.md: mark A-02, A-03, A-04, A-09 and A-12 as "Accepted by user"; record A-08 as decision D-xx
   (small scenarios live in tests/fixtures).

Finish with: files changed, and the output of `git status` and `git diff --stat`. Do not run git commit.
````
Reason for T01b: the 12 core rules were missing from the first prompt.

---

## Entry 3: T02 Demo trip design
| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T02: Design the Demo trip on paper and prove the story conditions (no code, no data files) |
| Prompt | Verbatim below |
| What was wrong or missing | Nothing blocking. The prompt asked for a 1000 x 600 map while the docs' illustrative example uses 1000 x 700 (the Demo city uses 600). The first search result (offsets for hotel/place) passed every condition but made N1 weak: the cheaper hotel also had the lower total, so a buggy "rank by rounded average, then cost" would give the same order. The assistant replaced it with a candidate where the pricier hotel (H_CIVIL) has the lower total than H_RIVERBRZ at the same displayed 62.9 |
| Refined prompt | Checkpoint A approval ("approved"), then Checkpoint B approval ("approve") after the proof tables. No re-prompt was needed. The assistant stated the method honestly: base table + offsets found by a throwaway script search, no per-cell overrides |
| Result | `verification/DEMO_DESIGN_NOTES.md`: Surmapur, 15 places (I = 40), 10 hotels, budget 30,000, 25 positions, 10x15 matrix, per-hotel results (6 affordable, H_GARDEN recommended, H_GHANTA lowest total but over budget), C1-C6 and N1-N3 all PASS, budget what-if (36,500 vs 36,499) and importance what-if (MUSEUM 3 -> 1 flips H_GARDEN to H_STEPWELL). T02 marked Done in PROGRESS.md |

**Prompt (verbatim):**
````text
Task T02: Design the Demo trip on paper. NO application code, NO data files in this task.

Read first: docs/source/PROBLEM_STATEMENT.md, docs/DATABASE_DESIGN.md, docs/API_SPECIFICATION.md,
docs/PROJECT_OVERVIEW.md (story-condition checklist and AC list), docs/TESTING.md, docs/DECISIONS.md.
Follow the field names, ID rules and ranges in those docs exactly.

## Goal
Design the fictional "Demo trip" (exactly 10 hotels, 15 places) and PROVE with arithmetic that it satisfies every
story condition BEFORE any file is written. I will review the proof, and only then will T03 freeze it into JSON.

## Content to design

1. City: a memorable fictional name and a 2-line concept; 4-6 districts (names + one line each).
2. Places (15): ID, memorable display name, type (attraction | food), district, importance 1-5.
   - at least 3 attractions and 3 food stops; at least 3 distinct importance values (use all of 1-5 if it fits)
   - must feel like the problem statement's wishlist: landmarks, a museum, a night market, a riverside walk, and several signature-food places
   - IDs match [A-Z][A-Z0-9_-]{0,15}, unique across hotels AND places
3. Hotels (10): ID, memorable name, district, complete-stay cost in whole rupees (₹, a realistic multi-night total, range 1-1,000,000), and a one-line tag (e.g. "beside the famous clock").
4. Initial budget (whole ₹).
5. Map positions for all 25 markers on a 1000 x 600 canvas (x, y integers). Presentation only: spread them so labels do not overlap and districts look like clusters. State explicitly that positions were chosen AFTER, and independent of, the travel times.
6. The 10x15 round-trip matrix (whole minutes, 1-600, complete hotel-to-place-to-hotel time). Not derived from map positions. Design method: give each hotel a "base" per district plus hand-chosen adjustments, so numbers look plausible (a hotel in a district is quick to places in that district, slow to far ones). Show it as a table.

## Story conditions to satisfy (prove each)
- C1: 4-7 hotels are affordable at the initial budget (stay_cost <= budget).
- C2: the hotel with the UNIQUE lowest weighted total is over budget.
- C3: the recommended affordable hotel (rank 1) is NOT the cheapest affordable hotel.
- C4: at least one affordable hotel has every round trip <= 90 minutes, and another affordable hotel has at least one round trip > 90.
- C5: raising the budget to exactly the stay cost of the most accessible hotel makes it the recommendation; at cost - 1 it is still over budget and not recommended.
- C6: one named place whose importance, changed to a value within 1-5, changes the recommended affordable hotel at the initial budget. Give the place, old value, new value, old winner, new winner.
Also design in, if possible without breaking the above (these make test evidence richer):
- N1: two affordable hotels whose displayed averages are equal at one decimal but whose exact totals differ (proves ranking uses exact totals, not rounded averages).
- N2: at least one hotel that is over budget by a small amount (e.g. under ₹1,000) and one by a large amount.
- N3: no two hotels share the same weighted total in the Demo trip (tie-breaks are tested with small separate scenarios, not here), unless it is intentional and documented.

## Method (follow this order, stop at each checkpoint)

Step 0: List ambiguities or doubts. Ask me only what is genuinely mine to decide (for example city theme preference).
         If I say nothing, choose a theme yourself and tell me which.
Checkpoint A: Show me ONLY items 1-5 (city, places, hotels, budget, positions) as tables. Wait for my approval.
Step 1: Design the matrix (item 6). Use a throwaway Python script outside the repo (your scratchpad or the system temp folder,
        NOT inside Project/) for arithmetic and for searching for numbers that satisfy the conditions. Do not save it in the repo.
Step 2: Produce the PROOF as markdown tables I can recheck by hand:
   a. Per place: ID, name, type, importance.
   b. The full 10x15 matrix.
   c. Per hotel: stay cost, affordable (yes/no), importance_total, weighted_travel_total, weighted average at one decimal
      (using floor((20*T + I) / (2*I)) / 10, integer math only), longest round trip, remaining budget or shortfall, rank (affordable only).
   d. For ONE hotel (the recommended one), show the complete 15-term contribution sum written out so I can verify it by hand.
   e. Condition checklist C1-C6 and N1-N3, each with PASS/FAIL and the numbers that prove it.
   f. What-if tables: (i) budget raised to the best hotel's cost vs cost - 1: new affordable set and ranks;
      (ii) importance change: new totals and ranks for all affordable hotels.
Checkpoint B: Wait for my approval. If any condition fails, fix the data and re-prove; do not weaken a condition.

## After my approval only
Write exactly one file: verification/DEMO_DESIGN_NOTES.md containing the approved tables (city, places, hotels, budget, positions,
matrix, per-hotel results, condition proofs, what-if tables) and the design method. Update docs/PROGRESS.md (T02 -> Done) and
append this prompt and any refinement to docs/interview/AI_PROMPTS.md. Do NOT create JSON, Python or TypeScript files; T03 does that.
Do not commit; show me git status.
````

---

## Entry 4: T04 Backend skeleton, models, rounding
| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T04: runnable FastAPI app with `GET /api/health`, domain models, integer rounding with tests (no validation or engine) |
| Prompt | Summarised below (the full text is in the T04 task message) |
| What was wrong or missing | The prompt's `ComparisonResult` field list omitted `default_inspected_hotel_id`, which `API_SPECIFICATION.md` requires (and INVALID must clear). The "no `/`" static check would also match `//` and slashes in docstrings. Raw vs validated modelling was left to the assistant. `CODING_STANDARDS.md` listed ruff rules without `N,SIM` |
| Refined prompt | Step 0/1 plan reviewed and approved with "approved": include `default_inspected_hotel_id`, `pip install -e ".[dev]"`, add `tests/unit/test_models.py`, raw (`Any`) vs validated (strict) model split (D-13) |
| Result | Tests were written first and failed on import errors; then 32 pass in about 1.4 s, `ruff check` and `ruff format --check` clean; live `GET /api/health` returned `{"status":"ok"}`. Decisions D-13, D-14 |

**Prompt (summary):**
````text
Task T04: Backend skeleton, domain models, rounding. NO validation or engine logic (T05, T06).
Python 3.10 (no tomllib/StrEnum/Self). Files: pyproject.toml (fastapi, uvicorn; dev: pytest, httpx, ruff, openpyxl;
ruff line 100, rules E,F,I,B,UP,N,SIM; pytest testpaths/pythonpath), app/main.py (create_app, CORS for :5173 on
localhost and 127.0.0.1), app/api/routes.py (health only), domain/models.py (frozen dataclasses, Status/PlaceType enums,
raw vs validated input, result models exactly as the API spec, INVALID factory clearing all derived fields),
domain/rounding.py (rounded_tenths = (20*T+I)//(2*I), format_average, ValueError on I<=0 or negative; no float/round/Decimal),
tests first: spec example 140/5 -> "28.0", hand-computed half-up boundaries, repeating decimals, maximum total,
Fraction cross-check for I in 1..75 and T in 0..2000, invalid inputs, static source check; health test.
Method: Step 0 ambiguities, Step 1 plan and wait for approval, Step 2 failing tests shown, Step 3 implement and paste real
pytest/ruff output, Step 4 start the server once and call /api/health, Step 5 docs, git status/diff --stat, no commit.
````

## Entry 5: T05 Validation

| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T05: `validate` / `validate_scenario` in `domain/validation.py` plus unit tests; domain code only |
| Prompt | Summarised below |
| What was wrong or missing | The prompt asked for codes and paths the API spec lacked (hotel/place ID, name and type paths) and for "missing/extra hotel row" tests that cannot occur because each `RawHotel` carries its own row. D-13 specified a tuple result; the prompt wanted an unmistakable result type. The first test run also exposed an unhashable place type crash in the validator, and two test-helper bugs |
| Refined prompt | After Step 0/1: index-form paths accepted (and documented in the API spec), ID errors must not hide other errors on the same record, drop the hotel-row tests (D-18), result type `ValidationOutcome` (D-17), read `surmapur.json` directly in the sanity test |
| Result | Tests first (import failure shown), then 116 validation tests pass in about 0.2 s; full suite 169 pass; ruff clean. Decisions D-17, D-18 |

**Prompt (summary):**
````text
Task T05: Validation. Domain code and unit tests only. validate(raw) -> list[ValidationError] plus validated models,
so the whole scenario is checked before any ranking; never a partial result. Rules: hotel 2-10 / place 3-15 counts; IDs by
re.fullmatch, str, ASCII, unique across hotels and places; names non-blank str; place type attraction|food; numbers must be
real ints (reject bool, float, str, None) within ranges; round-trip rows exactly match place IDs; one importance per place;
structural problems are errors, the validator never raises. Collect all errors in a stable order. Tests first (parametrised
per rule, garbage inputs, INVALID result cleared, Demo trip sanity, immutability). Method: Step 0 ambiguities, Step 1 table
and wait, Step 2 failing tests, Step 3 implement and paste real output, Step 4 docs, git status/diff --stat, no commit.
````

---

## Entry 5: T06 Engine and ranking
| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T06: pure `compare(scenario)` returning contributions, totals, display averages, affordability, ranks, recommendation and `NO_AFFORDABLE_HOTEL`; unit tests only |
| Prompt | Summarised below (the full text is in the T06 task message) |
| What was wrong or missing | The task text named `Backend/app/data/small_scenarios.py`, against D-12. It did not name the entry point. The "no `/`" check needed an AST rule so docstrings do not trip it. Output order was specified only in the API spec (A-06) |
| Refined prompt | Step 0/1 plan reviewed and approved with "approved": entry point `compare`, hand-calculated scenarios (CLOCK, GRID, FINE, FLIP, GAPS and four tie cases), AST-based static test |
| Result | Tests written first and failed on `ImportError: cannot import name 'compare'`; then 21 pass in 0.07 s; `ruff check` and `ruff format --check` clean. Decision D-15 |

**Prompt (summary):**
```text
Task T06: Engine and ranking. Domain code and unit tests only. A pure function takes an already validated Scenario and returns a
ComparisonResult. Integers only (no float, no round(), no /). Affordable iff stay_cost <= budget. Sort affordable hotels by
(weighted_total, stay_cost, hotel_id); ranks 1..n; rank 1 is recommended. Over-budget hotels keep shortfall, rank None, label
OVER_BUDGET. No affordable hotel -> NO_AFFORDABLE_HOTEL. Output order and field semantics follow docs/API_SPECIFICATION.md.
Tests first with hand-calculated literals (CLOCK/MARKET example, 3x3 arithmetic, exact ranking despite equal display averages,
budget equality and +/-1, budget-only vs importance change, ties by cost then ASCII ID, input-order independence, no mutation,
static source checks). Do not touch models.py, rounding.py, validation.py; do not import the validator or read verification/.
Method: Step 0/1 plan and wait, Step 2 failing tests, Step 3 implement and paste real output, Step 4 docs, git status. No commit.
```


| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T07: Demo story tests. Tests only; engine, validation, models, data, fixtures and spreadsheet untouched |
| Prompt | Summarised below |
| What was wrong or missing | `verification/EXPECTED_RESULTS.md` is empty, so N2/N3 were taken from `DEMO_DESIGN_NOTES.md` section 8. `TESTING.md` named the tests `s1..s6`; the task used C1..C6, so the traceability rows were renamed. The Demo trip has no ties, so tie-break mutations cannot be caught here |
| Refined prompt | Step 1 test list mapped to AC IDs reviewed and approved with "approve" |
| Result | 35 scenario tests pass in 0.13 s; mutation check: reordered sort key caught by 14 tests, `<` affordability by 3, ranking by rounded average by 6; dropping the cost or ID tie-break was not caught (expected, see N3) |

**Prompt (summary):**
```text
Task T07: Demo story tests. Tests only. Prove the real engine on the real frozen Demo trip reproduces tests/fixtures/expected_demo.py
(per-hotel totals, averages, affordability, remaining/shortfall, rank, longest trip, rank order, recommendation), recompute contributions
independently from the JSON, one named test per story condition C1-C6 and N1-N3 computed from engine output, what-if scenarios,
budget-only vs importance change, engine-level reset, boundary equality and minus one, budget 0, and a static independence guard.
Method: Step 1 plan and wait; Step 2 run; Step 3 mutation check on a scratch copy (tie-break order, < vs <=, rank by rounded average);
Step 4 full suite, docs, git status. If engine and fixtures disagree, stop and report. No commit.
```

## Entry 6: T08 API core
| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T08: `GET /api/cities/{id}`, `GET /api/cities/{id}/presets/demo`, `POST /api/compare`; loader, `domain/compare.py`, schemas, API tests, real sample responses |
| Prompt | Summarised below |
| What was wrong or missing | The spec gave no field path for unknown IDs, no 404 text for a city without a preset, and its prose says `FIELD_TYPE` is reported on `hotel_ids` while the validator reports `hotels`. Step 0 raised six points; all were approved as proposed (D-19). The Surmapur catalog has only 10 hotels, so "11 hotels" is built from a duplicate ID |
| Refined prompt | Step 1 endpoint table and module responsibilities approved with "approved" |
| Result | Tests written first; the first run failed at collection (`ModuleNotFoundError: No module named 'app.data.loader'`). I did not capture a per-test failing list. After implementing, 65 API tests pass; full suite 267 passed; ruff clean after fixing B008 and UP033 |

**Prompt (summary):**
```text
Task T08: API core. Wire validation and engine behind HTTP, backend only. Endpoints exactly as docs/API_SPECIFICATION.md. Thin routes;
data/loader.py is the only JSON reader (cached, injectable dependency); domain/compare.py is pure orchestration raw request ->
validate_scenario -> engine. Request fields reach the validator unchanged (Any, no pydantic coercion). Unknown IDs -> INVALID, never 500.
Duplicates reach the validator. INVALID / NO_AFFORDABLE_HOTEL are HTTP 200. Tests first: demo vs fixtures, key sets, budget boundary,
what-ifs, INVALID matrix (budget, importance, selection), overridden catalogs (missing/extra key, shared ID), malformed body, 404, CORS.
Save real responses as samples for T09. Method: Step 0 questions, Step 1 table + wait, tests first, implement, run, live calls, docs. No commit.
```

## Entry 7: T09 Frontend foundation
| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T09: typed contracts, fetch client, `useComparator` + context, currency and wire-value helpers, layout shell with stubs, temporary DevPanel, Vitest setup |
| Prompt | Summarised below |
| What was wrong or missing | The brief said the default inspected hotel is "the first hotel in the response" when nothing is recommended; the API provides `default_inspected_hotel_id` (lowest hotel ID) and the two differ. The user chose the API field (D-20). The brief and `CLAUDE.md` disagreed on `Intl` and on `Name/Name.tsx` vs `index.tsx`; the brief won and the docs were corrected (D-22, D-24). The brief did not say what happens to data while a recompute is in flight; resolved with `isStale` (D-25) |
| Refined prompt | Step 0/1: table of types, hook state/actions, stub approach, test list; five answers from the user, one addition (`isStale` plus a hook test) |
| Result | Tests written first; the first run failed with 6 failed files, "Failed to resolve import" for the missing modules (no individual test ran). After implementing: 55 tests pass, lint, typecheck, format check and build clean; proxy checked with the real backend. The first Prettier check flagged `CLAUDE.md`; fixed by excluding Markdown, not by reformatting docs |

**Prompt (summary):**
```text
Task T09: Frontend foundation. Contracts, API client, central state hook, currency helper, layout shell with stub components. No real UI
features (T10-T13). contracts.ts mirrors the API spec; RawValue for loose request fields; no any. formatRupees by hand (no Intl);
toWireValue forwards raw input and never decides validity. fetch client (no axios): ApiError, AbortError, VITE_API_BASE. useComparator is
the only state: loadDemo/setBudgetText/setImportanceText/inspectHotel/reset, request sequence numbers + AbortController, stale responses
ignored, INVALID clears derived data. Context provider. CSS-grid shell with tokens, six stubs + temporary DevPanel. Tests first (currency,
wireValue, client with real samples, hook incl. stale-response race, App smoke). Method: Step 0/1 table and wait, install, failing tests,
implement, run npm test/lint/typecheck/format:check/build, smoke test with both servers, docs. Do not touch Backend/. No commit.
```

## Entry 8: T10 Controls + StatusBanner
| Field | Content |
|---|---|
| Date | 2026-11-02 |
| Task | T10: `Controls` (Load, Reset, budget text input, importance editor) and `StatusBanner` (all states) |
| Prompt | Summarised below |
| What was wrong or missing | The brief did not foresee that replacing the stubs breaks `App.test.tsx` (stub test IDs, and two "Load" buttons with DevPanel). User chose: keep the stub test IDs on the new roots and change only the one button query (D-27). The brief's test-file location (`src/App.test.tsx`) was actually `src/__tests__/App.test.tsx` |
| Refined prompt | Step 0/1: design with elements, states and a 14-item test list; user answered two questions (test IDs, stale display) |
| Result | Tests first: 29 of 30 failed against the stubs (the one pass was vacuous). After implementing: one test was too strict about the "✕" symbol in the accessible description and was corrected. Final: 85 tests pass, lint, typecheck, format check and build clean |

**Prompt (summary):**
```text
Task T10: Controls + StatusBanner, editing only those two component folders. Data only from useComparatorContext(); no computation.
Controls: "Load Demo trip" (disabled while loading), plain text budget input (type=text, inputMode=numeric) with the backend-applied budget
via formatRupees, importance editor (one row per selected place: name, text+symbol type chip, text input, "original: N"), Reset (disabled
before load), field-level aria-invalid/aria-describedby for "budget" and "importances.<ID>", labels on every input, fieldset+legend.
StatusBanner: idle / loading / Updating… (aria-busy) / OK with recommended name + remaining budget / NO_AFFORDABLE_HOTEL / INVALID
(role=alert, every error listed, no previous result) / service error. Tests with real sample JSON and a mocked client. Method: Step 0
questions, Step 1 design and wait, failing tests first, implement, run test/lint/typecheck/format:check/build, run the app, update docs.
```

### T11: HotelRanking
| Field | Content |
|---|---|
| Prompt | Summarised below |
| What was wrong or missing | The brief left open the bar scale, the loading-with-no-result state and how INVALID (non-null result, empty hotels) differs from a request error. Claude proposed defaults in Step 1 (shared scale, extra "Loading…" line, both invalid cases share one message); user approved |
| Refined prompt | Step 0/1: element tree, states and a test list; two open choices answered "approved" |
| Result | Tests first: 17 of 17 failed against the stub. After implementing: 102 tests pass, lint, typecheck, format check and build clean |

**Prompt (summary):**
```text
Task T11: HotelRanking, editing only components/HotelRanking/. One card per hotel in the exact API order (no sorting): rank "#n" or "–"+Unranked,
name+ID, price via formatRupees, status "★ Recommended" / "✓ Within budget" / "✕ Over budget", money line ("₹X left in budget" / "Over budget by ₹X"),
weighted total, average, longest trip, CSS-only price bar vs a budget marker with a text equivalent, inspected card marked (aria-current + tag),
click/Enter/Space calls inspectHotel. States: idle, INVALID/error, stale (aria-busy, dimmed), NO_AFFORDABLE_HOTEL (no star, no ranks).
Tests use the real sample JSON; a shuffled list proves no sorting. Same Step 0-6 method as T10.
```

### T12: CityMap
| Field | Content |
|---|---|
| Prompt | Summarised below |
| What was wrong or missing | The brief gave no dev port and asked for right/left label placement, which would let a long label (`CLOCK`) cover a neighbouring marker. Claude asked about the port, proposed a greedy fallback (below, above, other side) and reusing the Controls test helper; user answered "approve" |
| Refined prompt | Step 0/1: element tree, states, label-placement approach and a 15-item test list |
| Result | Tests first: 18 of 19 failed against the stub. After implementing: 126 tests pass, lint, typecheck, format check and build clean |

**Prompt (summary):**
```text
Task T12: CityMap, editing only components/CityMap/. Schematic SVG from city.map (viewBox) with the 25 selected markers: square+H hotels, circle
attractions, diamond food, legend, name labels with a halo. ★ on the recommended hotel and ✕ on over-budget hotels from result labels; thick ring and bold
label for the inspected hotel. Only the inspected hotel gets 15 dashed links labelled "<minutes> min · <contribution>" straight from the API, with the caption
"Comparison links, not routes. Line length is not travel time." No links when result is null; empty state before load. Hotel markers call inspectHotel on
click/Enter/Space; place markers do not. role=img svg with title/desc, aria-busy when stale. No coordinate-based calculation. Same Step 0-6 method as T10.
```

### T13: ExplanationPanel + TravelMatrixTable
| Field | Content |
|---|---|
| Prompt | Summarised below |
| What was wrong or missing | The brief had no dev port and asked for a count of affordable flags, a subtraction for the "why not" line and a bar-width maximum, which brush against the no-calculation rule. Claude asked about both before building and logged them as D-32 |
| Refined prompt | Step 0/1: wording of every reason sentence, element tree for both components, a 27-test list; approved before any code |
| Result | Tests first: 27 of 27 failed against the stubs. After implementing: 153 tests pass, lint, typecheck, format check and build clean |

**Prompt (summary):**
```text
Task T13: ExplanationPanel + TravelMatrixTable, editing only their two folders. Panel: header (name, ID, symbol+text status), plain-language reason built
only from API values (RECOMMENDED, RANKED with a "why not #r-1" line for differing totals / equal totals / equal cost, OVER_BUDGET, NO_AFFORDABLE_HOTEL),
per-place calculation table "3 x 40 = 120" with footer total and average line, CSS contribution bars with printed values, empty/invalid/stale states.
Table: semantic <table> with caption, scope headers, scrollable focusable region with sticky first column, importance row, status column from the API
label, inspected row marked, hotel button calls inspectHotel, times stay visible when INVALID. Same Step 0-6 method as T10.
```

### T14: Integration and the Phase A checkpoint
| Field | Content |
|---|---|
| Prompt | Summarised below |
| What was wrong or missing | Three things the brief assumed were not true: `verification/EXPECTED_RESULTS.md` was empty (values came from `expected_demo.py`, D-37); the repo had no `development` or `feature/T14-integration` branch when work started; `flow_exact_budget_hotel` would have duplicated `flow_budget_at_best_cost`, so the case was changed to a mid-ranked hotel (D-34). A hash check later showed two more duplicate invalid-budget samples, which were deleted |
| Refined prompt | Step 0: baseline of all checks before any change, plus open questions (Playwright deferred to T17, branches, one-line `CODING_STANDARDS.md` fix). Step 1: consolidation table and integration-test outline approved before code. Step 2: test written first, 23 of 23 failed (the DevPanel's second Load button), then cleanup. Step 3: full verification and `Backend/app` diff. Steps 4-5: smoke test, evidence, commands and acceptance table, no git commands run |
| Result | 180 Vitest tests (16 files), 267 pytest, lint, typecheck, format and build clean. A mutation check (`HotelRanking` sorting by cost) failed 7 integration tests and was reverted |

**Prompt (summary):**
```text
Task T14: Integration and the Phase A checkpoint; no new features. Run the whole suite first and report. Remove DevPanel and the *-stub test IDs; consolidate
duplicated helpers (hotelLabels.ts, shared renderWithComparator) and show a table; capture REAL flow samples from the running backend and compare them with
expected_demo.py; write src/__tests__/integration.workflow.test.tsx (real App and provider, fake client replying from samples) for steps a-i with an
out-of-order sample; accessibility pass (one h1, main wraps the workspace, one live region, focus, contrast); layout check at 1440/1280/1024/900 and stacked
below; vite preview proxy; finalise TESTING.md checklist and traceability, COMMANDS.md and READMEs; do not touch Backend/app, data, fixtures or verification;
do not commit, merge or tag; print the commands and a PROVEN / NOT YET acceptance table. Ask before adding Playwright.
```

## T15: Catalog data, generator, cities list, selection limits (backend only)

| Field | Detail |
|---|---|
| Goal | Grow each city to 30 hotels / 50 places without changing one Demo value; add a second city; list endpoint; prove selection limits |
| Refined prompt | Step 0/1 first: ambiguities (a missing test file, a spec field, clamp vs assert) and design tables for approval, then tests first with the real failing run, then generator and endpoint. Approval answers: theme Shikharpur, Demo rows keep hand-authored offsets, assert not clamp, pin a second hash, add `has_demo_preset` to the list spec first, four renames |
| Result | 344 pytest (77 new), ruff clean, 180 Vitest unchanged; regeneration is byte-identical; Demo block hash unchanged |

**Prompt (summary):**
```text
Task T15: catalog data (2 cities, 30 hotels and 50 places each), deterministic generator, cities list endpoint, selection-limit verification. Backend only.
The Demo trip is frozen: compute its SHA-256 first and pin it in a test; new rows/columns are appended. Generator: base[district][district] + hotel offset +
place offset, integers only, no random/time/positions, idempotent bytes, T03 formatting. Positions at least 30 px apart. Tests first (freeze, catalog data,
generator, list API, selection API incl. every limit case, plus a hand-computed 3x4 check outside the engine). Show the plan and tables and wait for approval
before writing data. Do not touch Frontend or the engine; do not commit.
```

## T16: Selection UI
| Field | Value |
|---|---|
| Goal | Choose a city, pick up to 10 hotels and 15 places by list or map click, set importances and budget, see the same result views as the Demo trip |
| Refined prompt | Step 0 ambiguities and Step 1 design tables for approval, tests first with the real failing run, then implementation. Then two decisions when existing tests conflicted: fixture split instead of editing a test (D-43), a `budgetTouched` rule so Phase A behaviour stays (D-42), and a deliberate amendment of the live-region test (D-44) |
| Result | 251 Vitest, lint, typecheck, format and build clean, 344 pytest unchanged |

**Prompt (summary):**
```text
Task T16: selection UI, frontend only. City picker, city-scoped hotel/place pickers grouped by district with search and counters, map Inspect/Select modes
(80 markers in Select, labels only on hover/focus), compare gating with a readiness object, request sequencing kept. The Demo trip must stay exactly as it is
(25 markers, 15 links). Existing tests must pass unchanged; if one cannot, stop and say why. No new dependencies; backend and data untouched; do not commit.
```

### T19 / U1 — design tokens and app shell

```text
Redesign the front end into a Selection (Plan) screen and a Results screen with a light editorial look (orange accent, black pill buttons, large-radius cards, big map).
Do not change scoring, data or the API. Step U1 only: CSS design tokens (light + dark), faint background arcs, sticky top bar with theme toggle,
shared PillButton / Card / Chip. Old page must keep working under the new skin. Self-host one Inter variable font. No new npm dependencies; do not commit.
```

### T19 / U2 — view mode and persistence

```text
U2: add useViewMode (plan/results + drawer open) and persist city, budget, importances and selections to localStorage (guarded with try/catch).
Save choices only, never the API result; restore on mount through the existing compare path. Keep the scoring state hook unchanged in behaviour. Tests first; no new dependencies; do not commit.
```

### T19 / U3 — Selection (Plan) screen

```text
U3: build the Plan screen: Step 1 city + Load Demo + Reset, Step 2 searchable hotel/place chips with checkmarks (keep map Select mode), Step 3 budget + 1-5 segmented importance,
step indicator in the top bar, black "Compare hotels" pill with friendly inline validation instead of the old banner. Reuse the existing hook (no new state, no calculation).
Load Demo goes straight to Results. Keep existing tests green; tests first for the new screen; no new dependencies; do not commit.
```

### T19 / U4 — Results screen

```text
U4: build the Results screen. Read-only summary chips + Edit button, three stat cards (API values only), ranked cards (rank, big score, budget-fit bar, longest trip, "Why this score?" accordion with a stacked contribution bar and hover tooltips),
collapsible travel-time table, skeleton and empty states. No edit controls on this screen: delete Controls and Selection (Plan replaces them). No frontend arithmetic; no new dependencies; migrate the App-level tests to Plan -> Results; do not commit.
```

### T19 / U5 — Edit drawer

```text
U5: the Edit button on Results opens a slide-in drawer (bottom sheet on mobile) that reuses the Plan steps (no second copy of the controls). Values preserved; Esc closes; focus trapped and restored; page behind inert; "Update results" closes it and results re-render.
Keep one map on screen. Tests first (Drawer unit tests + an App-level drawer flow); migrate the integration tests' edit helper to the drawer; no new dependencies; do not commit.
```

### T19 / U6a — map viewport

```text
U6a: make the SVG map a large hero on Results (>=70vh) with the ranking as a floating glass panel (collapsible; stacked on mobile). Add pan/zoom as a viewBox camera in a MapViewport component:
drag with inertia, wheel zoom toward the cursor, pinch, double-click in / Shift+double-click and right-click out, arrow keys and +/-/0, floating buttons (zoom, fit all, reset, fullscreen), legend on the map, auto-fit when the selection changes.
Respect prefers-reduced-motion. Camera maths as pure functions with tests. No map library, no new dependencies; markers keep working; do not commit.
```

### T19 / U6b — marker effects and links

```text
U6b: on the Results map add hover (spring scale + tooltip card with name/score/price/trip; the matching ranked card lights up, and hovering a card pulses its marker), click on a hotel marker (ripple, fly-to, detail popup, select it and unfold "Why this score?"),
click on empty map (clear the inspection with a ripple), animated dashed links with line width by importance and minutes on each label. Reduced motion respected; keyboard focus behaves like hover. Share view state between map and cards without touching the comparison hook except letting inspectHotel accept null.
No clustering or radius rings. Tests first; no new dependencies; do not commit.
```

### T19 / U7 — polish and verification

```text
U7: micro-interactions: count-up of the first score (final value must be exactly the API string), FLIP re-order of ranked cards, staggered entrance, screen slide on mode switch, button press ripple. Accessibility: focus rings that meet 3:1, AA contrast for every token pair in both themes as a test, mobile top bar.
Respect reduced motion. Update docs and write a manual visual checklist, since screenshots cannot be taken here. No new dependencies; do not commit.
```

## Results screen bug fixes
Prompt: fix 3 bugs on Results (map vanishes when the travel table opens; ranking panel scrolls; white patch when dragging the map). Reproduce, find root cause, do not change scoring, data or the Selection screen. Outcome: grid-blowout (`minmax(0,1fr)`), panel moved to a grid column, infinite grid layer (D-55).
