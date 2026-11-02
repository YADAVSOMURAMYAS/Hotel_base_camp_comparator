# Backend/app/data/cities/

**Purpose:** One frozen JSON file per fictional city.

| Item | Detail |
|---|---|
| Contents | `<city_id>.json` *(none yet; the Demo city is added in T03, the second city in T15)* |
| Responsibilities | Source of truth for hotels, places, positions, travel-time matrix, Demo preset |
| Dependencies | None (read by `../` loader) |
| Naming | Lowercase `[a-z0-9_]+.json`, equal to `city_id` |
| Belongs | Frozen, committed data following [../../../../docs/DATABASE_DESIGN.md](../../../../docs/DATABASE_DESIGN.md) |
| Does not belong | Hand edits to generated cells without a log in `docs/DECISIONS.md`; expected results; user data |

Phase A: 10 hotels, 15 places. Phase B: 30 hotels, 50 places per city.
