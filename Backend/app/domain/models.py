"""Domain data shapes. Construction only: no validation, ranking or arithmetic here.

Raw* classes hold unvalidated request/catalog values (every field is Any). Only
validation.validate_scenario turns a RawScenario into a Scenario with strict types.
"""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from enum import Enum
from typing import Any


class Status(str, Enum):
    OK = "OK"
    NO_AFFORDABLE_HOTEL = "NO_AFFORDABLE_HOTEL"
    INVALID = "INVALID"


class PlaceType(str, Enum):
    ATTRACTION = "attraction"
    FOOD = "food"


class Label(str, Enum):
    RECOMMENDED = "RECOMMENDED"
    RANKED = "RANKED"
    OVER_BUDGET = "OVER_BUDGET"


# --- Raw (unvalidated) input -------------------------------------------------


@dataclass(frozen=True)
class RawHotel:
    id: Any
    name: Any
    stay_cost: Any
    round_trip_minutes: Any


@dataclass(frozen=True)
class RawPlace:
    id: Any
    name: Any
    type: Any


@dataclass(frozen=True)
class RawScenario:
    hotels: Any
    places: Any
    importances: Any
    budget: Any


# --- Validated input ---------------------------------------------------------


@dataclass(frozen=True)
class Hotel:
    id: str
    name: str
    stay_cost: int


@dataclass(frozen=True)
class Place:
    id: str
    name: str
    type: PlaceType


@dataclass(frozen=True)
class Scenario:
    hotels: tuple[Hotel, ...]
    places: tuple[Place, ...]
    importances: Mapping[str, int]
    round_trip_minutes: Mapping[str, Mapping[str, int]]
    budget: int


# --- Results -----------------------------------------------------------------


@dataclass(frozen=True)
class ValidationError:
    field: str
    code: str
    message: str


@dataclass(frozen=True)
class Contribution:
    place_id: str
    minutes: int
    importance: int
    contribution: int


@dataclass(frozen=True)
class HotelResult:
    id: str
    name: str
    stay_cost: int
    affordable: bool
    rank: int | None
    remaining_budget: int | None
    shortfall: int | None
    label: Label
    weighted_total: int
    weighted_average_display: str
    longest_trip: int
    contributions: tuple[Contribution, ...]


@dataclass(frozen=True)
class ComparisonResult:
    status: Status
    errors: tuple[ValidationError, ...]
    importance_total: int | None
    budget: int | None
    recommended_hotel_id: str | None
    default_inspected_hotel_id: str | None
    hotels: tuple[HotelResult, ...]

    @classmethod
    def invalid(cls, errors: Sequence[ValidationError]) -> "ComparisonResult":
        """INVALID result: errors only, every derived field cleared."""
        if not errors:
            raise ValueError("An INVALID result needs at least one error")
        return cls(
            status=Status.INVALID,
            errors=tuple(errors),
            importance_total=None,
            budget=None,
            recommended_hotel_id=None,
            default_inspected_hotel_id=None,
            hotels=(),
        )
