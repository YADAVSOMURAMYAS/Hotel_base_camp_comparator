"""scripts/design_helper.py: reproduces the committed city files, deterministically."""

import ast
import importlib.util
import json
from pathlib import Path

import pytest
from test_demo_freeze import DEMO_BLOCK_SHA256, _sha256

BACKEND = Path(__file__).resolve().parents[2]
SCRIPT = BACKEND / "scripts" / "design_helper.py"
CITIES_DIR = BACKEND / "app" / "data" / "cities"
CITY_IDS = ["surmapur", "shikharpur"]
FORBIDDEN_IMPORTS = {"random", "secrets", "time", "datetime", "numpy"}


@pytest.fixture(scope="module")
def helper():
    spec = importlib.util.spec_from_file_location("design_helper", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def generated(helper, tmp_path_factory):
    out = tmp_path_factory.mktemp("generated")
    helper.generate(out)
    return out


@pytest.mark.parametrize("city_id", CITY_IDS)
def test_output_matches_committed_file_byte_for_byte(generated, city_id):
    name = f"{city_id}.json"
    assert (generated / name).read_bytes() == (CITIES_DIR / name).read_bytes()


def test_running_twice_is_identical(helper, generated, tmp_path):
    helper.generate(tmp_path)
    for city_id in CITY_IDS:
        name = f"{city_id}.json"
        assert (tmp_path / name).read_bytes() == (generated / name).read_bytes()


def test_demo_block_is_untouched_after_generation(generated):
    city = json.loads((generated / "surmapur.json").read_text(encoding="utf-8"))
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


def test_generator_imports_nothing_nondeterministic():
    imported = set()
    for node in ast.walk(ast.parse(SCRIPT.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            imported |= {a.name.split(".")[0] for a in node.names}
        elif isinstance(node, ast.ImportFrom) and node.module:
            imported.add(node.module.split(".")[0])
    assert not imported & FORBIDDEN_IMPORTS


def test_generator_never_reads_position_fields():
    sources = [
        SCRIPT.read_text(encoding="utf-8"),
        (BACKEND / "scripts" / "catalog_design.py").read_text(encoding="utf-8"),
    ]
    for source in sources:
        for node in ast.walk(ast.parse(source)):
            if isinstance(node, ast.Subscript):
                assert not (isinstance(node.slice, ast.Constant) and node.slice.value == "position")
            if isinstance(node, ast.Attribute):
                assert node.attr != "position"
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                first = node.args[0] if node.args else None
                assert not (
                    node.func.attr in {"get", "pop"}
                    and isinstance(first, ast.Constant)
                    and first.value == "position"
                )


@pytest.mark.parametrize("city_id", CITY_IDS)
def test_same_district_trips_are_shorter_on_average(city_id):
    city = json.loads((CITIES_DIR / f"{city_id}.json").read_text(encoding="utf-8"))
    hotel_district = {h["id"]: h["district_id"] for h in city["hotels"]}
    place_district = {p["id"]: p["district_id"] for p in city["places"]}
    same, cross = [], []
    for hotel_id, row in city["round_trip_minutes"].items():
        for place_id, minutes in row.items():
            same_district = hotel_district[hotel_id] == place_district[place_id]
            (same if same_district else cross).append(minutes)
    assert sum(same) * len(cross) < sum(cross) * len(same)
