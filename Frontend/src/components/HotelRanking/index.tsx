import { useComparatorContext } from '../../state/ComparatorContext'

// STUB (T09). T11 replaces this with ranked rows, the Recommended badge and Over budget text.
export default function HotelRanking() {
  const { phase, result } = useComparatorContext()
  return (
    <section
      className="panel"
      aria-label="Hotel ranking"
      data-testid="hotel-ranking-stub"
    >
      <h2>Hotel ranking</h2>
      <p className="muted">
        T11: ranked hotels. Phase: {phase}; hotels in result: {result?.hotels.length ?? 0}
      </p>
    </section>
  )
}
