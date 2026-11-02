import { useComparatorContext } from '../../state/ComparatorContext'

// STUB (T09). T12 replaces this with the hand-written SVG map and the inspected hotel's links.
export default function CityMap() {
  const { phase, city } = useComparatorContext()
  return (
    <section className="panel" aria-label="City map" data-testid="city-map-stub">
      <h2>City map</h2>
      <p className="muted">
        T12: schematic SVG map. Phase: {phase}; city: {city?.name ?? 'not loaded'}
      </p>
    </section>
  )
}
