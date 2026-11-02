# Task Template

> **Purpose:** A fill-in prompt for every Claude Code session.
> **Owner of:** the standard task prompt structure and its closing checklist.
> **Read this when:** starting any session (copy the template, fill the blanks) or reviewing whether a prompt was specific enough.

Per-task content (objective, files, acceptance) is in [PROGRESS.md](PROGRESS.md). Session loop: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

## Template
```markdown
# Task <Txx>: <title>

**Objective:** <one or two sentences, outcome not recipe>

**Read first:** CLAUDE.md files (loaded), plus <docs/…>, <source files>
**Depends on:** <task IDs and what must already exist>

**Files you may create/modify:**
- <path>
**Files you must NOT touch:**
- <path or folder>; everything not listed above

**Implementation expectations:**
- <behaviour, rules, naming; test first>
- Use only approved dependencies; reuse existing code (search first).

**Acceptance criteria:**
- <testable bullet> (AC-xx)

**Test commands to run (paste real output):**
- <command>

**Ask before assuming:** If anything is ambiguous, conflicts with a doc, or needs a new field, endpoint, or dependency, stop and ask. Do not invent.

**Closing checklist:**
- [ ] Tests and lint run; real output pasted
- [ ] docs/PROGRESS.md updated
- [ ] README.md of each changed folder updated
- [ ] Key prompt appended to docs/interview/AI_PROMPTS.md
- [ ] Deviations logged in docs/DECISIONS.md
```

## Filled-in example: T06 Engine and ranking
```markdown
# Task T06: Engine and ranking

**Objective:** Pure functions that turn a validated scenario into a ComparisonResult: contributions, totals, display averages, affordability, ranking, recommendation.

**Read first:** docs/API_SPECIFICATION.md (ComparisonResult, HotelResult), docs/CRITICAL_RULES.md, docs/TESTING.md, Backend/app/domain/models.py, Backend/app/domain/rounding.py
**Depends on:** T04 (models, rounding). Does not need T05; assume a valid scenario.

**Files you may create/modify:**
- Backend/app/domain/engine.py
- Backend/tests/unit/test_engine.py
- Backend/tests/unit/test_ranking_ties.py
- Backend/tests/fixtures/small_scenarios.py
**Files you must NOT touch:** Backend/app/domain/validation.py, Backend/app/api/, Frontend/, verification/, any file not listed

**Implementation expectations:**
- contribution = importance * minutes; weighted_total = sum; integer arithmetic only (no float, no round(), no /).
- Display average via rounding.py; ranking uses the exact integer total.
- Affordable iff stay_cost <= budget. Sort affordable by (weighted_total, stay_cost, id). Ranks 1..n; rank 1 is Recommended.
- Over-budget hotels: rank None, shortfall set, label OVER_BUDGET. Status NO_AFFORDABLE_HOTEL when none affordable.
- Field names exactly as in docs/API_SPECIFICATION.md. Test first.

**Acceptance criteria:**
- CLOCK/MARKET example gives 140 and "28.0" (AC-16, AC-17)
- Equal displayed averages but different totals rank by exact total (AC-18)
- Cost tie and full tie (hotel ID) resolved (AC-10, AC-11); input order irrelevant
- Budget equal affordable, budget - 1 unranked (AC-09)
- Budget-only change leaves contributions unchanged; importance change recomputes all (AC-19)
- No-affordable result keeps shortfalls, no winner (AC-12)

**Test commands to run (paste real output):**
- cd Backend; pytest -q tests/unit
- ruff check .; ruff format --check .

**Ask before assuming:** If a field in the spec is unclear or you need a new one, stop and ask.

**Closing checklist:** (as template)
```
