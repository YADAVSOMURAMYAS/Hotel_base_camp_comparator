"""Whole-scenario validation. Runs before any ranking and never raises for bad user data.

validate_scenario(raw) collects every error and, only when there are none, builds the strict
Scenario. validate(raw) is the errors-only view. Field paths are documented in
docs/API_SPECIFICATION.md (error section).
"""

import re
from collections.abc import Mapping
from dataclasses import dataclass
from types import MappingProxyType
from typing import Any

from app.domain.models import (
    ComparisonResult,
    Hotel,
    Place,
    PlaceType,
    RawHotel,
    RawPlace,
    RawScenario,
    Scenario,
    ValidationError,
)

ID_PATTERN = re.compile(r"[A-Z][A-Z0-9_-]{0,15}")
HOTEL_COUNT = (2, 10)
PLACE_COUNT = (3, 15)
BUDGET_RANGE = (0, 1_000_000)
STAY_COST_RANGE = (1, 1_000_000)
IMPORTANCE_RANGE = (1, 5)
MINUTES_RANGE = (1, 600)


@dataclass(frozen=True)
class ValidationOutcome:
    """Either errors (and no scenario) or a validated scenario (and no errors)."""

    errors: tuple[ValidationError, ...]
    scenario: Scenario | None

    @property
    def ok(self) -> bool:
        return not self.errors

    def to_invalid_result(self) -> ComparisonResult:
        return ComparisonResult.invalid(self.errors)


def validate(raw: Any) -> list[ValidationError]:
    return list(validate_scenario(raw).errors)


def validate_scenario(raw: Any) -> ValidationOutcome:
    errors = _collect_errors(raw)
    if errors:
        return ValidationOutcome(tuple(errors), None)
    return ValidationOutcome((), _build_scenario(raw))


# --- Checks ------------------------------------------------------------------


def _collect_errors(raw: Any) -> list[ValidationError]:
    errors: list[ValidationError] = []
    if not isinstance(raw, RawScenario):
        _add(errors, "scenario", "FIELD_TYPE", "The scenario must be an object")
        return errors

    hotels_ok = isinstance(raw.hotels, (list, tuple))
    places_ok = isinstance(raw.places, (list, tuple))
    seen_ids: set[str] = set()

    hotel_refs: list[tuple[RawHotel, str, str]] = []  # (hotel, field prefix, label)
    if hotels_ok:
        _check_count(errors, "hotel_ids", "HOTEL_COUNT", "hotels", len(raw.hotels), HOTEL_COUNT)
        for i, hotel in enumerate(raw.hotels):
            if not isinstance(hotel, RawHotel):
                _add(errors, f"hotels[{i}]", "FIELD_TYPE", f"Hotel {i + 1} must be an object")
                continue
            usable = _check_id(errors, f"hotels[{i}].id", "Hotel", i, hotel.id, seen_ids)
            label = hotel.id if _is_valid_id(hotel.id) else f"hotel {i + 1}"
            _check_name(errors, f"hotels[{i}].name", f"Hotel name for {label}", hotel.name)
            prefix = f"hotels.{hotel.id}" if usable else f"hotels[{i}]"
            if not _is_int_in(hotel.stay_cost, STAY_COST_RANGE):
                _add(
                    errors,
                    f"{prefix}.stay_cost",
                    "STAY_COST_INVALID",
                    f"Stay cost for {label} must be a whole number from 1 to 1,000,000",
                )
            hotel_refs.append((hotel, prefix, label))
    else:
        _add(errors, "hotels", "FIELD_TYPE", "Hotels must be a list")

    place_ids: list[str] = []  # valid, unique IDs, in input order
    known_place_ids: set[str] = set()  # every string ID given, even if it was rejected
    if places_ok:
        _check_count(errors, "place_ids", "PLACE_COUNT", "places", len(raw.places), PLACE_COUNT)
        for i, place in enumerate(raw.places):
            if not isinstance(place, RawPlace):
                _add(errors, f"places[{i}]", "FIELD_TYPE", f"Place {i + 1} must be an object")
                continue
            if isinstance(place.id, str):
                known_place_ids.add(place.id)
            if _check_id(errors, f"places[{i}].id", "Place", i, place.id, seen_ids):
                place_ids.append(place.id)
            label = place.id if _is_valid_id(place.id) else f"place {i + 1}"
            _check_name(errors, f"places[{i}].name", f"Place name for {label}", place.name)
            if not isinstance(place.type, str) or place.type not in {t.value for t in PlaceType}:
                _add(
                    errors,
                    f"places[{i}].type",
                    "PLACE_TYPE",
                    f"Type for {label} must be 'attraction' or 'food', not {place.type!r}",
                )
    else:
        _add(errors, "places", "FIELD_TYPE", "Places must be a list")

    if places_ok:
        for hotel, prefix, label in hotel_refs:
            _check_matrix_row(
                errors, hotel.round_trip_minutes, prefix, label, place_ids, known_place_ids
            )

    if not isinstance(raw.importances, Mapping):
        _add(errors, "importances", "FIELD_TYPE", "Importances must be an object")
    elif places_ok:
        _check_importances(errors, raw.importances, place_ids, known_place_ids)

    if not _is_int_in(raw.budget, BUDGET_RANGE):
        _add(
            errors, "budget", "BUDGET_INVALID", "Budget must be a whole number from 0 to 1,000,000"
        )
    return errors


def _check_matrix_row(errors, row, prefix, label, place_ids, known_place_ids) -> None:
    field = f"{prefix}.round_trip_minutes"
    if not isinstance(row, Mapping):
        _add(errors, field, "FIELD_TYPE", f"Round-trip minutes for {label} must be an object")
        return
    for place_id in place_ids:
        if place_id not in row:
            _add(
                errors,
                f"{field}.{place_id}",
                "MAPPING_MISSING_PLACE",
                f"Hotel {label} has no round-trip minutes for place {place_id}",
            )
        elif not _is_int_in(row[place_id], MINUTES_RANGE):
            _add(
                errors,
                f"{field}.{place_id}",
                "MINUTES_INVALID",
                f"Minutes from {label} to {place_id} must be a whole number from 1 to 600",
            )
    for key in row:
        if key not in place_ids and key not in known_place_ids:
            _add(
                errors,
                f"{field}.{key}",
                "MAPPING_UNKNOWN_PLACE",
                f"Hotel {label} has round-trip minutes for {key!r}, which is not a selected place",
            )


def _check_importances(errors, importances, place_ids, known_place_ids) -> None:
    for place_id in place_ids:
        if place_id not in importances:
            _add(
                errors,
                f"importances.{place_id}",
                "IMPORTANCE_MISSING",
                f"Importance for {place_id} is missing",
            )
        elif not _is_int_in(importances[place_id], IMPORTANCE_RANGE):
            _add(
                errors,
                f"importances.{place_id}",
                "IMPORTANCE_INVALID",
                f"Importance for {place_id} must be a whole number from 1 to 5",
            )
    for key in importances:
        if key not in place_ids and key not in known_place_ids:
            _add(
                errors,
                f"importances.{key}",
                "IMPORTANCE_UNKNOWN",
                f"Importance given for {key!r}, which is not a selected place",
            )


def _check_count(errors, field, code, noun, count, limits) -> None:
    low, high = limits
    if not low <= count <= high:
        _add(errors, field, code, f"Select {low} to {high} {noun} (got {count})")


def _check_id(errors, field, noun, index, value, seen_ids) -> bool:
    """Report a bad or repeated ID. True when it is valid and the first of its kind."""
    if not _is_valid_id(value):
        _add(
            errors,
            field,
            "ID_FORMAT",
            f"{noun} {index + 1} has ID {value!r}; an ID is 1-16 characters: "
            "A-Z first, then A-Z, 0-9, _ or -",
        )
        return False
    if value in seen_ids:
        _add(errors, field, "DUPLICATE_ID", f"ID {value} is used more than once")
        return False
    seen_ids.add(value)
    return True


def _check_name(errors, field, what, value) -> None:
    if not isinstance(value, str) or value.strip() == "":
        _add(errors, field, "NAME_BLANK", f"{what} must not be blank")


def _is_valid_id(value: Any) -> bool:
    return isinstance(value, str) and ID_PATTERN.fullmatch(value) is not None


def _is_int_in(value: Any, limits: tuple[int, int]) -> bool:
    return type(value) is int and limits[0] <= value <= limits[1]


def _add(errors: list[ValidationError], field: str, code: str, message: str) -> None:
    errors.append(ValidationError(field=field, code=code, message=message))


# --- Model construction (only called when validation found no errors) ---------


def _build_scenario(raw: RawScenario) -> Scenario:
    places = tuple(Place(p.id, p.name, PlaceType(p.type)) for p in raw.places)
    return Scenario(
        hotels=tuple(Hotel(h.id, h.name, h.stay_cost) for h in raw.hotels),
        places=places,
        importances=MappingProxyType({p.id: raw.importances[p.id] for p in places}),
        round_trip_minutes=MappingProxyType(
            {
                h.id: MappingProxyType({p.id: h.round_trip_minutes[p.id] for p in places})
                for h in raw.hotels
            }
        ),
        budget=raw.budget,
    )
