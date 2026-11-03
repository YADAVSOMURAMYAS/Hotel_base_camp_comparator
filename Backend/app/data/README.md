# Backend/app/data/

**Purpose:** Load frozen city JSON files. No database.

| Item | Detail |
|---|---|
| Contents | `cities/` (JSON files), `loader.py` (`get_city`, `list_cities` (T15, every file in `cities/`, sorted by `city_id`), `UnknownCityError`, `get_catalog_source` dependency; cached, read-only; T08). Small test scenarios do not live here; they are in `../../tests/fixtures/small_scenarios.py` |
| Responsibilities | Read and return city data |
| Dependencies | Python stdlib |
| Naming | `<city_id>.json`, lowercase |
| Belongs | File reading |
| Does not belong | Business-rule validation, calculation, runtime writes |

Schema: [../../../docs/DATABASE_DESIGN.md](../../../docs/DATABASE_DESIGN.md).
