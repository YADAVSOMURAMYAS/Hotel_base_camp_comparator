# src/test/samples/

**Purpose:** Real API responses used as mock data by Frontend tests.

These are **copies** of `Backend/tests/api/samples/*.json` (saved from the FastAPI test client). Do not hand-edit them. Refresh after any contract or catalog change (from the repo root, PowerShell):

```powershell
Copy-Item Backend\tests\api\samples\*.json Frontend\src\test\samples\ -Force
```

| File | Request |
|---|---|
| `city_surmapur.json` | `GET /api/cities/surmapur` |
| `preset_demo.json` | `GET /api/cities/surmapur/presets/demo` |
| `compare_ok.json` | `POST /api/compare`, Demo trip (`OK`) |
| `compare_no_affordable_hotel.json` | Demo trip with `budget: 0` |
| `compare_invalid.json` | Demo trip with `budget: -5` |
