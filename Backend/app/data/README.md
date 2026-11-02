# Backend/app/data/

**Purpose:** Load frozen city JSON files. No database.

| Item | Detail |
|---|---|
| Contents | `cities/` (JSON files), a loader *(planned, T03/T08)*. Small test scenarios do not live here; they are in `../../tests/fixtures/small_scenarios.py` *(planned)* |
| Responsibilities | Read and return city data |
| Dependencies | Python stdlib |
| Naming | `<city_id>.json`, lowercase |
| Belongs | File reading |
| Does not belong | Business-rule validation, calculation, runtime writes |

Schema: [../../../docs/DATABASE_DESIGN.md](../../../docs/DATABASE_DESIGN.md).
