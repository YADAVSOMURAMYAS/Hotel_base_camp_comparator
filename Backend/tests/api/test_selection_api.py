"""Selecting subsets of the 30x50 catalogs through POST /api/compare."""

import pytest

CITIES = ["surmapur", "shikharpur"]


@pytest.fixture(params=CITIES)
def catalog(request, client):
    return client.get(f"/api/cities/{request.param}").json()


def _request(catalog, hotels, places, budget=1_000_000, importances=None):
    place_ids = [p["id"] for p in catalog["places"]][:places] if isinstance(places, int) else places
    hotel_ids = [h["id"] for h in catalog["hotels"]][:hotels] if isinstance(hotels, int) else hotels
    defaults = {p["id"]: p["default_importance"] for p in catalog["places"]}
    return {
        "city_id": catalog["city_id"],
        "hotel_ids": hotel_ids,
        "place_ids": place_ids,
        "importances": {p: defaults[p] for p in place_ids if p in defaults}
        if importances is None
        else importances,
        "budget": budget,
    }


def _compare(client, body):
    response = client.post("/api/compare", json=body)
    assert response.status_code == 200
    return response.json()


def _codes(result):
    return [e["code"] for e in result["errors"]]


def _assert_invalid(result, code):
    assert result["status"] == "INVALID"
    assert code in _codes(result)
    assert result["importance_total"] is None
    assert result["budget"] is None
    assert result["recommended_hotel_id"] is None
    assert result["default_inspected_hotel_id"] is None
    assert result["hotels"] == []


# --- valid selections --------------------------------------------------------------------------


def test_valid_non_demo_selection_is_ok_with_ranks(client, catalog):
    result = _compare(client, _request(catalog, 6, 8))
    assert result["status"] == "OK"
    assert result["errors"] == []
    assert [h["rank"] for h in result["hotels"]] == [1, 2, 3, 4, 5, 6]
    assert result["recommended_hotel_id"] == result["hotels"][0]["id"]
    assert all(len(h["contributions"]) == 8 for h in result["hotels"])


def test_selection_limits_are_inclusive(client, catalog):
    biggest = _compare(client, _request(catalog, 10, 15))
    smallest = _compare(client, _request(catalog, 2, 3))
    assert biggest["status"] == smallest["status"] == "OK"
    assert len(biggest["hotels"]) == 10
    assert len(smallest["hotels"]) == 2


# --- count limits ------------------------------------------------------------------------------


def test_eleven_hotels_is_hotel_count(client, catalog):
    _assert_invalid(_compare(client, _request(catalog, 11, 8)), "HOTEL_COUNT")


def test_one_hotel_is_hotel_count(client, catalog):
    _assert_invalid(_compare(client, _request(catalog, 1, 8)), "HOTEL_COUNT")


def test_sixteen_places_is_place_count(client, catalog):
    _assert_invalid(_compare(client, _request(catalog, 6, 16)), "PLACE_COUNT")


def test_two_places_is_place_count(client, catalog):
    _assert_invalid(_compare(client, _request(catalog, 6, 2)), "PLACE_COUNT")


# --- identity ----------------------------------------------------------------------------------


def test_unknown_hotel_id(client, catalog):
    ids = [h["id"] for h in catalog["hotels"]][:5] + ["H_NOWHERE"]
    result = _compare(client, _request(catalog, ids, 8))
    _assert_invalid(result, "UNKNOWN_HOTEL")
    assert any(e["field"] == "hotel_ids[5]" for e in result["errors"])


def test_unknown_place_id(client, catalog):
    ids = [p["id"] for p in catalog["places"]][:7] + ["NOWHERE"]
    importances = {p: 3 for p in ids}
    result = _compare(client, _request(catalog, 6, ids, importances=importances))
    _assert_invalid(result, "UNKNOWN_PLACE")
    assert any(e["field"] == "place_ids[7]" for e in result["errors"])


def test_duplicate_hotel_id(client, catalog):
    ids = [h["id"] for h in catalog["hotels"]][:4]
    _assert_invalid(_compare(client, _request(catalog, ids + ids[:1], 8)), "DUPLICATE_ID")


def test_duplicate_place_id(client, catalog):
    ids = [p["id"] for p in catalog["places"]][:7]
    result = _compare(client, _request(catalog, 6, ids + ids[:1]))
    _assert_invalid(result, "DUPLICATE_ID")


def test_hotel_id_in_place_ids_is_unknown_place(client, catalog):
    ids = [p["id"] for p in catalog["places"]][:7] + [catalog["hotels"][0]["id"]]
    result = _compare(client, _request(catalog, 6, ids, importances={p: 3 for p in ids}))
    _assert_invalid(result, "UNKNOWN_PLACE")


# --- importances -------------------------------------------------------------------------------


def test_importance_missing_for_a_selected_place(client, catalog):
    body = _request(catalog, 6, 8)
    missing = body["place_ids"][3]
    del body["importances"][missing]
    result = _compare(client, body)
    _assert_invalid(result, "IMPORTANCE_MISSING")
    assert any(e["field"] == f"importances.{missing}" for e in result["errors"])


def test_importance_for_an_unselected_place(client, catalog):
    body = _request(catalog, 6, 8)
    extra = catalog["places"][20]["id"]
    body["importances"][extra] = 3
    result = _compare(client, body)
    _assert_invalid(result, "IMPORTANCE_UNKNOWN")
    assert any(e["field"] == f"importances.{extra}" for e in result["errors"])


# --- budget ------------------------------------------------------------------------------------


@pytest.mark.parametrize("budget", [-1, 1_000_001])
def test_budget_outside_range(client, catalog, budget):
    _assert_invalid(_compare(client, _request(catalog, 6, 8, budget=budget)), "BUDGET_INVALID")


def test_budget_limits_are_valid(client, catalog):
    assert _compare(client, _request(catalog, 6, 8, budget=1_000_000))["status"] == "OK"
    result = _compare(client, _request(catalog, 6, 8, budget=0))
    assert result["status"] == "NO_AFFORDABLE_HOTEL"
    assert result["recommended_hotel_id"] is None
    assert all(h["rank"] is None for h in result["hotels"])


# --- independent check (second city, 3 hotels x 4 places) -------------------------------------


def test_second_city_selection_matches_hand_computed_totals(client):
    """Expected values were worked out by hand from shikharpur.json, not with the engine.

    Importances TOYTRAIN 5, MONASTERY 2, FALLS 4, CHOLE 3 -> I = 14. Budget 13,000.
    Minutes (TOYTRAIN, MONASTERY, FALLS, CHOLE):
      H_MALLROAD 15, 37, 67, 28 -> 5*15 + 2*37 + 4*67 + 3*28 = 75 + 74 + 268 + 84 = 501
      H_BARRACK  39, 61, 91, 24 -> 195 + 122 + 364 + 72 = 753
      H_ROPEWAY  63, 85, 20, 71 -> 315 + 170 + 80 + 213 = 778
    Tenths = (20*T + 14) // 28: 501 -> 10034 // 28 = 358; 753 -> 15074 // 28 = 538;
    778 -> 15574 // 28 = 556. Costs 12,800 / 6,900 / 14,400: ROPEWAY is over by 1,400.
    """
    result = _compare(
        client,
        {
            "city_id": "shikharpur",
            "hotel_ids": ["H_ROPEWAY", "H_BARRACK", "H_MALLROAD"],
            "place_ids": ["TOYTRAIN", "MONASTERY", "FALLS", "CHOLE"],
            "importances": {"TOYTRAIN": 5, "MONASTERY": 2, "FALLS": 4, "CHOLE": 3},
            "budget": 13000,
        },
    )
    assert result["status"] == "OK"
    assert result["importance_total"] == 14
    assert result["recommended_hotel_id"] == "H_MALLROAD"
    got = [
        (h["id"], h["rank"], h["weighted_total"], h["weighted_average_display"], h["shortfall"])
        for h in result["hotels"]
    ]
    assert got == [
        ("H_MALLROAD", 1, 501, "35.8", None),
        ("H_BARRACK", 2, 753, "53.8", None),
        ("H_ROPEWAY", None, 778, "55.6", 1400),
    ]
    assert [h["remaining_budget"] for h in result["hotels"]] == [200, 6100, None]
    assert [h["longest_trip"] for h in result["hotels"]] == [67, 91, 85]
