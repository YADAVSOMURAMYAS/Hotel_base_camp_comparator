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
