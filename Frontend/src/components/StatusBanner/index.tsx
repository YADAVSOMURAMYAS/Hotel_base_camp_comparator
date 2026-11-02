import { useComparatorContext } from '../../state/ComparatorContext'

// STUB (T09). T10 replaces this with OK / NO_AFFORDABLE_HOTEL / INVALID messages and errors.
export default function StatusBanner() {
  const { phase, result } = useComparatorContext()
  return (
    <section className="panel" aria-label="Status" data-testid="status-banner-stub">
      <h2>Status</h2>
      <p className="muted">
        T10: result status and validation errors. Phase: {phase}; result status:{' '}
        {result?.status ?? 'none'}
      </p>
    </section>
  )
}
