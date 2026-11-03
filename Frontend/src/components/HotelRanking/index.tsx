import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { useComparatorContext } from '../../state/ComparatorContext'
import { useLinkedView, type Hover } from '../../state/linkedView'
import type { HotelResult } from '../../types/contracts'
import { formatRupees } from '../../utils/currency'
import { overBudgetBy, statusLabel } from '../../utils/hotelLabels'
import HotelExplanation from '../ExplanationPanel'
import Card from '../ui/Card'
import CountUp from '../ui/CountUp'
import { flipDeltas } from './flip'
import './HotelRanking.css'

interface CardProps {
  hotel: HotelResult
  budget: number
  scale: number
  inspected: boolean
  expanded: boolean
  /** The marker for this hotel is under the pointer on the map. */
  lit: boolean
  /** Position in the list, for the staggered entrance (a CSS variable, no maths). */
  index: number
  onInspect: (id: string) => void
  onToggleWhy: (id: string) => void
  onHover: (hover: Hover | null) => void
  explanation: React.ReactNode
}

function HotelCard({
  hotel,
  budget,
  scale,
  inspected,
  expanded,
  lit,
  index,
  onInspect,
  onToggleWhy,
  onHover,
  explanation,
}: CardProps) {
  const over = hotel.label === 'OVER_BUDGET'
  const classes = ['ranking-card']
  if (over) classes.push('ranking-card-over')
  if (inspected) classes.push('ranking-card-inspected')
  if (lit) classes.push('ranking-card-lit')

  // A marker click inspects this hotel from the map: bring its card into view.
  const item = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (!inspected) return
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    item.current?.scrollIntoView?.({
      block: 'nearest',
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [inspected])

  // The bar lengths are CSS ratios of two API numbers (see HotelRanking.css); no maths in JS.
  const barStyle = {
    '--v': hotel.stay_cost,
    '--max': scale,
    '--budget': budget,
  } as CSSProperties

  return (
    <li
      ref={item}
      data-flip-id={hotel.id}
      style={{ '--i': index } as CSSProperties}
      className={classes.join(' ')}
      onMouseEnter={() => onHover({ id: hotel.id, source: 'card' })}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover({ id: hotel.id, source: 'card' })}
      onBlur={() => onHover(null)}
    >
      <Card accent={hotel.label === 'RECOMMENDED'} hover>
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
            <span className="ranking-title">
              <span className="ranking-name">{hotel.name}</span>
              <span className="ranking-id">{hotel.id}</span>
              {inspected && <span className="ranking-tag">Inspecting</span>}
            </span>
            <span className="ranking-score">
              <span className="ranking-score-value">
                <CountUp value={hotel.weighted_average_display} />
              </span>
              <span className="ranking-score-unit">min average</span>
            </span>
          </span>

          <span className="ranking-status">{statusLabel(hotel.label)}</span>
          <span className="ranking-price">
            Complete stay: {formatRupees(hotel.stay_cost)}
          </span>
          <span className="ranking-money">
            {hotel.shortfall !== null
              ? overBudgetBy(hotel.shortfall)
              : hotel.remaining_budget !== null
                ? `${formatRupees(hotel.remaining_budget)} left in budget`
                : null}
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

          <span className="ranking-numbers">
            <span>Weighted total: {hotel.weighted_total} importance-minutes</span>
            <span>Longest round trip: {hotel.longest_trip} min</span>
          </span>
        </button>

        <button
          type="button"
          className="ranking-why"
          aria-expanded={expanded}
          aria-controls={`why-${hotel.id}`}
          onClick={() => onToggleWhy(hotel.id)}
        >
          Why this score?
          <span className="ranking-why-icon" aria-hidden="true">
            {expanded ? '−' : '+'}
          </span>
        </button>
        {expanded && (
          <div id={`why-${hotel.id}`} className="ranking-why-body">
            {explanation}
          </div>
        )}
      </Card>
    </li>
  )
}

/** Ranked cards in the API's order. Only the inspected card can be open, one at a time. */
export default function HotelRanking() {
  const { city, result, isStale, inspectedHotelId, inspectHotel } = useComparatorContext()
  const { hover, setHover, collapsedId, setCollapsedId } = useLinkedView()

  // FLIP: when the order changes, each card slides from its old place to its new one.
  const list = useRef<HTMLOListElement>(null)
  const tops = useRef(new Map<string, number>())
  const lastOrder = useRef('')
  const order = result?.hotels.map((h) => h.id).join() ?? ''
  useLayoutEffect(() => {
    const el = list.current
    if (!el) return
    const next = new Map<string, number>()
    const items = el.querySelectorAll<HTMLElement>(':scope > [data-flip-id]')
    items.forEach((li) => next.set(li.dataset.flipId!, li.offsetTop))
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (order !== lastOrder.current && lastOrder.current !== '' && !reduced) {
      const deltas = flipDeltas(tops.current, next)
      items.forEach((li) => {
        const delta = deltas.get(li.dataset.flipId!)
        if (delta === undefined) return
        li.animate?.([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], {
          duration: 450,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        })
      })
    }
    lastOrder.current = order
    tops.current = next
  })

  if (!result) return null

  const budget = result.budget ?? 0
  const scale = Math.max(budget, ...result.hotels.map((h) => h.stay_cost))
  const affordable = result.hotels.filter((h) => h.affordable).length

  const inspect = (id: string) => {
    setCollapsedId(null)
    inspectHotel(id)
  }
  const toggleWhy = (id: string) => {
    if (id !== inspectedHotelId) inspect(id)
    else setCollapsedId(collapsedId === id ? null : id)
  }

  return (
    <section
      className={`ranking-panel${isStale ? ' ranking-stale' : ''}`}
      aria-label="Ranked hotels"
      aria-busy={isStale}
    >
      <h2>Ranked hotels</h2>
      <p className="ranking-summary">
        {affordable === 0
          ? 'No hotel fits this budget'
          : `${affordable} of ${result.hotels.length} hotels fit the budget`}
      </p>
      <ol ref={list} className="ranking-list" aria-label="Hotels in rank order">
        {result.hotels.map((hotel, index) => {
          const isInspected = hotel.id === inspectedHotelId
          return (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              budget={budget}
              scale={scale}
              inspected={isInspected}
              expanded={isInspected && collapsedId !== hotel.id}
              lit={hover?.id === hotel.id && hover.source === 'map'}
              index={index}
              onInspect={inspect}
              onToggleWhy={toggleWhy}
              onHover={setHover}
              explanation={<HotelExplanation hotel={hotel} result={result} city={city} />}
            />
          )
        })}
      </ol>
    </section>
  )
}
