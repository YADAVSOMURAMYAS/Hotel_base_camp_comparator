"""Wire shapes. Request fields other than city_id stay raw (Any) so pydantic never coerces
them; the domain validator judges them. Responses are plain dicts built to the spec."""

from dataclasses import asdict
from typing import Any

from pydantic import BaseModel, StrictStr

from app.domain.models import ComparisonResult


class CompareRequest(BaseModel):
    city_id: StrictStr
    hotel_ids: Any = None
    place_ids: Any = None
    importances: Any = None
    budget: Any = None


def city_summary(city: dict[str, Any]) -> dict[str, Any]:
    return {
        "city_id": city["city_id"],
        "name": city["name"],
        "hotel_count": len(city["hotels"]),
        "place_count": len(city["places"]),
        "has_demo_preset": city.get("demo_preset") is not None,
    }


def catalog_view(city: dict[str, Any]) -> dict[str, Any]:
    return {
        "city_id": city["city_id"],
        "name": city["name"],
        "map": city["map"],
        "districts": city["districts"],
        "hotels": city["hotels"],
        "places": city["places"],
        "round_trip_minutes": city["round_trip_minutes"],
        "has_demo_preset": city.get("demo_preset") is not None,
    }


def preset_view(city: dict[str, Any]) -> dict[str, Any]:
    preset = city["demo_preset"]
    return {
        "city_id": city["city_id"],
        "hotel_ids": preset["hotel_ids"],
        "place_ids": preset["place_ids"],
        "importances": preset["importances"],
        "budget": preset["budget"],
    }


def result_view(result: ComparisonResult) -> dict[str, Any]:
    """Dataclasses to dicts; the str-based enums are encoded as their values by FastAPI."""
    return asdict(result)
