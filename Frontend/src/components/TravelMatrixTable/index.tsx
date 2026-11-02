import { useComparatorContext } from '../../state/ComparatorContext'
import { statusShort, TYPE_SYMBOL, TYPE_TEXT } from '../ExplanationPanel/hotelStatus'
import './TravelMatrixTable.css'

// data-testid is temporary: keeps App smoke test green until T14 removes stub test IDs.
const TEST_ID = 'travel-matrix-stub'

export default function TravelMatrixTable() {
  const { city, selection, result, inspectedHotelId, inspectHotel, isStale } =
    useComparatorContext()
  const busy = isStale ? 'true' : undefined
  const className = isStale ? 'panel traveltable traveltable-stale' : 'panel traveltable'

  if (!city) {
    return (
      <section
        className={className}
        aria-label="Travel times"
        aria-busy={busy}
        data-testid={TEST_ID}
      >
        <h2>Travel times</h2>
        <p className="muted">Load the Demo trip to see the travel-time table.</p>
      </section>
    )
  }

  const hotels = new Map(city.hotels.map((h) => [h.id, h]))
  const places = new Map(city.places.map((p) => [p.id, p]))
  const apiHotels = new Map((result?.hotels ?? []).map((h) => [h.id, h]))
  // Importance is the same for every hotel, so the first hotel's contributions are enough.
  const importance = new Map(
    (result?.hotels[0]?.contributions ?? []).map((c) => [c.place_id, c.importance]),
  )

  return (
    <section
      className={className}
      aria-label="Travel times"
      aria-busy={busy}
      data-testid={TEST_ID}
    >
      <h2>Travel times</h2>
      <div
        className="traveltable-scroll"
        tabIndex={0}
        role="region"
        aria-label="Travel times, scrollable"
      >
        <table className="traveltable-table">
          <caption>Round-trip minutes: hotel to place and back</caption>
          <thead>
            <tr>
              <th scope="col">Hotel</th>
              <th scope="col">Status</th>
              {selection.place_ids.map((pid) => {
                const place = places.get(pid)
                return (
                  <th scope="col" key={pid}>
                    {place?.name ?? pid}
                    {place && (
                      <span className="traveltable-type">
                        {TYPE_SYMBOL[place.type]} {TYPE_TEXT[place.type]}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
            <tr className="traveltable-importance">
              <th scope="row" colSpan={2}>
                Importance
              </th>
              {selection.place_ids.map((pid) => (
                <td key={pid}>{importance.get(pid) ?? '–'}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {selection.hotel_ids.map((hid) => {
              const current = hid === inspectedHotelId
              const api = apiHotels.get(hid)
              return (
                <tr
                  key={hid}
                  className={current ? 'traveltable-current' : undefined}
                  aria-current={current ? 'true' : undefined}
                >
                  <th scope="row">
                    <button type="button" onClick={() => inspectHotel(hid)}>
                      {hotels.get(hid)?.name ?? hid}
                    </button>
                    {current && <span className="traveltable-marker">Inspecting</span>}
                  </th>
                  <td>{api ? statusShort(api) : ''}</td>
                  {selection.place_ids.map((pid) => (
                    <td key={pid}>{city.round_trip_minutes[hid]?.[pid]}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
