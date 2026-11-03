"""The Demo trip is frozen: T15 grows the catalog around it without changing one value.

Both hashes were computed from the T03 file before the catalog grew:
    sha256(json.dumps(block, sort_keys=True, separators=(",", ":"), ensure_ascii=False))
"""

import hashlib
import json
from pathlib import Path

CITY_FILE = Path(__file__).resolve().parents[2] / "app" / "data" / "cities" / "surmapur.json"

DEMO_BLOCK_SHA256 = "7b944cab2f0cbc250e438fbbb73b872ef94ed51986db14751ec2bcb2698d5507"
MAP_DISTRICTS_SHA256 = "65d729fea27ccbeca92a92fcc3791a053c3bc03c4fd4232032ab58b63bf306e7"

DEMO_HOTEL_IDS = [
    "H_GHANTA", "H_HAVELI", "H_MAHAL", "H_STEPWELL", "H_NEELGHAT",
    "H_RIVERBRZ", "H_CIVIL", "H_GARDEN", "H_LAKEVIEW", "H_HILLTOP",
]  # fmt: skip
DEMO_PLACE_IDS = [
    "CLOCK", "FORTGATE", "MUSEUM", "NIGHTMKT", "RIVERWALK", "STEPWELL", "VIEWPOINT", "GARDEN",
    "KACHORI", "BIRYANI", "CHAI", "JALEBI", "FISHCURRY", "THALI", "KULFI",
]  # fmt: skip


def _sha256(value) -> str:
    text = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _city():
    return json.loads(CITY_FILE.read_text(encoding="utf-8"))


def test_demo_block_is_byte_for_byte_the_t03_data():
    city = _city()
    preset = city["demo_preset"]
    hotels = {h["id"]: h for h in city["hotels"]}
    places = {p["id"]: p for p in city["places"]}
    block = {
        "hotels": [hotels[i] for i in preset["hotel_ids"]],
        "places": [places[i] for i in preset["place_ids"]],
        "round_trip_minutes": {
            h: {p: city["round_trip_minutes"][h][p] for p in preset["place_ids"]}
            for h in preset["hotel_ids"]
        },
        "demo_preset": preset,
    }
    assert _sha256(block) == DEMO_BLOCK_SHA256


def test_map_and_districts_are_unchanged():
    city = _city()
    assert _sha256({"map": city["map"], "districts": city["districts"]}) == MAP_DISTRICTS_SHA256


def test_demo_ids_are_unchanged_and_first_in_file_order():
    city = _city()
    assert [h["id"] for h in city["hotels"][:10]] == DEMO_HOTEL_IDS
    assert [p["id"] for p in city["places"][:15]] == DEMO_PLACE_IDS
    assert city["demo_preset"]["hotel_ids"] == DEMO_HOTEL_IDS
    assert city["demo_preset"]["place_ids"] == DEMO_PLACE_IDS


def test_demo_matrix_rows_keep_demo_columns_first():
    """New columns are appended after the 15 Demo places; new rows after the 10 Demo hotels."""
    matrix = _city()["round_trip_minutes"]
    assert list(matrix)[:10] == DEMO_HOTEL_IDS
    for hotel_id in DEMO_HOTEL_IDS:
        assert list(matrix[hotel_id])[:15] == DEMO_PLACE_IDS
