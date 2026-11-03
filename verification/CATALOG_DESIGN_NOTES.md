# Catalog Design Notes (T15)

> **Purpose:** The approved design of the Phase B catalogs: the Surmapur additions and the Shikharpur city, with the matrix method and every map position.
> **Owner of:** the design rationale and the full data tables. The generator reads `Backend/scripts/catalog_design.py` (same values); the frozen output is `Backend/app/data/cities/*.json`.
> **Read this when:** changing the catalog, explaining where a number came from, or adding a third city.

Approved by the user at the T15 checkpoint (2026-11-02), with four renames in Shikharpur (NOODLES, Ridge Bakery, Eagle Hill Sunrise Point, Old Assembly Library). No app code reads this file.

## 1. Frozen Demo trip

The Demo block (10 Demo hotels, 15 Demo places, the 10x15 matrix slice, `demo_preset`) is pinned by `Backend/tests/unit/test_demo_freeze.py`:

```
sha256(json.dumps(block, sort_keys=True, separators=(",", ":"), ensure_ascii=False)) =
7b944cab2f0cbc250e438fbbb73b872ef94ed51986db14751ec2bcb2698d5507     (computed before any T15 change)
map + districts of Surmapur =
65d729fea27ccbeca92a92fcc3791a053c3bc03c4fd4232032ab58b63bf306e7
```

New hotels are appended after the Demo hotels, new places after the Demo places, and every old row gets its new columns appended after the 15 Demo columns.

## 2. Matrix method

```
minutes(h, p) = base[district(h)][district(p)] + hotel_offset(h) + place_offset(p)    (must be 1..600, else the generator raises)
new hotel i (0-based over the final 30):  hotel_offset(i) = (i * 7) % 13 - 6     -> -6..+6
new place j (0-based over the final 50):  place_offset(j) = (j * 5) % 11 - 5     -> -5..+5
```

- Surmapur: Demo hotels keep their hand-authored offsets (+2, +6, +8, -6, +5, -5, +2, -5, +3, -7) and Demo places theirs (+6, -5, -1, 0, -5, -6, +5, +2, +2, -2, +2, -5, +6, +7, +7). All 150 Demo cells equal `base + hotel offset + place offset`, so every Demo row and column stays coherent when extended. The 150 cells are copied from the existing file, not recomputed.
- Shikharpur: every hotel and place uses the index formulas.
- No cell was changed by hand, so nothing is logged under "Hand-tuned data cells".
- Resulting ranges: Surmapur 15..135 minutes, Shikharpur 9..110.

Surmapur base (rows = hotel district, columns = place district, order FORT, BAZAAR, GHAT, CIVIL, LAKE): the Demo base table in `DEMO_DESIGN_NOTES.md` section 6.

Shikharpur base (order MALL, GOMPA, TEA, TAL, CANTT, VALLEY), asymmetric because hill roads are slower one way:

| Hotel district | MALL | GOMPA | TEA | TAL | CANTT | VALLEY |
|---|---|---|---|---|---|---|

| MALL | 20 | 45 | 60 | 50 | 35 | 70 |
| GOMPA | 50 | 22 | 90 | 95 | 65 | 100 |
| TEA | 60 | 85 | 25 | 80 | 75 | 65 |
| TAL | 50 | 90 | 80 | 20 | 55 | 40 |
| CANTT | 35 | 60 | 75 | 55 | 22 | 85 |
| VALLEY | 70 | 95 | 65 | 40 | 80 | 25 |

## 3. Positions

Positions are presentation data on a 1000 x 600 canvas. They were placed by a fixed rule **before** the matrix existed and never feed it.

- Surmapur: the 25 Demo markers stay where they are (their closest pair is 98 px apart). For each district, the new hotels and places (interleaved, hotel first) take the first free point of a 20 px lattice inside that district's rectangle, scanning left-to-right then top-to-bottom, where "free" means at least 55 px from every marker already placed. Rectangles (x0-x1, y0-y1): FORT 40-420, 40-270; BAZAAR 430-740, 150-450; GHAT 40-420, 300-570; CIVIL 740-960, 30-340; LAKE 560-960, 360-570.
- Shikharpur: each district gets a 4 x 4 brick lattice (columns 70 px apart, rows 60 px apart, odd rows shifted 35 px) starting at GOMPA (40,40), MALL (370,40), CANTT (700,40), TEA (40,320), TAL (370,320), VALLEY (700,320). Hotels and places interleave in file order.
- The tests require every marker inside the canvas and at least 30 px from every other marker (all 80 per city).

Closest pair of the 80 Surmapur markers: 56.6 px.

Closest pair of the 80 Shikharpur markers: 69.5 px.

## 4. Surmapur additions (20 hotels, 35 places)

Hotels (file indexes 10-29):

| ID | Name | District | Stay cost (₹) | x | y |
|---|---|---|---|---|---|
| H_RAMPART | Rampart Retreat | FORT | 41,200 | 40 | 40 |
| H_KILA | Kila Courtyard Stay | FORT | 22,600 | 160 | 40 |
| H_JHAROKHA | Jharokha Heritage Suites | FORT | 47,500 | 360 | 40 |
| H_SENTRY | Sentry Gate Guesthouse | FORT | 9,800 | 140 | 100 |
| H_SPICE | Spice Lane Lodge | BAZAAR | 18,400 | 430 | 150 |
| H_CHOWK | Chowk Central Hotel | BAZAAR | 34,200 | 550 | 150 |
| H_ZARI | Zari Bazaar Inn | BAZAAR | 14,900 | 670 | 150 |
| H_MINAR | Minar View Residency | BAZAAR | 43,900 | 430 | 210 |
| H_BOATMAN | Boatman's Rest | GHAT | 11,300 | 40 | 300 |
| H_DIYA | Diya Ghat Boutique | GHAT | 38,600 | 160 | 300 |
| H_SANGAM | Sangam Riverside | GHAT | 26,700 | 280 | 300 |
| H_LOTUS | Lotus Steps Hotel | GHAT | 21,500 | 380 | 340 |
| H_RAJ | Raj Club Residency | CIVIL | 55,400 | 800 | 30 |
| H_ELM | Elm Avenue Hotel | CIVIL | 28,900 | 840 | 70 |
| H_PARADE | Parade Ground Inn | CIVIL | 13,700 | 800 | 130 |
| H_GULMOHAR | Gulmohar Grand | CIVIL | 31,800 | 840 | 170 |
| H_JETTY | Lakeside Jetty Cottages | LAKE | 24,800 | 620 | 360 |
| H_PINE | Pinecrest Lake Lodge | LAKE | 17,200 | 880 | 360 |
| H_SUNSET | Sunset Terrace Resort | LAKE | 46,300 | 560 | 400 |
| H_MISTY | Misty Shore Homestay | LAKE | 10,900 | 720 | 420 |

Places (file indexes 15-49):

| ID | Name | Type | Importance | District | x | y |
|---|---|---|---|---|---|---|
| DARBAR | Diwan-e-Khas Darbar Hall | attraction | 4 | FORT | 100 | 40 |
| CANNON | Jai Cannon Terrace | attraction | 2 | FORT | 300 | 40 |
| ARMORY | Royal Armory Gallery | attraction | 3 | FORT | 420 | 40 |
| CHHATRI | Sandstone Chhatri Gardens | attraction | 2 | FORT | 280 | 100 |
| KEBAB | Seekh Kebab Lane | food | 3 | FORT | 200 | 120 |
| LASSI | Fort Gate Lassi Stall | food | 2 | FORT | 40 | 140 |
| BADAMHALWA | Royal Badam Halwa | food | 1 | FORT | 320 | 140 |
| SPICEMKT | Spice Merchants' Row | attraction | 4 | BAZAAR | 490 | 150 |
| BANGLE | Bangle Lane | attraction | 1 | BAZAAR | 610 | 150 |
| CHAAT | Bhaiya Chaat Centre | food | 5 | BAZAAR | 730 | 150 |
| SAMOSA | Clocktower Samosa Wala | food | 3 | BAZAAR | 590 | 210 |
| PAAN | Rajwada Paan Shop | food | 1 | BAZAAR | 710 | 210 |
| MITHAI | Surmapur Mithai Mahal | food | 4 | BAZAAR | 470 | 250 |
| AARTI | Neelganga Aarti Steps | attraction | 5 | GHAT | 100 | 300 |
| BOATRIDE | Sunrise Boat Ride Landing | attraction | 4 | GHAT | 220 | 300 |
| TEMPLE | Shiv Ghat Temple | attraction | 2 | GHAT | 340 | 300 |
| KITEFLY | Kite Flyers' Bank | attraction | 1 | GHAT | 40 | 360 |
| POHA | Ghat-side Poha Cart | food | 2 | GHAT | 100 | 360 |
| FISHFRY | Neelganga Fish Fry | food | 3 | GHAT | 160 | 360 |
| RABRI | Riverstep Rabri Shop | food | 4 | GHAT | 320 | 360 |
| CATHEDRAL | St. Mark's Cathedral | attraction | 2 | CIVIL | 960 | 30 |
| OBSERVE | Colonial Observatory | attraction | 3 | CIVIL | 960 | 90 |
| ARTGAL | Civil Lines Art Gallery | attraction | 3 | CIVIL | 960 | 150 |
| CAFE | Old Post Office Cafe | food | 3 | CIVIL | 940 | 210 |
| TANDOOR | Tandoori Nights Grill | food | 4 | CIVIL | 840 | 230 |
| DOSA | Sagar Dosa Corner | food | 2 | CIVIL | 940 | 270 |
| COFFEE | Raj Club Coffee House | food | 5 | CIVIL | 740 | 290 |
| BOATING | Meghna Pedal Boats | attraction | 3 | LAKE | 760 | 360 |
| BIRDS | Meghna Bird Sanctuary | attraction | 5 | LAKE | 940 | 360 |
| WATCHTWR | Pine Hill Watchtower | attraction | 4 | LAKE | 620 | 420 |
| SPA | Lakeside Ayurveda Spa | attraction | 1 | LAKE | 860 | 420 |
| BHUTTA | Bhutta Roast Point | food | 2 | LAKE | 920 | 420 |
| SIZZLER | Lakeview Sizzler Deck | food | 3 | LAKE | 560 | 460 |
| HILLCAFE | Hilltop Bakery Cafe | food | 4 | LAKE | 660 | 460 |
| PAKORA | Monsoon Pakora Hut | food | 1 | LAKE | 820 | 460 |

Surmapur totals: 30 hotels, 50 places (25 attractions, 25 food).

## 5. Shikharpur (no Demo preset)

*A Himalayan hill station: a mall ridge, a monastery hill, tea estates, a lake, an old cantonment and a pine valley.*

| District ID | Name |
|---|---|
| MALL | The Mall Ridge |
| GOMPA | Gompa Hill |
| TEA | Chai Bagan Estates |
| TAL | Tal Lakefront |
| CANTT | Old Cantonment |
| VALLEY | Pine Valley |

Hotels (30):

| ID | Name | District | Stay cost (₹) | x | y |
|---|---|---|---|---|---|
| H_RIDGE | Ridge View Grand | MALL | 58,400 | 370 | 40 |
| H_PROMEN | Promenade Palace | MALL | 72,900 | 510 | 40 |
| H_BANDSTAND | Bandstand Inn | MALL | 19,600 | 405 | 100 |
| H_SNOWLINE | Snowline Suites | MALL | 41,500 | 545 | 100 |
| H_MALLROAD | Mall Road Lodge | MALL | 12,800 | 370 | 160 |
| H_MONK | Monk's Rest Guesthouse | GOMPA | 7,400 | 40 | 40 |
| H_PRAYER | Prayer Flag Homestay | GOMPA | 9,900 | 180 | 40 |
| H_GOMPA | Gompa View Resort | GOMPA | 36,700 | 75 | 100 |
| H_CHORTEN | Chorten Heights | GOMPA | 24,300 | 215 | 100 |
| H_BELL | Bell Tower Retreat | GOMPA | 15,200 | 40 | 160 |
| H_PLUCKER | Tea Plucker's Cottage | TEA | 13,500 | 40 | 320 |
| H_BAGAN | Bagan Bungalow | TEA | 52,100 | 180 | 320 |
| H_FLUSH | First Flush Estate Stay | TEA | 66,800 | 75 | 380 |
| H_TEAHOUSE | Teahouse Lodge | TEA | 21,400 | 215 | 380 |
| H_CLOUD | Cloudrest Homestay | TEA | 10,600 | 40 | 440 |
| H_TAL | Tal Lakefront Hotel | TAL | 46,200 | 370 | 320 |
| H_SHIKARA | Shikara Landing Inn | TAL | 28,700 | 510 | 320 |
| H_REEDS | Reeds & Ripples | TAL | 17,800 | 405 | 380 |
| H_BOATHSE | Boathouse Hotel | TAL | 33,900 | 545 | 380 |
| H_DUSK | Dusk Terrace Resort | TAL | 79,500 | 370 | 440 |
| H_COLONEL | Colonel's Bungalow | CANTT | 44,800 | 700 | 40 |
| H_PARADEG | Parade Gate Inn | CANTT | 11,900 | 840 | 40 |
| H_BARRACK | Barracks Budget Stay | CANTT | 6,900 | 735 | 100 |
| H_CHURCH | Church Road Hotel | CANTT | 23,700 | 875 | 100 |
| H_GOVHSE | Governor's House Suites | CANTT | 88,000 | 700 | 160 |
| H_PINEV | Pine Valley Lodge | VALLEY | 20,500 | 700 | 320 |
| H_ROPEWAY | Ropeway Base Camp Inn | VALLEY | 14,400 | 840 | 320 |
| H_CEDAR | Cedar Cabins | VALLEY | 31,200 | 735 | 380 |
| H_WATERFALL | Waterfall View Resort | VALLEY | 57,300 | 875 | 380 |
| H_TREK | Trekkers' Hostel | VALLEY | 7,900 | 700 | 440 |

Places (50):

| ID | Name | Type | Importance | District | x | y |
|---|---|---|---|---|---|---|
| RIDGEWALK | Ridge Promenade Walk | attraction | 4 | MALL | 440 | 40 |
| CHURCHSQ | Christ Church Square | attraction | 2 | MALL | 580 | 40 |
| LIBRARY | Old Assembly Library | attraction | 2 | MALL | 475 | 100 |
| TOYTRAIN | Toy Train Station | attraction | 5 | MALL | 615 | 100 |
| MOMO | Mall Road Momo Stall | food | 5 | MALL | 440 | 160 |
| BAKERY | Ridge Bakery | food | 3 | MALL | 510 | 160 |
| CHOCO | Hot Chocolate Parlour | food | 2 | MALL | 580 | 160 |
| THUKPA | Thukpa Kitchen | food | 4 | MALL | 405 | 220 |
| NOODLES | Mall Road Noodle Point | food | 3 | MALL | 475 | 220 |
| MONASTERY | Thubten Gompa Monastery | attraction | 5 | GOMPA | 110 | 40 |
| PRAYERWHL | Prayer Wheel Corridor | attraction | 3 | GOMPA | 250 | 40 |
| STUPA | Peace Stupa | attraction | 4 | GOMPA | 145 | 100 |
| MEDITATE | Meditation Cave | attraction | 1 | GOMPA | 285 | 100 |
| SUNRISE | Eagle Hill Sunrise Point | attraction | 4 | GOMPA | 110 | 160 |
| BUTTERTEA | Butter Tea House | food | 2 | GOMPA | 180 | 160 |
| TINGMO | Tingmo Steamed Bread Cafe | food | 1 | GOMPA | 250 | 160 |
| SHAPHALE | Shaphale Corner | food | 3 | GOMPA | 75 | 220 |
| TEAFACT | Estate Tea Factory Tour | attraction | 4 | TEA | 110 | 320 |
| PLUCKING | Plucking Trail | attraction | 3 | TEA | 250 | 320 |
| TEAGARDEN | Terraced Tea Gardens | attraction | 5 | TEA | 145 | 380 |
| PLANTERS | Planter's Bungalow Museum | attraction | 1 | TEA | 285 | 380 |
| TEASAMPLER | First Flush Tasting Room | food | 3 | TEA | 110 | 440 |
| SCONES | Estate Scones Cafe | food | 2 | TEA | 180 | 440 |
| ALOODUM | Aloo Dum Dhaba | food | 4 | TEA | 250 | 440 |
| BHAJIA | Rainy-day Bhajia Shack | food | 1 | TEA | 75 | 500 |
| LAKEWALK | Tal Lakeside Walk | attraction | 4 | TAL | 440 | 320 |
| SHIKARARIDE | Shikara Ride | attraction | 5 | TAL | 580 | 320 |
| BOATCLUB | Old Boat Club | attraction | 2 | TAL | 475 | 380 |
| FLOATMKT | Floating Flower Market | attraction | 3 | TAL | 615 | 380 |
| TROUT | Grilled Trout Deck | food | 4 | TAL | 440 | 440 |
| KAHWA | Kahwa Kiosk | food | 2 | TAL | 510 | 440 |
| RAJMA | Rajma Chawal Counter | food | 3 | TAL | 580 | 440 |
| CAKEHSE | Lakeview Cake House | food | 1 | TAL | 405 | 500 |
| FONDUE | Cheese Fondue Terrace | food | 5 | TAL | 475 | 500 |
| PARADE | Parade Ground | attraction | 1 | CANTT | 770 | 40 |
| WARMEM | War Memorial | attraction | 2 | CANTT | 910 | 40 |
| STJOHNS | St. John's Chapel | attraction | 3 | CANTT | 805 | 100 |
| CLUBHSE | Heritage Club House | attraction | 2 | CANTT | 945 | 100 |
| CUTLET | Anglo Fish Cutlet House | food | 4 | CANTT | 770 | 160 |
| PUDDING | Colonel's Pudding Shop | food | 2 | CANTT | 840 | 160 |
| CHOLE | Cantt Chole Bhature | food | 5 | CANTT | 910 | 160 |
| SANDWICH | Club Sandwich Counter | food | 1 | CANTT | 735 | 220 |
| ROPEWAY | Valley Ropeway Ride | attraction | 5 | VALLEY | 770 | 320 |
| FALLS | Seven Sisters Falls | attraction | 4 | VALLEY | 910 | 320 |
| PINETRAIL | Deodar Pine Trail | attraction | 3 | VALLEY | 805 | 380 |
| VIEWDECK | Glass Skywalk Viewdeck | attraction | 2 | VALLEY | 945 | 380 |
| CAMPFIRE | Campfire Kitchen | food | 3 | VALLEY | 770 | 440 |
| MUSHROOM | Wild Mushroom Stall | food | 1 | VALLEY | 840 | 440 |
| CHAIDHABA | Highway Chai Dhaba | food | 2 | VALLEY | 910 | 440 |
| APPLE | Apple Orchard Cafe | food | 4 | VALLEY | 735 | 500 |

Shikharpur totals: 30 hotels, 50 places (25 attractions, 25 food); stay costs ₹6,900 to ₹88,000.

## 6. Independent check

The API test `test_second_city_selection_matches_hand_computed_totals` uses Shikharpur, hotels H_MALLROAD / H_BARRACK / H_ROPEWAY, places TOYTRAIN 5 / MONASTERY 2 / FALLS 4 / CHOLE 3 (I = 14), budget 13,000. The totals 501, 753 and 778 were added up by hand from `shikharpur.json` (arithmetic is in the test's docstring), not produced by the engine.
