import { render, screen, within } from '@testing-library/react'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { Comparator } from '../../state/useComparator'
import type { ComparisonResult, HotelResult } from '../../types/contracts'
import {
  idleComparator,
  invalidResult,
  loadedComparator,
  noHotelResult,
  okResult,
  sampleCity,
} from '../../test/renderWithComparator'
import ExplanationPanel from './index'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(comparator: Comparator) {
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  return render(<ExplanationPanel />)
}

function hotel(id: string, result: ComparisonResult = okResult): HotelResult {
  const found = result.hotels.find((h) => h.id === id)
  if (!found) throw new Error(`sample has no ${id}`)
  return found
}

/** okResult with some hotels changed, to build the tie cases by hand. */
function withHotels(changes: Record<string, Partial<HotelResult>>): ComparisonResult {
  return {
    ...okResult,
    hotels: okResult.hotels.map((h) => ({ ...h, ...(changes[h.id] ?? {}) })),
  }
}

describe('ExplanationPanel reasons', () => {
  it('RECOMMENDED: header and best-of-N sentence', () => {
    show(loadedComparator({ inspectedHotelId: 'H_GARDEN' }))
    expect(screen.getByRole('heading', { name: /Garden Court Hotel/ })).toHaveTextContent(
      'H_GARDEN',
    )
    expect(screen.getByText('★ Recommended')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Best accessibility total among the 6 hotels within budget; ₹13,500 left in budget.',
      ),
    ).toBeInTheDocument()
  })

  it('RANKED: rank sentence and a why-not line with the importance-minute difference', () => {
    show(loadedComparator({ inspectedHotelId: 'H_RIVERBRZ' }))
    expect(screen.getByText('✓ Within budget, rank #4')).toBeInTheDocument()
    expect(
      screen.getByText('Ranked #4 of 6 within-budget hotels; ₹10,200 left in budget.'),
    ).toBeInTheDocument()
    const above = hotel('H_CIVIL')
    expect(
      screen.getByText(
        `Why not #3 ${above.name}? Its weighted total is 3 importance-minutes lower (2514 vs 2517).`,
      ),
    ).toBeInTheDocument()
  })

  it('RANKED: equal totals lose on stay cost', () => {
    const result = withHotels({
      H_CIVIL: { stay_cost: 19000 },
      H_RIVERBRZ: { weighted_total: 2514 },
    })
    show(loadedComparator({ result, inspectedHotelId: 'H_RIVERBRZ' }))
    expect(
      screen.getByText(
        `Same weighted total as #3 ${hotel('H_CIVIL').name}, so it loses on stay cost (₹19,800 vs ₹19,000).`,
      ),
    ).toBeInTheDocument()
  })

  it('RANKED: equal totals and equal cost lose on hotel ID', () => {
    const result = withHotels({
      H_CIVIL: { stay_cost: 19800 },
      H_RIVERBRZ: { weighted_total: 2514 },
    })
    show(loadedComparator({ result, inspectedHotelId: 'H_RIVERBRZ' }))
    expect(
      screen.getByText(
        `Same weighted total and stay cost as #3 ${hotel('H_CIVIL').name}, so it loses on hotel ID (H_RIVERBRZ vs H_CIVIL).`,
      ),
    ).toBeInTheDocument()
  })

  it('OVER_BUDGET: shortfall, stay cost, budget and the never-ranked rule', () => {
    show(loadedComparator({ inspectedHotelId: 'H_HAVELI' }))
    expect(screen.getByText('✕ Over budget')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Over budget by ₹800 (stay ₹30,800, budget ₹30,000). Over-budget hotels are never ranked or recommended.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Why not/)).not.toBeInTheDocument()
  })

  it('NO_AFFORDABLE_HOTEL: adds that nothing is recommended', () => {
    show(
      loadedComparator({
        result: noHotelResult,
        inspectedHotelId: noHotelResult.default_inspected_hotel_id,
      }),
    )
    expect(
      screen.getByText('No hotel fits this budget, so nothing is recommended.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/^Over budget by ₹/)).toBeInTheDocument()
    expect(screen.queryByText(/★/)).not.toBeInTheDocument()
  })
})

describe('ExplanationPanel calculation', () => {
  const inspected = hotel('H_GARDEN')

  it('walk-through has one row per place with the API numbers', () => {
    show(loadedComparator({ inspectedHotelId: 'H_GARDEN' }))
    const table = screen.getByRole('table', { name: /Calculation/ })
    const rows = within(table).getAllByRole('row')
    // header + 15 places + footer
    expect(rows).toHaveLength(17)
    for (const [i, c] of inspected.contributions.entries()) {
      const place = sampleCity.places.find((p) => p.id === c.place_id)
      const row = rows[i + 1]
      expect(row).toHaveTextContent(place!.name)
      expect(row).toHaveTextContent(place!.type === 'food' ? 'Food' : 'Attraction')
      expect(row).toHaveTextContent(`${c.importance} × ${c.minutes} = ${c.contribution}`)
    }
  })

  it('footer total and average line are the API values', () => {
    show(loadedComparator({ inspectedHotelId: 'H_GARDEN' }))
    const table = screen.getByRole('table', { name: /Calculation/ })
    expect(table).toHaveTextContent(
      `Weighted total = ${inspected.weighted_total} importance-minutes`,
    )
    expect(
      screen.getByText(
        `${inspected.weighted_total} ÷ ${okResult.importance_total} (importance total) = ${inspected.weighted_average_display} min average`,
      ),
    ).toBeInTheDocument()
  })

  it('chart has one bar item per place with the printed value', () => {
    show(loadedComparator({ inspectedHotelId: 'H_GARDEN' }))
    const items = within(
      screen.getByRole('list', { name: /Contribution chart/ }),
    ).getAllByRole('listitem')
    expect(items).toHaveLength(15)
    for (const [i, c] of inspected.contributions.entries()) {
      expect(items[i]).toHaveTextContent(String(c.contribution))
    }
  })

  it('shows mocked totals verbatim and computes nothing', () => {
    const odd: ComparisonResult = {
      ...okResult,
      importance_total: 9,
      hotels: okResult.hotels.map((h) =>
        h.id === 'H_GARDEN'
          ? {
              ...h,
              weighted_total: 777,
              weighted_average_display: '86.3',
              contributions: [
                { place_id: 'CLOCK', importance: 2, minutes: 7, contribution: 14 },
                { place_id: 'FORTGATE', importance: 7, minutes: 3, contribution: 763 },
              ],
            }
          : h,
      ),
    }
    show(loadedComparator({ result: odd, inspectedHotelId: 'H_GARDEN' }))
    expect(
      screen.getByText('777 ÷ 9 (importance total) = 86.3 min average'),
    ).toBeInTheDocument()
    const table = screen.getByRole('table', { name: /Calculation/ })
    expect(table).toHaveTextContent('Weighted total = 777 importance-minutes')
    expect(table).toHaveTextContent('2 × 7 = 14')
    expect(table).toHaveTextContent('7 × 3 = 763')
  })
})

describe('ExplanationPanel empty and busy states', () => {
  it('before load: invites loading the Demo trip', () => {
    show(idleComparator())
    expect(
      screen.getByText(
        'Load the Demo trip, then pick a hotel to see how its score is calculated.',
      ),
    ).toBeInTheDocument()
  })

  it('INVALID: no explanation', () => {
    show(loadedComparator({ result: invalidResult, inspectedHotelId: null }))
    expect(
      screen.getByText('No explanation while inputs are invalid.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('request error: no explanation', () => {
    show(idleComparator({ phase: 'error', error: 'down' }))
    expect(
      screen.getByText('No explanation while inputs are invalid.'),
    ).toBeInTheDocument()
  })

  it('inspected hotel missing from the result: shows a hint', () => {
    show(loadedComparator({ inspectedHotelId: 'H_NOPE' }))
    expect(
      screen.getByText('Pick a hotel in the ranking or table to see its explanation.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('stale: aria-busy is set', () => {
    show(
      loadedComparator({ inspectedHotelId: 'H_GARDEN', isStale: true, phase: 'loading' }),
    )
    expect(screen.getByRole('region', { name: 'Explanation' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })
})
