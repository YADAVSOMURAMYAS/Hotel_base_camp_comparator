# Backend/tests/scenario/

**Purpose:** Prove the Demo trip tells the required story.

| Item | Detail |
|---|---|
| Contents | *(planned, T07)* `test_demo_story.py` |
| Responsibilities | Engine output equals independent expected values for every hotel; story conditions S1–S6; budget boundary; importance what-if; reset |
| Dependencies | `app.domain`, `app.data`, `../fixtures/expected_demo.py` |
| Naming | `test_<scenario>.py` |
| Belongs | Tests that compare against `verification/` constants |
| Does not belong | Feeding expected values into the engine |
