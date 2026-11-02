# SPR26_D2_P03: Hotel Base-Camp Comparator

*AI-Assisted Coding Interview Problem*

------------------------------------------------------------------------

# Problem Statement

You and your friends are finally taking the city trip that has lived in
the group chat for months. Everyone has already agreed on the wishlist:
famous landmarks, a museum, a night market, a riverside walk, and
several places that serve food the city is known for. Nothing is being
removed from that list.

One decision is still causing an argument. A cheap hotel may leave the
group crossing the city all day, while the hotel beside the most popular
attraction may use too much of the lodging budget. Promotional phrases
such as "centrally located" are not helping anyone compare the real
trade-off.

Build an interactive **Hotel Base-Camp Comparator** for the group. It
should compare complete-stay hotel prices with known round-trip travel
times to every wishlist place, recommend the most accessible affordable
hotel, and explain the choice clearly enough to settle the discussion.

The tool is a base-camp decision aid, not an itinerary planner. It does
not choose places, arrange days, find routes, or estimate admission,
meal, or transport costs. The group has set aside one budget for the
complete hotel stay, and a place that matters more to them should
influence the accessibility result more strongly.

Create the fictional city and all demonstration and test data yourself;
no starter asset is supplied. Your main city must contain exactly **10
hotels** and **15 wishlist places**. Include both attractions and
signature food stops, give the places memorable names, and position all
25 markers on a schematic map. Independently document the expected
totals and rank order for the main scenario. Your application must
calculate its decisions from hotel costs, importance values, and travel
times---it must not read the documented answers as ranking input.

You are not expected to build a 150-cell data-entry screen. The
candidate-created travel matrix may be stored as constants or produced
once by a deterministic generator that does not use map geometry or
randomness. In either case, materialize and inspect the same stable
10-by-15 matrix on every reset, and verify the expected results through
a separate calculation path such as a spreadsheet or explicit test
constants. A general city editor and file importer are not required.

Design the main scenario to tell a useful decision story. At its initial
budget:

- from `4` through `7` hotels are affordable;
- the hotel with the unique lowest accessibility total is over budget;
- the recommended affordable hotel is not the cheapest affordable hotel;
  and
- at least one affordable hotel has every round trip at or below `90`
  minutes, while another affordable hotel has at least one round trip
  above `90`; and
- raising the budget to the cost of that most accessible hotel makes it
  the recommendation.

Also choose one place whose importance can be changed within `1–5` so
that the recommended affordable hotel changes. This gives the group two
meaningful "what if?" moments instead of a table with an obvious winner.

Here is a deliberately tiny illustration of the calculation; it is not
large enough to be your main city. Suppose `CLOCK` has importance `3`
and `MARKET` has importance `2`. A hotel with round trips of `20` and
`40` minutes has a weighted travel total of `(3 × 20) + (2 × 40) = 140`
importance-minutes and a weighted average of `140 / 5 = 28.0` minutes. A
hotel is considered only when its complete-stay cost is no greater than
the current budget.

Create one attractive comparison workspace. It should combine a ranked
hotel view with a labelled city map, cost and budget information, and an
explanation of the selected hotel's calculation. The map must show all
10 hotels and 15 places, but highlight comparison links only from the
hotel currently being inspected so the display stays readable. Let the
user load the city in one action, change the budget and place
importance, inspect any hotel, and reset the original trip.

A browser application is a natural fit, although another local
interactive solution with an equally clear visual map is acceptable. Use
familiar technology and keep processing local. Accounts, databases, live
maps, geocoding, hotel booking, traffic services, route finding, and
external APIs are outside scope.

## Contracts

### City and trip data

- Use one currency consistently. `budget` is the whole-number amount
  from `0` through `1,000,000` available for the complete hotel stay,
  not a nightly allowance.
- The calculation engine must support from `2` through `10` hotels and
  from `3` through `15` wishlist places. The main demonstration must use
  exactly 10 hotels and 15 places.
- Hotel and place IDs must be unique across the complete scenario and
  match `[A-Z][A-Z0-9_-]{0,15}`. Display names must be non-empty after
  surrounding whitespace is removed.
- Each place has a `type` of `attraction` or `food` and a whole-number
  `importance` from `1` through `5`. The main scenario must include at
  least three places of each type and use at least three different
  importance values.
- Each hotel has a `stay_cost`, the quoted whole-number price from `1`
  through `1,000,000` for the complete stay.
- Each hotel has a `round_trip_minutes` mapping whose keys exactly match
  all wishlist place IDs. Every value is the complete
  hotel-to-place-to-hotel time and must be a whole number from `1`
  through `600`. Missing and unknown place IDs are invalid.
- Marker positions are presentation data. Pixel distance and line length
  must never be used to calculate travel time, accessibility, or
  ranking.
- Every wishlist place participates in every baseline comparison.
  Inspecting a hotel changes only the visible explanation and
  highlighted links, not the result.

### Accessibility, affordability, and ranking

For each hotel `h` and place `p`, calculate:

    contribution(h, p) = importance(p) × round_trip_minutes(h, p)
    importance_total = sum of all place importance values
    weighted_travel_total(h) = sum of all contribution(h, p) values
    weighted_average_minutes(h) = weighted_travel_total(h) / importance_total
    remaining_budget(h) = budget - stay_cost(h)

- `weighted_travel_total` is an integer measured in importance-minutes.
  Lower is better. Use this exact total for every comparison.
- Display the weighted average to one decimal place using round-half-up
  for non-negative values. An integer-only equivalent is
  `rounded_tenths = floor((20 × weighted_travel_total + importance_total) / (2 × importance_total))`;
  display `rounded_tenths / 10`. Display rounding must not influence
  ranking.
- A hotel is affordable exactly when `stay_cost <= budget`; equality is
  included. Keep an over-budget hotel visible, label it
  `Over budget by X`, give it no numerical rank, and never recommend it.
- Sort affordable hotels by exact `weighted_travel_total` ascending,
  then `stay_cost` ascending, then hotel ID in ascending ASCII order.
  Names, input order, map position, and displayed average do not break
  ties.
- Assign unique ranks `1, 2, 3, ...` without gaps. Rank 1 is the single
  `Recommended` hotel.
- If no hotel is affordable, show `NO_AFFORDABLE_HOTEL`, retain each
  shortfall, and show no recommendation or numerical rank. This is a
  valid comparison result, not a data-validation error.

### Validation, interaction, and explanation

- Validate the complete scenario before ranking. Reject an invalid
  count, malformed or duplicate ID, empty name, unsupported place type,
  out-of-range budget, stay cost, importance, or travel time, and an
  incomplete or extra hotel-to-place mapping.
- An invalid result must identify the problem and clear stale ranks,
  recommendation, contributions, and derived map highlights. Do not
  produce a partial ranking from valid-looking records.
- The visible app must demonstrate invalid handling for an editable
  budget or importance. Structural errors may be demonstrated through
  repeatable candidate-authored tests; a general-purpose city-data
  editor is not required.
- Changing only the budget recalculates affordability, shortfalls,
  ranks, and recommendation without changing travel contributions.
  Changing an importance value recalculates every contribution, total,
  average, rank, and relevant chart or link label.
- **Reset** restores all candidate-created city data, the original
  budget and importance values, the documented recommendation, and the
  default inspected hotel.
- Show all 25 labelled markers on a schematic map. When a hotel is
  inspected, highlight only its 15 hotel-to-place comparison links and
  expose the supplied round-trip time and weighted contribution for
  each. These are comparison links, not calculated roads or routes.
- Keep the map synchronized with an accessible hotel-by-place time table
  or equivalent view, ranked hotel cards or rows, eligibility reasons,
  and a contribution detail or chart. Use text or symbols as well as
  colour to identify the recommendation and excluded hotels.

## Acceptance Criteria

- **Required:** Create and load in one action a deterministic fictional
  city with exactly 10 hotels and 15 wishlist places, at least three
  attractions and three food stops, at least three importance values,
  and a complete 10-by-15 travel-time mapping. Do not depend on a
  supplied asset or external service.
- **Required:** Satisfy and document the main-scenario story conditions:
  4--7 hotels initially affordable, the unique most accessible hotel
  over budget, the recommended hotel different from the cheapest
  affordable hotel, at least one affordable hotel on each side of the
  `90`-minute longest-trip boundary, and the most accessible hotel
  becoming recommended exactly at its stay-cost boundary.
- **Required:** Independently record every hotel's expected weighted
  total, one-decimal average, affordability, shortfall or remaining
  budget, and initial rank. Reproduce them in the application without
  using the recorded answers as calculation input.
- **Required:** Show all 25 map markers while highlighting only the
  inspected hotel's 15 links. Show each link's supplied round-trip time
  and contribution, the complete-stay price comparison, ranked hotel
  results, and a clear reason for every unranked hotel.
- **Required:** Raise the budget across the documented hotel-cost
  boundary and demonstrate the new recommendation. Change the chosen
  place's importance to the documented value and demonstrate a different
  affordable recommendation. Reset both changes exactly.
- **Required:** Demonstrate that a hotel exactly on budget is
  affordable, one currency unit over budget is unranked, an
  accessibility tie is resolved by stay cost, and a complete tie is
  resolved by hotel ID. The tie cases may use smaller candidate-authored
  test scenarios.
- **Required:** Demonstrate `NO_AFFORDABLE_HOTEL` with no stale winner.
  Visibly reject an invalid budget or importance, and use repeatable
  test evidence to reject at least one duplicate-ID case and one
  incomplete or unknown travel-time mapping.
- **Required:** Include focused tests or equivalent repeatable evidence
  for contribution arithmetic, round-half-up display, exact ranking
  despite rounded averages, both tie-breaks, budget equality, budget and
  importance changes, invalid-state clearing, the no-affordable result,
  hotel inspection, and reset.
- **Optional:** Add a compact budget timeline showing the amounts at
  which the recommendation changes, while preserving the same
  affordability and ranking rules.

Use AI coding assistants. Before implementation, create a short plan
with 3--5 ordered steps and useful checkpoints. Be prepared to present
that plan, explain any changes you made to it, share relevant prompts,
summarize your design, and show test evidence such as tests,
screenshots, or output samples.

## How You'll Be Evaluated

- **Planning and Solution Presentation**: Present your 3--5-step
  implementation plan, explain how the work followed or changed that
  plan, and demonstrate the working solution with clear explanations
- **AI Prompting Strategy**: Show the prompts you used to translate this
  problem statement into technical specifications for AI assistants
- **Design Constraints and Technology Choices**: Explain the constraints
  you provided to AI regarding design patterns, technology stack, and
  architectural decisions
- **AI-Influenced Decision Making**: Discuss trade-offs, assumptions,
  and how AI recommendations influenced your choices for components,
  data structures, and implementation approaches
- **Testing and Validation**: Demonstrate how you tested the application
  covering both typical usage scenarios and edge cases
- **Live Modification Capability**: Be prepared to implement one small
  modification, and possibly a second if time permits, using AI
  assistance; keep your development environment ready for focused
  changes and verification
