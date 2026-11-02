import { useComparatorContext } from '../../state/ComparatorContext'

// STUB (T09). T13 replaces this with the inspected hotel's contributions and reasons.
export default function ExplanationPanel() {
  const { phase, inspectedHotelId } = useComparatorContext()
  return (
    <section
      className="panel"
      aria-label="Explanation"
      data-testid="explanation-panel-stub"
    >
      <h2>Explanation</h2>
      <p className="muted">
        T13: contributions of the inspected hotel. Phase: {phase}; inspected:{' '}
        {inspectedHotelId ?? 'none'}
      </p>
    </section>
  )
}
