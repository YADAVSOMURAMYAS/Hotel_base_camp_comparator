# Backend/app/data/cities/

**Purpose:** One frozen JSON file per fictional city.

| Item | Detail |
|---|---|
| Contents | `surmapur.json` (owns the Demo trip) and `shikharpur.json` (no preset), both 30 hotels x 50 places. Generated once by `Backend/scripts/design_helper.py` (T15); design tables in `verification/CATALOG_DESIGN_NOTES.md` |
| Responsibilities | Source of truth for hotels, places, positions, travel-time matrix, Demo preset |
| Dependencies | None (read by `../` loader) |
| Naming | Lowercase `[a-z0-9_]+.json`, equal to `city_id` |
| Belongs | Frozen, committed data following [../../../../docs/DATABASE_DESIGN.md](../../../../docs/DATABASE_DESIGN.md) |
| Does not belong | Hand edits to generated cells without a log in `docs/DECISIONS.md`; expected results; user data |

Each city has 30 hotels and 50 places. The first 10 hotels and 15 places of Surmapur are the frozen Demo trip (pinned by `tests/unit/test_demo_freeze.py`); never edit them.
