# Coding Standards

> **Purpose:** One consistent style so diffs stay small and explainable.
> **Owner of:** Python and TypeScript conventions, accessibility requirements, comment/README conventions, commit format.
> **Read this when:** writing or reviewing any code, or any folder README.

Non-negotiable behaviour rules live in [CRITICAL_RULES.md](CRITICAL_RULES.md). Keep it simple: no layers or abstractions the scope does not need.

## Python (Backend)
| Topic | Standard |
|---|---|
| Version | Python ≥ 3.10 (3.10.11 installed) |
| Typing | Type hints on every function signature and dataclass field; no untyped public functions |
| Domain | Pure functions: no I/O, no globals, no FastAPI/pydantic imports. Data in, plain result out |
| Models | `@dataclass(frozen=True)` in `domain/`; Pydantic only in `api/schemas.py`, with loose types (`Any`) so the domain judges input |
| Arithmetic | Integers only: `//`, `%`, `sum`, `max`. No `/`, `round()`, `float`, `Decimal`, `math.floor` |
| Number checks | `type(x) is int` (rejects `bool`); reject float, numeric strings, `None`, NaN |
| IDs | `re.fullmatch(r"[A-Z][A-Z0-9_-]{0,15}", s)`; tie-break by plain `str` comparison |
| Naming | `snake_case` functions/variables, `PascalCase` classes, `UPPER_CASE` constants; error codes `UPPER_SNAKE` |
| Errors | Domain returns error lists (`field`, `code`, `message`); never raises for invalid user data. Raise only for programmer errors. Routes translate: unknown city → 404 |
| Docstrings | One line on public domain functions saying what, not how. No docstring if the name says it all |
| Lint/format | `ruff check .` and `ruff format --check .` clean; config in `Backend/pyproject.toml`: line length 100, rules `E,F,I,B,UP,N,SIM` |
| Tests | `pytest`, one behaviour per test, names like `test_budget_equality_is_affordable` |

## TypeScript / React (Frontend)
| Topic | Standard |
|---|---|
| Strictness | `strict: true`; **no `any`** (use `unknown` and narrow) |
| Components | Functional components and hooks only; props typed with an interface |
| Files | `components/Name/index.tsx` (default export) plus `Name.css` and `Name.test.tsx` as needed; hooks `useThing.ts`; helpers `camelCase.ts` |
| Logic | No business logic in components: no totals, ranks, rounding, sorting, affordability. Show API values as given |
| Allowed transform | Format integer rupees with the hand-written Indian grouping in `utils/currency.ts` (₹1,25,000); no `Intl`/`toLocaleString` |
| State | Plain React state in one hook; no state/UI/map/chart libraries |
| CSS | Plain CSS files with CSS variables (`--color-…`) in `src/styles.css`; no CSS framework |
| Lint | `npm run lint` (oxlint) clean; `npm run build` type-checks |
| Tests | Vitest + React Testing Library; query by role, label and text, never CSS class; mock `src/api/` |

### Accessibility
- Time table: real `<table>` with `<caption>`, `<th scope="col">` and `<th scope="row">`.
- Every input has a `<label for>`; errors are associated with their input and announced (`role="alert"`).
- Markers and ranking rows are keyboard-focusable and operable with Enter/Space.
- Never colour alone: `★ Recommended`, `✕ Over budget by ₹X` text/symbols; hotels and places differ by shape **and** label.
- SVG has a `<title>`; links are described as comparison links, not routes.

## Comments and READMEs
- Comment *why*, not *what*. No commented-out code. No TODOs without a task ID (`TODO(T12): …`).
- Every meaningful folder has a `README.md` with: purpose, contents, responsibilities, dependencies, naming conventions, what belongs / does not belong. Update it in the same task that changes the folder.
- Doc files start with purpose / owner-of / read-this-when.

## Commit messages
Format `type(scope): summary` (imperative, ≤ 72 chars). Commit only when asked.

| type | use | example |
|---|---|---|
| `feat` | new behaviour | `feat(engine): rank affordable hotels by exact total` |
| `fix` | bug fix | `fix(validation): reject bool as budget` |
| `test` | tests only | `test(scenario): assert Demo story conditions` |
| `docs` | docs only | `docs(api): add INVALID example` |
| `refactor` | no behaviour change | `refactor(ui): split ranking row` |
| `chore` | tooling, config | `chore(backend): add ruff config` |

Scopes: `engine`, `validation`, `rounding`, `api`, `data`, `ui`, `map`, `state`, `docs`, `verification`.
