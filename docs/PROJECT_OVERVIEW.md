# Project Overview

> **Purpose:** Explain what the Hotel Base-Camp Comparator is, who uses it, and what "done" means.
> **Owner of:** scope (Required / Extension / Optional / Out of scope), user workflow, story conditions, and the acceptance-criteria IDs (AC-01…AC-25).
> **Read this when:** starting any task, writing tests or evidence (they cite AC IDs), or deciding whether something is in scope.

Original requirements: [source/PROBLEM_STATEMENT.md](source/PROBLEM_STATEMENT.md). Evaluation: [source/STUDENT_GUIDE.md](source/STUDENT_GUIDE.md).

## The problem in plain words
A friend group has a fixed wishlist of places in a city and one budget for the whole hotel stay. A cheap hotel may mean crossing the city all day; a hotel next to the top attraction may eat the budget. The tool compares each hotel's **complete-stay price** against its **known round-trip times** to every wishlist place, weighted by how much each place matters, then recommends the most accessible *affordable* hotel and explains why.

| The tool IS | The tool is NOT |
|---|---|
| A base-camp decision aid | An itinerary planner (no days, no ordering of places) |
| A comparison of price vs weighted travel time | A router (no roads, no routes; map lines are "comparison links") |
| Local, deterministic, explainable | A cost estimator (no admission, meal or transport costs) |
| Built on fictional, candidate-authored data | A connected app (no accounts, DB, live maps, external APIs) |

## Users
| User | Goal |
|---|---|
| Friend group member | Decide on a hotel; ask "what if we spend more?" and "what if the museum matters more?" |
| Interview evaluator | Check the Demo trip, the plan, prompts, tests and a 10-minute live change |

## User workflow
1. Click **Load Demo trip**: 10 hotels, 15 places, fixed budget and importances load in one action.
2. Read the ranked list. Rank 1 carries **★ Recommended**; over-budget hotels show **✕ Over budget by ₹X** with no rank.
3. Click any hotel to inspect it. Only that hotel's 15 comparison links are highlighted on the map, each with its round-trip minutes and weighted contribution. The explanation panel and time table follow.
4. Change the **budget**. Affordability, shortfalls, ranks and recommendation update; contributions do not.
5. Change one place's **importance** (1–5). Every contribution, total, average and rank updates.
6. Enter an invalid budget or importance (e.g. `-5`, `6`). A readable error appears and every derived value (ranks, recommendation, contributions, highlights) is cleared.
7. Lower the budget until nothing is affordable: `NO_AFFORDABLE_HOTEL`, shortfalls shown, no winner.
8. Click **Reset**: the Demo trip's budget, importances, recommendation and default inspected hotel return exactly.
9. *(Extension)* Pick another city, choose up to 10 hotels and 15 places from lists or by clicking existing markers.

### Worked example (from the problem statement, illustrative only)
`CLOCK` importance 3, `MARKET` importance 2, so `importance_total` = 5. A hotel with round trips of 20 and 40 minutes:

| Place | Importance | Minutes | Contribution |
|---|---|---|---|
| CLOCK | 3 | 20 | 60 |
| MARKET | 2 | 40 | 80 |
| **Total** | **5** | | **140** |

`weighted_travel_total` = 140 importance-minutes; average = 140 / 5 = **28.0** minutes. Integer form: `floor((20×140 + 5) / (2×5))` = `floor(2805 / 10)` = 280 tenths → `"28.0"`. A hotel is considered only if `stay_cost <= budget`.

## Features
| ID | Feature | Tag |
|---|---|---|
| F-01 | Fictional city, 10 hotels, 15 places, complete 10×15 matrix, loaded in one action (Demo trip) | Required |
| F-02 | Calculation: contribution, weighted total, one-decimal average, affordability, ranking, recommendation | Required |
| F-03 | Tie-breaks: stay cost, then hotel ID | Required |
| F-04 | `NO_AFFORDABLE_HOTEL` result; `INVALID` result with cleared derived fields | Required |
| F-05 | Full-scenario validation (counts, IDs, names, type, ranges, mapping) | Required |
| F-06 | Editable budget and per-place importance; Reset | Required |
| F-07 | Ranked hotel view with "Recommended" and "Over budget by ₹X" labels (text/symbol, not colour alone) | Required |
| F-08 | Schematic SVG map: 25 labelled markers, links only for the inspected hotel, time + contribution per link | Required |
| F-09 | Accessible hotel-by-place time table | Required |
| F-10 | Explanation panel: contribution table, totals, eligibility reason, contribution bars | Required |
| F-11 | Independent expected results (spreadsheet + test constants) | Required |
| F-12 | Catalog: 2+ cities, each 30 hotels and 50 places, deterministic generated matrix | Extension |
| F-13 | Select up to 10 hotels and 15 places by list or by clicking existing markers; selection-limit validation | Extension |
| F-14 | Budget carries over between trips; per-place `default_importance` | Extension |
| F-15 | Compact budget timeline (amounts at which the recommendation changes) | Optional |

## Out of scope
Accounts · database · live maps · geocoding · hotel booking · traffic · route finding · external APIs · general city editor · file importer · **user-added map points** · itinerary, day planning, admission/meal/transport costs · randomness or geometry in any calculation.

## Story conditions (Demo trip at its initial budget)
| ID | Condition | How verified |
|---|---|---|
| S1 | 4–7 hotels are affordable | `Backend/tests/scenario/test_demo_story.py` vs `verification/EXPECTED_RESULTS.md` |
| S2 | The unique lowest-`weighted_total` hotel is over budget | same test; proof in `verification/DEMO_DESIGN_NOTES.md` (planned) |
| S3 | Recommended hotel is not the cheapest affordable hotel | same test |
| S4 | One affordable hotel has every trip ≤ 90 min; another affordable hotel has a trip > 90 | same test (`longest_trip`) |
| S5 | Budget raised to exactly the best hotel's `stay_cost` makes it recommended; one ₹ less does not | same test + manual checklist |
| S6 | Changing one named place's importance within 1–5 changes the recommended affordable hotel | same test + manual checklist |

Additional Demo-trip data rules (AC-01): ≥3 attractions, ≥3 food stops, ≥3 distinct importance values.

## Acceptance criteria
Tag shows the problem-statement label. Tests and evidence are mapped in [TESTING.md](TESTING.md).

| ID | Criterion | Tag |
|---|---|---|
| AC-01 | Deterministic fictional Demo city loads in one action: exactly 10 hotels, 15 places, ≥3 attractions, ≥3 food, ≥3 importance values, complete 10×15 mapping; no external asset or service | Required |
| AC-02 | Story conditions S1–S6 are satisfied and documented | Required |
| AC-03 | Every hotel's expected weighted total, one-decimal average, affordability, shortfall/remaining budget and initial rank are recorded independently and reproduced by the app without reading the record | Required |
| AC-04 | All 25 markers are shown; only the inspected hotel's 15 links are highlighted, each with round-trip minutes and weighted contribution | Required |
| AC-05 | Complete-stay price vs budget, ranked results, and a clear reason for every unranked hotel are shown (text/symbol as well as colour) | Required |
| AC-06 | Raising the budget across the documented boundary shows the new recommendation | Required |
| AC-07 | Changing the chosen place's importance to the documented value shows a different affordable recommendation | Required |
| AC-08 | Reset restores data, budget, importances, recommendation and default inspected hotel exactly | Required |
| AC-09 | A hotel exactly on budget is affordable; one ₹ over is unranked | Required |
| AC-10 | An accessibility tie is resolved by lower stay cost | Required |
| AC-11 | A complete tie (total and cost) is resolved by hotel ID in ASCII order | Required |
| AC-12 | `NO_AFFORDABLE_HOTEL` shows shortfalls, no rank, no winner, no stale recommendation | Required |
| AC-13 | An invalid budget or importance is visibly rejected in the app | Required |
| AC-14 | Duplicate-ID scenario is rejected (repeatable test) | Required |
| AC-15 | Incomplete or unknown travel-time mapping is rejected (repeatable test) | Required |
| AC-16 | Contribution arithmetic is tested | Required |
| AC-17 | Round-half-up display of the average is tested | Required |
| AC-18 | Ranking uses the exact integer total even when rounded averages are equal (tested) | Required |
| AC-19 | Budget change recomputes affordability, shortfall, ranks, recommendation but not contributions; importance change recomputes everything (tested) | Required |
| AC-20 | `INVALID` clears ranks, recommendation, totals, contributions and highlights, in API and UI (tested) | Required |
| AC-21 | Inspecting a hotel changes only the explanation and highlighted links, never the result (tested) | Required |
| AC-22 | Every validation rule (counts, ID format, blank name, place type, budget/stay-cost/importance/minutes ranges) rejects bad input | Required |
| AC-23 | Process deliverables exist: 3–5 step plan with changes, prompt history, design summary, test evidence, live-change readiness | Required |
| AC-24 | Budget timeline shows recommendation change points under the same rules | Optional |
| AC-25 | Catalog (30 hotels / 50 places per city, 2+ cities) and selection by list or marker click with limits enforced | Extension |
