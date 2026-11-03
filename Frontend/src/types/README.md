# src/types/

**Purpose:** `contracts.ts` mirrors `docs/API_SPECIFICATION.md` field for field.
**Rules:** change the doc first, then this file. No `any`. Request values the user types are `RawValue`, because the backend validator judges them.
**Depends on:** nothing.

**T16:** `CitySummary` mirrors an entry of `GET /api/cities`.
