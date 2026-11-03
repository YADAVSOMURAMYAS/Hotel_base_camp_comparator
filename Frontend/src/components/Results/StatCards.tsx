import type { CSSProperties } from 'react'
import { useComparatorContext } from '../../state/ComparatorContext'
import { formatRupees } from '../../utils/currency'
import Card from '../ui/Card'
import CountUp from '../ui/CountUp'

/** Three headline numbers for the recommended hotel, all taken from the API result as given. */
export default function StatCards() {
  const { result } = useComparatorContext()
  const best = result?.hotels.find((h) => h.id === result.recommended_hotel_id)

  // Nothing is recommended (no affordable hotel): the banner and ranking say so; no numbers to headline.
  if (!result || !best) return null

  return (
    <ul className="results-stats" aria-label="Recommended hotel at a glance">
      <li style={{ '--i': 0 } as CSSProperties}>
        <Card className="results-stat">
          <span className="results-stat-label">Best hotel score</span>
          <span className="results-stat-value">
            <CountUp value={best.weighted_average_display} />
            <small> min</small>
          </span>
          <span className="results-stat-note">{`${best.name}: weighted average round trip`}</span>
        </Card>
      </li>
      <li style={{ '--i': 1 } as CSSProperties}>
        <Card className="results-stat">
          <span className="results-stat-label">Total cost vs budget</span>
          <span className="results-stat-value">{formatRupees(best.stay_cost)}</span>
          <span className="results-stat-note">
            {`of ${formatRupees(result.budget ?? 0)}`}
            {best.remaining_budget !== null &&
              ` · ${formatRupees(best.remaining_budget)} left`}
          </span>
        </Card>
      </li>
      <li style={{ '--i': 2 } as CSSProperties}>
        <Card className="results-stat">
          <span className="results-stat-label">Longest round trip</span>
          <span className="results-stat-value">
            <CountUp value={String(best.longest_trip)} />
            <small> min</small>
          </span>
          <span className="results-stat-note">to any chosen place</span>
        </Card>
      </li>
    </ul>
  )
}
