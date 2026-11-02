"""Expected results for the Demo trip (Surmapur), typed by hand.

Source: verification/DEMO_DESIGN_NOTES.md, sections 7 (per-hotel results),
8 (condition proofs) and 9 (what-if tables). Date typed: 2026-11-02.

These are plain literals. Nothing here is read from the JSON, the spreadsheet or
app code, and the engine and API must never import this module (rule P10).
Tests only compare engine output against these values.
"""

IMPORTANCE_TOTAL = 40
BUDGET = 30000
RECOMMENDED_HOTEL_ID = "H_GARDEN"
DEFAULT_INSPECTED_HOTEL_ID = "H_GARDEN"

# Per hotel at budget 30,000. rank None = over budget (unranked).
# Exactly one of remaining_budget / shortfall is set.
EXPECTED_HOTELS = {
    "H_GARDEN": {
        "weighted_total": 2234,
        "weighted_average_display": "55.9",
        "affordable": True,
        "remaining_budget": 13500,
        "shortfall": None,
        "rank": 1,
        "longest_trip": 86,
    },
    "H_STEPWELL": {
        "weighted_total": 2327,
        "weighted_average_display": "58.2",
        "affordable": True,
        "remaining_budget": 2500,
        "shortfall": None,
        "rank": 2,
        "longest_trip": 121,
    },
    "H_CIVIL": {
        "weighted_total": 2514,
        "weighted_average_display": "62.9",
        "affordable": True,
        "remaining_budget": 5800,
        "shortfall": None,
        "rank": 3,
        "longest_trip": 93,
    },
    "H_RIVERBRZ": {
        "weighted_total": 2517,
        "weighted_average_display": "62.9",
        "affordable": True,
        "remaining_budget": 10200,
        "shortfall": None,
        "rank": 4,
        "longest_trip": 122,
    },
    "H_NEELGHAT": {
        "weighted_total": 2917,
        "weighted_average_display": "72.9",
        "affordable": True,
        "remaining_budget": 500,
        "shortfall": None,
        "rank": 5,
        "longest_trip": 132,
    },
    "H_HILLTOP": {
        "weighted_total": 3327,
        "weighted_average_display": "83.2",
        "affordable": True,
        "remaining_budget": 17600,
        "shortfall": None,
        "rank": 6,
        "longest_trip": 119,
    },
    "H_GHANTA": {
        "weighted_total": 1942,
        "weighted_average_display": "48.6",
        "affordable": False,
        "remaining_budget": None,
        "shortfall": 6500,
        "rank": None,
        "longest_trip": 89,
    },
    "H_HAVELI": {
        "weighted_total": 2102,
        "weighted_average_display": "52.6",
        "affordable": False,
        "remaining_budget": None,
        "shortfall": 800,
        "rank": None,
        "longest_trip": 93,
    },
    "H_MAHAL": {
        "weighted_total": 2887,
        "weighted_average_display": "72.2",
        "affordable": False,
        "remaining_budget": None,
        "shortfall": 22000,
        "rank": None,
        "longest_trip": 135,
    },
    "H_LAKEVIEW": {
        "weighted_total": 3727,
        "weighted_average_display": "93.2",
        "affordable": False,
        "remaining_budget": None,
        "shortfall": 3000,
        "rank": None,
        "longest_trip": 129,
    },
}

# Affordable hotels at budget 30,000, best first.
EXPECTED_RANK_ORDER = [
    "H_GARDEN",
    "H_STEPWELL",
    "H_CIVIL",
    "H_RIVERBRZ",
    "H_NEELGHAT",
    "H_HILLTOP",
]

# (i) Budget equal to the best (lowest-total) hotel's cost, and one rupee less.
# Importances unchanged, so totals and contributions equal the 30,000 case.
WHATIF_BUDGET_EXACT = {
    "budget": 36500,
    "recommended_hotel_id": "H_GHANTA",
    "rank_order": [
        "H_GHANTA",
        "H_HAVELI",
        "H_GARDEN",
        "H_STEPWELL",
        "H_CIVIL",
        "H_RIVERBRZ",
        "H_NEELGHAT",
        "H_HILLTOP",
        "H_LAKEVIEW",
    ],
    "remaining_budget": {"H_GHANTA": 0},
    "shortfall": {"H_MAHAL": 15500},
}

WHATIF_BUDGET_MINUS_ONE = {
    "budget": 36499,
    "recommended_hotel_id": "H_HAVELI",
    "rank_order": [
        "H_HAVELI",
        "H_GARDEN",
        "H_STEPWELL",
        "H_CIVIL",
        "H_RIVERBRZ",
        "H_NEELGHAT",
        "H_HILLTOP",
        "H_LAKEVIEW",
    ],
    "remaining_budget": {},
    "shortfall": {"H_GHANTA": 1, "H_MAHAL": 15501},
}

# (ii) MUSEUM importance 3 -> 1 at budget 30,000 (importance total becomes 38).
WHATIF_IMPORTANCE_CHANGE = {
    "place_id": "MUSEUM",
    "new_importance": 1,
    "budget": 30000,
    "importance_total": 38,
    "recommended_hotel_id": "H_STEPWELL",
    "rank_order": [
        "H_STEPWELL",
        "H_GARDEN",
        "H_RIVERBRZ",
        "H_CIVIL",
        "H_NEELGHAT",
        "H_HILLTOP",
    ],
    "weighted_totals": {
        "H_STEPWELL": 2141,
        "H_GARDEN": 2196,
        "H_RIVERBRZ": 2329,
        "H_CIVIL": 2462,
        "H_NEELGHAT": 2709,
        "H_HILLTOP": 3203,
        "H_GHANTA": 1830,
        "H_HAVELI": 1982,
        "H_MAHAL": 2673,
        "H_LAKEVIEW": 3583,
    },
    "weighted_average_display": {
        "H_STEPWELL": "56.3",
        "H_GARDEN": "57.8",
        "H_RIVERBRZ": "61.3",
        "H_CIVIL": "64.8",
        "H_NEELGHAT": "71.3",
        "H_HILLTOP": "84.3",
    },
}
