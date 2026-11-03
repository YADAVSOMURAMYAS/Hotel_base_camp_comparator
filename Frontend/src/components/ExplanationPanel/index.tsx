import type { City, ComparisonResult, HotelResult } from '../../types/contracts'
import { formatRupees } from '../../utils/currency'
import { overBudgetBy, statusLong, typeChip } from '../../utils/hotelLabels'
import './ExplanationPanel.css'

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
    `${overBudgetBy(hotel.shortfall)} (stay ${rupees(hotel.stay_cost)}, budget ${rupees(result.budget)}). Over-budget hotels are never ranked or recommended.`,
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

interface Props {
  hotel: HotelResult
  result: ComparisonResult
  city: City | null
}

/** How one hotel's score is built, from API values only. Shown inside the ranked card's accordion. */
export default function HotelExplanation({ hotel, result, city }: Props) {
  const places = new Map((city?.places ?? []).map((p) => [p.id, p]))
  const name = (id: string) => places.get(id)?.name ?? id
  return (
    <div className="explain">
      <h3 className="explain-hotel">
        {hotel.name} <span className="muted">({hotel.id})</span>
      </h3>
      <p className="explain-status">{statusLong(hotel)}</p>
      {reasons(hotel, result).map((line) => (
        <p key={line} className="explain-reason">
          {line}
        </p>
      ))}

      <h4>Contribution by place</h4>
      {/* Segment width is the contribution itself (flex-grow); the list below is the accessible equivalent. */}
      <div className="explain-stack" aria-hidden="true">
        {hotel.contributions.map((c) => (
          <span
            key={c.place_id}
            className="explain-segment"
            style={{ flexGrow: c.contribution }}
            data-tip={`${name(c.place_id)}: ${c.importance} × ${c.minutes} = ${c.contribution}`}
          />
        ))}
      </div>
      <ul className="explain-chart" aria-label="Contribution chart">
        {hotel.contributions.map((c) => (
          <li key={c.place_id}>
            <span className="explain-chart-name">{name(c.place_id)}</span>
            <span className="explain-chart-value">{c.contribution}</span>
          </li>
        ))}
      </ul>

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
                  <th scope="row">{name(c.place_id)}</th>
                  <td>{place ? typeChip(place.type) : '–'}</td>
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
    </div>
  )
}
