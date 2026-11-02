# docs/

**Purpose:** Specifications and project records. Each file owns one topic; other files link by path.

| File | Owns |
|---|---|
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Scope, workflow, story conditions, AC-01…AC-25 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layers, folders, data flows |
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | Endpoints, schemas, status values, error codes |
| [DATABASE_DESIGN.md](DATABASE_DESIGN.md) | JSON data design (no database) |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | Style, accessibility, commits |
| [CRITICAL_RULES.md](CRITICAL_RULES.md) | Enforceable rules |
| [TECH_STACK.md](TECH_STACK.md) | Approved tools, rejected alternatives |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | Session loop, Git, parallel work |
| [TESTING.md](TESTING.md) | Strategy, AC → test traceability |
| [COMMANDS.md](COMMANDS.md) | Setup, run, test commands |
| [PROGRESS.md](PROGRESS.md) | Task table and status |
| [DECISIONS.md](DECISIONS.md) | Decisions and assumptions |
| [TASK_TEMPLATE.md](TASK_TEMPLATE.md) | Per-session prompt template |

Subfolders: `source/` (original requirements), `interview/` (deliverables).

- **Responsibilities:** keep specs current *before* code changes; never merge two docs.
- **Naming:** `UPPER_SNAKE.md`. Each doc starts with purpose, owner-of, read-this-when.
- **Belongs:** specs and records. **Does not belong:** code, generated data, screenshots (see `interview/`).
