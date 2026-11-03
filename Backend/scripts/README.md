# Backend/scripts/

**Purpose:** One-time, hand-run tools.

| Item | Detail |
|---|---|
| Contents | `design_helper.py`: deterministic city/matrix generator (T15). `catalog_design.py`: plain data (names, districts, costs, types, importances, positions, base tables) |
| Responsibilities | Produce the matrix with `base[district][district] + hotel_offset + place_offset` (new hotels/places use `(i*7)%13-6` and `(j*5)%11-5`; Demo rows and columns keep their hand-authored offsets and the Demo cells are copied through); output is frozen into `../app/data/cities/`. Run `python scripts/design_helper.py [--out DIR]`; two runs give identical bytes. A value outside 1..600 raises |
| Dependencies | Python stdlib |
| Naming | `snake_case.py`, run as `python scripts/<name>.py` |
| Belongs | Generators and design helpers |
| Does not belong | Imports from `app/`, randomness, map geometry, anything the running app needs |

Rules: [../../docs/DATABASE_DESIGN.md](../../docs/DATABASE_DESIGN.md).
