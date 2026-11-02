import ast
import copy
import random
from pathlib import Path

from app.domain import engine
from app.domain.engine import compare
from app.domain.models import Contribution, Label, Scenario, Status
from tests.fixtures import small_scenarios as sc


def by_id(result):
    return {h.id: h for h in result.hotels}


def order(result):
    return [h.id for h in result.hotels]


def contribution_values(hotel):
    return [c.contribution for c in hotel.contributions]


def test_clock_market_example_from_problem_statement():
    # One hotel only: the engine trusts the validator for counts.
    result = compare(sc.clock_market())
    hotel = result.hotels[0]
    assert result.status is Status.OK
    assert result.importance_total == 5  # 3 + 2
    assert hotel.contributions == (
        Contribution("CLOCK", 20, 3, 60),  # 3 * 20
        Contribution("MARKET", 40, 2, 80),  # 2 * 40
    )
    assert hotel.weighted_total == 140  # 60 + 80
    assert hotel.weighted_average_display == "28.0"  # (20*140 + 5) // 10 = 280


def test_contribution_arithmetic_three_hotels_by_three_places():
    result = compare(sc.grid(budget=300))  # importances 1, 2, 3 -> I = 6
    hotels = by_id(result)
    assert result.importance_total == 6
    # A: 1*10, 2*20, 3*30
    assert contribution_values(hotels["A"]) == [10, 40, 90]
    assert hotels["A"].weighted_total == 140  # 10 + 40 + 90
    assert hotels["A"].weighted_average_display == "23.3"  # (2800 + 6) // 12 = 233
    # B: 1*30, 2*20, 3*10
    assert contribution_values(hotels["B"]) == [30, 40, 30]
    assert hotels["B"].weighted_total == 100  # 30 + 40 + 30
    assert hotels["B"].weighted_average_display == "16.7"  # (2000 + 6) // 12 = 167
    # C: 1*15, 2*15, 3*15
    assert contribution_values(hotels["C"]) == [15, 30, 45]
    assert hotels["C"].weighted_total == 90  # 15 + 30 + 45
    assert hotels["C"].weighted_average_display == "15.0"  # (1800 + 6) // 12 = 150
    assert [c.place_id for c in hotels["A"].contributions] == ["P1", "P2", "P3"]


def test_exact_total_ranks_even_when_displayed_averages_are_equal():
    result = compare(sc.fine_difference())  # I = 5+5+5+5+4+1 = 25
    hotels = by_id(result)
    assert hotels["X"].weighted_total == 1000  # 25 * 40
    assert hotels["Y"].weighted_total == 1001  # 1000 + 1*1
    assert hotels["X"].weighted_average_display == "40.0"  # (20000 + 25) // 50 = 400
    assert hotels["Y"].weighted_average_display == "40.0"  # (20020 + 25) // 50 = 400
    assert order(result) == ["X", "Y"]
    assert hotels["X"].rank == 1
    assert hotels["Y"].rank == 2
    assert result.recommended_hotel_id == "X"  # Y is cheaper but 1 importance-minute worse


def test_budget_equal_to_stay_cost_is_affordable():
    result = compare(sc.grid(budget=300))
    c = by_id(result)["C"]  # stay_cost 300
    assert c.affordable is True
    assert c.remaining_budget == 0  # 300 - 300
    assert c.shortfall is None
    assert c.rank == 1  # total 90 is the lowest
    assert c.label is Label.RECOMMENDED


def test_budget_one_below_stay_cost_is_over_budget():
    result = compare(sc.grid(budget=299))
    c = by_id(result)["C"]
    assert c.affordable is False
    assert c.rank is None
    assert c.remaining_budget is None
    assert c.shortfall == 1  # 300 - 299
    assert c.label is Label.OVER_BUDGET
    assert result.recommended_hotel_id == "B"  # next lowest total, 100
    assert order(result) == ["B", "A", "C"]


def test_over_budget_hotel_with_lowest_total_is_never_recommended():
    result = compare(sc.grid(budget=250))
    hotels = by_id(result)
    assert hotels["C"].weighted_total == 90  # lowest of 90, 100, 140
    assert hotels["C"].rank is None
    assert result.recommended_hotel_id == "B"
    assert hotels["B"].label is Label.RECOMMENDED
    assert hotels["A"].label is Label.RANKED


def test_remaining_budget_and_shortfall_values():
    result = compare(sc.grid(budget=250))
    hotels = by_id(result)
    assert hotels["A"].remaining_budget == 150  # 250 - 100
    assert hotels["B"].remaining_budget == 50  # 250 - 200
    assert hotels["C"].shortfall == 50  # 300 - 250
    assert hotels["A"].shortfall is None
    assert hotels["C"].remaining_budget is None
    assert result.budget == 250


def test_budget_change_keeps_contributions_and_totals_but_changes_ranking():
    low = compare(sc.grid(budget=250))
    high = compare(sc.grid(budget=300))
    for hotel_id in ("A", "B", "C"):
        a, b = by_id(low)[hotel_id], by_id(high)[hotel_id]
        assert a.contributions == b.contributions
        assert a.weighted_total == b.weighted_total
        assert a.weighted_average_display == b.weighted_average_display
    assert [by_id(low)[i].rank for i in "ABC"] == [2, 1, None]
    assert [by_id(high)[i].rank for i in "ABC"] == [3, 2, 1]
    assert low.recommended_hotel_id == "B"
    assert high.recommended_hotel_id == "C"


def test_importance_change_recomputes_everything_and_flips_recommendation():
    even = compare(sc.flip((1, 1, 1)))  # I = 3
    heavy = compare(sc.flip((5, 1, 1)))  # I = 7
    a1, b1 = by_id(even)["A"], by_id(even)["B"]
    assert contribution_values(a1) == [10, 50, 30]  # 1*10, 1*50, 1*30
    assert contribution_values(b1) == [40, 10, 30]  # 1*40, 1*10, 1*30
    assert (a1.weighted_total, b1.weighted_total) == (90, 80)
    assert (a1.weighted_average_display, b1.weighted_average_display) == ("30.0", "26.7")
    assert even.recommended_hotel_id == "B"

    a2, b2 = by_id(heavy)["A"], by_id(heavy)["B"]
    assert contribution_values(a2) == [50, 50, 30]  # 5*10, 1*50, 1*30
    assert contribution_values(b2) == [200, 10, 30]  # 5*40, 1*10, 1*30
    assert (a2.weighted_total, b2.weighted_total) == (130, 240)
    assert (a2.weighted_average_display, b2.weighted_average_display) == ("18.6", "34.3")
    assert heavy.importance_total == 7
    assert heavy.recommended_hotel_id == "A"
    assert (a2.rank, b2.rank) == (1, 2)


def test_no_affordable_hotel_is_a_valid_result_with_shortfalls():
    result = compare(sc.grid(budget=50))
    assert result.status is Status.NO_AFFORDABLE_HOTEL
    assert result.errors == ()
    assert result.recommended_hotel_id is None
    assert result.default_inspected_hotel_id == "A"  # lowest hotel ID
    assert result.importance_total == 6
    assert result.budget == 50
    assert order(result) == ["C", "B", "A"]  # by total 90, 100, 140
    assert [h.shortfall for h in result.hotels] == [250, 150, 50]  # 300-50, 200-50, 100-50
    for hotel in result.hotels:
        assert hotel.rank is None
        assert hotel.affordable is False
        assert hotel.label is Label.OVER_BUDGET
        assert hotel.remaining_budget is None
        assert len(hotel.contributions) == 3


def test_ok_result_defaults_inspection_to_the_recommended_hotel():
    result = compare(sc.grid(budget=250))
    assert result.status is Status.OK
    assert result.errors == ()
    assert result.default_inspected_hotel_id == result.recommended_hotel_id == "B"


def test_ranks_have_no_gaps_when_some_hotels_are_over_budget():
    result = compare(sc.gaps())  # budget 150; totals H1 90, H2 30, H3 60, H4 15
    hotels = by_id(result)
    assert order(result) == ["H3", "H1", "H4", "H2"]  # ranked, then over budget by total
    assert [hotels[i].rank for i in ("H3", "H1", "H4", "H2")] == [1, 2, None, None]
    assert hotels["H4"].shortfall == 150  # 300 - 150
    assert hotels["H2"].shortfall == 50  # 200 - 150


def test_longest_trip_ignores_budget_and_importance():
    for budget in (50, 250, 300):
        for importances in ((1, 2, 3), (3, 2, 1), (5, 5, 5)):
            hotels = by_id(compare(sc.grid(budget=budget, importances=importances)))
            assert hotels["A"].longest_trip == 30  # max(10, 20, 30)
            assert hotels["B"].longest_trip == 30  # max(30, 20, 10)
            assert hotels["C"].longest_trip == 15  # max(15, 15, 15)


def test_result_does_not_depend_on_input_order_of_hotels_and_places():
    base = sc.grid(budget=250)
    expected = normalise(compare(base))
    rng = random.Random(7)
    for _ in range(10):
        hotels = list(base.hotels)
        places = list(base.places)
        rng.shuffle(hotels)
        rng.shuffle(places)
        shuffled = Scenario(
            hotels=tuple(hotels),
            places=tuple(places),
            importances=base.importances,
            round_trip_minutes=base.round_trip_minutes,
            budget=base.budget,
        )
        assert normalise(compare(shuffled)) == expected


def normalise(result):
    """Result with each hotel's contributions sorted by place ID (they follow place order)."""
    hotels = tuple(
        (h, tuple(sorted(h.contributions, key=lambda c: c.place_id))) for h in result.hotels
    )
    return (
        result.status,
        result.importance_total,
        result.recommended_hotel_id,
        result.default_inspected_hotel_id,
        tuple(
            (
                h.id,
                h.rank,
                h.label,
                h.weighted_total,
                h.weighted_average_display,
                h.longest_trip,
                h.remaining_budget,
                h.shortfall,
                sorted_contribs,
            )
            for h, sorted_contribs in hotels
        ),
    )


def test_engine_does_not_mutate_its_input():
    scenario = sc.grid(budget=250)
    before = copy.deepcopy(scenario)
    compare(scenario)
    assert scenario == before


# --- static checks on engine.py ------------------------------------------------

ENGINE_TREE = ast.parse(Path(engine.__file__).read_text(encoding="utf-8"))
FORBIDDEN_CALLS = {"float", "round", "open"}
FORBIDDEN_MODULES = {"fastapi", "json", "pathlib", "tests", "verification"}
FORBIDDEN_APP_PARTS = {"api", "data", "domain.validation"}


def imported_modules():
    for node in ast.walk(ENGINE_TREE):
        if isinstance(node, ast.Import):
            yield from (alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            base = ("." * node.level) + (node.module or "")
            yield base
            yield from (f"{base}.{alias.name}" for alias in node.names)


def test_engine_has_no_float_round_open_or_true_division():
    calls = {
        node.func.id
        for node in ast.walk(ENGINE_TREE)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
    }
    assert calls & FORBIDDEN_CALLS == set()
    divisions = [
        node
        for node in ast.walk(ENGINE_TREE)
        if isinstance(node, (ast.BinOp, ast.AugAssign)) and isinstance(node.op, ast.Div)
    ]
    assert divisions == []


def test_engine_imports_no_io_web_data_validator_or_verification_code():
    for module in imported_modules():
        assert module.split(".")[0] not in FORBIDDEN_MODULES, module
        stripped = module.removeprefix("app.")
        assert not any(
            stripped == part or stripped.startswith(part + ".") for part in FORBIDDEN_APP_PARTS
        ), module
        assert "validation" not in module, module
