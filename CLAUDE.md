# Hotel Base-Camp Comparator — Claude Code guide

## What we are building and why
- A local web app that helps a friend group pick a base-camp hotel in a fictional Indian city.
- It compares each hotel's complete-stay price (₹, whole rupees) against known round-trip times to every wishlist place, weighted by importance.
- It recommends the most accessible *affordable* hotel and explains why, using a ranked view, a schematic SVG map, a time table and contribution details.
- It is not an itinerary planner: no routes, days, admission or transport costs, accounts, databases or external APIs.
- It is built for an AI-assisted coding interview. Evaluators judge the **Demo trip** preset, our plan, our prompts, and our tests.
- Original spec: `docs/source/PROBLEM_STATEMENT.md` (the source of truth for requirements).

## Calculation rules (exact; backend `Backend/app/domain/` only)
```
contribution(h,p)      = importance(p) * round_trip_minutes(h,p)
importance_total  (I)  = sum of importance over all selected places
weighted_total(h) (T)  = sum of contribution(h,p) over all selected places   # integer
rounded_tenths(h)      = floor((20*T + I) / (2*I))                           # integer only
weighted_average_display = f"{rounded_tenths // 10}.{rounded_tenths % 10}"   # e.g. "28.0"
remaining_budget(h)    = budget - stay_cost(h)
```
- Affordable exactly when `stay_cost <= budget` (equality is affordable). Over-budget hotels stay visible as `Over budget by ₹X`, with no rank, and are never recommended.
- Sort affordable hotels by `weighted_total` asc, then `stay_cost` asc, then hotel ID in ASCII order. Ranks are `1..n` with no gaps. Rank 1 is the single `Recommended` hotel.
- Names, input order, map position and the displayed average never break ties. Rounding never affects ranking.
- No affordable hotel: status `NO_AFFORDABLE_HOTEL`. Shortfalls are kept; there are no ranks and no recommendation. This is a valid result, not an error.
- Invalid scenario (counts, ID format `[A-Z][A-Z0-9_-]{0,15}`, duplicate IDs, blank names, place type, budget 0–1,000,000, stay_cost 1–1,000,000, importance 1–5, minutes 1–600, missing or extra mapping): status `INVALID` with readable `errors[]`. **Every derived field is cleared**: no ranks, recommendation, totals, contributions or highlights. Never return a partial ranking.
- Budget change: recomputes affordability, shortfall, ranks and recommendation, but not contributions. Importance change: recomputes everything.

## Scope decisions (extend the spec)
- At least 2 fictional cities, each with a catalog of **30 hotels and 50 places**, in `Backend/app/data/cities/<city_id>.json`.
- The user selects up to 10 hotels and up to 15 places (from lists or by clicking existing markers), sets importance 1–5 per place, and sets the budget. Each place has a stored `default_importance`; the budget carries over from the current trip.
- The engine supports 2–10 hotels and 3–15 places. A selection below the minimum is sent anyway and returns `INVALID`.
- **Users cannot add map points.** Coordinates are presentation-only and never used in any calculation.
- Travel times for the full 30×50 catalog come from a one-time deterministic generator (`Backend/scripts/`): district base table + hotel offset + place offset. No randomness, no geometry. The frozen JSON is the source of truth; any hand-tuned cell is logged in `docs/DECISIONS.md`.
- The **Demo trip** (exactly 10 hotels, 15 places, fixed budget and importances) is the spec's "main scenario". "Load" and "Reset" always restore it. At its initial budget it must meet every story condition:
  1. 4–7 hotels are affordable;
  2. the hotel with the unique lowest `weighted_total` is over budget;
  3. the recommended hotel is not the cheapest affordable hotel;
  4. one affordable hotel has every trip <= 90 min and another affordable hotel has a trip > 90;
  5. raising the budget to exactly the best hotel's cost makes it recommended;
  6. one place's importance change within 1–5 flips the recommendation.
- **Build and finish the Demo trip first.** Catalog and selection features come after.
- Map modes: *selection* shows all 80 catalog markers (clickable); *comparison* shows the 25 selected markers, with links highlighted only for the inspected hotel.
- The backend returns `default_inspected_hotel_id`: the recommended hotel, or the lowest hotel ID if none is recommended.
- The optional budget timeline is deferred until every Required criterion is met.

## Non-negotiable rules
1. All calculation lives in `Backend/app/domain/` as pure functions. The frontend only renders API output. It never computes totals, ranks, averages or rounding; it may only format integer rupees with `en-IN` grouping (₹1,25,000).
2. Rank only by the exact integer `weighted_total`. No floats and no `round()` anywhere in the engine.
3. Coordinates, pixel distance and line length are never used in any calculation.
4. `INVALID` clears all derived fields, in both the API response and the UI.
5. `verification/` holds independently computed expected results. Code must never read it as calculation input (only tests may compare against it).
6. Never invent fields or endpoints. `docs/API_SPECIFICATION.md` and `docs/DATABASE_DESIGN.md` define them; update those docs first.
7. Never touch files outside the current task. Never duplicate existing functionality; search first and reuse.
8. No new dependencies without asking. Approved: FastAPI, uvicorn, pydantic, pytest, httpx, ruff; React, Vite, TypeScript, Vitest, React Testing Library, oxlint. No map or chart libraries (hand-written SVG/CSS).
9. Never claim tests pass unless they were actually run in this session. Paste the real output.
10. Keep it simple: no extra layers, frameworks or abstractions the scope doesn't need.

## How we are evaluated (`docs/source/STUDENT_GUIDE.md`)
- A 3–5 step implementation plan with checkpoints, plus honest notes on changes → `docs/interview/IMPLEMENTATION_PLAN.md`.
- Prompt history with iterations (broad → specific constraints) → `docs/interview/AI_PROMPTS.md`.
- A design summary: architecture, AI influence, trade-offs → `docs/interview/DESIGN_SUMMARY.md`.
- Test evidence: typical cases and edge cases → `docs/interview/TEST_EVIDENCE.md`.
- A 10-minute live modification during the interview: the code must be small, readable and easy to change.
- Over-engineering and blind copy-paste count against us.
- **Habits this implies:** small diffs we can explain line by line; quick startup; tests that run in seconds; record key prompts as we go; log every deviation from the plan.

## Where to find what
| Topic | File |
|---|---|
| Original requirements | `docs/source/PROBLEM_STATEMENT.md` |
| Evaluation guide | `docs/source/STUDENT_GUIDE.md` |
| Overview / architecture | `docs/PROJECT_OVERVIEW.md`, `docs/ARCHITECTURE.md` |
| Critical rules (expanded) | `docs/CRITICAL_RULES.md` |
| Tech stack | `docs/TECH_STACK.md` |
| API contracts (request/response) | `docs/API_SPECIFICATION.md` |
| JSON data design (cities, catalog, Demo trip) | `docs/DATABASE_DESIGN.md` |
| Expected results (independent) | `verification/` |
| Coding standards | `docs/CODING_STANDARDS.md` |
| Testing strategy | `docs/TESTING.md` |
| Commands | `docs/COMMANDS.md` |
| Workflow / Git | `docs/DEVELOPMENT_WORKFLOW.md` |
| Progress log | `docs/PROGRESS.md` |
| Decisions log | `docs/DECISIONS.md` |
| Task template | `docs/TASK_TEMPLATE.md` |
| Interview deliverables | `docs/interview/` |
| Backend / Frontend rules | `Backend/CLAUDE.md`, `Frontend/CLAUDE.md` |

Each of the 13 docs is a separate file; never merge them. Every meaningful folder has a `README.md`.

## Commands (Windows PowerShell)
```powershell
# Backend (from Backend\)
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload          # http://127.0.0.1:8000
pytest -q                              # all backend tests
ruff check .; ruff format --check .    # lint + format check
# Frontend (from Frontend\)
npm run dev                            # http://localhost:5173
npx vitest run                         # all frontend tests
npm run lint                           # oxlint
npm run build                          # type-check + build
```

## Workflow
- Documentation first: update the relevant spec doc before changing code.
- Test first: write a failing test, make it pass, then refactor.
- One small task per session, using `docs/TASK_TEMPLATE.md`.
- Git branches: `main` (demo-ready) ← `development` ← `feature/<task>`. Commit only when asked.

## After every task (checklist)
- [ ] Tests run and the real output is pasted (backend and/or frontend as affected); lint is clean.
- [ ] `docs/PROGRESS.md` updated (what was done, what is next).
- [ ] The `README.md` of every changed folder is updated.
- [ ] The key prompt(s) are appended to `docs/interview/AI_PROMPTS.md`.
- [ ] Any decision or deviation from the plan is logged in `docs/DECISIONS.md`.
