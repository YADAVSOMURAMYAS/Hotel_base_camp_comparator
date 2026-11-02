import dataclasses
import json
from pathlib import Path

import pytest

from app.domain.models import (
    ComparisonResult,
    Hotel,
    Place,
    PlaceType,
    RawHotel,
    RawPlace,
    RawScenario,
    Scenario,
    Status,
)
from app.domain.validation import validate, validate_scenario

PLACE_IDS = ("P1", "P2", "P3")
NAN = float("nan")


# --- Builders: a small valid baseline (2 hotels, 3 places) -------------------


def minutes(place_ids=PLACE_IDS, value=10):
    return {place_id: value for place_id in place_ids}


def hotel(id="H1", name="Hotel", stay_cost=1000, row=None):
    return RawHotel(id, name, stay_cost, minutes() if row is None else row)


def place(id="P1", name="Place", type="attraction"):
    return RawPlace(id, name, type)


def make_raw(hotels=None, places=None, importances=None, budget=5000):
    return RawScenario(
        hotels=[hotel("H1"), hotel("H2")] if hotels is None else hotels,
        places=[place("P1"), place("P2"), place("P3")] if places is None else places,
        importances={"P1": 1, "P2": 2, "P3": 3} if importances is None else importances,
        budget=budget,
    )


def sized(n_hotels, n_places):
    ids = [f"P{i}" for i in range(1, n_places + 1)]
    return RawScenario(
        hotels=[hotel(f"H{i}", row=minutes(ids)) for i in range(1, n_hotels + 1)],
        places=[place(i) for i in ids],
        importances={i: 1 for i in ids},
        budget=5000,
    )


def found(raw):
    """(field, code) pairs of every error, in order."""
    return [(e.field, e.code) for e in validate(raw)]


# --- Baseline and result type -------------------------------------------------


def test_baseline_is_valid():
    outcome = validate_scenario(make_raw())
    assert outcome.errors == ()
    assert outcome.ok
    assert isinstance(outcome.scenario, Scenario)
    assert validate(make_raw()) == []


def test_invalid_outcome_has_no_scenario_and_builds_cleared_result():
    outcome = validate_scenario(make_raw(budget="5000"))
    assert not outcome.ok
    assert outcome.scenario is None
    result = outcome.to_invalid_result()
    assert result.status is Status.INVALID
    assert result.errors == outcome.errors
    assert result.importance_total is None
    assert result.budget is None
    assert result.recommended_hotel_id is None
    assert result.default_inspected_hotel_id is None
    assert result.hotels == ()
    assert result == ComparisonResult.invalid(outcome.errors)


def test_valid_outcome_cannot_become_invalid_result():
    with pytest.raises(ValueError):
        validate_scenario(make_raw()).to_invalid_result()


def test_validate_matches_outcome_errors():
    raw = make_raw(budget=None)
    assert validate(raw) == list(validate_scenario(raw).errors)


# --- Rule 1: counts -----------------------------------------------------------


@pytest.mark.parametrize("n", [1, 11])
def test_hotel_count_out_of_range(n):
    assert found(sized(n, 3)) == [("hotel_ids", "HOTEL_COUNT")]


@pytest.mark.parametrize("n", [2, 10])
def test_hotel_count_boundaries_valid(n):
    assert found(sized(n, 3)) == []


@pytest.mark.parametrize("n", [2, 16])
def test_place_count_out_of_range(n):
    assert found(sized(2, n)) == [("place_ids", "PLACE_COUNT")]


@pytest.mark.parametrize("n", [3, 15])
def test_place_count_boundaries_valid(n):
    assert found(sized(2, n)) == []


# --- Rule 2: IDs --------------------------------------------------------------

BAD_IDS = [
    "h1",
    "",
    "1A",
    "_A",
    "-A",
    "A" * 17,
    "H1\n",
    "Н1",  # Cyrillic capital En
    "Η1",  # Greek capital Eta
    5,
    None,
]


@pytest.mark.parametrize("bad", BAD_IDS)
def test_hotel_id_format(bad):
    raw = make_raw(hotels=[hotel(bad, row=minutes()), hotel("H2")])
    assert found(raw) == [("hotels[0].id", "ID_FORMAT")]


@pytest.mark.parametrize("bad", BAD_IDS)
def test_place_id_format(bad):
    # The bad place keeps its slot; rows and importances use the same (bad) key.
    # Only string IDs can be keys (JSON), so a non-string bad ID has no key.
    ids = tuple(i for i in ("P1", "P2", bad) if isinstance(i, str))
    raw = make_raw(
        hotels=[hotel("H1", row=minutes(ids)), hotel("H2", row=minutes(ids))],
        places=[place("P1"), place("P2"), place(bad)],
        importances={i: 1 for i in ids},
    )
    assert found(raw) == [("places[2].id", "ID_FORMAT")]


def test_sixteen_character_ids_are_valid():
    long_id = "A" * 16
    raw = make_raw(
        hotels=[hotel(long_id), hotel("H2")],
        places=[place("P1"), place("P2"), place("P3")],
    )
    assert found(raw) == []


def test_duplicate_hotel_id_reported_on_second_occurrence_only():
    raw = make_raw(hotels=[hotel("H1"), hotel("H1")])
    assert found(raw) == [("hotels[1].id", "DUPLICATE_ID")]


def test_duplicate_place_id_reported_on_second_occurrence_only():
    raw = make_raw(
        places=[place("P1"), place("P2"), place("P3"), place("P1")],
    )
    assert found(raw) == [("places[3].id", "DUPLICATE_ID")]


def test_hotel_id_equal_to_place_id_is_duplicate_on_the_place():
    ids = ("P1", "P2", "H1")
    raw = make_raw(
        hotels=[hotel("H1", row=minutes(ids)), hotel("H2", row=minutes(ids))],
        places=[place("P1"), place("P2"), place("H1")],
        importances={"P1": 1, "P2": 2, "H1": 3},
    )
    assert found(raw) == [("places[2].id", "DUPLICATE_ID")]


def test_duplicate_message_names_the_id():
    errors = validate(make_raw(hotels=[hotel("H1"), hotel("H1")]))
    assert "H1" in errors[0].message


def test_id_error_does_not_hide_other_errors_on_the_same_hotel():
    row = {"P1": 0, "P2": "10"}  # P3 missing, two bad values
    raw = make_raw(hotels=[hotel("h1", stay_cost=0, row=row), hotel("H2")])
    assert found(raw) == [
        ("hotels[0].id", "ID_FORMAT"),
        ("hotels[0].stay_cost", "STAY_COST_INVALID"),
        ("hotels[0].round_trip_minutes.P1", "MINUTES_INVALID"),
        ("hotels[0].round_trip_minutes.P2", "MINUTES_INVALID"),
        ("hotels[0].round_trip_minutes.P3", "MAPPING_MISSING_PLACE"),
    ]


def test_duplicate_id_does_not_hide_other_errors_on_the_same_hotel():
    raw = make_raw(hotels=[hotel("H1"), hotel("H1", stay_cost=None, name=" ")])
    assert found(raw) == [
        ("hotels[1].id", "DUPLICATE_ID"),
        ("hotels[1].name", "NAME_BLANK"),
        ("hotels[1].stay_cost", "STAY_COST_INVALID"),
    ]


def test_bad_place_id_does_not_cascade_but_real_errors_are_still_reported():
    ids = ("P1", "P2", "bad")
    raw = make_raw(
        hotels=[
            hotel("H1", row=minutes(ids)),
            hotel("H2", row={"P2": 10, "bad": 10, "P9": 10}),  # P1 missing, P9 unknown
        ],
        places=[place("P1"), place("P2"), place("bad")],
        importances={"P1": 1, "P2": 9, "bad": 3, "P8": 2},  # P2 bad, P8 unknown
    )
    assert found(raw) == [
        ("places[2].id", "ID_FORMAT"),
        ("hotels.H2.round_trip_minutes.P1", "MAPPING_MISSING_PLACE"),
        ("hotels.H2.round_trip_minutes.P9", "MAPPING_UNKNOWN_PLACE"),
        ("importances.P2", "IMPORTANCE_INVALID"),
        ("importances.P8", "IMPORTANCE_UNKNOWN"),
    ]


# --- Rule 3: names ------------------------------------------------------------


@pytest.mark.parametrize("bad", ["", "   ", "\t\n", None, 5, ["x"]])
def test_hotel_name_blank(bad):
    raw = make_raw(hotels=[hotel("H1", name=bad), hotel("H2")])
    assert found(raw) == [("hotels[0].name", "NAME_BLANK")]


@pytest.mark.parametrize("bad", ["", "   ", "\t\n", None, 5, ["x"]])
def test_place_name_blank(bad):
    raw = make_raw(places=[place("P1", name=bad), place("P2"), place("P3")])
    assert found(raw) == [("places[0].name", "NAME_BLANK")]


def test_name_with_inner_spaces_is_valid():
    assert found(make_raw(hotels=[hotel("H1", name="  Old  Fort Inn "), hotel("H2")])) == []


# --- Rule 4: place type -------------------------------------------------------


@pytest.mark.parametrize("bad", ["Attraction", "museum", "FOOD", "", None, 1])
def test_place_type_invalid(bad):
    raw = make_raw(places=[place("P1", type=bad), place("P2"), place("P3")])
    assert found(raw) == [("places[0].type", "PLACE_TYPE")]


@pytest.mark.parametrize("good", ["attraction", "food"])
def test_place_type_valid(good):
    raw = make_raw(places=[place("P1", type=good), place("P2"), place("P3")])
    outcome = validate_scenario(raw)
    assert outcome.errors == ()
    assert outcome.scenario.places[0].type is PlaceType(good)


# --- Rule 5: numbers ----------------------------------------------------------

NUMBER_FIELDS = {
    "budget": (0, 1_000_000, "BUDGET_INVALID", "budget"),
    "stay_cost": (1, 1_000_000, "STAY_COST_INVALID", "hotels.H1.stay_cost"),
    "importance": (1, 5, "IMPORTANCE_INVALID", "importances.P1"),
    "minutes": (1, 600, "MINUTES_INVALID", "hotels.H1.round_trip_minutes.P1"),
}


def with_number(name, value):
    if name == "budget":
        return make_raw(budget=value)
    if name == "stay_cost":
        return make_raw(hotels=[hotel("H1", stay_cost=value), hotel("H2")])
    if name == "importance":
        return make_raw(importances={"P1": value, "P2": 2, "P3": 3})
    return make_raw(hotels=[hotel("H1", row={"P1": value, "P2": 10, "P3": 10}), hotel("H2")])


def number_cases(kind):
    lo, hi, _, _ = NUMBER_FIELDS[kind]
    return [lo - 1, hi + 1, True, False, 5.0, 1.0, "5", None, NAN]


@pytest.mark.parametrize("kind", NUMBER_FIELDS)
def test_number_rejects_bad_values(kind):
    _, _, code, field = NUMBER_FIELDS[kind]
    for bad in number_cases(kind):
        assert found(with_number(kind, bad)) == [(field, code)], repr(bad)


@pytest.mark.parametrize("kind", NUMBER_FIELDS)
def test_number_accepts_exact_boundaries(kind):
    lo, hi, _, _ = NUMBER_FIELDS[kind]
    assert found(with_number(kind, lo)) == []
    assert found(with_number(kind, hi)) == []


def test_number_message_names_the_value_owner():
    errors = validate(make_raw(importances={"P1": 6, "P2": 2, "P3": 3}))
    assert errors[0].message == "Importance for P1 must be a whole number from 1 to 5"
    assert validate(make_raw(budget="5000"))[0].message == (
        "Budget must be a whole number from 0 to 1,000,000"
    )


# --- Rule 6: round-trip mapping -----------------------------------------------


def test_matrix_missing_place_key():
    raw = make_raw(hotels=[hotel("H1", row={"P1": 10, "P3": 10}), hotel("H2")])
    assert found(raw) == [("hotels.H1.round_trip_minutes.P2", "MAPPING_MISSING_PLACE")]


def test_matrix_unknown_place_key():
    raw = make_raw(hotels=[hotel("H1", row={**minutes(), "P9": 10}), hotel("H2")])
    assert found(raw) == [("hotels.H1.round_trip_minutes.P9", "MAPPING_UNKNOWN_PLACE")]


def test_matrix_non_string_key_is_unknown():
    raw = make_raw(hotels=[hotel("H1", row={**minutes(), 7: 10}), hotel("H2")])
    assert found(raw) == [("hotels.H1.round_trip_minutes.7", "MAPPING_UNKNOWN_PLACE")]


def test_matrix_missing_and_unknown_reported_separately_with_names():
    raw = make_raw(hotels=[hotel("H1", row={"P1": 10, "P2": 10, "PX": 10}), hotel("H2")])
    errors = validate(raw)
    assert [(e.field, e.code) for e in errors] == [
        ("hotels.H1.round_trip_minutes.P3", "MAPPING_MISSING_PLACE"),
        ("hotels.H1.round_trip_minutes.PX", "MAPPING_UNKNOWN_PLACE"),
    ]
    assert "H1" in errors[0].message and "P3" in errors[0].message
    assert "H1" in errors[1].message and "PX" in errors[1].message


@pytest.mark.parametrize("bad", [None, [], "P1", 5, [("P1", 10)]])
def test_matrix_row_not_a_mapping(bad):
    # Built directly: hotel() treats row=None as "use the default row".
    raw = make_raw(hotels=[RawHotel("H1", "Hotel", 1000, bad), hotel("H2")])
    assert found(raw) == [("hotels.H1.round_trip_minutes", "FIELD_TYPE")]


# --- Rule 7: importances ------------------------------------------------------


def test_importance_missing_place():
    assert found(make_raw(importances={"P1": 1, "P3": 3})) == [
        ("importances.P2", "IMPORTANCE_MISSING")
    ]


def test_importance_extra_place():
    assert found(make_raw(importances={"P1": 1, "P2": 2, "P3": 3, "P9": 1})) == [
        ("importances.P9", "IMPORTANCE_UNKNOWN")
    ]


@pytest.mark.parametrize("bad", [None, [], "x", 5])
def test_importances_not_a_mapping(bad):
    raw = dataclasses.replace(make_raw(), importances=bad)  # make_raw maps None to a default
    assert found(raw) == [("importances", "FIELD_TYPE")]


# --- Rule 8: structure, ordering, no exceptions -------------------------------


@pytest.mark.parametrize("bad", [None, {}, "x", 5, {"a": 1}])
def test_hotels_container_wrong_type(bad):
    raw = RawScenario(bad, make_raw().places, make_raw().importances, 5000)
    assert found(raw) == [("hotels", "FIELD_TYPE")]


@pytest.mark.parametrize("bad", [None, {}, "x", 5])
def test_places_container_wrong_type(bad):
    raw = RawScenario(make_raw().hotels, bad, make_raw().importances, 5000)
    assert found(raw) == [("places", "FIELD_TYPE")]


def test_hotel_and_place_items_wrong_type():
    raw = make_raw(
        hotels=[hotel("H1"), hotel("H2"), "H3"],
        places=[place("P1"), place("P2"), place("P3"), {"id": "P4"}],
    )
    assert found(raw) == [("hotels[2]", "FIELD_TYPE"), ("places[3]", "FIELD_TYPE")]


def test_scenario_object_wrong_type():
    assert found(None) == [("scenario", "FIELD_TYPE")]


def test_multiple_errors_all_returned_in_documented_order():
    raw = make_raw(
        hotels=[
            hotel("H1", name=" ", row={"P1": 10, "P2": 0, "P3": 10}),
            hotel("H2", stay_cost=None),
        ],
        places=[place("P1", type="museum"), place("P2"), place("P3")],
        importances={"P1": 9, "P2": 2, "P3": 3},
        budget=-1,
    )
    assert found(raw) == [
        ("hotels[0].name", "NAME_BLANK"),
        ("hotels.H2.stay_cost", "STAY_COST_INVALID"),
        ("places[0].type", "PLACE_TYPE"),
        ("hotels.H1.round_trip_minutes.P2", "MINUTES_INVALID"),
        ("importances.P1", "IMPORTANCE_INVALID"),
        ("budget", "BUDGET_INVALID"),
    ]


def test_error_order_is_stable_across_runs():
    raw = make_raw(budget=None, importances={"P1": 0})
    assert validate(raw) == validate(raw)


GARBAGE = [
    None,
    [],
    "x",
    5,
    RawScenario(None, None, None, None),
    RawScenario([], [], [], []),
    RawScenario("a", "b", "c", "d"),
    RawScenario([None, 1, "x", {}], [[]], 5, []),
    RawScenario([RawHotel(None, None, None, None)] * 2, [RawPlace(None, None, None)] * 3, {}, {}),
    RawScenario([RawHotel([], {}, [], 7)] * 3, [RawPlace([], [], [])] * 3, {1: 2}, [1]),
    RawScenario([hotel("H1"), hotel("H2")], [place({}), place(()), place(set())], {"P1": []}, {}),
    RawScenario([RawHotel("H1", "n", 1, {None: None, (1,): [2]})] * 2, [place("P1")] * 3, {}, 1.5),
]


@pytest.mark.parametrize("garbage", GARBAGE)
def test_validator_never_raises_on_garbage(garbage):
    outcome = validate_scenario(garbage)
    assert outcome.errors
    assert outcome.scenario is None
    assert not outcome.ok
    assert outcome.to_invalid_result().status is Status.INVALID


# --- Validated models: copies and immutable -----------------------------------


def test_validated_models_are_new_typed_objects():
    raw = make_raw()
    scenario = validate_scenario(raw).scenario
    assert all(isinstance(h, Hotel) for h in scenario.hotels)
    assert all(isinstance(p, Place) for p in scenario.places)
    assert scenario.hotels is not raw.hotels
    assert scenario.importances is not raw.importances
    assert scenario.round_trip_minutes["H1"] is not raw.hotels[0].round_trip_minutes
    assert [h.id for h in scenario.hotels] == ["H1", "H2"]
    assert [p.id for p in scenario.places] == ["P1", "P2", "P3"]
    assert scenario.budget == 5000
    assert scenario.importances == {"P1": 1, "P2": 2, "P3": 3}
    assert scenario.round_trip_minutes["H2"]["P3"] == 10


def test_validated_models_are_immutable():
    scenario = validate_scenario(make_raw()).scenario
    with pytest.raises(dataclasses.FrozenInstanceError):
        scenario.budget = 1  # type: ignore[misc]
    with pytest.raises(dataclasses.FrozenInstanceError):
        scenario.hotels[0].stay_cost = 1  # type: ignore[misc]
    with pytest.raises(TypeError):
        scenario.importances["P1"] = 5  # type: ignore[index]
    with pytest.raises(TypeError):
        scenario.round_trip_minutes["H1"]["P1"] = 1  # type: ignore[index]
    with pytest.raises(TypeError):
        scenario.round_trip_minutes["H9"] = {}  # type: ignore[index]
    assert isinstance(scenario.hotels, tuple)
    assert isinstance(scenario.places, tuple)


def test_changing_raw_input_afterwards_does_not_change_the_scenario():
    raw = make_raw()
    scenario = validate_scenario(raw).scenario
    raw.importances["P1"] = 5
    raw.hotels[0].round_trip_minutes["P1"] = 99
    assert scenario.importances["P1"] == 1
    assert scenario.round_trip_minutes["H1"]["P1"] == 10


# --- Sanity: the Demo trip from the shipped catalog ---------------------------

CITY_FILE = Path(__file__).resolve().parents[2] / "app" / "data" / "cities" / "surmapur.json"


def demo_raw_scenario():
    city = json.loads(CITY_FILE.read_text(encoding="utf-8"))
    demo = city["demo_preset"]
    hotels = {h["id"]: h for h in city["hotels"]}
    places = {p["id"]: p for p in city["places"]}
    return RawScenario(
        hotels=[
            RawHotel(
                id=hid,
                name=hotels[hid]["name"],
                stay_cost=hotels[hid]["stay_cost"],
                round_trip_minutes={
                    pid: city["round_trip_minutes"][hid][pid] for pid in demo["place_ids"]
                },
            )
            for hid in demo["hotel_ids"]
        ],
        places=[
            RawPlace(id=pid, name=places[pid]["name"], type=places[pid]["type"])
            for pid in demo["place_ids"]
        ],
        importances=dict(demo["importances"]),
        budget=demo["budget"],
    )


def test_demo_trip_validates_with_zero_errors():
    raw = demo_raw_scenario()
    outcome = validate_scenario(raw)
    assert outcome.errors == ()
    assert len(outcome.scenario.hotels) == 10
    assert len(outcome.scenario.places) == 15
    assert outcome.scenario.budget == 30000
