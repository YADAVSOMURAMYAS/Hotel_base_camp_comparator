import type { CSSProperties } from 'react'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { HotelLabel, HotelResult } from '../../types/contracts'
import { formatRupees } from '../../utils/currency'
import './HotelRanking.css'

// data-testid is temporary: keeps the App smoke test green until T14 removes stub test IDs.
const TEST_ID = 'hotel-ranking-stub'

const STATUS_TEXT: Record<HotelLabel, string> = {
  RECOMMENDED: '★ Recommended',
  RANKED: '✓ Within budget',
  OVER_BUDGET: '✕ Over budget',
}

// Bar geometry is presentation only: one shared scale so cards are comparable.
// Nothing here decides affordability, rank or recommendation.
function percentOf(value: number, scale: number): number {
  return scale > 0 ? Math.floor((value * 100) / scale) : 0
}

interface CardProps {
  hotel: HotelResult
  budget: number
  scale: number
  inspected: boolean
  onInspect: (id: string) => void
}

function HotelCard({ hotel, budget, scale, inspected, onInspect }: CardProps) {
  const over = hotel.label === 'OVER_BUDGET'
  const classes = ['ranking-card']
  if (hotel.label === 'RECOMMENDED') classes.push('ranking-card-recommended')
  if (over) classes.push('ranking-card-over')
  if (inspected) classes.push('ranking-card-inspected')

  const barStyle = {
    '--ranking-fill': `${percentOf(hotel.stay_cost, scale)}%`,
    '--ranking-marker': `${percentOf(budget, scale)}%`,
  } as CSSProperties

  return (
    <li className={classes.join(' ')}>
      <button
        type="button"
        className="ranking-button"
        aria-current={inspected ? 'true' : undefined}
        onClick={() => onInspect(hotel.id)}
      >
        <span className="ranking-head">
          <span className="ranking-rank">
            {hotel.rank !== null ? (
              `#${hotel.rank}`
            ) : (
              <>
                <span aria-hidden="true">–</span>
                <span className="ranking-sr-only">Unranked</span>
              </>
            )}
          </span>
          <span className="ranking-name">{hotel.name}</span>
          <span className="ranking-id">{hotel.id}</span>
          {inspected && <span className="ranking-tag">Inspecting</span>}
        </span>

        <span className="ranking-price">
          Complete stay: {formatRupees(hotel.stay_cost)}
        </span>
        <span className="ranking-status">{STATUS_TEXT[hotel.label]}</span>
        <span className="ranking-money">
          {hotel.shortfall !== null
            ? `Over budget by ${formatRupees(hotel.shortfall)}`
            : hotel.remaining_budget !== null
              ? `${formatRupees(hotel.remaining_budget)} left in budget`
              : null}
        </span>

        <span className="ranking-numbers">
          <span>Weighted total: {hotel.weighted_total} importance-minutes</span>
          <span>Average: {hotel.weighted_average_display} min</span>
          <span>Longest round trip: {hotel.longest_trip} min</span>
        </span>

        <span className="ranking-bar" style={barStyle} aria-hidden="true">
          <span className="ranking-bar-fill" />
          <span className="ranking-bar-marker" />
        </span>
        <span className="ranking-bar-text">
          {over
            ? `Stay ${formatRupees(hotel.stay_cost)} is over the budget of ${formatRupees(budget)}`
            : `Stay ${formatRupees(hotel.stay_cost)} against a budget of ${formatRupees(budget)}`}
        </span>
      </button>
    </li>
  )
}

export default function HotelRanking() {
  const { phase, result, isStale, inspectedHotelId, inspectHotel } =
    useComparatorContext()

  let body
  if (phase === 'error' || result?.status === 'INVALID') {
    body = <p className="muted">No ranking while inputs are invalid.</p>
  } else if (result === null) {
    body =
      phase === 'loading' ? (
        <p className="muted">Loading ranked hotels…</p>
      ) : (
        <p className="muted">Load the Demo trip to see ranked hotels.</p>
      )
  } else {
    const budget = result.budget ?? 0
    const scale = Math.max(budget, ...result.hotels.map((h) => h.stay_cost))
    const affordable = result.hotels.filter((h) => h.affordable).length
    body = (
      <>
        <p className="ranking-summary">
          {affordable === 0
            ? 'No hotel fits this budget'
            : `${affordable} of ${result.hotels.length} hotels fit the budget`}
        </p>
        <ol className="ranking-list">
          {result.hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              budget={budget}
              scale={scale}
              inspected={hotel.id === inspectedHotelId}
              onInspect={inspectHotel}
            />
          ))}
        </ol>
      </>
    )
  }

  return (
    <section
      className={`panel ranking-panel${isStale ? ' ranking-stale' : ''}`}
      aria-label="Ranked hotels"
      aria-busy={isStale}
      data-testid={TEST_ID}
    >
      <h2>Ranked hotels</h2>
      {body}
    </section>
  )
}
