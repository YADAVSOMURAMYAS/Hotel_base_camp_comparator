# Implementation Plan

> **Purpose:** The 3–5 step plan presented at the interview, with checkpoints and honest changes.
> **Owner of:** the ordered steps, their checkpoints and verification, and the "Changes from plan" log.
> **Read this when:** preparing the interview presentation or when work deviates from the plan.

The fine-grained task list (T01–T18) is in [../PROGRESS.md](../PROGRESS.md); the five steps below group it.

| Step | What | Tasks | Checkpoint (working evidence) | How verified |
|---|---|---|---|---|
| 1. Specify and design the Demo trip | Docs, API contract, data design; design the fictional city on paper and prove the six story conditions | T01–T03 | Docs consistent; proof table approved; frozen JSON; expected results agree between spreadsheet and typed constants | Manual doc review; spreadsheet vs constants cross-check; data-structure test |
| 2. Build the calculation core | Rounding, validation, engine, ranking; story tests against independent expected values | T04–T07 | `pytest -q` and `ruff check .` green; Demo trip matches expected results for every hotel; S1–S6 pass | Real pytest output in `TEST_EVIDENCE.md` |
| 3. Expose the API and build the UI pieces | FastAPI endpoints; React contracts, state hook, controls, ranking, SVG map, explanation, time table (built in parallel against the contract) | T08–T13 | API tests green (OK / NO_AFFORDABLE_HOTEL / INVALID); each component test green | pytest + vitest output; mock-data screenshots |
| 4. Integrate and demo-ready checkpoint | Wire frontend to backend, walk the whole workflow, merge to `main` and tag | T14 | Manual checklist in [../TESTING.md](../TESTING.md) passes click by click; what-ifs and reset match expected results | Walkthrough + screenshots; full regression run |
| 5. Extend, then prove | Catalog (30/50 per city) and selection UI if time allows; fresh-session AC review; interview docs; live-change rehearsal | T15–T17 (T18 optional) | Every AC maps to a passing test or screenshot; regenerated matrix identical; a 10-minute change rehearsed | Full pytest/vitest/lint; AC review table |

Phase A (steps 1–4) is a complete submission on its own; step 5 is the extension.

## UI redesign (two modes) — T19 plan

Goal: replace the single-page UI with a **Selection (Plan)** screen and a **Results** screen, restyled to a light, editorial look. No change to scoring, data, API or `Backend/`. One code path; the old layout is removed, not flagged (D-47).

Constraints that shape the plan (root `CLAUDE.md`):
- The frontend never computes. Stat cards, budget-fit bar and stacked bars use API values only (CSS `flex-grow` for proportions). Count-up animates *to* the exact API value, and is skipped under `prefers-reduced-motion`.
- No new libraries. The map stays hand-written SVG; pan/zoom is a transform on a `<g>`. Radius rings and clustering are dropped (distance and pixel geometry must not be used).
- One approved addition: a self-hosted Inter variable font (single woff2, `font-display: swap`) with a system-stack fallback. If the file cannot be added, the system stack is used with heavier weights and tighter letter-spacing.

| Step | What | Checkpoint | What changed and why (interview note) |
|---|---|---|---|
| U1. Tokens and shell **(done)** | `styles/tokens.css` (colours, radius, shadows, spacing, orange accent, dark theme), background arcs, sticky top bar (logo, step indicator, Edit, theme toggle), shared `ui/` pieces (PillButton, Card, Chip) | Old page still works under the new skin; tests green | One set of CSS variables means a re-theme is a one-file change. Shell first so later steps share it. |
| U2. View mode and persistence **(done)** | `useViewMode` (`plan` / `results`, `drawerOpen`); `localStorage` for city, budget, importances, selections (wrapped in try/catch) | Tests: mode switching, reload restores values | Mode lives next to, not inside, `useComparator`, so scoring state is untouched and switching modes never loses data. |
| U3. Selection screen **(done)** | 3 steps (city; hotels and places as searchable chips; budget and importance 1-5), inline friendly validation from `readinessOf`, black "Compare hotels" pill, Load Demo goes straight to Results | Cannot proceed until valid; Demo loads in one click | Reuses the logic of `Controls` and `Selection`; only the presentation is new. |
| U4. Results screen **(done)** | Read-only summary chips + Edit button, stat cards, ranked cards with "Why this score?" accordion (stacked bar, tooltips), collapsible time table, skeletons and empty states | All edit controls hidden in Results; INVALID still clears derived UI | Cards show API fields verbatim, so the no-calculation rule is kept. |
| U5. Edit drawer **(done)** | Side drawer (bottom sheet on mobile), Esc closes, focus trap, values preserved, "Update results" recalculates | Keyboard and focus tests; edit budget, update, results change | Reuses the U3 components inside the drawer; no second copy of the controls. |
| U6. Hero map **(done)** | U6a viewport: >=70vh, glass ranking overlay or card strip, zoom/fit/reset/fullscreen/legend, drag-pan with inertia, wheel zoom to cursor, double-click zoom, keyboard pan/zoom. U6b markers: hover spring + tooltip + linked card highlight (both ways), click ripple + fly-to + select + open explanation, click empty clears, animated dashed links with minutes labels and importance-based width | Interaction tests; no pixel value feeds any number | Split in two because it is the largest and riskiest step. Link labels use API minutes only. |
| U7. Polish and verify **(code done; browser pass open)** | Button hover/press/ripple, staggered entry, FLIP re-order, mode cross-fade, mobile pass, AA contrast and focus rings; update the 251 old tests; screenshots of Selection, Results and Drawer; full flow check | Vitest, lint and build output pasted; screenshots in `TEST_EVIDENCE.md` | Screenshots taken with the browser skill, not Playwright (a new dependency). |

Order: U1 to U7, one per session, each ending with the standard after-task checklist.

## Changes from plan
| Date | Step/Task | What changed | Why | Impact |
|---|---|---|---|---|
| 2026-11-02 | T19 U1 | Fonts: one self-hosted Inter variable file (`public/fonts/InterVariable.woff2`) | Agreed with the user; system stack is the fallback | None |
| 2026-11-02 | T19 U3 | Minimum places stays 3 | The engine requires 3; the brief said 1 | Plan screen asks for 3 |
| 2026-11-02 | T19 U6 | Radius rings and marker clustering dropped | Distance and pixel geometry must not feed anything; agreed with the user | None |
| 2026-11-02 | T19 U7 | No screenshots taken | No browser tool in the build session; Playwright would be a new dependency | Manual checklist in `TEST_EVIDENCE.md` must be run before the interview |
