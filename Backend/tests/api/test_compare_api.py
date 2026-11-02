import pytest
from conftest import CITY_ID

from tests.fixtures import expected_demo as exp

RESULT_KEYS = {
    "status",
    "errors",
    "importance_total",
    "budget",
    "recommended_hotel_id",
    "default_inspected_hotel_id",
    "hotels",
}
HOTEL_KEYS = {
    "id",
    "name",
    "stay_cost",
    "affordable",
    "rank",
    "remaining_budget",
    "shortfall",
    "label",
    "weighted_total",
    "weighted_average_display",
    "longest_trip",
    "contributions",
}
CONTRIBUTION_KEYS = {"place_id", "minutes", "importance", "contribution"}
ERROR_KEYS = {"field", "code", "message"}


def post(client, body):
    response = client.post("/api/compare", json=body)
    assert response.status_code == 200, response.text
    return response.json()


def with_(base, **changes):
    return {**base, **changes}


def assert_cleared(result):
    assert result["status"] == "INVALID"
    assert set(result) == RESULT_KEYS
    assert result["errors"]
    assert all(set(e) == ERROR_KEYS for e in result["errors"])
    assert result["importance_total"] is None
    assert result["budget"] is None
    assert result["recommended_hotel_id"] is None
    assert result["default_inspected_hotel_id"] is None
    assert result["hotels"] == []


def error_pairs(result):
    return {(e["code"], e["field"]) for e in result["errors"]}


# --- OK: the Demo trip ---------------------------------------------------------


def test_demo_preset_is_ok_and_matches_fixtures(client, demo_request):
    result = post(client, demo_request)
    assert result["status"] == "OK"
    assert result["errors"] == []
    assert result["importance_total"] == exp.IMPORTANCE_TOTAL
    assert result["budget"] == exp.BUDGET
    assert result["recommended_hotel_id"] == exp.RECOMMENDED_HOTEL_ID
    assert result["default_inspected_hotel_id"] == exp.DEFAULT_INSPECTED_HOTEL_ID
    assert len(result["hotels"]) == 10
    for hotel in result["hotels"]:
        want = exp.EXPECTED_HOTELS[hotel["id"]]
        for key, value in want.items():
            assert hotel[key] == value, (hotel["id"], key)
    ranked = [h["id"] for h in result["hotels"] if h["rank"] is not None]
    assert ranked == exp.EXPECTED_RANK_ORDER


def test_hotels_order_is_ranked_then_over_budget_by_total(client, demo_request):
    result = post(client, demo_request)
    ids = [h["id"] for h in result["hotels"]]
    assert ids[6:] == ["H_GHANTA", "H_HAVELI", "H_MAHAL", "H_LAKEVIEW"]


def test_ok_response_has_exactly_the_spec_keys(client, demo_request):
    result = post(client, demo_request)
    assert set(result) == RESULT_KEYS
    for hotel in result["hotels"]:
        assert set(hotel) == HOTEL_KEYS
        assert all(set(c) == CONTRIBUTION_KEYS for c in hotel["contributions"])
        assert isinstance(hotel["weighted_average_display"], str)
    labels = {h["id"]: h["label"] for h in result["hotels"]}
    assert labels["H_GARDEN"] == "RECOMMENDED"
    assert labels["H_STEPWELL"] == "RANKED"
    assert labels["H_GHANTA"] == "OVER_BUDGET"
    over = next(h for h in result["hotels"] if h["id"] == "H_GHANTA")
    assert over["rank"] is None and over["remaining_budget"] is None


def test_contributions_follow_place_ids_order(client, demo_request):
    result = post(client, demo_request)
    for hotel in result["hotels"]:
        assert [c["place_id"] for c in hotel["contributions"]] == demo_request["place_ids"]


# --- What-ifs --------------------------------------------------------------------


def test_budget_at_best_hotel_cost_recommends_it(client, demo_request):
    what = exp.WHATIF_BUDGET_EXACT
    result = post(client, with_(demo_request, budget=what["budget"]))
    assert result["recommended_hotel_id"] == what["recommended_hotel_id"]
    assert [h["id"] for h in result["hotels"] if h["rank"]] == what["rank_order"]


def test_budget_one_rupee_less_does_not_recommend_it(client, demo_request):
    what = exp.WHATIF_BUDGET_MINUS_ONE
    result = post(client, with_(demo_request, budget=what["budget"]))
    assert result["recommended_hotel_id"] == what["recommended_hotel_id"] != "H_GHANTA"
    ghanta = next(h for h in result["hotels"] if h["id"] == "H_GHANTA")
    assert ghanta["shortfall"] == 1 and ghanta["rank"] is None


def test_importance_change_flips_recommendation(client, demo_request):
    what = exp.WHATIF_IMPORTANCE_CHANGE
    importances = {**demo_request["importances"], what["place_id"]: what["new_importance"]}
    result = post(client, with_(demo_request, importances=importances))
    assert result["importance_total"] == what["importance_total"]
    assert result["recommended_hotel_id"] == what["recommended_hotel_id"]
    assert [h["id"] for h in result["hotels"] if h["rank"]] == what["rank_order"]
    for hotel in result["hotels"]:
        assert hotel["weighted_total"] == what["weighted_totals"][hotel["id"]]


def contributions(result):
    return {h["id"]: h["contributions"] for h in result["hotels"]}


def test_budget_change_keeps_contributions(client, demo_request):
    base = post(client, demo_request)
    other = post(client, with_(demo_request, budget=36500))
    assert contributions(base) == contributions(other)
    assert base["recommended_hotel_id"] != other["recommended_hotel_id"]


def test_importance_change_changes_contributions(client, demo_request):
    base = post(client, demo_request)
    importances = {**demo_request["importances"], "MUSEUM": 1}
    other = post(client, with_(demo_request, importances=importances))
    assert contributions(base) != contributions(other)


# --- NO_AFFORDABLE_HOTEL ---------------------------------------------------------


def test_budget_zero_is_no_affordable_hotel(client, demo_request):
    result = post(client, with_(demo_request, budget=0))
    assert result["status"] == "NO_AFFORDABLE_HOTEL"
    assert set(result) == RESULT_KEYS
    assert result["errors"] == []
    assert result["budget"] == 0
    assert result["importance_total"] == exp.IMPORTANCE_TOTAL
    assert result["recommended_hotel_id"] is None
    assert result["default_inspected_hotel_id"] == min(demo_request["hotel_ids"])
    assert len(result["hotels"]) == 10
    for hotel in result["hotels"]:
        assert set(hotel) == HOTEL_KEYS
        assert hotel["rank"] is None
        assert hotel["label"] == "OVER_BUDGET"
        assert hotel["remaining_budget"] is None
        assert hotel["shortfall"] == hotel["stay_cost"]


# --- INVALID: budget -------------------------------------------------------------


@pytest.mark.parametrize("budget", [-5, 1000001, 12.5, "100", True, None])
def test_bad_budget_is_invalid(client, demo_request, budget):
    result = post(client, with_(demo_request, budget=budget))
    assert_cleared(result)
    assert error_pairs(result) == {("BUDGET_INVALID", "budget")}


def test_missing_budget_key_is_invalid(client, demo_request):
    body = {k: v for k, v in demo_request.items() if k != "budget"}
    result = post(client, body)
    assert_cleared(result)
    assert error_pairs(result) == {("BUDGET_INVALID", "budget")}


# --- INVALID: importances --------------------------------------------------------


@pytest.mark.parametrize("value", [0, 6, "3", True, 2.0])
def test_bad_importance_is_invalid(client, demo_request, value):
    importances = {**demo_request["importances"], "CLOCK": value}
    result = post(client, with_(demo_request, importances=importances))
    assert_cleared(result)
    assert error_pairs(result) == {("IMPORTANCE_INVALID", "importances.CLOCK")}


def test_missing_importance_is_invalid(client, demo_request):
    importances = {k: v for k, v in demo_request["importances"].items() if k != "CLOCK"}
    result = post(client, with_(demo_request, importances=importances))
    assert_cleared(result)
    assert error_pairs(result) == {("IMPORTANCE_MISSING", "importances.CLOCK")}


def test_importance_for_unselected_place_is_invalid(client, demo_request):
    place_ids = [p for p in demo_request["place_ids"] if p != "KULFI"]
    result = post(client, with_(demo_request, place_ids=place_ids))
    assert_cleared(result)
    assert error_pairs(result) == {("IMPORTANCE_UNKNOWN", "importances.KULFI")}


def test_importances_not_an_object_is_invalid(client, demo_request):
    result = post(client, with_(demo_request, importances=[1, 2, 3]))
    assert_cleared(result)
    assert ("FIELD_TYPE", "importances") in error_pairs(result)


# --- INVALID: selection ----------------------------------------------------------


def test_duplicate_hotel_id_is_reported(client, demo_request):
    hotel_ids = [*demo_request["hotel_ids"][:9], demo_request["hotel_ids"][0]]
    result = post(client, with_(demo_request, hotel_ids=hotel_ids))
    assert_cleared(result)
    assert error_pairs(result) == {("DUPLICATE_ID", "hotels[9].id")}


def test_duplicate_place_id_is_reported(client, demo_request):
    place_ids = [*demo_request["place_ids"][:14], demo_request["place_ids"][0]]
    result = post(client, with_(demo_request, place_ids=place_ids))
    assert_cleared(result)
    assert ("DUPLICATE_ID", "places[14].id") in error_pairs(result)


def test_too_many_hotels_is_invalid(client, demo_request):
    hotel_ids = [*demo_request["hotel_ids"], demo_request["hotel_ids"][0]]  # 11 entries
    result = post(client, with_(demo_request, hotel_ids=hotel_ids))
    assert_cleared(result)
    assert ("HOTEL_COUNT", "hotel_ids") in error_pairs(result)
    assert ("DUPLICATE_ID", "hotels[10].id") in error_pairs(result)


def test_too_few_places_is_invalid(client, demo_request):
    place_ids = demo_request["place_ids"][:2]
    importances = {p: demo_request["importances"][p] for p in place_ids}
    result = post(client, with_(demo_request, place_ids=place_ids, importances=importances))
    assert_cleared(result)
    assert error_pairs(result) == {("PLACE_COUNT", "place_ids")}


def test_too_few_hotels_is_invalid(client, demo_request):
    result = post(client, with_(demo_request, hotel_ids=demo_request["hotel_ids"][:1]))
    assert_cleared(result)
    assert error_pairs(result) == {("HOTEL_COUNT", "hotel_ids")}


def test_unknown_hotel_id_is_invalid(client, demo_request):
    hotel_ids = [*demo_request["hotel_ids"][:9], "H_NOPE"]
    result = post(client, with_(demo_request, hotel_ids=hotel_ids))
    assert_cleared(result)
    assert error_pairs(result) == {("UNKNOWN_HOTEL", "hotel_ids[9]")}


def test_unknown_place_id_is_invalid(client, demo_request):
    place_ids = [*demo_request["place_ids"][:14], "NOWHERE"]
    result = post(client, with_(demo_request, place_ids=place_ids))
    assert_cleared(result)
    assert ("UNKNOWN_PLACE", "place_ids[14]") in error_pairs(result)


def test_non_string_ids_are_invalid_not_a_crash(client, demo_request):
    hotel_ids = [*demo_request["hotel_ids"][:9], 7]
    result = post(client, with_(demo_request, hotel_ids=hotel_ids))
    assert_cleared(result)
    assert ("UNKNOWN_HOTEL", "hotel_ids[9]") in error_pairs(result)


@pytest.mark.parametrize("field", ["hotel_ids", "place_ids"])
@pytest.mark.parametrize("value", ["H_GARDEN", 5, None, {"a": 1}])
def test_id_list_of_wrong_type_is_field_type(client, demo_request, field, value):
    result = post(client, with_(demo_request, **{field: value}))
    assert_cleared(result)
    # The validator names these fields "hotels" / "places" (see DECISIONS.md)
    assert ("FIELD_TYPE", "hotels" if field == "hotel_ids" else "places") in error_pairs(result)


# --- INVALID: catalog problems (overridden loader) -------------------------------


def test_catalog_row_missing_a_place_is_invalid(client, demo_request, override_catalog):
    override_catalog(lambda city: city["round_trip_minutes"]["H_GHANTA"].pop("CLOCK"))
    result = post(client, demo_request)
    assert_cleared(result)
    assert error_pairs(result) == {
        ("MAPPING_MISSING_PLACE", "hotels.H_GHANTA.round_trip_minutes.CLOCK")
    }


def test_catalog_row_with_extra_place_is_invalid(client, demo_request, override_catalog):
    override_catalog(lambda city: city["round_trip_minutes"]["H_GHANTA"].update(ZZZ=10))
    result = post(client, demo_request)
    assert_cleared(result)
    assert error_pairs(result) == {
        ("MAPPING_UNKNOWN_PLACE", "hotels.H_GHANTA.round_trip_minutes.ZZZ")
    }


def test_id_shared_by_hotel_and_place_is_invalid(client, demo_request, override_catalog):
    def edit(city):
        next(p for p in city["places"] if p["id"] == "KULFI")["id"] = "H_GARDEN"
        for row in city["round_trip_minutes"].values():
            row["H_GARDEN"] = row.pop("KULFI")

    override_catalog(edit)
    place_ids = [*demo_request["place_ids"][:14], "H_GARDEN"]
    importances = {**demo_request["importances"], "H_GARDEN": 2}
    del importances["KULFI"]
    result = post(client, with_(demo_request, place_ids=place_ids, importances=importances))
    assert_cleared(result)
    assert ("DUPLICATE_ID", "places[14].id") in error_pairs(result)


def test_catalog_bad_minutes_is_invalid(client, demo_request, override_catalog):
    override_catalog(lambda city: city["round_trip_minutes"]["H_GHANTA"].update(CLOCK=0))
    result = post(client, demo_request)
    assert_cleared(result)
    assert error_pairs(result) == {("MINUTES_INVALID", "hotels.H_GHANTA.round_trip_minutes.CLOCK")}


# --- HTTP behaviour --------------------------------------------------------------


def test_malformed_json_body_is_422_without_traceback(client):
    response = client.post(
        "/api/compare", content="{not json", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422
    assert "Traceback" not in response.text


@pytest.mark.parametrize("body", [[1, 2], "text", 5, None])
def test_non_object_body_is_422(client, body):
    response = client.post("/api/compare", json=body)
    assert response.status_code == 422
    assert "Traceback" not in response.text


@pytest.mark.parametrize("city_id", [None, 5, ["surmapur"]])
def test_missing_or_non_string_city_id_is_422(client, demo_request, city_id):
    body = {**demo_request, "city_id": city_id}
    assert client.post("/api/compare", json=body).status_code == 422
    del body["city_id"]
    assert client.post("/api/compare", json=body).status_code == 422


def test_unknown_city_is_404(client, demo_request):
    response = client.post("/api/compare", json=with_(demo_request, city_id="nowhere"))
    assert response.status_code == 404
    assert response.json() == {"detail": "Unknown city 'nowhere'"}


def test_same_request_twice_gives_identical_json(client, demo_request):
    first = client.post("/api/compare", json=demo_request)
    second = client.post("/api/compare", json=demo_request)
    assert first.content == second.content


def test_cors_preflight_from_vite_origin(client):
    response = client.options(
        "/api/compare",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_city_id_is_the_catalog_key(client, demo_request):
    assert demo_request["city_id"] == CITY_ID
