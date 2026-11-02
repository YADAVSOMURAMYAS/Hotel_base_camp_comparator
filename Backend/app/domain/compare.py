"""Request-level orchestration: city catalog + raw selection -> ComparisonResult.

Pure: the catalog arrives as a plain dict, nothing is read or written here. Selected IDs
are looked up in the catalog; unknown ones become UNKNOWN_HOTEL / UNKNOWN_PLACE errors.
Everything else (duplicates, counts, types, ranges, mapping) is left to validate_scenario.
"""

from typing import Any

from app.domain.engine import compare
from app.domain.models import (
    ComparisonResult,
    RawHotel,
    RawPlace,
    RawScenario,
    ValidationError,
)
from app.domain.validation import validate_scenario


def compare_request(
    city: dict[str, Any], hotel_ids: Any, place_ids: Any, importances: Any, budget: Any
) -> ComparisonResult:
    hotels_by_id = {h["id"]: h for h in city["hotels"]}
    places_by_id = {p["id"]: p for p in city["places"]}
    unknown: list[ValidationError] = []

    raw_places = _pick(place_ids, places_by_id, "place_ids", "UNKNOWN_PLACE", "place", unknown)
    selected = {p["id"] for p in raw_places} if isinstance(raw_places, list) else set()
    raw_hotels = _pick(hotel_ids, hotels_by_id, "hotel_ids", "UNKNOWN_HOTEL", "hotel", unknown)

    scenario = RawScenario(
        hotels=_as_raw_hotels(raw_hotels, city["round_trip_minutes"], places_by_id, selected),
        places=_as_raw_places(raw_places),
        importances=importances,
        budget=budget,
    )
    outcome = validate_scenario(scenario)
    errors = unknown + list(outcome.errors)
    if errors:
        return ComparisonResult.invalid(errors)
    return compare(outcome.scenario)


def _pick(ids, catalog, field, code, noun, unknown):
    """Catalog records for the known IDs, in input order (duplicates kept).

    Anything that is not a list is passed through so the validator reports FIELD_TYPE.
    """
    if not isinstance(ids, list):
        return ids
    picked = []
    for i, item in enumerate(ids):
        if isinstance(item, str) and item in catalog:
            picked.append(catalog[item])
        else:
            unknown.append(
                ValidationError(
                    f"{field}[{i}]", code, f"Unknown {noun} {item!r}: not in this city's catalog"
                )
            )
    return picked


def _as_raw_hotels(records, matrix, places_by_id, selected):
    if not isinstance(records, list):
        return records
    return [
        RawHotel(
            id=h["id"],
            name=h["name"],
            stay_cost=h["stay_cost"],
            round_trip_minutes=_row_for(matrix.get(h["id"], {}), places_by_id, selected),
        )
        for h in records
    ]


def _row_for(row, places_by_id, selected):
    """Drop catalog places the user did not select; keep foreign keys so they get reported."""
    return {k: v for k, v in row.items() if k in selected or k not in places_by_id}


def _as_raw_places(records):
    if not isinstance(records, list):
        return records
    return [RawPlace(id=p["id"], name=p["name"], type=p["type"]) for p in records]
