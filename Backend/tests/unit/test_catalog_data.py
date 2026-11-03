"""Shape and range checks on every shipped city file. Plain json only: no loader, no engine."""

import itertools
import json
import math
import re
from pathlib import Path

import pytest

CITIES_DIR = Path(__file__).resolve().parents[2] / "app" / "data" / "cities"
CITY_IDS = ["surmapur", "shikharpur"]
ID_FORMAT = re.compile(r"[A-Z][A-Z0-9_-]{0,15}")
MIN_MARKER_GAP_PX = 30


def _load(city_id):
    return json.loads((CITIES_DIR / f"{city_id}.json").read_text(encoding="utf-8"))


def _is_whole(value):
    return type(value) is int


@pytest.fixture(params=CITY_IDS)
def city(request):
    return _load(request.param)


def test_file_name_matches_city_id(city):
    assert (CITIES_DIR / f"{city['city_id']}.json").exists()
    assert city["name"].strip()


def test_counts(city):
    assert len(city["hotels"]) == 30
    assert len(city["places"]) == 50


def test_ids_are_valid_and_unique_across_hotels_and_places(city):
    ids = [h["id"] for h in city["hotels"]] + [p["id"] for p in city["places"]]
    assert all(ID_FORMAT.fullmatch(i) for i in ids)
    assert len(ids) == len(set(ids)) == 80


def test_names_are_not_blank(city):
    assert all(h["name"].strip() for h in city["hotels"])
    assert all(p["name"].strip() for p in city["places"])


def test_place_types_and_mix(city):
    types = [p["type"] for p in city["places"]]
    assert set(types) <= {"attraction", "food"}
    assert types.count("attraction") >= 10
    assert types.count("food") >= 10


def test_stay_costs_are_whole_rupees_in_range(city):
    assert all(
        _is_whole(h["stay_cost"]) and 1 <= h["stay_cost"] <= 1_000_000 for h in city["hotels"]
    )


def test_default_importances_in_range_and_varied(city):
    values = [p["default_importance"] for p in city["places"]]
    assert all(_is_whole(v) and 1 <= v <= 5 for v in values)
    assert len(set(values)) >= 3


def test_every_hotel_row_has_exactly_the_place_keys(city):
    place_ids = {p["id"] for p in city["places"]}
    matrix = city["round_trip_minutes"]
    assert set(matrix) == {h["id"] for h in city["hotels"]}
    assert all(set(row) == place_ids for row in matrix.values())


def test_all_minutes_are_whole_numbers_1_to_600(city):
    cells = [m for row in city["round_trip_minutes"].values() for m in row.values()]
    assert len(cells) == 1500
    assert all(_is_whole(m) and 1 <= m <= 600 for m in cells)


def test_districts_exist_and_are_unique(city):
    district_ids = [d["id"] for d in city["districts"]]
    assert len(district_ids) == len(set(district_ids)) and district_ids
    assert all(d["name"].strip() for d in city["districts"])
    for record in city["hotels"] + city["places"]:
        assert record["district_id"] in district_ids


def test_positions_are_on_the_canvas_and_markers_are_apart(city):
    width, height = city["map"]["width"], city["map"]["height"]
    points = []
    for record in city["hotels"] + city["places"]:
        x, y = record["position"]["x"], record["position"]["y"]
        assert _is_whole(x) and _is_whole(y)
        assert 0 <= x <= width and 0 <= y <= height, record["id"]
        points.append((record["id"], x, y))
    for a, b in itertools.combinations(points, 2):
        assert math.dist(a[1:], b[1:]) >= MIN_MARKER_GAP_PX, (a[0], b[0])


def test_demo_preset_only_on_the_primary_city():
    assert _load("surmapur")["demo_preset"] is not None
    assert _load("shikharpur")["demo_preset"] is None


def test_file_loads_twice_identically(city):
    again = _load(city["city_id"])
    assert again == city
    assert json.dumps(again, sort_keys=True) == json.dumps(city, sort_keys=True)
