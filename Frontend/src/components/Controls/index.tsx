import { useComparatorContext } from '../../state/ComparatorContext'

// STUB (T09). T10 replaces this with Load/Reset, the budget input and importance inputs.
export default function Controls() {
  const { phase } = useComparatorContext()
  return (
    <section className="panel" aria-label="Controls" data-testid="controls-stub">
      <h2>Controls</h2>
      <p className="muted">
        T10: Load, Reset, budget and importance inputs. Phase: {phase}
      </p>
    </section>
  )
}
