"""Demo trip story tests: the real engine on the real frozen Demo trip.

Expected values come only from tests/fixtures/expected_demo.py (typed by hand in T03). The
engine never reads them. Story conditions are computed from engine output, not from the fixtures.
"""

import ast
from pathlib import Path

import pytest

from app.domain.models import Contribution, Label, Status
from tests.fixtures import expected_demo as exp

APP_DIR = Path(__file__).resolve().parents[2] / "app"
WHATIF = exp.WHATIF_IMPORTANCE_CHANGE


def by_id(result):
    return {h.id: h for h in result.hotels}


def rank_order(result):
    """Affordable hotels, best first."""
    ranked = sorted((h for h in result.hotels if h.rank is not None), key=lambda h: h.rank)
    return [h.id for h in ranked]


def contributions_of(result):
    return {h.id: h.contributions for h in result.hotels}


# --- 1. Engine equals the independently recorded answers ------------------------------


@pytest.mark.parametrize("hotel_id", list(exp.EXPECTED_HOTELS))
def test_engine_matches_expected_for_every_hotel(demo, hotel_id):
    hotel = by_id(demo.run())[hotel_id]
    want = exp.EXPECTED_HOTELS[hotel_id]
    assert hotel.weighted_total == want["weighted_total"]
    assert hotel.weighted_average_display == want["weighted_average_display"]
    assert hotel.affordable is want["affordable"]
    assert hotel.remaining_budget == want["remaining_budget"]
    assert hotel.shortfall == want["shortfall"]
    assert hotel.rank == want["rank"]
    assert hotel.longest_trip == want["longest_trip"]


def test_summary_matches_expected(demo):
    result = demo.run()
    assert demo.budget == exp.BUDGET
    assert result.status is Status.OK
    assert result.importance_total == exp.IMPORTANCE_TOTAL
    assert result.budget == exp.BUDGET
    assert result.recommended_hotel_id == exp.RECOMMENDED_HOTEL_ID
    assert result.default_inspected_hotel_id == exp.DEFAULT_INSPECTED_HOTEL_ID
    assert set(by_id(result)) == set(exp.EXPECTED_HOTELS)
    assert len(result.hotels) == 10
    assert rank_order(result) == exp.EXPECTED_RANK_ORDER


# --- 2. Contributions recomputed with plain loops from the JSON -----------------------


def test_contributions_match_independent_recompute(demo):
    result = demo.run()
    for hotel_id in demo.hotel_ids:
        expected = []
        for place_id in demo.place_ids:
            minutes = demo.matrix[hotel_id][place_id]
            importance = demo.importances[place_id]
            expected.append(Contribution(place_id, minutes, importance, importance * minutes))
        assert by_id(result)[hotel_id].contributions == tuple(expected), hotel_id


# --- 3. Story conditions, computed from engine output ---------------------------------


def test_story_c1_four_to_seven_hotels_affordable(demo):
    result = demo.run(budget=demo.preset["budget"])
    assert 4 <= sum(h.affordable for h in result.hotels) <= 7


def test_story_c2_unique_lowest_total_is_over_budget(demo):
    hotels = demo.run().hotels
    lowest = min(h.weighted_total for h in hotels)
    holders = [h for h in hotels if h.weighted_total == lowest]
    assert len(holders) == 1
    assert not holders[0].affordable
    assert holders[0].label is Label.OVER_BUDGET


def test_story_c3_recommended_is_not_the_cheapest_affordable(demo):
    result = demo.run()
    affordable = [h for h in result.hotels if h.affordable]
    cheapest = min(affordable, key=lambda h: h.stay_cost)
    assert result.recommended_hotel_id is not None
    assert result.recommended_hotel_id != cheapest.id


def test_story_c4_one_affordable_all_trips_within_90_another_has_a_long_trip(demo):
    affordable = [h for h in demo.run().hotels if h.affordable]
    assert any(all(c.minutes <= 90 for c in h.contributions) for h in affordable)
    assert any(any(c.minutes > 90 for c in h.contributions) for h in affordable)


def test_story_c5_budget_boundary_at_most_accessible_hotel(demo):
    best = min(demo.run().hotels, key=lambda h: h.weighted_total)
    at_cost = by_id(demo.run(budget=best.stay_cost))[best.id]
    assert at_cost.affordable
    assert at_cost.rank == 1
    assert at_cost.remaining_budget == 0
    assert demo.run(budget=best.stay_cost).recommended_hotel_id == best.id

    below = demo.run(budget=best.stay_cost - 1)
    hotel = by_id(below)[best.id]
    assert not hotel.affordable
    assert hotel.shortfall == 1
    assert hotel.rank is None
    assert below.recommended_hotel_id != best.id


def test_story_c6_importance_change_flips_the_recommendation(demo):
    old_importance = demo.importances[WHATIF["place_id"]]
    assert old_importance != WHATIF["new_importance"]
    assert 1 <= WHATIF["new_importance"] <= 5

    before = demo.run()
    after = demo.run(importance_overrides={WHATIF["place_id"]: WHATIF["new_importance"]})
    assert before.recommended_hotel_id == exp.RECOMMENDED_HOTEL_ID
    assert after.recommended_hotel_id == WHATIF["recommended_hotel_id"]
    assert after.recommended_hotel_id != before.recommended_hotel_id
    assert rank_order(after) == WHATIF["rank_order"]


def test_story_n1_equal_displayed_average_ranks_by_exact_total(demo):
    affordable = sorted((h for h in demo.run().hotels if h.affordable), key=lambda h: h.rank)
    pairs = [
        (a, b)
        for i, a in enumerate(affordable)
        for b in affordable[i + 1 :]
        if a.weighted_average_display == b.weighted_average_display
    ]
    assert pairs, "no two affordable hotels share a displayed average"
    for better, worse in pairs:
        assert better.weighted_total < worse.weighted_total  # exact totals differ and decide
    # Ranking by (displayed average, cost) would give a different order: the totals decide.
    by_display = sorted(affordable, key=lambda h: (h.weighted_average_display, h.stay_cost))
    assert [h.id for h in by_display] != [h.id for h in affordable]


def test_story_n2_small_and_large_over_budget_margins(demo):
    shortfalls = [h.shortfall for h in demo.run().hotels if not h.affordable]
    assert any(s < 1000 for s in shortfalls)
    assert any(s >= 10000 for s in shortfalls)


def test_story_n3_all_totals_distinct_so_no_tie_break_needed(demo):
    totals = [h.weighted_total for h in demo.run().hotels]
    assert len(set(totals)) == len(totals)


# --- 4. What-if scenarios from the fixtures -------------------------------------------


@pytest.mark.parametrize("case", [exp.WHATIF_BUDGET_EXACT, exp.WHATIF_BUDGET_MINUS_ONE])
def test_whatif_budget(demo, case):
    result = demo.run(budget=case["budget"])
    hotels = by_id(result)
    assert result.status is Status.OK
    assert result.recommended_hotel_id == case["recommended_hotel_id"]
    assert rank_order(result) == case["rank_order"]
    assert [hotels[i].rank for i in case["rank_order"]] == list(
        range(1, len(case["rank_order"]) + 1)
    )
    for hotel_id, remaining in case["remaining_budget"].items():
        assert hotels[hotel_id].remaining_budget == remaining
    for hotel_id, shortfall in case["shortfall"].items():
        assert hotels[hotel_id].shortfall == shortfall
        assert hotels[hotel_id].rank is None


def test_whatif_importance_change(demo):
    result = demo.run(
        budget=WHATIF["budget"], importance_overrides={WHATIF["place_id"]: WHATIF["new_importance"]}
    )
    hotels = by_id(result)
    assert result.importance_total == WHATIF["importance_total"]
    assert result.recommended_hotel_id == WHATIF["recommended_hotel_id"]
    assert rank_order(result) == WHATIF["rank_order"]
    for hotel_id, total in WHATIF["weighted_totals"].items():
        assert hotels[hotel_id].weighted_total == total, hotel_id
    for hotel_id, display in WHATIF["weighted_average_display"].items():
        assert hotels[hotel_id].weighted_average_display == display, hotel_id
    # Shortfalls are unchanged by an importance change.
    for hotel_id in ("H_GHANTA", "H_HAVELI", "H_MAHAL", "H_LAKEVIEW"):
        assert hotels[hotel_id].shortfall == exp.EXPECTED_HOTELS[hotel_id]["shortfall"]


# --- 5. Budget change vs importance change --------------------------------------------


@pytest.mark.parametrize("budget", [0, 20000, 36499, 36500, 1_000_000])
def test_budget_change_keeps_contributions_and_totals(demo, budget):
    baseline = demo.run()
    changed = demo.run(budget=budget)
    assert contributions_of(changed) == contributions_of(baseline)
    for hotel_id, hotel in by_id(changed).items():
        assert hotel.weighted_total == by_id(baseline)[hotel_id].weighted_total
        assert hotel.weighted_average_display == by_id(baseline)[hotel_id].weighted_average_display
    assert changed.importance_total == baseline.importance_total


def test_importance_change_changes_only_that_places_contributions(demo):
    place, new = WHATIF["place_id"], WHATIF["new_importance"]
    before = contributions_of(demo.run())
    after = contributions_of(demo.run(importance_overrides={place: new}))
    for hotel_id in demo.hotel_ids:
        assert len(after[hotel_id]) == len(before[hotel_id])
        for old_c, new_c in zip(before[hotel_id], after[hotel_id], strict=True):
            if old_c.place_id == place:
                assert new_c == Contribution(place, old_c.minutes, new, new * old_c.minutes)
            else:
                assert new_c == old_c


# --- 6. Reset at engine level ---------------------------------------------------------


def test_reset_inputs_restore_original_recommendation(demo):
    baseline = demo.run()
    demo.run(budget=exp.WHATIF_BUDGET_EXACT["budget"])
    demo.run(budget=0)
    demo.run(importance_overrides={WHATIF["place_id"]: WHATIF["new_importance"]})
    assert demo.run() == baseline
    assert demo.run(budget=demo.preset["budget"]) == baseline


# --- 7. Budget boundary on an actual Demo hotel ---------------------------------------


def test_budget_equality_is_affordable_and_minus_one_is_not(demo):
    best_affordable = by_id(demo.run())[rank_order(demo.run())[0]]
    cost = best_affordable.stay_cost

    at_cost = by_id(demo.run(budget=cost))[best_affordable.id]
    assert at_cost.affordable
    assert at_cost.remaining_budget == 0
    assert at_cost.shortfall is None

    below = by_id(demo.run(budget=cost - 1))[best_affordable.id]
    assert not below.affordable
    assert below.shortfall == 1
    assert below.remaining_budget is None
    assert below.rank is None


# --- 8. NO_AFFORDABLE_HOTEL on the Demo trip ------------------------------------------


def test_no_affordable_hotel_at_budget_zero(demo):
    result = demo.run(budget=0)
    assert result.status is Status.NO_AFFORDABLE_HOTEL
    assert result.errors == ()
    assert result.recommended_hotel_id is None
    assert result.default_inspected_hotel_id == min(demo.hotel_ids)
    assert len(result.hotels) == 10
    for hotel in result.hotels:
        assert not hotel.affordable
        assert hotel.rank is None
        assert hotel.remaining_budget is None
        assert hotel.shortfall == hotel.stay_cost
        assert hotel.label is Label.OVER_BUDGET


# --- 9. Independence guard ------------------------------------------------------------


def test_app_code_never_references_expected_values():
    forbidden = ("expected_demo", "verification", "EXPECTED_RESULTS")
    offenders = [
        f"{path.relative_to(APP_DIR)}: {word}"
        for path in APP_DIR.rglob("*.py")
        for word in forbidden
        if word in path.read_text(encoding="utf-8")
    ]
    assert offenders == []


def test_engine_does_no_file_io():
    tree = ast.parse((APP_DIR / "domain" / "engine.py").read_text(encoding="utf-8"))
    imported = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imported.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imported.add(node.module.split(".")[0])
    assert not imported & {"json", "pathlib", "os", "io"}
    calls = {
        n.func.id
        for n in ast.walk(tree)
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Name)
    }
    assert "open" not in calls
