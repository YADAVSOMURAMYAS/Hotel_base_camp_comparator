# src/test/samples/

**Purpose:** Real API responses used as mock data by Frontend tests. Do not hand-edit them.

## Backend test samples (copies)
`city_surmapur.json`, `preset_demo.json`, `compare_ok.json`, `compare_no_affordable_hotel.json` and `compare_invalid.json` are **copies** of `Backend/tests/api/samples/*.json` (saved from the FastAPI test client). Refresh after any contract or catalog change (from the repo root, PowerShell):

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

## Flow samples (captured from the running backend, T14)
Used by `src/__tests__/integration.workflow.test.tsx`. Each is the Demo trip request (same hotels, places and importances as the preset) with the one change shown. Invalid budgets (`-5`, `12.5`, `"abc"`) all get the identical backend body, so the tests reuse `compare_invalid.json` for them. Expected hotels are recorded in `Backend/tests/fixtures/expected_demo.py`.

| File | Change | What it shows |
|---|---|---|
| `flow_budget_at_best_cost.json` | budget 36500 | `H_GHANTA` recommended with ₹0 left, 9 ranked |
| `flow_budget_one_less.json` | budget 36499 | `H_GHANTA` over by ₹1, `H_HAVELI` recommended |
| `flow_importance_whatif.json` | `MUSEUM` importance 1 (budget 30000) | `H_STEPWELL` recommended, importance total 38 |
| `flow_exact_budget_hotel.json` | budget 29500 | `H_NEELGHAT` rank 5 with ₹0 left |
| `flow_one_over_budget_hotel.json` | budget 29499 | `H_NEELGHAT` over by ₹1, unranked |
| `flow_invalid_importance.json` | `MUSEUM` importance 6 | `INVALID`, field `importances.MUSEUM` |

**Regenerate** (backend running on port 8000, from the repo root, PowerShell 5.1 or 7). The files hold the raw server body (UTF-8 without a BOM, which `Set-Content` in PowerShell 5.1 would add); no formatting step is needed because this folder is in `.prettierignore`:

```powershell
$dir = "Frontend\src\test\samples"
$p = Invoke-RestMethod http://127.0.0.1:8000/api/cities/surmapur/presets/demo
function Save-Flow($name, $budget, $override) {
  $imp = [ordered]@{}; $p.importances.PSObject.Properties | ForEach-Object { $imp[$_.Name] = $_.Value }
  if ($override) { foreach ($k in $override.Keys) { $imp[$k] = $override[$k] } }
  $body = @{ city_id = $p.city_id; hotel_ids = $p.hotel_ids; place_ids = $p.place_ids; importances = $imp; budget = $budget } | ConvertTo-Json -Depth 5
  $r = Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:8000/api/compare -Method Post -ContentType 'application/json' -Body $body
  [IO.File]::WriteAllText("$((Resolve-Path $dir).Path)\$name.json", $r.Content, (New-Object Text.UTF8Encoding($false)))
}
Save-Flow flow_budget_at_best_cost 36500 $null
Save-Flow flow_budget_one_less 36499 $null
Save-Flow flow_importance_whatif $p.budget @{ MUSEUM = 1 }
Save-Flow flow_exact_budget_hotel 29500 $null
Save-Flow flow_one_over_budget_hotel 29499 $null
Save-Flow flow_invalid_importance $p.budget @{ MUSEUM = 6 }
```

After regenerating, run `npm test` and compare the recommended hotel and rank order with `expected_demo.py` (`WHATIF_BUDGET_EXACT`, `WHATIF_BUDGET_MINUS_ONE`, `WHATIF_IMPORTANCE_CHANGE`).

## T16 additions
| File | Source |
|---|---|
| `city_surmapur.json` | Refreshed copy of `Backend/tests/api/samples/city_surmapur.json` (full 30 x 50 catalog, untouched). Tests that expect only the Demo selection use `sampleCity` from `renderWithComparator.tsx`, which narrows it from the preset (D-43) |
| `cities_list.json` | Copy of `Backend/tests/api/samples/cities_list.json` |
| `city_shikharpur.json` | `GET /api/cities/shikharpur` from the running backend |
| `flow_shikharpur_small_ok.json` | `POST /api/compare`: Shikharpur, hotels `H_MALLROAD H_BARRACK H_ROPEWAY`, places `TOYTRAIN MONASTERY CHOLE FALLS` with importances 5/2/3/4, budget 13000. Totals 501 / 753 / 778 |
