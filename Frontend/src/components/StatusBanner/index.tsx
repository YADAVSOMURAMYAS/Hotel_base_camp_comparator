import { useComparatorContext } from '../../state/ComparatorContext'
import { formatRupees } from '../../utils/currency'
import './StatusBanner.css'

// data-testid is temporary: keeps App smoke test green until T14 removes stub test IDs.
const TEST_ID = 'status-banner-stub'

export default function StatusBanner() {
  const { phase, result, error, isStale } = useComparatorContext()

  if (phase === 'error') {
    return (
      <div role="alert" className="statusbanner statusbanner-error" data-testid={TEST_ID}>
        <p>✕ The comparison service is unavailable</p>
        <p>{error}</p>
      </div>
    )
  }

  if (isStale) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="statusbanner statusbanner-neutral"
        data-testid={TEST_ID}
      >
        Updating…
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div
        role="status"
        className="statusbanner statusbanner-neutral"
        data-testid={TEST_ID}
      >
        Loading…
      </div>
    )
  }

  if (result?.status === 'INVALID') {
    return (
      <div role="alert" className="statusbanner statusbanner-error" data-testid={TEST_ID}>
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
      <div
        role="status"
        className="statusbanner statusbanner-warning"
        data-testid={TEST_ID}
      >
        ⚠ No hotel fits this budget. Nothing is recommended.
      </div>
    )
  }

  if (result?.status === 'OK') {
    const hotel = result.hotels.find((h) => h.id === result.recommended_hotel_id)
    return (
      <div role="status" className="statusbanner statusbanner-ok" data-testid={TEST_ID}>
        <p>✓ Recommended: {hotel?.name ?? result.recommended_hotel_id}</p>
        {hotel?.remaining_budget != null && (
          <p>{`Remaining budget: ${formatRupees(hotel.remaining_budget)}`}</p>
        )}
      </div>
    )
  }

  return (
    <div
      role="status"
      className="statusbanner statusbanner-neutral"
      data-testid={TEST_ID}
    >
      Load the Demo trip to begin.
    </div>
  )
}
