# Backend/scripts/

**Purpose:** One-time, hand-run tools.

| Item | Detail |
|---|---|
| Contents | `design_helper.py`: deterministic travel-time matrix generator *(empty stub; built in T15)* |
| Responsibilities | Produce the matrix with `base[district][district] + hotel_offset + place_offset`; output is frozen into `../app/data/cities/` |
| Dependencies | Python stdlib |
| Naming | `snake_case.py`, run as `python scripts/<name>.py` |
| Belongs | Generators and design helpers |
| Does not belong | Imports from `app/`, randomness, map geometry, anything the running app needs |

Rules: [../../docs/DATABASE_DESIGN.md](../../docs/DATABASE_DESIGN.md).
