import type { CSSProperties } from 'react'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { ComparisonResult, HotelResult } from '../../types/contracts'
import { formatRupees } from '../../utils/currency'
import { statusLong, TYPE_SYMBOL, TYPE_TEXT } from './hotelStatus'
import './ExplanationPanel.css'

// data-testid is temporary: keeps App smoke test green until T14 removes stub test IDs.
const TEST_ID = 'explanation-panel-stub'

const rupees = (n: number | null) => (n === null ? '–' : formatRupees(n))

/** Plain-language reasons, assembled only from API values. */
function reasons(hotel: HotelResult, result: ComparisonResult): string[] {
  const within = result.hotels.filter((h) => h.affordable).length
  if (hotel.label === 'RECOMMENDED') {
    return [
      `Best accessibility total among the ${within} hotels within budget; ${rupees(hotel.remaining_budget)} left in budget.`,
    ]
  }
  if (hotel.label === 'RANKED') {
    const lines = [
      `Ranked #${hotel.rank} of ${within} within-budget hotels; ${rupees(hotel.remaining_budget)} left in budget.`,
    ]
    const above = result.hotels.find((h) => h.rank === (hotel.rank ?? 0) - 1)
    if (above) lines.push(whyNotAbove(hotel, above))
    return lines
  }
  const lines = [
    `Over budget by ${rupees(hotel.shortfall)} (stay ${rupees(hotel.stay_cost)}, budget ${rupees(result.budget)}). Over-budget hotels are never ranked or recommended.`,
  ]
  if (result.status === 'NO_AFFORDABLE_HOTEL') {
    lines.push('No hotel fits this budget, so nothing is recommended.')
  }
  return lines
}

function whyNotAbove(hotel: HotelResult, above: HotelResult): string {
  const label = `#${above.rank} ${above.name}`
  if (hotel.weighted_total !== above.weighted_total) {
    const gap = hotel.weighted_total - above.weighted_total
    return `Why not ${label}? Its weighted total is ${gap} importance-minutes lower (${above.weighted_total} vs ${hotel.weighted_total}).`
  }
  if (hotel.stay_cost !== above.stay_cost) {
    return `Same weighted total as ${label}, so it loses on stay cost (${rupees(hotel.stay_cost)} vs ${rupees(above.stay_cost)}).`
  }
  return `Same weighted total and stay cost as ${label}, so it loses on hotel ID (${hotel.id} vs ${above.id}).`
}

export default function ExplanationPanel() {
  const { city, result, inspectedHotelId, phase, isStale } = useComparatorContext()
  const hotel = result?.hotels.find((h) => h.id === inspectedHotelId)

  let body
  if (phase === 'error' || result?.status === 'INVALID') {
    body = <p className="muted">No explanation while inputs are invalid.</p>
  } else if (!result) {
    body = (
      <p className="muted">
        Load the Demo trip, then pick a hotel to see how its score is calculated.
      </p>
    )
  } else if (!hotel) {
    body = (
      <p className="muted">
        Pick a hotel in the ranking or table to see its explanation.
      </p>
    )
  } else {
    const places = new Map((city?.places ?? []).map((p) => [p.id, p]))
    // Presentation only: the longest bar is the largest contribution of this hotel.
    const longest = Math.max(1, ...hotel.contributions.map((c) => c.contribution))
    body = (
      <>
        <h3 className="explain-hotel">
          {hotel.name} <span className="muted">({hotel.id})</span>
        </h3>
        <p className="explain-status">{statusLong(hotel)}</p>
        {reasons(hotel, result).map((line) => (
          <p key={line} className="explain-reason">
            {line}
          </p>
        ))}

        <div className="explain-scroll">
          <table className="explain-table">
            <caption>Calculation for {hotel.name}</caption>
            <thead>
              <tr>
                <th scope="col">Place</th>
                <th scope="col">Type</th>
                <th scope="col">Importance</th>
                <th scope="col">Round-trip minutes</th>
                <th scope="col">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {hotel.contributions.map((c) => {
                const place = places.get(c.place_id)
                return (
                  <tr key={c.place_id}>
                    <th scope="row">{place?.name ?? c.place_id}</th>
                    <td>
                      {place
                        ? `${TYPE_SYMBOL[place.type]} ${TYPE_TEXT[place.type]}`
                        : '–'}
                    </td>
                    <td>{c.importance}</td>
                    <td>{c.minutes}</td>
                    <td>{`${c.importance} × ${c.minutes} = ${c.contribution}`}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={5}>
                  Weighted total = {hotel.weighted_total} importance-minutes
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="explain-average">
          {`${hotel.weighted_total} ÷ ${result.importance_total} (importance total) = ${hotel.weighted_average_display} min average`}
        </p>

        <h4>Contribution by place</h4>
        <ul className="explain-chart" aria-label="Contribution chart">
          {hotel.contributions.map((c) => (
            <li key={c.place_id}>
              <span className="explain-chart-name">
                {places.get(c.place_id)?.name ?? c.place_id}
              </span>
              <span className="explain-bar-track" aria-hidden="true">
                <span
                  className="explain-bar"
                  style={{ '--v': c.contribution, '--max': longest } as CSSProperties}
                />
              </span>
              <span className="explain-chart-value">{c.contribution}</span>
            </li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <section
      className={isStale ? 'panel explain explain-stale' : 'panel explain'}
      aria-label="Explanation"
      aria-busy={isStale ? 'true' : undefined}
      data-testid={TEST_ID}
    >
      <h2>Explanation</h2>
      {body}
    </section>
  )
}
