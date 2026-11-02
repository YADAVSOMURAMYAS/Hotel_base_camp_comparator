# src/utils/

**Purpose:** formatting and input forwarding only.
- `currency.ts` `formatRupees(n)`: Indian grouping by string manipulation (no `Intl`). Throws on non-integers.
- `wireValue.ts` `toWireValue(text)`: trimmed empty -> `null`; plain integers/decimals -> number; anything else -> the original string. The backend decides validity.

**Does not belong here:** totals, ranks, averages, affordability.
