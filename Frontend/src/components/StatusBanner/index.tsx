import { useComparatorContext } from '../../state/ComparatorContext'
import { formatRupees } from '../../utils/currency'
import {
  MAX_HOTELS,
  MAX_PLACES,
  MIN_HOTELS,
  MIN_PLACES,
} from '../../utils/selectionLimits'
import './StatusBanner.css'

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

export default function StatusBanner() {
  const { phase, result, error, isStale, loaded, readiness } = useComparatorContext()

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

  if (loaded && !readiness.canCompare) {
    const missing = [
      readiness.hotelsNeeded > 0 && plural(readiness.hotelsNeeded, 'more hotel'),
      readiness.placesNeeded > 0 && plural(readiness.placesNeeded, 'more place'),
      readiness.budgetMissing && 'a budget',
    ].filter(Boolean)
    return (
      <div role="status" className="statusbanner statusbanner-neutral">
        <p>
          {`Pick ${MIN_HOTELS}-${MAX_HOTELS} hotels (${readiness.hotelCount} selected) and ${MIN_PLACES}-${MAX_PLACES} places (${readiness.placeCount} selected), then enter a budget.`}
        </p>
        {missing.length > 0 && <p>{`Still needed: ${missing.join(', ')}.`}</p>}
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
