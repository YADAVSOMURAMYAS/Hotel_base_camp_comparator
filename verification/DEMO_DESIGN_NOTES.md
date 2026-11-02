# Demo Trip Design Notes (T02)

> **Purpose:** The approved paper design of the Demo trip (Surmapur) and the arithmetic proof that it meets every story condition.
> **Owner of:** the design rationale and the hand-checkable proof. T03 freezes this data into JSON; the independent expected results go in `EXPECTED_RESULTS.md`.
> **Read this when:** writing the Demo city JSON (T03), the Demo story tests (T07), or explaining why the data looks the way it does.

Approved by the user at Checkpoint A (items 1–5) and Checkpoint B (matrix and proof), 2026-11-02. No app code reads this file; only people and tests (by value, copied into constants) use it.

## 1. City

**Surmapur** (`city_id: surmapur`, map 1000 × 600)

> A sandstone fort city on the Neelganga river, with a clock-tower bazaar at its centre and a cool lake district on the edge.
> Tourists come for the night market, the stepwell and the river ghats, and stay for the city's street food.

| District ID | Name | One line |
|---|---|---|
| FORT | Old Fort Quarter | Sandstone gates, stepwell and royal biryani kitchens, on high ground in the north-west |
| BAZAAR | Clocktower Bazaar | Dense central market streets around the famous clock |
| GHAT | Neelganga Ghats | Riverside steps, boat landings and fish shacks along the south-west bank |
| CIVIL | Civil Lines | Leafy colonial avenues with the museum and gardens in the north-east |
| LAKE | Meghna Lakeside | Quiet hillside lakeshore in the south-east, far from the centre |

## 2. Places (15, importance total I = 40)

| # | ID | Name | Type | District | Importance |
|---|---|---|---|---|---|
| 1 | CLOCK | Ghantaghar Clock Tower | attraction | BAZAAR | 5 |
| 2 | FORTGATE | Lion Gate Fort | attraction | FORT | 4 |
| 3 | MUSEUM | Surmapur Heritage Museum | attraction | CIVIL | 3 |
| 4 | NIGHTMKT | Moonlight Night Market | attraction | BAZAAR | 4 |
| 5 | RIVERWALK | Neelganga Riverside Walk | attraction | GHAT | 3 |
| 6 | STEPWELL | Rani's Stepwell | attraction | FORT | 1 |
| 7 | VIEWPOINT | Sunset Point over Meghna Lake | attraction | LAKE | 2 |
| 8 | GARDEN | Rosewood Botanical Garden | attraction | CIVIL | 1 |
| 9 | KACHORI | Pandit Kachori Corner | food | BAZAAR | 2 |
| 10 | BIRYANI | Nawabi Biryani House | food | FORT | 4 |
| 11 | CHAI | Sunrise Kulhad Chai | food | GHAT | 1 |
| 12 | JALEBI | Jalebi Gali | food | BAZAAR | 3 |
| 13 | FISHCURRY | Riverbank Fish Curry Shack | food | GHAT | 3 |
| 14 | THALI | Maharaja Thali Bhavan | food | CIVIL | 2 |
| 15 | KULFI | Lakeside Matka Kulfi | food | LAKE | 2 |

8 attractions, 7 food stops, importance values 1–5 all used. The night market is typed `attraction` (the enum has only `attraction` and `food`).

## 3. Hotels (10)

| # | ID | Name | District | Stay cost (₹) | Tag |
|---|---|---|---|---|---|
| 1 | H_GHANTA | Ghantaghar Grand | BAZAAR | 36,500 | Beside the famous clock |
| 2 | H_HAVELI | Bazaar Haveli | BAZAAR | 30,800 | Courtyard haveli above the spice lanes |
| 3 | H_MAHAL | Lion Gate Mahal | FORT | 52,000 | Palace rooms inside the fort walls |
| 4 | H_STEPWELL | Stepwell Heritage Inn | FORT | 27,500 | Sandstone inn beside the old stepwell |
| 5 | H_NEELGHAT | Neelganga Ghat Residency | GHAT | 29,500 | Balconies over the river steps |
| 6 | H_RIVERBRZ | River Breeze Lodge | GHAT | 19,800 | Simple rooms by the boat landing |
| 7 | H_CIVIL | Civil Lines Suites | CIVIL | 24,200 | Quiet colonial-era suites |
| 8 | H_GARDEN | Garden Court Hotel | CIVIL | 16,500 | Budget rooms facing the botanical garden |
| 9 | H_LAKEVIEW | Lakeview Resort | LAKE | 33,000 | Infinity pool over Meghna Lake |
| 10 | H_HILLTOP | Hilltop Hostel | LAKE | 12,400 | Cheapest beds, up the lake road |

Stay costs are whole-rupee totals for a multi-night stay. Hotel IDs start with `H_`; no hotel ID equals a place ID.

## 4. Initial budget

**₹30,000** (whole rupees).

## 5. Map positions (1000 × 600, integers)

Positions were chosen **after the places and hotels were fixed and before any travel time existed**. They reflect where the districts sit on the schematic and nothing else. They are presentation data only: independent of the travel times, and never used in any calculation.

| Cluster | Marker | x | y |
|---|---|---|---|
| FORT (top-left) | H_MAHAL | 80 | 100 |
| | FORTGATE | 230 | 60 |
| | BIRYANI | 380 | 110 |
| | STEPWELL (place) | 130 | 230 |
| | H_STEPWELL | 290 | 200 |
| BAZAAR (centre) | CLOCK | 530 | 230 |
| | NIGHTMKT | 650 | 240 |
| | H_GHANTA | 450 | 310 |
| | H_HAVELI | 570 | 330 |
| | JALEBI | 690 | 370 |
| | KACHORI | 500 | 410 |
| GHAT (bottom-left) | H_NEELGHAT | 260 | 380 |
| | RIVERWALK | 150 | 450 |
| | FISHCURRY | 370 | 480 |
| | CHAI | 230 | 520 |
| | H_RIVERBRZ | 110 | 540 |
| CIVIL (top-right) | MUSEUM | 760 | 80 |
| | THALI | 900 | 60 |
| | H_CIVIL | 900 | 160 |
| | GARDEN (place) | 770 | 230 |
| | H_GARDEN | 880 | 300 |
| LAKE (bottom-right) | H_LAKEVIEW | 820 | 380 |
| | VIEWPOINT | 760 | 470 |
| | KULFI | 900 | 540 |
| | H_HILLTOP | 640 | 540 |

25 markers. Every pair is at least 80 px apart horizontally or 50 px vertically, so labels should not overlap (to be rechecked in the real SVG, T12).

## 6. Travel-time matrix

### Design method

```
minutes(h, p) = base[district(h)][district(p)] + hotel_offset[h] + place_offset[p]
```

- The base table was hand-picked from district adjacency: same district ≈ 25–30 minutes, neighbouring districts 45–70, far districts 100–120. The Civil Lines row is deliberately central (88 / 45 / 85 / 25 / 60), so a Civil Lines hotel can keep every trip near or below 90.
- The offsets came from a throwaway random search over small integers (hotel −8…+8, place −7…+7) that tested every condition below. The script lived outside the repo and is not saved. Among the passing offset sets, the one with the cleanest story was chosen: the museum flip, and the N1 pair where the cheaper hotel has the higher total.
- There are **no per-cell overrides**, so nothing is logged in DECISIONS.md under "Hand-tuned data cells" for T02.
- The final 150 numbers are frozen as hand-authored constants (DATABASE_DESIGN.md, "Demo block"). Map coordinates and randomness do not enter the data.
- All values are within 18–135 minutes (the allowed range is 1–600).

Base table (rows = hotel district, columns = place district):

| | FORT | BAZAAR | GHAT | CIVIL | LAKE |
|---|---|---|---|---|---|
| **FORT** hotel | 30 | 50 | 70 | 100 | 120 |
| **BAZAAR** hotel | 50 | 25 | 55 | 55 | 80 |
| **GHAT** hotel | 70 | 55 | 30 | 100 | 120 |
| **CIVIL** hotel | 88 | 45 | 85 | 25 | 60 |
| **LAKE** hotel | 120 | 80 | 120 | 70 | 30 |

Hotel offsets: H_GHANTA +2, H_HAVELI +6, H_MAHAL +8, H_STEPWELL −6, H_NEELGHAT +5, H_RIVERBRZ −5, H_CIVIL +2, H_GARDEN −5, H_LAKEVIEW +3, H_HILLTOP −7.

Place offsets: CLOCK +6, FORTGATE −5, MUSEUM −1, NIGHTMKT 0, RIVERWALK −5, STEPWELL −6, VIEWPOINT +5, GARDEN +2, KACHORI +2, BIRYANI −2, CHAI +2, JALEBI −5, FISHCURRY +6, THALI +7, KULFI +7.

### Round-trip matrix (minutes, hotel → place → hotel)

| Hotel \ Place | CLOCK | FORTGATE | MUSEUM | NIGHTMKT | RIVERWALK | STEPWELL | VIEWPOINT | GARDEN | KACHORI | BIRYANI | CHAI | JALEBI | FISHCURRY | THALI | KULFI |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| *importance →* | *5* | *4* | *3* | *4* | *3* | *1* | *2* | *1* | *2* | *4* | *1* | *3* | *3* | *2* | *2* |
| H_GHANTA | 33 | 47 | 56 | 27 | 52 | 46 | 87 | 59 | 29 | 50 | 59 | 22 | 63 | 64 | 89 |
| H_HAVELI | 37 | 51 | 60 | 31 | 56 | 50 | 91 | 63 | 33 | 54 | 63 | 26 | 67 | 68 | 93 |
| H_MAHAL | 64 | 33 | 107 | 58 | 73 | 32 | 133 | 110 | 60 | 36 | 80 | 53 | 84 | 115 | 135 |
| H_STEPWELL | 50 | 19 | 93 | 44 | 59 | 18 | 119 | 96 | 46 | 22 | 66 | 39 | 70 | 101 | 121 |
| H_NEELGHAT | 66 | 70 | 104 | 60 | 30 | 69 | 130 | 107 | 62 | 73 | 37 | 55 | 41 | 112 | 132 |
| H_RIVERBRZ | 56 | 60 | 94 | 50 | 20 | 59 | 120 | 97 | 52 | 63 | 27 | 45 | 31 | 102 | 122 |
| H_CIVIL | 53 | 85 | 26 | 47 | 82 | 84 | 67 | 29 | 49 | 88 | 89 | 42 | 93 | 34 | 69 |
| H_GARDEN | 46 | 78 | 19 | 40 | 75 | 77 | 60 | 22 | 42 | 81 | 82 | 35 | 86 | 27 | 62 |
| H_LAKEVIEW | 89 | 118 | 72 | 83 | 118 | 117 | 38 | 75 | 85 | 121 | 125 | 78 | 129 | 80 | 40 |
| H_HILLTOP | 79 | 108 | 62 | 73 | 108 | 107 | 28 | 65 | 75 | 111 | 115 | 68 | 119 | 70 | 30 |

## 7. Per-hotel results at budget ₹30,000

`rounded_tenths = floor((20T + 40) / 80)`, displayed as `tenths // 10 . tenths % 10`. Hotels in API order (ranked, then over budget by T, cost, ID). All arithmetic is integer; the displayed averages were also cross-checked with exact fractions and half-up rounding.

| Rank | Hotel | Stay cost | Affordable | T | Avg | Longest trip | Remaining / shortfall |
|---|---|---|---|---|---|---|---|
| **1 ★** | H_GARDEN | ₹16,500 | yes | 2234 | 55.9 | 86 (FISHCURRY) | ₹13,500 left |
| 2 | H_STEPWELL | ₹27,500 | yes | 2327 | 58.2 | 121 (KULFI) | ₹2,500 left |
| 3 | H_CIVIL | ₹24,200 | yes | 2514 | 62.9 | 93 (FISHCURRY) | ₹5,800 left |
| 4 | H_RIVERBRZ | ₹19,800 | yes | 2517 | 62.9 | 122 (KULFI) | ₹10,200 left |
| 5 | H_NEELGHAT | ₹29,500 | yes | 2917 | 72.9 | 132 (KULFI) | ₹500 left |
| 6 | H_HILLTOP | ₹12,400 | yes | 3327 | 83.2 | 119 (CHAI) | ₹17,600 left |
| – | H_GHANTA | ₹36,500 | no | 1942 | 48.6 | 89 (KULFI) | over by ₹6,500 |
| – | H_HAVELI | ₹30,800 | no | 2102 | 52.6 | 93 (KULFI) | over by ₹800 |
| – | H_MAHAL | ₹52,000 | no | 2887 | 72.2 | 135 (KULFI) | over by ₹22,000 |
| – | H_LAKEVIEW | ₹33,000 | no | 3727 | 93.2 | 129 (CHAI) | over by ₹3,000 |

`default_inspected_hotel_id` = `H_GARDEN` (the recommended hotel).

### Full contribution sum for H_GARDEN (the recommended hotel)

| Place | Importance × minutes | Contribution |
|---|---|---|
| CLOCK | 5 × 46 | 230 |
| FORTGATE | 4 × 78 | 312 |
| MUSEUM | 3 × 19 | 57 |
| NIGHTMKT | 4 × 40 | 160 |
| RIVERWALK | 3 × 75 | 225 |
| STEPWELL | 1 × 77 | 77 |
| VIEWPOINT | 2 × 60 | 120 |
| GARDEN | 1 × 22 | 22 |
| KACHORI | 2 × 42 | 84 |
| BIRYANI | 4 × 81 | 324 |
| CHAI | 1 × 82 | 82 |
| JALEBI | 3 × 35 | 105 |
| FISHCURRY | 3 × 86 | 258 |
| THALI | 2 × 27 | 54 |
| KULFI | 2 × 62 | 124 |
| **Total** | I = 40 | **2234** |

Running sum: 230, 542, 599, 759, 984, 1061, 1181, 1203, 1287, 1611, 1693, 1798, 2056, 2110, 2234.
Average: floor((20 × 2234 + 40) / 80) = floor(44720 / 80) = 559 tenths, displayed **55.9**.

## 8. Condition proofs

| ID | Result | Proof |
|---|---|---|
| **C1** (S1) | PASS | 6 hotels have cost ≤ 30,000: H_GARDEN, H_STEPWELL, H_CIVIL, H_RIVERBRZ, H_NEELGHAT, H_HILLTOP. 6 is within 4–7. |
| **C2** (S2) | PASS | The lowest total is H_GHANTA at 1942; the next is H_HAVELI at 2102, so it is unique. Its cost 36,500 > 30,000 (over by ₹6,500). |
| **C3** (S3) | PASS | Rank 1 is H_GARDEN (₹16,500). The cheapest affordable hotel is H_HILLTOP (₹12,400). They differ. |
| **C4** (S4) | PASS | H_GARDEN is affordable and its longest trip is 86 (FISHCURRY), so all 15 trips are ≤ 90. H_STEPWELL is affordable and has KULFI = 121 > 90 (also H_CIVIL 93, H_RIVERBRZ, H_NEELGHAT, H_HILLTOP). |
| **C5** (S5) | PASS | Most accessible hotel: H_GHANTA, cost ₹36,500. At budget 36,500 it is rank 1 (Recommended, ₹0 left). At 36,499 it is over by ₹1 with no rank, and H_HAVELI is rank 1. See what-if (i). |
| **C6** (S6) | PASS | **MUSEUM importance 3 → 1** at ₹30,000 changes the winner from **H_GARDEN** to **H_STEPWELL**. See what-if (ii). |
| **N1** | PASS | H_CIVIL (T = 2514) and H_RIVERBRZ (T = 2517) both display 62.9. H_CIVIL: floor(50320 / 80) = 629. H_RIVERBRZ: floor(50380 / 80) = 629 (629.75). Totals differ, so H_CIVIL is rank 3 and H_RIVERBRZ rank 4. H_CIVIL costs more (₹24,200 vs ₹19,800), so ranking by rounded average then cost would put H_RIVERBRZ first. Only exact-total ranking gives this order. |
| **N2** | PASS | H_HAVELI is over by ₹800 (small, under ₹1,000). H_MAHAL is over by ₹22,000 (large). H_LAKEVIEW is over by ₹3,000 and H_GHANTA by ₹6,500. |
| **N3** | PASS | All 10 totals are distinct: 1942, 2102, 2234, 2327, 2514, 2517, 2887, 2917, 3327, 3727. No tie-break is exercised in the Demo trip. |

Other single importance changes (1–5) that flip the winner at ₹30,000: place STEPWELL 1 → 3, 4 or 5 also gives H_STEPWELL. No other place flips it. MUSEUM 3 → 1 is the documented flip.

## 9. What-if tables

### (i) Budget raised to exactly ₹36,500 versus ₹36,499 (importances unchanged)

| Hotel (T) | Rank at ₹36,500 | Rank at ₹36,499 |
|---|---|---|
| H_GHANTA (1942) | **1 ★ Recommended** (₹0 left) | over by ₹1, no rank |
| H_HAVELI (2102) | 2 | **1 ★ Recommended** |
| H_GARDEN (2234) | 3 | 2 |
| H_STEPWELL (2327) | 4 | 3 |
| H_CIVIL (2514) | 5 | 4 |
| H_RIVERBRZ (2517) | 6 | 5 |
| H_NEELGHAT (2917) | 7 | 6 |
| H_HILLTOP (3327) | 8 | 7 |
| H_LAKEVIEW (3727) | 9 | 8 |
| H_MAHAL (2887) | over by ₹15,500 | over by ₹15,501 |

9 hotels are affordable at ₹36,500; 8 at ₹36,499. The contributions and totals are identical to the ₹30,000 case (a budget change does not touch them).

### (ii) MUSEUM importance 3 → 1 at ₹30,000 (I becomes 38)

Each total drops by 2 × the hotel's MUSEUM minutes.

| Hotel | Old T | New T | New avg | Old rank | New rank |
|---|---|---|---|---|---|
| H_STEPWELL | 2327 | 2141 | 56.3 | 2 | **1 ★ Recommended** |
| H_GARDEN | 2234 | 2196 | 57.8 | **1 ★** | 2 |
| H_RIVERBRZ | 2517 | 2329 | 61.3 | 4 | 3 |
| H_CIVIL | 2514 | 2462 | 64.8 | 3 | 4 |
| H_NEELGHAT | 2917 | 2709 | 71.3 | 5 | 5 |
| H_HILLTOP | 3327 | 3203 | 84.3 | 6 | 6 |

Over-budget hotels (no rank, shortfalls unchanged): H_GHANTA T = 1830, H_HAVELI T = 1982, H_MAHAL T = 2673, H_LAKEVIEW T = 3583.

Hand check: H_GARDEN 2234 − 2 × 19 = 2196. H_STEPWELL 2327 − 2 × 93 = 2141.

Story: if the group cares less about the museum, the Stepwell Heritage Inn overtakes the Garden Court Hotel.
