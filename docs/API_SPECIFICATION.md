# API Specification

> **Purpose:** The HTTP/JSON contract between Frontend and Backend.
> **Owner of:** endpoints, request/response schemas, status values, error codes, per-status field rules, HTTP behaviour.
> **Read this when:** touching `Backend/app/api/`, `Frontend/src/api/`, `Frontend/src/types/contracts.ts`, or any test that asserts a response shape. Change this doc **first**; then update `contracts.ts` in the same commit.

Data files behind these endpoints: [DATABASE_DESIGN.md](DATABASE_DESIGN.md). Calculation rules: root `CLAUDE.md`.

## Conventions
| Topic | Rule |
|---|---|
| Base URL | `http://127.0.0.1:8000` (dev); Vite dev server `http://localhost:5173` is allowed by CORS |
| Format | JSON, UTF-8, `snake_case` keys |
| Numbers | Whole numbers only. Currency amounts are integer rupees (₹). No floats anywhere |
| Currency display | Backend returns integers. Frontend formats with hand-written Indian grouping (no `Intl`/`toLocaleString`), e.g. `₹1,25,000` |
| Averages | `weighted_average_display` is a string like `"28.0"` produced by the backend; the frontend never recomputes it |
| Calculation | Only the backend calculates (`Backend/app/domain/`) |
| Availability | Phase A (T08): health, city detail, demo preset, compare. Phase B (T15): city list, selection subsets. Timeline: Optional (T18) |

## Status values
`OK` · `NO_AFFORDABLE_HOTEL` · `INVALID`

## HTTP behaviour
| Situation | HTTP | Body |
|---|---|---|
| `OK`, `NO_AFFORDABLE_HOTEL`, `INVALID` comparison results | **200** | `ComparisonResult` with that `status` |
| Request body is not parseable JSON, or is not an object, or `city_id` is missing / not a string | 422 | FastAPI default `{"detail": …}` |
| Unknown `city_id` (path or body) or unknown preset | 404 | `{"detail": "Unknown city 'x'"}` |
| Server fault | 500 | `{"detail": "Internal server error"}` |

`INVALID` and `NO_AFFORDABLE_HOTEL` are **results, never HTTP errors**. All other body fields are typed loosely on the wire (`Any`); the domain validator judges them.

---

## GET /api/health
Response `200`:
```json
{ "status": "ok" }
```

## GET /api/cities  *(Phase B, T15)*
Response `200`:
```json
{ "cities": [ { "city_id": "example_city", "name": "Example City", "hotel_count": 30, "place_count": 50 } ] }
```

## GET /api/cities/{city_id}
Full catalog: everything the map, lists and time table need. Positions are presentation data only.

Response `200`:
| Field | Type | Notes |
|---|---|---|
| `city_id` | string | |
| `name` | string | |
| `map` | `{width:int, height:int}` | SVG viewBox size |
| `districts` | `[{id:string, name:string}]` | |
| `hotels` | `[{id, name, stay_cost:int, district_id, position:{x:int,y:int}}]` | `stay_cost` 1–1,000,000 |
| `places` | `[{id, name, type:"attraction"\|"food", default_importance:int, district_id, position:{x,y}}]` | `default_importance` 1–5 |
| `round_trip_minutes` | `{hotel_id: {place_id: int}}` | 1–600; complete matrix for the catalog |
| `has_demo_preset` | bool | true only for the city that owns the Demo trip |

Example (trimmed):
```json
{
  "city_id": "example_city", "name": "Example City",
  "map": { "width": 1000, "height": 700 },
  "districts": [ { "id": "OLD", "name": "Old Town" } ],
  "hotels": [ { "id": "H_RIVER", "name": "Riverside Inn", "stay_cost": 4200, "district_id": "OLD", "position": { "x": 210, "y": 340 } } ],
  "places": [ { "id": "CLOCK", "name": "Clock Tower", "type": "attraction", "default_importance": 3, "district_id": "OLD", "position": { "x": 480, "y": 120 } } ],
  "round_trip_minutes": { "H_RIVER": { "CLOCK": 20 } },
  "has_demo_preset": true
}
```
Errors: unknown city → 404.

## GET /api/cities/{city_id}/presets/demo
The required Demo trip. "Load" and "Reset" both use it.

| Field | Type |
|---|---|
| `city_id` | string |
| `hotel_ids` | string[] (10) |
| `place_ids` | string[] (15) |
| `importances` | `{place_id: int}` (1–5) |
| `budget` | int |

```json
{ "city_id": "example_city", "hotel_ids": ["H_RIVER","H_FORT","H_BAZAAR"], "place_ids": ["CLOCK","MARKET","DOSA"],
  "importances": { "CLOCK": 3, "MARKET": 2, "DOSA": 5 }, "budget": 4500 }
```
Errors: unknown city or city without a preset → 404. (Example shows 3/3 for brevity; the real preset is 10/15.)

## POST /api/compare
Request:
| Field | Wire type | Meaning |
|---|---|---|
| `city_id` | string | catalog to read hotels, places and minutes from |
| `hotel_ids` | array of string | selected hotels (engine: 2–10) |
| `place_ids` | array of string | selected places (engine: 3–15) |
| `importances` | object `{place_id: raw}` | one raw value per selected place; judged by the validator |
| `budget` | raw | whole rupees 0–1,000,000; judged by the validator |

"raw" means any JSON value (string, float, bool, null…). Wrong container types give `FIELD_TYPE` errors (`INVALID`, HTTP 200).

### ComparisonResult
| Field | Type | `OK` | `NO_AFFORDABLE_HOTEL` | `INVALID` |
|---|---|---|---|---|
| `status` | enum | `"OK"` | `"NO_AFFORDABLE_HOTEL"` | `"INVALID"` |
| `errors` | `[{field, code, message}]` | `[]` | `[]` | ≥1 entry |
| `importance_total` | int \| null | I | I | `null` |
| `budget` | int \| null | echoed | echoed | `null` |
| `recommended_hotel_id` | string \| null | rank-1 hotel | `null` | `null` |
| `default_inspected_hotel_id` | string \| null | = recommended | lowest hotel ID | `null` |
| `hotels` | `HotelResult[]` | all selected hotels | all selected hotels | `[]` |

`hotels` order (frontend never re-sorts): ranked hotels by rank 1..n, then over-budget hotels by `weighted_total`, `stay_cost`, `id` ascending.

### HotelResult
| Field | Type | Affordable | Over budget |
|---|---|---|---|
| `id`, `name` | string | ✔ | ✔ |
| `stay_cost` | int | ✔ | ✔ |
| `affordable` | bool | `true` | `false` |
| `rank` | int \| null | 1..n, no gaps | `null` |
| `remaining_budget` | int \| null | `budget - stay_cost` (≥0) | `null` |
| `shortfall` | int \| null | `null` | `stay_cost - budget` (>0) |
| `label` | enum | `RECOMMENDED` (rank 1) or `RANKED` | `OVER_BUDGET` |
| `weighted_total` | int | ✔ | ✔ (kept) |
| `weighted_average_display` | string | `"28.0"` | ✔ (kept) |
| `longest_trip` | int | max minutes | ✔ |
| `contributions` | `[{place_id, minutes, importance, contribution}]` | in `place_ids` order | ✔ (kept) |

`label` is a code; the frontend renders text ("★ Recommended", "✕ Over budget by ₹X" using `shortfall`). With `NO_AFFORDABLE_HOTEL` every hotel is `OVER_BUDGET`.

### Example: OK (budget 4500)
Illustrative scenario, not the Demo trip. `CLOCK`=3, `MARKET`=2, `DOSA`=5 → I = 10. Minutes: RIVER 20/40/30, FORT 10/25/20, BAZAAR 35/15/60.

Request:
```json
{ "city_id": "example_city", "hotel_ids": ["H_RIVER","H_FORT","H_BAZAAR"], "place_ids": ["CLOCK","MARKET","DOSA"],
  "importances": { "CLOCK": 3, "MARKET": 2, "DOSA": 5 }, "budget": 4500 }
```
Response `200` (the lowest-total hotel FORT is over budget; RIVER is recommended though BAZAAR is cheaper):
```json
{
  "status": "OK", "errors": [], "importance_total": 10, "budget": 4500,
  "recommended_hotel_id": "H_RIVER", "default_inspected_hotel_id": "H_RIVER",
  "hotels": [
    { "id": "H_RIVER", "name": "Riverside Inn", "stay_cost": 4200, "affordable": true, "rank": 1,
      "remaining_budget": 300, "shortfall": null, "label": "RECOMMENDED",
      "weighted_total": 290, "weighted_average_display": "29.0", "longest_trip": 40,
      "contributions": [ { "place_id": "CLOCK", "minutes": 20, "importance": 3, "contribution": 60 },
                         { "place_id": "MARKET", "minutes": 40, "importance": 2, "contribution": 80 },
                         { "place_id": "DOSA", "minutes": 30, "importance": 5, "contribution": 150 } ] },
    { "id": "H_BAZAAR", "name": "Bazaar Lodge", "stay_cost": 3100, "affordable": true, "rank": 2,
      "remaining_budget": 1400, "shortfall": null, "label": "RANKED",
      "weighted_total": 435, "weighted_average_display": "43.5", "longest_trip": 60,
      "contributions": [ { "place_id": "CLOCK", "minutes": 35, "importance": 3, "contribution": 105 },
                         { "place_id": "MARKET", "minutes": 15, "importance": 2, "contribution": 30 },
                         { "place_id": "DOSA", "minutes": 60, "importance": 5, "contribution": 300 } ] },
    { "id": "H_FORT", "name": "Fort View Hotel", "stay_cost": 5200, "affordable": false, "rank": null,
      "remaining_budget": null, "shortfall": 700, "label": "OVER_BUDGET",
      "weighted_total": 180, "weighted_average_display": "18.0", "longest_trip": 25,
      "contributions": [ { "place_id": "CLOCK", "minutes": 10, "importance": 3, "contribution": 30 },
                         { "place_id": "MARKET", "minutes": 25, "importance": 2, "contribution": 50 },
                         { "place_id": "DOSA", "minutes": 20, "importance": 5, "contribution": 100 } ] }
  ]
}
```

### Example: NO_AFFORDABLE_HOTEL (same request, `"budget": 3000`)
Shortfalls: BAZAAR 100, RIVER 1200, FORT 2200. Lowest hotel ID is `H_BAZAAR`.
```json
{
  "status": "NO_AFFORDABLE_HOTEL", "errors": [], "importance_total": 10, "budget": 3000,
  "recommended_hotel_id": null, "default_inspected_hotel_id": "H_BAZAAR",
  "hotels": [
    { "id": "H_FORT", "name": "Fort View Hotel", "stay_cost": 5200, "affordable": false, "rank": null,
      "remaining_budget": null, "shortfall": 2200, "label": "OVER_BUDGET", "weighted_total": 180,
      "weighted_average_display": "18.0", "longest_trip": 25, "contributions": [ "…as above…" ] },
    { "id": "H_RIVER", "…": "rank null, shortfall 1200, weighted_total 290" },
    { "id": "H_BAZAAR", "…": "rank null, shortfall 100, weighted_total 435" }
  ]
}
```

### Example: INVALID
Request with `"budget": "4500"` and `"importances": {"CLOCK":3,"MARKET":2,"DOSA":6}`. Response `200`:
```json
{
  "status": "INVALID",
  "errors": [
    { "field": "budget", "code": "BUDGET_INVALID", "message": "Budget must be a whole number from 0 to 1,000,000" },
    { "field": "importances.DOSA", "code": "IMPORTANCE_INVALID", "message": "Importance for DOSA must be a whole number from 1 to 5" }
  ],
  "importance_total": null, "budget": null, "recommended_hotel_id": null,
  "default_inspected_hotel_id": null, "hotels": []
}
```
No ranks, recommendation, totals, contributions or highlights are returned. Errors are collected in one pass where practical.

## Validation error codes
`field` uses dotted paths (`budget`, `hotel_ids`, `importances.<place_id>`, `hotels.<id>.stay_cost`, `hotels.<id>.round_trip_minutes.<place_id>`). Messages are plain English.

| Code | Rule violated |
|---|---|
| `FIELD_TYPE` | A container has the wrong JSON type (e.g. `hotel_ids` not an array, `importances` not an object) |
| `HOTEL_COUNT` | Selected hotels not 2–10 (too few / too many) |
| `PLACE_COUNT` | Selected places not 3–15 |
| `ID_FORMAT` | ID not matching `[A-Z][A-Z0-9_-]{0,15}` (`re.fullmatch`) |
| `DUPLICATE_ID` | An ID appears twice across hotels **and** places combined |
| `UNKNOWN_HOTEL` | A `hotel_ids` entry is not in the city's catalog |
| `UNKNOWN_PLACE` | A `place_ids` entry is not in the city's catalog |
| `NAME_BLANK` | Name empty after trimming whitespace (or not a string) |
| `PLACE_TYPE` | Type not `attraction` or `food` |
| `BUDGET_INVALID` | Not an `int` (bool, float, string, null rejected) or outside 0–1,000,000 |
| `STAY_COST_INVALID` | Not an `int` or outside 1–1,000,000 |
| `IMPORTANCE_INVALID` | Not an `int` or outside 1–5 |
| `IMPORTANCE_MISSING` | A selected place has no entry in `importances` |
| `IMPORTANCE_UNKNOWN` | `importances` has a key that is not a selected place |
| `MINUTES_INVALID` | Not an `int` or outside 1–600 |
| `MAPPING_MISSING_PLACE` | A hotel's `round_trip_minutes` lacks a selected place ID |
| `MAPPING_UNKNOWN_PLACE` | A hotel's `round_trip_minutes` has a place ID that is not selected |

**Path convention for hotel and place records.** `hotels.<id>.stay_cost` and `hotels.<id>.round_trip_minutes[.<place_id>]` use the hotel's ID when it is valid and not a duplicate; otherwise (and always for `id`, `name`, `type`) the input position is used: `hotels[0].id`, `hotels[0].stay_cost`, `places[2].type`. Count errors use `hotel_ids` / `place_ids`. An ID error never hides other errors on the same record. A scenario that is not an object is `FIELD_TYPE` on `scenario`.

Structural codes (`NAME_BLANK`, `PLACE_TYPE`, `STAY_COST_INVALID`, `MINUTES_INVALID`, `MAPPING_*`, `ID_FORMAT` on data) cannot come from the shipped catalog; they are exercised by test scenarios built directly against the domain.

## GET /api/cities/{city_id}/timeline  *(Optional, T18, deferred)*
Not defined yet. Its schema is added here before T18 starts; it must use the engine's affordability and ranking rules.

## Contract-change rule
Any change here updates `Frontend/src/types/contracts.ts` and the affected tests in the same commit.
