# Testing

> **Purpose:** Define how every acceptance criterion is tested and evidenced.
> **Owner of:** test strategy, AC → test traceability, independent verification method, manual demo checklist.
> **Read this when:** writing any test, producing evidence, or running the final review (T17).

All test files below are **(planned)** unless a task has delivered them. Rule: record real command output in [interview/TEST_EVIDENCE.md](interview/TEST_EVIDENCE.md); never claim results that were not run.

## Pyramid and tools
| Layer | Tool | Location | Share | Speed |
|---|---|---|---|---|
| Domain unit | pytest | `Backend/tests/unit/` | Most | ms |
| Scenario (Demo trip vs `verification/`) | pytest | `Backend/tests/scenario/` | Few, high value | ms |
| API | pytest + FastAPI TestClient (httpx) | `Backend/tests/api/` | Shapes and HTTP rules | < 1 s |
| Frontend component/hook | Vitest + RTL + jsdom, API mocked | `Frontend/src/__tests__/` | Each component | seconds |
| Manual demo walkthrough | Browser | checklist below | Once per milestone | minutes |

Small hand-written scenarios (ties, equality, invalid) live in `Backend/tests/fixtures/small_scenarios.py` (planned, T06). Tests stay fast and offline.

## Traceability: acceptance criterion → test → evidence
| AC | Test (file :: name) | Evidence |
|---|---|---|
| AC-01 | `unit/test_city_data.py::test_demo_counts_types_importances_matrix_complete`; `api/test_compare_api.py::test_demo_preset_endpoint` | pytest output |
| AC-02 | `scenario/test_demo_story.py::test_story_c1_…` to `…_c6_…` (one per condition), `::test_story_n1_…`, `::test_story_n2_…`, `::test_story_n3_…` | pytest output + `verification/EXPECTED_RESULTS.md` |
| AC-03 | `scenario/test_demo_story.py::test_engine_matches_expected_for_every_hotel`, `::test_summary_matches_expected`, `::test_contributions_match_independent_recompute` (total, average, affordability, remaining/shortfall, rank) | pytest output; spreadsheet screenshot |
| AC-04 | Frontend `CityMap.test.tsx::renders_25_markers`, `::highlights_only_inspected_hotel_links`, `::link_labels_show_minutes_and_contribution` | vitest output; screenshot |
| AC-05 | Frontend `HotelRanking.test.tsx::recommended_label`, `::over_budget_label_and_no_rank`; `ExplanationPanel.test.tsx::each_eligibility_reason` | vitest output; screenshot |
| AC-06 | `scenario/test_demo_story.py::test_story_c5_budget_boundary_at_most_accessible_hotel`, `::test_whatif_budget`; manual checklist step 6 | pytest output; screenshot |
| AC-07 | `scenario/test_demo_story.py::test_story_c6_importance_change_flips_the_recommendation`, `::test_whatif_importance_change`; manual step 7 | pytest output; screenshot |
| AC-08 | `scenario/test_demo_story.py::test_reset_inputs_restore_original_recommendation`; Frontend `Controls.test.tsx::reset_restores_demo_trip`, `useComparator.test.ts::reset` | pytest + vitest output; screenshot |
| AC-09 | `unit/test_engine.py::test_budget_equality_is_affordable`, `::test_budget_plus_one_over_is_unranked` | pytest output |
| AC-10 | `unit/test_ranking_ties.py::test_equal_total_resolved_by_lower_stay_cost` | pytest output |
| AC-11 | `unit/test_ranking_ties.py::test_full_tie_resolved_by_hotel_id_ascii`, `::test_input_order_does_not_matter` | pytest output |
| AC-12 | `unit/test_engine.py::test_no_affordable_hotel_keeps_shortfalls_no_winner`; `api/test_compare_api.py::test_no_affordable_hotel_http_200`; Frontend `StatusBanner.test.tsx::no_affordable_shows_no_winner` | pytest + vitest output; screenshot |
| AC-13 | Frontend `Controls.test.tsx::invalid_budget_values` (`-5`, `1000001`, empty, `12.5`), `::invalid_importance_values` (`0`, `6`); `api/test_compare_api.py::test_invalid_budget_and_importance` | vitest + pytest output; screenshot |
| AC-14 | `unit/test_validation.py::test_duplicate_id_within_hotels`, `::test_duplicate_id_hotel_vs_place`; `api/test_compare_api.py::test_duplicate_id_invalid` | pytest output |
| AC-15 | `unit/test_validation.py::test_mapping_missing_place`, `::test_mapping_unknown_place`; `api/test_compare_api.py::test_incomplete_mapping_invalid` | pytest output |
| AC-16 | `unit/test_engine.py::test_contribution_arithmetic_clock_market` (140 importance-minutes) | pytest output |
| AC-17 | `unit/test_rounding.py::test_clock_market_is_28_0`, `::test_half_up_boundaries`, `::test_zero_and_large` | pytest output |
| AC-18 | `unit/test_engine.py::test_exact_total_ranks_when_displayed_averages_equal` | pytest output |
| AC-19 | `unit/test_engine.py::test_budget_change_keeps_contributions`, `::test_importance_change_recomputes_everything` | pytest output |
| AC-20 | `unit/test_engine.py::test_invalid_clears_all_derived_fields`; `api/test_compare_api.py::test_invalid_has_no_derived_fields`; Frontend `App.test.tsx::invalid_clears_ranking_map_explanation` | pytest + vitest output |
| AC-21 | Frontend `useComparator.test.ts::inspect_changes_only_inspected_id`; `CityMap.test.tsx::inspection_moves_links`; `api` result unchanged (no request) | vitest output |
| AC-22 | `unit/test_validation.py` one test per rule: counts, ID format, blank name, place type, budget/stay-cost/importance/minutes ranges, `bool`/float/string/`None` | pytest output |
| AC-23 | Manual review in T17 against [interview/](interview/) files | Completed files; T17 review notes |
| AC-24 | `unit/test_timeline.py::test_thresholds_match_engine_at_cost_and_cost_minus_one` (T18, optional) | pytest output |
| AC-25 | `unit/test_matrix_generator.py::test_regeneration_is_identical`, `unit/test_city_data.py::test_catalog_counts_30_50`, `unit/test_validation.py::test_selection_limits`, `api/test_catalog_api.py::*`, Frontend `Selection.test.tsx::*` | pytest + vitest output |

Also covered by the same files: stale responses ignored (`useComparator.test.ts::ignores_out_of_order_response`), currency formatting (`utils/currency.test.ts::en_in_grouping`), table accessibility (`TravelMatrixTable.test.tsx::caption_and_scoped_headers`).

## Independent verification method
1. Expected results are computed **outside the app**: a spreadsheet (`verification/expected_results.xlsx`, planned T03) with formulas for contribution, total, `FLOOR((20*T+I)/(2*I))`, affordability and rank.
2. The same values are **typed by hand** as constants in `Backend/tests/fixtures/expected_demo.py` (planned T03) and written up in `verification/EXPECTED_RESULTS.md`.
3. Tests compare engine output to these constants. The engine and API never import them (rule P10).
4. The spreadsheet and the constants must agree with each other and with the T02 proof table before T03 is accepted.

## Frontend test list
Render of an OK result (rank, ★ Recommended, Over budget text) · inspection (only that hotel's links; minutes + contribution) · Reset restores Demo trip · INVALID clears derived UI · NO_AFFORDABLE_HOTEL shows no winner · stale responses ignored · table accessibility (role/label queries) · currency formatting · ordering follows API response (no re-sort).

## Manual demo checklist (interview, click by click)
Backend on :8000, frontend on :5173 (see [COMMANDS.md](COMMANDS.md)).
| # | Action | Expected | AC |
|---|---|---|---|
| 1 | Open the app, click **Load Demo trip** | 10 hotels, 15 places, 25 markers; Rank 1 shows ★ Recommended; some hotels ✕ Over budget by ₹X | AC-01, 04, 05 |
| 2 | Read the status/ranking | Matches `verification/EXPECTED_RESULTS.md` (totals, averages, ranks) | AC-03 |
| 3 | Click a different hotel | Only its 15 links highlighted with minutes + contribution; panel and table row follow; ranking unchanged | AC-04, 21 |
| 4 | Click the lowest-total (over budget) hotel | Reason "Over budget by ₹X"; no rank | AC-05 |
| 5 | Set budget to exactly the best hotel's cost | That hotel becomes Recommended | AC-06 |
| 6 | Set budget to that cost − 1 | It is Over budget again | AC-09 |
| 7 | Change the documented place's importance | Different affordable hotel is recommended | AC-07 |
| 8 | Enter budget `-5` / `1000001` / `12.5`, importance `0` / `6` | Readable error; ranks, links, panel cleared | AC-13, 20 |
| 9 | Set budget below every hotel's cost | `NO_AFFORDABLE_HOTEL`, shortfalls, no winner | AC-12 |
| 10 | Click **Reset** | Original budget, importances, recommendation, inspected hotel | AC-08 |
| 11 | (Phase B) Pick another city, select by list and by marker click; exceed limits | Counters x/10, y/15; limit enforced; Load Demo trip still restores preset | AC-25 |
