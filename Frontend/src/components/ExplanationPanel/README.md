# ExplanationPanel

**Purpose:** `HotelExplanation`, the "why this score" body shown inside the inspected ranked card (props: `hotel`, `result`, `city`).
**Shows:** header (name, ID, symbol + text status), a plain-language reason built from API values, a stacked bar (segment width = the API contribution, hover tooltip) with an equivalent list of numbers, the per-place calculation table (`3 × 40 = 120`), and the weighted total / average lines as given.
**Rules:** data only from props. The only arithmetic is a count of affordable flags and one subtraction for the "why not" line (D-32); the bar is a CSS ratio.
**Tests:** `ExplanationPanel.test.tsx`.
