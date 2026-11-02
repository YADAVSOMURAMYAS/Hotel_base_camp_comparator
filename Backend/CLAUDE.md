# Backend — Claude Code guide (Python, FastAPI, pytest, ruff)

The root `CLAUDE.md` rules always apply. The calculation rules are defined there; contracts are in `docs/API_SPECIFICATION.md`.

## Folder layout
```
app/
  main.py          FastAPI app factory, CORS for the Vite dev server
  api/             routes.py (HTTP only), schemas.py (loose request/response shapes)
  domain/          PURE functions: models.py, validation.py, engine.py, rounding.py
  data/            JSON loading only; cities/<city_id>.json (catalog + Demo trip)
scripts/           one-time deterministic generator (design_helper.py); never imported by app/
tests/
  unit/            domain functions: arithmetic, rounding, sorting, ties, validation
  scenario/        Demo trip story conditions vs verification/ expected values
  api/             endpoint shapes via FastAPI TestClient (OK / NO_AFFORDABLE_HOTEL / INVALID)
  fixtures/        small hand-written scenarios (ties, equality, invalid cases)
```
Small tie and edge-case scenarios live in `tests/fixtures/small_scenarios.py` (planned), not in `app/`.

## Layering rules
- `api/routes.py`: parse the request → load the city via `data/` → build the scenario → call `domain` → return its result. **No business logic, comparisons or arithmetic in routes.**
- `domain/`: no I/O, no FastAPI or pydantic imports, no globals. Input in, plain result out. Deterministic.
- `data/`: reads JSON files, nothing else. It never validates business rules and never computes.
- `scripts/`: run by hand once; their output is frozen into `app/data/cities/`. `app/` never imports `scripts/` or `verification/`.
- A function used in two places lives once in `domain/`. Search before adding.

## Validation approach
- `domain/validation.py` alone decides validity, and it validates the **complete** scenario before ranking.
- The API always returns **HTTP 200**. Valid input gives `status: OK | NO_AFFORDABLE_HOTEL`; invalid input gives `status: INVALID` with `errors: [ { field, code, message } ]` in plain English (e.g. `"Importance for NIGHT_MKT must be a whole number from 1 to 5"`).
- `INVALID` responses contain **no derived fields**: no hotels ranking, totals, contributions, recommendation or `default_inspected_hotel_id`.
- Request schemas accept loosely typed JSON values (e.g. `Any` or `StrictInt` where it doesn't reject early) so that pydantic never coerces or rejects first; the domain reports the error. Only an unparseable body may return FastAPI's default 422.
- Collect all errors in one pass where practical; never stop with a half-built ranking.

## Python traps (must handle)
- `bool` is a subclass of `int`: check `type(x) is int`, so `True` is rejected.
- Reject floats (`5.0`), numeric strings (`"5"`), `None` and NaN for every number.
- IDs: `re.fullmatch(r"[A-Z][A-Z0-9_-]{0,15}", s)`. `re.match` with `$` accepts a trailing `"\n"`.
- Names: `isinstance(name, str) and name.strip() != ""`.
- ID tie-break: plain `str` comparison (code-point order = ASCII for valid IDs). Never `locale` or `casefold`.
- Integer math only: `//` and `%`. No `/`, `round()`, `math.floor` on floats, or `Decimal`.
- Duplicate IDs: check across hotels **and** places together.
- Mapping keys must equal the selected place IDs exactly: report missing and unknown keys separately.

## Testing rules
- Test first: add the failing test, run it, see it fail, then implement.
- Each required acceptance criterion has at least one named test:
  - contribution arithmetic, round-half-up (including `.x5` boundaries), and exact ranking despite equal rounded averages;
  - the stay-cost tie-break and the full tie resolved by ID;
  - budget equality (affordable) and budget + ₹1 over (unranked);
  - `NO_AFFORDABLE_HOTEL`, `INVALID` clearing, duplicate ID, incomplete or unknown mapping;
  - budget change vs importance change.
- Scenario tests load the Demo trip from `app/data/cities/` and compare against `verification/`. Tests only **compare**; expected values are never fed into the engine.
- Keep tests fast and offline. Run `pytest -q` and `ruff check .` and paste the real output.
