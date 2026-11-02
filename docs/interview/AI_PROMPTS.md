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
