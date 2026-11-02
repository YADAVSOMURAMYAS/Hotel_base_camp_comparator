"""Small hand-made, already-valid scenarios for engine tests.

Plain data built straight from the domain models; no validator, no computation of expected
values. Expected results are written as literals in the tests.
"""

from app.domain.models import Hotel, Place, PlaceType, Scenario

# (hotel id, name, stay_cost, minutes in place order)
HotelSpec = tuple[str, str, int, tuple[int, ...]]


def build(
    hotels: list[HotelSpec],
    importances: list[tuple[str, int]],
    budget: int,
) -> Scenario:
    place_ids = [place_id for place_id, _ in importances]
    return Scenario(
        hotels=tuple(Hotel(hid, name, cost) for hid, name, cost, _ in hotels),
        places=tuple(Place(pid, f"Place {pid}", PlaceType.ATTRACTION) for pid in place_ids),
        importances=dict(importances),
        round_trip_minutes={
            hid: dict(zip(place_ids, mins, strict=True)) for hid, _, _, mins in hotels
        },
        budget=budget,
    )


def clock_market() -> Scenario:
    """Problem statement example: one hotel, CLOCK (importance 3) 20 min, MARKET (2) 40 min."""
    return build([("H_RIVER", "Riverside", 1000, (20, 40))], [("CLOCK", 3), ("MARKET", 2)], 2000)


def grid(budget: int = 300, importances: tuple[int, int, int] = (1, 2, 3)) -> Scenario:
    """3 hotels x 3 places. With the default importances: totals A 140, B 100, C 90."""
    return build(
        [
            ("A", "Alpha", 100, (10, 20, 30)),
            ("B", "Beta", 200, (30, 20, 10)),
            ("C", "Gamma", 300, (15, 15, 15)),
        ],
        [("P1", importances[0]), ("P2", importances[1]), ("P3", importances[2])],
        budget,
    )


def fine_difference() -> Scenario:
    """Totals 1000 vs 1001 (I = 25) that both display as "40.0". Y is far cheaper than X."""
    importances = [("P1", 5), ("P2", 5), ("P3", 5), ("P4", 5), ("P5", 4), ("P6", 1)]
    return build(
        [
            ("X", "Exact", 500, (40, 40, 40, 40, 40, 40)),
            ("Y", "Cheap", 100, (40, 40, 40, 40, 40, 41)),
        ],
        importances,
        1000,
    )


def flip(importances: tuple[int, int, int]) -> Scenario:
    """Two affordable hotels whose order depends on the importances."""
    return build(
        [("A", "Alpha", 100, (10, 50, 30)), ("B", "Beta", 150, (40, 10, 30))],
        [("P1", importances[0]), ("P2", importances[1]), ("P3", importances[2])],
        200,
    )


def gaps() -> Scenario:
    """Budget 150. H2 and H4 are over budget; H4 has the lowest total of all."""
    return build(
        [
            ("H1", "One", 100, (30, 30, 30)),
            ("H2", "Two", 200, (10, 10, 10)),
            ("H3", "Three", 120, (20, 20, 20)),
            ("H4", "Four", 300, (5, 5, 5)),
        ],
        [("P1", 1), ("P2", 1), ("P3", 1)],
        150,
    )


_THREE_PLACES = [("P1", 1), ("P2", 1), ("P3", 1)]


def tie_on_cost() -> Scenario:
    """Equal totals (60); T2 is cheaper but has the higher ID."""
    return build(
        [("T1", "One", 300, (10, 20, 30)), ("T2", "Two", 200, (20, 10, 30))],
        _THREE_PLACES,
        1000,
    )


def tie_on_ids() -> Scenario:
    """Equal total and cost; input order and names are the reverse of the ASCII ID order."""
    return build(
        [
            ("A_1", "Aardvark", 100, (10, 20, 30)),
            ("A1", "Middle", 100, (20, 10, 30)),
            ("A-1", "Zulu", 100, (30, 20, 10)),
        ],
        _THREE_PLACES,
        1000,
    )


def tie_three_way() -> Scenario:
    """Equal totals; H3 is cheapest, then H1 and H2 tie on cost and go by ID."""
    return build(
        [
            ("H2", "Two", 100, (10, 20, 30)),
            ("H3", "Three", 50, (20, 10, 30)),
            ("H1", "One", 100, (30, 20, 10)),
        ],
        _THREE_PLACES,
        1000,
    )


def tie_with_over_budget() -> Scenario:
    """Equal totals; A1 has the lower ID but costs 500 > budget 400."""
    return build(
        [("A1", "Pricey", 500, (10, 20, 30)), ("B1", "Fair", 300, (20, 10, 30))],
        _THREE_PLACES,
        400,
    )
