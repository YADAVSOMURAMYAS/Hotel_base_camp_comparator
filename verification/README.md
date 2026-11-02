# verification/

**Purpose:** Independently computed expected results for the Demo trip.

| Item | Detail |
|---|---|
| Contents | `README.md` (this file); `EXPECTED_RESULTS.md` (empty until T03); later `expected_results.xlsx` (T03) and `DEMO_DESIGN_NOTES.md` (T02), all *(planned)* |
| Responsibility | Hold the answers the app is checked against: per hotel the weighted total, one-decimal average, affordability, shortfall or remaining budget, initial rank, plus the what-if outcomes |
| Dependencies | None. Nothing here imports app code |
| Naming | `UPPER_SNAKE.md` for write-ups; lowercase for spreadsheets |
| Belongs | Spreadsheet with formulas, the written results, the Demo trip design proof |
| Does not belong | Code, generated app data, anything the app reads |

## Rule
**App code never reads this folder** (`Backend/app/`, `Frontend/src/` must not reference it). Only tests may compare against it, via hand-typed constants in `Backend/tests/fixtures/expected_demo.py` *(planned, T03)*. Rule P10 in [../docs/CRITICAL_RULES.md](../docs/CRITICAL_RULES.md).

## How expected results are produced
1. In a spreadsheet, enter the Demo trip's costs, importances and 10×15 minutes.
2. Compute with formulas: contribution = importance × minutes; total = sum; average tenths = `FLOOR((20*T + I) / (2*I))`; affordable = cost ≤ budget; rank by total, then cost, then ID.
3. Type the results by hand into `EXPECTED_RESULTS.md` and `expected_demo.py`.
4. Confirm spreadsheet, typed constants and the T02 proof table agree before accepting T03.

Method details: [../docs/TESTING.md](../docs/TESTING.md).
