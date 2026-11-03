# Backend/tests/api/samples/

**Purpose:** Real API responses, saved from the FastAPI test client (not hand-written). Frontend task T09 uses them as mock data.

| File | Request |
|---|---|
| `cities_list.json` | `GET /api/cities` (T15) |
| `city_surmapur.json` | `GET /api/cities/surmapur` (30 hotels, 50 places since T15) |
| `preset_demo.json` | `GET /api/cities/surmapur/presets/demo` |
| `compare_ok.json` | `POST /api/compare` with the Demo trip (status `OK`) |
| `compare_no_affordable_hotel.json` | the Demo trip with `budget: 0` |
| `compare_invalid.json` | the Demo trip with `budget: -5` |

Regenerate by re-running those calls whenever the contract or the catalog changes. Nothing reads these files at runtime; tests do not depend on them.
