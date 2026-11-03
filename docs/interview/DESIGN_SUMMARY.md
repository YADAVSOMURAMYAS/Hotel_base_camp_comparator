# Design Summary

> **Purpose:** Skeleton for the design summary deliverable (architecture, AI influence, trade-offs).
> **Owner of:** the interview-facing summary. Fill in as work proceeds; keep it short and honest.
> **Read this when:** finishing a task that changes the design, and during T17.

Facts to draw from: [../ARCHITECTURE.md](../ARCHITECTURE.md), [../DECISIONS.md](../DECISIONS.md), [../TECH_STACK.md](../TECH_STACK.md).

## 1. Architecture decisions
| Decision | Why (fill in) | Prompt to answer |
|---|---|---|
| Engine only in the backend, pure functions | | Why not compute in the browser? What did that cost? |
| Integer-only rounding | | Why not `round()` / floats? Show a half-up case |
| Loose request schemas; domain validates | | Why not let Pydantic reject first? |
| Hand-written SVG map | | Why no map library? |
| JSON city files, no database | | What would change if data were editable? |
| One state hook with request sequencing | | What bug does the sequence number prevent? |

## 2. AI influence
| Area | What AI proposed | What I accepted / changed / rejected, and why |
|---|---|---|
| | | |

Prompts to answer: Where did AI output need correction? Which constraint, once added, improved the result most? (Link entries in [AI_PROMPTS.md](AI_PROMPTS.md).)

## 3. Trade-offs
| Prioritised | Deferred or given up | Reason |
|---|---|---|
| | | |

## 4. Deferred items
| Item | Why deferred | What it would take |
|---|---|---|
| Budget timeline (optional) | | |
| Anything cut from Phase B | | |

## 5. Known limitations
Prompt: What would a reviewer find if they pushed hardest on edge cases?

## UI redesign (T19): two screens, one source of truth
- **Architecture:** `useComparator` still owns every number and the only API calls. The redesign added view-only state beside it: `useViewMode` (Plan / Results / drawer), `linkedView` (hover and folded card shared by the map and the cards), `useTheme`, and a guarded `localStorage` trip. The frontend still computes nothing about hotels; the single exception is the count-up animation, which ends on the API's exact string (D-54).
- **One copy of the controls:** the Plan steps render as a full screen the first time and inside the Edit drawer afterwards (`variant`), so there is one place to change them.
- **Map:** hand-written SVG with a camera that only changes the `viewBox` (pure maths in `camera.ts`, unit-tested); no map library.
- **AI influence:** the plan, the component split and the first versions of the interactions were drafted with AI and corrected by tests (for example the animation clock bug found by the viewport tests, and the contrast check that now guards the colour tokens). Prompts are in `AI_PROMPTS.md` (T19 / U1 to U7).
- **Trade-offs:** no clustering or radius rings (distance must not feed anything); the wheel zooms the map instead of scrolling the page; Results has no Select mode (editing is in the drawer); screenshots are a manual step (see `TEST_EVIDENCE.md`).
