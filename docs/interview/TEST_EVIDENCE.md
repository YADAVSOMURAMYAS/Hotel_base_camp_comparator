# Test Evidence

> **Purpose:** Real, pasted proof of tests and edge cases.
> **Owner of:** test plan summary, commands run with output, screenshot list, edge-case table linked to AC IDs.
> **Read this when:** finishing any task (append output) and during T17. Never record results that were not run.

Strategy and AC → test mapping: [../TESTING.md](../TESTING.md). AC definitions: [../PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md).

## 1. Test plan summary
Backend pytest (unit, scenario, api) · Frontend Vitest + RTL · manual demo checklist · independent expected results in `verification/`.

## 2. Commands run
Append one block per run. Paste the real output.

```text
Date:
Task:
Command:
Output:
```

## 3. Screenshots
| # | Shot | File | AC |
|---|---|---|---|
| 1 | Initial Demo trip | | AC-01, 04, 05 |
| 2 | Inspected hotel | | AC-04, 21 |
| 3 | Budget what-if (exact boundary) | | AC-06 |
| 4 | Importance what-if | | AC-07 |
| 5 | Exactly on budget / ₹1 over | | AC-09 |
| 6 | Tie cases | | AC-10, 11 |
| 7 | NO_AFFORDABLE_HOTEL | | AC-12 |
| 8 | Invalid input | | AC-13, 20 |
| 9 | Reset | | AC-08 |

## 4. Edge-case table
| Edge case | AC | Test or evidence | Result (fill from real run) |
|---|---|---|---|
| Budget equals stay cost | AC-09 | | |
| Budget one ₹ below stay cost | AC-09 | | |
| Equal totals, different cost | AC-10 | | |
| Equal totals and cost, different ID | AC-11 | | |
| Equal displayed averages, different totals | AC-18 | | |
| `.x5` half-up boundary | AC-17 | | |
| No affordable hotel | AC-12 | | |
| Budget `-5`, `1000001`, `12.5`, empty, `"4500"`, `true` | AC-13, 22 | | |
| Importance `0`, `6`, `5.0`, `"3"` | AC-13, 22 | | |
| Duplicate ID (hotel vs place) | AC-14 | | |
| Missing / unknown mapping key | AC-15 | | |
| INVALID clears everything | AC-20 | | |
| Stale response ignored | (frontend) | | |
