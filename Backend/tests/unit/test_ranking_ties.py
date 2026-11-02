from app.domain.engine import compare
from tests.fixtures import small_scenarios as sc


def order(result):
    return [h.id for h in result.hotels]


def test_equal_totals_are_broken_by_lower_stay_cost():
    result = compare(sc.tie_on_cost())  # both totals 60 (importances 1)
    assert [h.weighted_total for h in result.hotels] == [60, 60]
    assert order(result) == ["T2", "T1"]  # 200 < 300, although T1 has the lower ID
    assert [h.rank for h in result.hotels] == [1, 2]
    assert result.recommended_hotel_id == "T2"


def test_complete_tie_is_broken_by_ascii_hotel_id_not_input_order_or_name():
    result = compare(sc.tie_on_ids())  # all totals 60, all costs 100
    assert [h.weighted_total for h in result.hotels] == [60, 60, 60]
    # ASCII: "-" (45) < "1" (49) < "_" (95), so "A-1" < "A1" < "A_1".
    assert order(result) == ["A-1", "A1", "A_1"]
    assert [h.name for h in result.hotels] == ["Zulu", "Middle", "Aardvark"]
    assert [h.rank for h in result.hotels] == [1, 2, 3]
    assert result.recommended_hotel_id == "A-1"


def test_three_way_tie_orders_by_cost_then_id():
    result = compare(sc.tie_three_way())  # all totals 60; costs H3 50, H1 100, H2 100
    assert order(result) == ["H3", "H1", "H2"]
    assert [h.rank for h in result.hotels] == [1, 2, 3]


def test_tied_over_budget_hotel_never_takes_a_rank():
    result = compare(sc.tie_with_over_budget())  # both totals 60, budget 400
    assert order(result) == ["B1", "A1"]
    b1, a1 = result.hotels
    assert b1.rank == 1
    assert result.recommended_hotel_id == "B1"
    assert a1.rank is None  # A1 has the lower ID but costs 500 > 400
    assert a1.shortfall == 100  # 500 - 400
