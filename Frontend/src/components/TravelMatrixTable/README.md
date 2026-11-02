# TravelMatrixTable

**Status:** done (T13).
**Shows:** a semantic hotel-by-place table of round-trip minutes from `city.round_trip_minutes`, in a focusable scrollable region with a sticky first column; an importance row, a status column (★ / ✓ #n / ✕ from the API label), and the inspected row marked (`aria-current`, "Inspecting"). The hotel name is a button that calls `inspectHotel(id)`.
**Files:** `index.tsx`, `TravelMatrixTable.css` (`traveltable-*`), `TravelMatrixTable.test.tsx`. Status and place-type wording come from `utils/hotelLabels`.
**Rules:** no calculation; hotels and places keep `selection` order. Times stay visible when INVALID; status and importance are blank / "–".
**States:** before load, stale (dimmed, `aria-busy`).
