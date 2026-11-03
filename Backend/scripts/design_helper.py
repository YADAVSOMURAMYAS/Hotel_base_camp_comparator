"""One-off deterministic generator for the Phase B city files (T15).

    python scripts/design_helper.py [--out DIR]      # default: Backend/app/data/cities

    minutes(h, p) = base[district(h)][district(p)] + hotel_offset(h) + place_offset(p)

Offsets for NEW hotels / places come from their index in the final file order:
    hotel_offset(i) = (i * 7) % 13 - 6      -> -6..+6
    place_offset(j) = (j * 5) % 11 - 5      -> -5..+5
The Demo hotels and places keep their hand-authored offsets, and the Demo 10x15 cells are
copied through from the existing surmapur.json, so the Demo trip is never regenerated.
Integers only: no randomness, no time, no map positions. A value outside 1..600 raises.

The output is what gets committed; the app never imports this script.
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # sibling data module

import catalog_design as design  # noqa: E402

CITIES_DIR = Path(__file__).resolve().parents[1] / "app" / "data" / "cities"


def hotel_offset(index: int) -> int:
    return (index * 7) % 13 - 6


def place_offset(index: int) -> int:
    return (index * 5) % 11 - 5


def minutes(base: list[list[int]], hotel_district: int, place_district: int, offsets: int) -> int:
    value = base[hotel_district][place_district] + offsets
    if not 1 <= value <= 600:
        raise ValueError(f"generated {value} minutes is outside 1..600")
    return value


# ---- record builders --------------------------------------------------------------------------


def _hotel(row: tuple) -> dict:
    hotel_id, name, stay_cost, district_id, x, y = row
    return {
        "id": hotel_id,
        "name": name,
        "stay_cost": stay_cost,
        "district_id": district_id,
        "position": {"x": x, "y": y},
    }


def _place(row: tuple) -> dict:
    place_id, name, kind, importance, district_id, x, y = row
    return {
        "id": place_id,
        "name": name,
        "type": kind,
        "default_importance": importance,
        "district_id": district_id,
        "position": {"x": x, "y": y},
    }


def _matrix(hotels, places, base, order, hotel_offsets, place_offsets, copied) -> dict:
    """Every hotel x place cell. `copied` holds the cells that are taken as they are."""
    column = {district: i for i, district in enumerate(order)}
    rows = {}
    for h, hotel in enumerate(hotels):
        rows[hotel["id"]] = {}
        for p, place in enumerate(places):
            if hotel["id"] in copied and place["id"] in copied[hotel["id"]]:
                value = copied[hotel["id"]][place["id"]]
            else:
                value = minutes(
                    base,
                    column[hotel["district_id"]],
                    column[place["district_id"]],
                    hotel_offsets[h] + place_offsets[p],
                )
            rows[hotel["id"]][place["id"]] = value
    return rows


# ---- the two cities ---------------------------------------------------------------------------


def build_surmapur(source: dict) -> dict:
    """`source` is the existing surmapur.json; only its Demo block is read."""
    preset = source["demo_preset"]
    by_hotel = {h["id"]: h for h in source["hotels"]}
    by_place = {p["id"]: p for p in source["places"]}
    hotels = [by_hotel[i] for i in preset["hotel_ids"]] + [
        _hotel(r) for r in design.SURMAPUR_NEW_HOTELS
    ]
    places = [by_place[i] for i in preset["place_ids"]] + [
        _place(r) for r in design.SURMAPUR_NEW_PLACES
    ]
    hotel_offsets = design.SURMAPUR_DEMO_HOTEL_OFFSETS + [
        hotel_offset(i) for i in range(len(preset["hotel_ids"]), len(hotels))
    ]
    place_offsets = design.SURMAPUR_DEMO_PLACE_OFFSETS + [
        place_offset(j) for j in range(len(preset["place_ids"]), len(places))
    ]
    copied = {
        h: {p: source["round_trip_minutes"][h][p] for p in preset["place_ids"]}
        for h in preset["hotel_ids"]
    }
    return {
        "city_id": source["city_id"],
        "name": source["name"],
        "map": source["map"],
        "districts": source["districts"],
        "hotels": hotels,
        "places": places,
        "round_trip_minutes": _matrix(
            hotels,
            places,
            design.SURMAPUR_BASE,
            design.SURMAPUR_DISTRICT_ORDER,
            hotel_offsets,
            place_offsets,
            copied,
        ),
        "demo_preset": preset,
    }


def build_shikharpur() -> dict:
    hotels = [_hotel(r) for r in design.SHIKHARPUR_HOTELS]
    places = [_place(r) for r in design.SHIKHARPUR_PLACES]
    order = [district_id for district_id, _ in design.SHIKHARPUR_DISTRICTS]
    return {
        "city_id": "shikharpur",
        "name": "Shikharpur",
        "map": dict(design.MAP),
        "districts": [{"id": i, "name": n} for i, n in design.SHIKHARPUR_DISTRICTS],
        "hotels": hotels,
        "places": places,
        "round_trip_minutes": _matrix(
            hotels,
            places,
            design.SHIKHARPUR_BASE,
            order,
            [hotel_offset(i) for i in range(len(hotels))],
            [place_offset(j) for j in range(len(places))],
            {},
        ),
        "demo_preset": None,
    }


# ---- stable formatting (same layout as the T03 file) -------------------------------------------


def _inline(value) -> str:
    if isinstance(value, dict):
        return "{ " + ", ".join(f"{json.dumps(k)}: {_inline(v)}" for k, v in value.items()) + " }"
    if isinstance(value, list):
        return "[" + ", ".join(_inline(v) for v in value) + "]"
    return json.dumps(value, ensure_ascii=False)


def dump_city(city: dict) -> str:
    """2-space indent, fixed key order, one record or matrix row per line."""
    parts = []
    for key, value in city.items():
        if key in ("districts", "hotels", "places"):
            rows = ",\n".join(f"    {_inline(row)}" for row in value)
            parts.append(f'  "{key}": [\n{rows}\n  ]')
        elif key == "round_trip_minutes":
            rows = ",\n".join(f"    {json.dumps(h)}: {_inline(row)}" for h, row in value.items())
            parts.append(f'  "{key}": {{\n{rows}\n  }}')
        elif key == "demo_preset" and value is not None:
            rows = ",\n".join(f"    {json.dumps(k)}: {_inline(v)}" for k, v in value.items())
            parts.append(f'  "{key}": {{\n{rows}\n  }}')
        else:
            parts.append(f'  "{key}": {_inline(value)}')
    return "{\n" + ",\n".join(parts) + "\n}\n"


def generate(out_dir: Path, source_dir: Path = CITIES_DIR) -> list[Path]:
    source = json.loads((source_dir / "surmapur.json").read_text(encoding="utf-8"))
    out_dir = Path(out_dir)
    written = []
    for city in (build_surmapur(source), build_shikharpur()):
        path = out_dir / f"{city['city_id']}.json"
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(dump_city(city))
        written.append(path)
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--out", type=Path, default=CITIES_DIR, help="output directory")
    for path in generate(parser.parse_args().out):
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
