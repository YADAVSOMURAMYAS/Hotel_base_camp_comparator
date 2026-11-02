import { useComparatorContext } from '../../state/ComparatorContext'
import { formatRupees } from '../../utils/currency'
import './StatusBanner.css'

export default function StatusBanner() {
  const { phase, result, error, isStale } = useComparatorContext()

  if (phase === 'error') {
    return (
      <div role="alert" className="statusbanner statusbanner-error">
        <p>✕ The comparison service is unavailable</p>
        <p>{error}</p>
      </div>
    )
  }

  if (isStale) {
    return (
      <div role="status" aria-busy="true" className="statusbanner statusbanner-neutral">
        Updating…
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div role="status" className="statusbanner statusbanner-neutral">
        Loading…
      </div>
    )
  }

  if (result?.status === 'INVALID') {
    return (
      <div role="alert" className="statusbanner statusbanner-error">
        <p>✕ Cannot compare: fix the highlighted inputs</p>
        <ul>
          {result.errors.map((e, i) => (
            <li key={`${e.field}-${i}`}>
              <code>{e.field}</code> · {e.code} · {e.message}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (result?.status === 'NO_AFFORDABLE_HOTEL') {
    return (
      <div role="status" className="statusbanner statusbanner-warning">
        ⚠ No hotel fits this budget. Nothing is recommended.
      </div>
    )
  }

  if (result?.status === 'OK') {
    const hotel = result.hotels.find((h) => h.id === result.recommended_hotel_id)
    return (
      <div role="status" className="statusbanner statusbanner-ok">
        <p>✓ Recommended: {hotel?.name ?? result.recommended_hotel_id}</p>
        {hotel?.remaining_budget != null && (
          <p>{`Remaining budget: ${formatRupees(hotel.remaining_budget)}`}</p>
        )}
      </div>
    )
  }

  return (
    <div role="status" className="statusbanner statusbanner-neutral">
      Load the Demo trip to begin.
    </div>
  )
}
