"""Comparison engine: contributions, totals, affordability, ranking and recommendation.

Pure integer arithmetic on an already validated Scenario. Ranking uses the exact
weighted total only; the display average never decides an order.
"""

from dataclasses import replace

from app.domain.models import (
    ComparisonResult,
    Contribution,
    Hotel,
    HotelResult,
    Label,
    Scenario,
    Status,
)
from app.domain.rounding import format_average


def compare(scenario: Scenario) -> ComparisonResult:
    importance_total = sum(scenario.importances[place.id] for place in scenario.places)
    results = [_hotel_result(hotel, scenario, importance_total) for hotel in scenario.hotels]

    affordable = sorted((r for r in results if r.affordable), key=_sort_key)
    over_budget = sorted((r for r in results if not r.affordable), key=_sort_key)
    ranked = [
        replace(r, rank=rank, label=Label.RECOMMENDED if rank == 1 else Label.RANKED)
        for rank, r in enumerate(affordable, start=1)
    ]

    recommended = ranked[0].id if ranked else None
    lowest_id = min(hotel.id for hotel in scenario.hotels)
    return ComparisonResult(
        status=Status.OK if ranked else Status.NO_AFFORDABLE_HOTEL,
        errors=(),
        importance_total=importance_total,
        budget=scenario.budget,
        recommended_hotel_id=recommended,
        default_inspected_hotel_id=recommended if recommended is not None else lowest_id,
        hotels=tuple(ranked + over_budget),
    )


def _sort_key(result: HotelResult) -> tuple[int, int, str]:
    return (result.weighted_total, result.stay_cost, result.id)


def _hotel_result(hotel: Hotel, scenario: Scenario, importance_total: int) -> HotelResult:
    minutes_by_place = scenario.round_trip_minutes[hotel.id]
    contributions = tuple(
        Contribution(
            place_id=place.id,
            minutes=minutes_by_place[place.id],
            importance=scenario.importances[place.id],
            contribution=scenario.importances[place.id] * minutes_by_place[place.id],
        )
        for place in scenario.places
    )
    weighted_total = sum(c.contribution for c in contributions)
    affordable = hotel.stay_cost <= scenario.budget
    return HotelResult(
        id=hotel.id,
        name=hotel.name,
        stay_cost=hotel.stay_cost,
        affordable=affordable,
        rank=None,
        remaining_budget=scenario.budget - hotel.stay_cost if affordable else None,
        shortfall=None if affordable else hotel.stay_cost - scenario.budget,
        label=Label.RANKED if affordable else Label.OVER_BUDGET,
        weighted_total=weighted_total,
        weighted_average_display=format_average(weighted_total, importance_total),
        longest_trip=max(c.minutes for c in contributions),
        contributions=contributions,
    )
