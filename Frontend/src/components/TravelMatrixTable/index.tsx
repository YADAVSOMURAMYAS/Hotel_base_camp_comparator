import { useComparatorContext } from '../../state/ComparatorContext'

// STUB (T09). T13 replaces this with the accessible hotel-by-place time table.
export default function TravelMatrixTable() {
  const { phase, selection } = useComparatorContext()
  return (
    <section className="panel" aria-label="Travel times" data-testid="travel-matrix-stub">
      <h2>Travel times</h2>
      <p className="muted">
        T13: hotel-by-place table. Phase: {phase}; selected: {selection.hotel_ids.length}{' '}
        hotels, {selection.place_ids.length} places
      </p>
    </section>
  )
}
