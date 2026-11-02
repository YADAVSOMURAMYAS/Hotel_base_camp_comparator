"""Demo trip helper for scenario tests.

Reads surmapur.json with the plain json module (no app loader), builds a RawScenario from the
`demo_preset` block, validates it and runs the engine. Every call builds a fresh scenario.
"""

import json
from pathlib import Path

import pytest

from app.domain.engine import compare
from app.domain.models import RawHotel, RawPlace, RawScenario
from app.domain.validation import validate_scenario

CITY_FILE = Path(__file__).resolve().parents[2] / "app" / "data" / "cities" / "surmapur.json"


class DemoTrip:
    def __init__(self, data):
        self.preset = data["demo_preset"]
        self.hotels = {h["id"]: h for h in data["hotels"]}
        self.places = {p["id"]: p for p in data["places"]}
        self.matrix = data["round_trip_minutes"]
        self.hotel_ids = self.preset["hotel_ids"]
        self.place_ids = self.preset["place_ids"]
        self.importances = self.preset["importances"]
        self.budget = self.preset["budget"]

    def raw(self, budget=None, importance_overrides=None):
        importances = dict(self.importances)
        importances.update(importance_overrides or {})
        return RawScenario(
            hotels=[
                RawHotel(
                    h,
                    self.hotels[h]["name"],
                    self.hotels[h]["stay_cost"],
                    {p: self.matrix[h][p] for p in self.place_ids},
                )
                for h in self.hotel_ids
            ],
            places=[
                RawPlace(p, self.places[p]["name"], self.places[p]["type"]) for p in self.place_ids
            ],
            importances=importances,
            budget=self.budget if budget is None else budget,
        )

    def run(self, budget=None, importance_overrides=None):
        outcome = validate_scenario(self.raw(budget, importance_overrides))
        assert outcome.ok, outcome.errors
        return compare(outcome.scenario)


@pytest.fixture
def demo():
    return DemoTrip(json.loads(CITY_FILE.read_text(encoding="utf-8")))
