# Testing

> **Purpose:** Define how every acceptance criterion is tested and evidenced.
> **Owner of:** test strategy, AC → test traceability, independent verification method, manual demo checklist.
> **Read this when:** writing any test, producing evidence, or running the final review (T17).

Test files named below exist as of T14 unless marked **(planned)**. Frontend names are the exact Vitest `it` titles (checked in T14). **Backend names are still the T01 planned names and some differ from the final function names** (for example the real one is `test_budget_equal_to_stay_cost_is_affordable`); reconcile them with `pytest --collect-only -q` in T17. Rule: record real command output in [interview/TEST_EVIDENCE.md](interview/TEST_EVIDENCE.md); never claim results that were not run.

## Pyramid and tools
| Layer | Tool | Location | Share | Speed |
|---|---|---|---|---|
| Domain unit | pytest | `Backend/tests/unit/` | Most | ms |
| Scenario (Demo trip vs `verification/`) | pytest | `Backend/tests/scenario/` | Few, high value | ms |
| API | pytest + FastAPI TestClient (httpx) | `Backend/tests/api/` | Shapes and HTTP rules | < 1 s |
| Frontend component/hook | Vitest + RTL + jsdom, API mocked | `Frontend/src/components/*/*.test.tsx`, `Frontend/src/__tests__/` | Each component | seconds |
| Frontend integration (real `<App/>`, real provider, fake client replying with real backend responses) | Vitest + RTL | `Frontend/src/__tests__/integration.workflow.test.tsx`, samples in `Frontend/src/test/samples/` | One workflow, steps a–i | seconds |
| Manual demo walkthrough | Browser | checklist below | Once per milestone | minutes |

Small hand-written scenarios (ties, equality, invalid) live in `Backend/tests/fixtures/small_scenarios.py` (planned, T06). Tests stay fast and offline.

## Traceability: acceptance criterion → test → evidence
| AC | Test (file :: name) | Evidence |
|---|---|---|
| AC-01 | `unit/test_city_data.py::test_demo_counts_types_importances_matrix_complete`; `api/test_compare_api.py::test_demo_preset_endpoint` | pytest output |
| AC-02 | `scenario/test_demo_story.py::test_story_c1_…` to `…_c6_…` (one per condition), `::test_story_n1_…`, `::test_story_n2_…`, `::test_story_n3_…` | pytest output + `verification/EXPECTED_RESULTS.md` |
| AC-03 | `scenario/test_demo_story.py::test_engine_matches_expected_for_every_hotel`, `::test_summary_matches_expected`, `::test_contributions_match_independent_recompute` (total, average, affordability, remaining/shortfall, rank) | pytest output; spreadsheet screenshot |
| AC-04 | Frontend `CityMap.test.tsx::renders exactly 25 markers: 10 hotels and 15 places`, `::draws 15 links for the inspected hotel with API minutes and contribution`, `::moves the links to another inspected hotel and keeps 25 markers`; Frontend `integration.workflow.test.tsx`::`b. Load Demo trip > shows the recommended hotel everywhere, in the order the API sent` | vitest output; screenshot |
| AC-05 | Frontend `HotelRanking.test.tsx::marks the recommended hotel as #1 with a star`, `::shows over-budget hotels unranked with the exact shortfall`; `ExplanationPanel.test.tsx::RECOMMENDED…`, `::RANKED: rank sentence…`, `::OVER_BUDGET…`; Frontend `integration.workflow.test.tsx`::`b. Load Demo trip > shows over-budget hotels unranked with their shortfall…` | vitest output; screenshot |
| AC-06 | `scenario/test_demo_story.py::test_story_c5_budget_boundary_at_most_accessible_hotel`, `::test_whatif_budget`; Frontend `integration.workflow.test.tsx`::`d. budget what-if > makes the best hotel recommended at exactly its cost and over budget one rupee less`; manual checklist steps 7–8 | pytest + vitest output; screenshot |
| AC-07 | `scenario/test_demo_story.py::test_story_c6_importance_change_flips_the_recommendation`, `::test_whatif_importance_change`; manual step 11; Frontend `integration.workflow.test.tsx`::`e. importance what-if > changes the recommendation, the contributions and the map link labels` | pytest + vitest output; screenshot |
| AC-08 | `scenario/test_demo_story.py::test_reset_inputs_restore_original_recommendation`; Frontend `Controls.test.tsx::calls reset when Reset is clicked`, `useComparator.test.tsx::reset restores preset inputs, reruns compare and the default inspected hotel`, Frontend `integration.workflow.test.tsx`::`i. reset > restores the preset inputs, the recommendation and the inspected hotel` | pytest + vitest output; screenshot |
| AC-09 | `unit/test_engine.py::test_budget_equality_is_affordable`, `::test_budget_plus_one_over_is_unranked`; Frontend `integration.workflow.test.tsx`::`f. exact budget > shows ₹0 left in budget at the exact cost and Over budget by ₹1 one rupee below` | pytest + vitest output |
| AC-10 | `unit/test_ranking_ties.py::test_equal_total_resolved_by_lower_stay_cost` | pytest output |
| AC-11 | `unit/test_ranking_ties.py::test_full_tie_resolved_by_hotel_id_ascii`, `::test_input_order_does_not_matter` | pytest output |
| AC-12 | `unit/test_engine.py::test_no_affordable_hotel_keeps_shortfalls_no_winner`; `api/test_compare_api.py::test_no_affordable_hotel_http_200`; Frontend `StatusBanner.test.tsx::NO_AFFORDABLE_HOTEL: says nothing is recommended and names no winner`, `CityMap.test.tsx::NO_AFFORDABLE_HOTEL: no ★ and ✕ on every hotel`, Frontend `integration.workflow.test.tsx`::`h. no affordable hotel > shows shortfalls and no star, no rank and no recommendation` | pytest + vitest output; screenshot |
| AC-13 | Frontend `Controls.test.tsx::forwards budget text … exactly as typed` (`-5`, `12.5`, `abc`), `::forwards importance text … with the place id` (`0`, `6`); Frontend `integration.workflow.test.tsx`::`g. invalid inputs` (budget `-5`, `12.5`, `abc`, importance `6`); `api/test_compare_api.py::test_invalid_budget_and_importance` | vitest + pytest output; screenshot |
| AC-14 | `unit/test_validation.py::test_duplicate_id_within_hotels`, `::test_duplicate_id_hotel_vs_place`; `api/test_compare_api.py::test_duplicate_id_invalid` | pytest output |
| AC-15 | `unit/test_validation.py::test_mapping_missing_place`, `::test_mapping_unknown_place`; `api/test_compare_api.py::test_incomplete_mapping_invalid` | pytest output |
| AC-16 | `unit/test_engine.py::test_contribution_arithmetic_clock_market` (140 importance-minutes) | pytest output |
| AC-17 | `unit/test_rounding.py::test_clock_market_is_28_0`, `::test_half_up_boundaries`, `::test_zero_and_large` | pytest output |
| AC-18 | `unit/test_engine.py::test_exact_total_ranks_when_displayed_averages_equal` | pytest output |
| AC-19 | `unit/test_engine.py::test_budget_change_keeps_contributions`, `::test_importance_change_recomputes_everything` | pytest output |
| AC-20 | `unit/test_engine.py::test_invalid_clears_all_derived_fields`; `api/test_compare_api.py::test_invalid_has_no_derived_fields`; Frontend `StatusBanner.test.tsx::INVALID: alerts, lists every error…`, `HotelRanking.test.tsx::shows the invalid message for an INVALID result`, `CityMap.test.tsx::INVALID result: markers stay, nothing derived is drawn`, Frontend `integration.workflow.test.tsx`::`g. invalid inputs > … clears every derived view and keeps the markers` | pytest + vitest output |
| AC-21 | Frontend `useComparator.test.tsx::inspectHotel changes only inspectedHotelId and never calls compare`; `CityMap.test.tsx::moves the links to another inspected hotel and keeps 25 markers`; Frontend `integration.workflow.test.tsx`::`c. inspecting another hotel > via a ranking card / a map hotel marker / a table row header moves every view and sends no new request` (asserts the compare call count) | vitest output |
| AC-22 | `unit/test_validation.py` one test per rule: counts, ID format, blank name, place type, budget/stay-cost/importance/minutes ranges, `bool`/float/string/`None` | pytest output |
| AC-23 | Manual review in T17 against [interview/](interview/) files | Completed files; T17 review notes |
| AC-24 | `unit/test_timeline.py::test_thresholds_match_engine_at_cost_and_cost_minus_one` (T18, optional) | pytest output |
| AC-25 | `unit/test_matrix_generator.py::test_regeneration_is_identical`, `unit/test_city_data.py::test_catalog_counts_30_50`, `unit/test_validation.py::test_selection_limits`, `api/test_catalog_api.py::*`, Frontend `Selection.test.tsx::*` | pytest + vitest output |

Also covered: stale responses ignored (`useComparator.test.tsx::ignores a stale response that arrives last and aborts the older call`), currency formatting (`currency.test.ts`), shared status and type wording (`hotelLabels.test.ts`), table accessibility (`TravelMatrixTable.test.tsx::has a caption, column headers per place and row headers per hotel`), page structure and live-region rules (`integration.workflow.test.tsx::page structure`), and "the frontend never re-sorts or computes" (`integration.workflow.test.tsx::the frontend never re-sorts or computes`, plus `HotelRanking.test.tsx::does not sort: a shuffled list keeps its input order`).

## Independent verification method
1. Expected results are computed **outside the app**: a spreadsheet (`verification/expected_results.xlsx`, planned T03) with formulas for contribution, total, `FLOOR((20*T+I)/(2*I))`, affordability and rank.
2. The same values are **typed by hand** as constants in `Backend/tests/fixtures/expected_demo.py` (planned T03) and written up in `verification/EXPECTED_RESULTS.md`.
3. Tests compare engine output to these constants. The engine and API never import them (rule P10).
4. The spreadsheet and the constants must agree with each other and with the T02 proof table before T03 is accepted.

## Frontend test list
Delivered: render of an OK result (rank, ★ Recommended, Over budget text) · inspection (only that hotel's links; minutes + contribution; no new request) · Reset restores Demo trip · INVALID clears derived UI · NO_AFFORDABLE_HOTEL shows no winner · stale responses ignored · table accessibility (role/label queries) · currency formatting · ordering follows API response (no re-sort; swapped-order and tampered-number samples).

**Mutation check (T14):** making `HotelRanking` sort by stay cost makes 7 of the 23 integration tests fail; the change was reverted.

## Manual demo checklist (interview, click by click)
Values below come from `Backend/tests/fixtures/expected_demo.py` (typed by hand from `verification/DEMO_DESIGN_NOTES.md`) and were checked against the running backend in T14. `verification/EXPECTED_RESULTS.md` was empty in T14, so it is not the source.

**Start:** backend on :8000 and the frontend on **http://localhost:5173** (`npm run dev`) or the production build on **http://localhost:4173** (`npm run build; npm run preview`). Use `localhost`, not `127.0.0.1` (Vite listens on IPv6 localhost here). Budget and importance fields are plain text boxes; type the value, the app recomputes after each change.

| # | Action | Expected (exact) | AC |
|---|---|---|---|
| 1 | Open the app. Before clicking anything, look at every panel | Only **Load Demo trip** is enabled. Banner: "Load the Demo trip to begin." Each panel shows its own "Load the Demo trip…" hint. | AC-01 |
| 2 | Click **Load Demo trip** | Banner: "✓ Recommended: Garden Court Hotel" and "Remaining budget: ₹13,500". Budget box shows 30000. Ranking says "6 of 10 hotels fit the budget". Map: 25 markers, ★ on Garden Court Hotel. 15 dashed links from Garden Court Hotel. | AC-01, 04, 05 |
| 3 | Read the ranking, top to bottom | #1 Garden Court Hotel ₹16,500 (total 2234, avg 55.9, longest 86) · #2 Stepwell Heritage Inn ₹27,500 (2327, 58.2, 121) · #3 Civil Lines Suites ₹24,200 (2514, 62.9, 93) · #4 River Breeze Lodge ₹19,800 (2517, 62.9, 122) · #5 Neelganga Ghat Residency ₹29,500 (2917, 72.9, 132) · #6 Hilltop Hostel ₹12,400 (3327, 83.2, 119). Then unranked ✕ Over budget: Ghantaghar Grand by ₹6,500 (1942, 48.6) · Bazaar Haveli by ₹800 (2102, 52.6) · Lion Gate Mahal by ₹22,000 (2887, 72.2) · Lakeview Resort by ₹3,000 (3727, 93.2). | AC-03, 05 |
| 4 | Explanation panel (Garden Court Hotel) | "Weighted total = 2234 importance-minutes"; "2234 ÷ 40 (importance total) = 55.9 min average"; first row 5 × 46 = 230. Civil Lines Suites and River Breeze Lodge both show 62.9 but rank #3 and #4 (exact totals decide). | AC-03, 16, 17, 18 |
| 5 | Click **Stepwell Heritage Inn** in the ranking, then its marker on the map, then its name in the table | Each time: only its 15 links are drawn (labels "minutes min · contribution"), the explanation switches ("Ranked #2 of 6", total 2327), the table row is highlighted, the ranking order does not change. | AC-04, 21 |
| 6 | Click **Ghantaghar Grand** (lowest total, 1942) | "✕ Over budget"; "Over budget by ₹6,500 (stay ₹36,500, budget ₹30,000)…"; no rank. | AC-05 |
| 7 | Set the budget to **36500** | Banner: "✓ Recommended: Ghantaghar Grand". Its card: "₹0 left in budget". 9 of 10 fit. Lion Gate Mahal: over by ₹15,500. The inspected hotel's contribution table is unchanged. | AC-06, 19 |
| 8 | Set the budget to **36499** | Ghantaghar Grand: "Over budget by ₹1", no rank. Banner: "✓ Recommended: Bazaar Haveli". 8 of 10 fit. Lion Gate Mahal: over by ₹15,501. | AC-06, 09 |
| 9 | Set the budget to **29500**, then **29499** | At 29500 Neelganga Ghat Residency is #5 with "₹0 left in budget". At 29499 it shows "Over budget by ₹1" and no rank; 5 hotels remain ranked. | AC-09 |
| 10 | Click **Reset** | Budget 30000, Garden Court Hotel recommended and inspected. | AC-08 |
| 11 | Change **Importance for Surmapur Heritage Museum** from 3 to **1** | Banner: "✓ Recommended: Stepwell Heritage Inn". Order: Stepwell Heritage Inn (2141, 56.3), Garden Court Hotel (2196, 57.8), River Breeze Lodge (2329, 61.3), Civil Lines Suites (2462, 64.8), Neelganga Ghat Residency (2709, 71.3), Hilltop Hostel (3203, 84.3). Map link labels for the museum change. | AC-07, 19 |
| 12 | Click **Reset**. Enter budget `-5`, then `12.5`, then `abc`; reset; enter museum importance `6` | Banner: "✕ Cannot compare: fix the highlighted inputs" with the backend message ("Budget must be a whole number from 0 to 1,000,000" / "Importance for MUSEUM must be a whole number from 1 to 5"). The offending box is outlined and has a ✕ message. Ranking, explanation, links and ranks are gone; the 25 markers stay; no "Recommended" anywhere. Correcting the value brings the results back. | AC-13, 20 |
| 13 | Click **Reset**. Set the budget to **0** | Banner: "⚠ No hotel fits this budget. Nothing is recommended." No ★, no ranks. Every hotel says "Over budget by" its full cost (smallest: ₹12,400 for Hilltop Hostel). ✕ on all 10 hotel markers. | AC-12 |
| 14 | Click **Reset** | Original budget, importances, recommendation and inspected hotel are back. | AC-08 |
| 15 | (Phase B) Pick another city, select by list and by marker click; exceed limits | Counters x/10, y/15; limit enforced; Load Demo trip still restores preset | AC-25 |
