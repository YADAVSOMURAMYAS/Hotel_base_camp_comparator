import { useComparatorContext } from '../../state/ComparatorContext'

// TEMPORARY smoke panel: remove in T14, once Controls (T10) can load the Demo trip.
export default function DevPanel() {
  const { loadDemo, phase, result, error } = useComparatorContext()
  return (
    <section className="panel dev" aria-label="Dev panel" data-testid="dev-panel">
      <h2>Dev panel (remove in T14)</h2>
      <button type="button" onClick={() => void loadDemo()}>
        Load Demo trip
      </button>
      <dl>
        <dt>Phase</dt>
        <dd>{phase}</dd>
        <dt>Status</dt>
        <dd>{result?.status ?? 'none'}</dd>
        <dt>Recommended hotel ID</dt>
        <dd>{result?.recommended_hotel_id ?? 'none'}</dd>
      </dl>
      {error && <p role="alert">Error: {error}</p>}
    </section>
  )
}
