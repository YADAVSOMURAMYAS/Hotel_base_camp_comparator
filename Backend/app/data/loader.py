"""The only place that reads city JSON. Cached, read-only, no validation, no maths."""

import json
import re
from collections.abc import Callable
from functools import cache
from pathlib import Path
from typing import Any

CITIES_DIR = Path(__file__).parent / "cities"
_CITY_FILE = re.compile(r"[a-z0-9_]+")

CatalogSource = Callable[[str], dict[str, Any]]


class UnknownCityError(Exception):
    def __init__(self, city_id: Any):
        super().__init__(f"Unknown city '{city_id}'")
        self.city_id = city_id


@cache
def _load(city_id: str) -> dict[str, Any]:
    with open(CITIES_DIR / f"{city_id}.json", encoding="utf-8") as f:
        return json.load(f)


def get_city(city_id: str) -> dict[str, Any]:
    """The cached catalog for a city. Callers must not modify it."""
    if not isinstance(city_id, str) or not _CITY_FILE.fullmatch(city_id):
        raise UnknownCityError(city_id)
    try:
        return _load(city_id)
    except FileNotFoundError:
        raise UnknownCityError(city_id) from None


@cache
def list_cities() -> tuple[dict[str, Any], ...]:
    """Every shipped city, sorted by city_id. Callers must not modify them."""
    return tuple(get_city(path.stem) for path in sorted(CITIES_DIR.glob("*.json")))


def get_catalog_source() -> CatalogSource:
    """FastAPI dependency; tests override it to serve a custom catalog."""
    return get_city
