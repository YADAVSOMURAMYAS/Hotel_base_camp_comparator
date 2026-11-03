import { useState } from 'react'
import { useComparatorContext } from '../../state/ComparatorContext'
import { LinkedViewProvider } from '../../state/linkedView'
import { formatRupees } from '../../utils/currency'
import CityMap from '../CityMap'
import HotelRanking from '../HotelRanking'
import StatusBanner from '../StatusBanner'
import TravelMatrixTable from '../TravelMatrixTable'
import { Chip } from '../ui/Chip'
import PillButton from '../ui/PillButton'
import StatCards from './StatCards'
import './Results.css'

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

function Skeleton() {
  return (
    <div className="results-skeleton" aria-hidden="true">
      <div className="results-skeleton-block" />
      <div className="results-skeleton-block" />
      <div className="results-skeleton-block results-skeleton-tall" />
    </div>
  )
}

/** Results screen: read-only summary, stat cards, map, ranked cards, time table. No edit controls. */
export default function Results({ onEdit }: { onEdit: () => void }) {
  const { loaded, city, selection, inputs, result, phase, isStale } =
    useComparatorContext()
  const [showTable, setShowTable] = useState(false)

  const budget =
    result?.budget != null ? formatRupees(result.budget) : inputs.budgetText.trim() || '–'
  const showResult = result !== null && result.status !== 'INVALID'

  let body
  if (!loaded) {
    body = (
      <div className="results-empty">
        <span className="results-empty-icon" aria-hidden="true">
          ◌
        </span>
        <h2>Nothing to compare yet</h2>
        <p className="muted">Set up a trip and press Compare hotels to see results.</p>
        <PillButton arrow onClick={onEdit}>
          Plan a trip
        </PillButton>
      </div>
    )
  } else if (phase === 'loading' && result === null) {
    body = <Skeleton />
  } else if (!showResult) {
    body = (
      <div className="results-empty">
        <span className="results-empty-icon" aria-hidden="true">
          ◌
        </span>
        <h2>No results to show</h2>
        <p className="muted">Fix the plan, then compare again.</p>
        <PillButton arrow onClick={onEdit}>
          Edit plan
        </PillButton>
      </div>
    )
  } else {
    body = (
      <>
        <StatCards />
        <LinkedViewProvider>
          <div className="results-hero">
            <div className="results-map">
              <CityMap hero />
            </div>
            <div className="results-side">
              <HotelRanking />
            </div>
          </div>
        </LinkedViewProvider>
        <div className="results-table">
          <PillButton
            variant="secondary"
            aria-expanded={showTable}
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? 'Hide travel times' : 'Show travel times'}
          </PillButton>
          <div className={showTable ? 'results-collapse results-open' : 'results-collapse'}>
            <div className="results-collapse-inner">{showTable && <TravelMatrixTable />}</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <section
      className={isStale ? 'results results-stale' : 'results'}
      aria-label="Results"
      aria-busy={isStale || undefined}
    >
      {city && (
        <ul className="results-summary" aria-label="Your choices">
          <li>
            <Chip>{city.name}</Chip>
          </li>
          <li>
            <Chip>{`Budget ${budget}`}</Chip>
          </li>
          <li>
            <Chip>{plural(selection.hotel_ids.length, 'hotel')}</Chip>
          </li>
          <li>
            <Chip>{plural(selection.place_ids.length, 'place')}</Chip>
          </li>
        </ul>
      )}
      {loaded && <StatusBanner />}
      {body}
    </section>
  )
}
