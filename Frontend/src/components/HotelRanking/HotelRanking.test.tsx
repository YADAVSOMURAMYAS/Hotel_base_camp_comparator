import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { ComparisonResult } from '../../types/contracts'
import HotelRanking from '.'
import {
  loadedComparator,
  noHotelResult,
  okResult,
} from '../../test/renderWithComparator'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(overrides = {}) {
  const comparator = loadedComparator(overrides)
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  render(<HotelRanking />)
  return comparator
}

// An open card holds its own list (the contribution chart), so only the ranking's direct items count.
const cards = () => {
  const list = screen.getByRole('list', { name: 'Hotels in rank order' })
  return within(list)
    .getAllByRole('listitem')
    .filter((li) => li.parentElement === list)
}
const cardOf = (id: string) =>
  cards().find((c) => within(c).queryAllByText(id).length > 0)!

beforeEach(() => vi.mocked(useComparatorContext).mockReset())

describe('HotelRanking', () => {
  it('renders hotels in the exact API order', () => {
    show()
    const ids = cards().map(
      (c) => okResult.hotels.find((h) => c.textContent?.includes(h.id))!.id,
    )
    expect(ids).toEqual(okResult.hotels.map((h) => h.id))
  })

  it('does not sort: a shuffled list keeps its input order', () => {
    const shuffled: ComparisonResult = {
      ...okResult,
      hotels: [
        okResult.hotels[7],
        okResult.hotels[2],
        okResult.hotels[9],
        okResult.hotels[0],
      ],
    }
    show({ result: shuffled })
    const texts = cards().map((c) => c.textContent ?? '')
    shuffled.hotels.forEach((h, i) => expect(texts[i]).toContain(h.id))
    expect(cards()).toHaveLength(4)
  })

  it('marks the recommended hotel as #1 with a star', () => {
    show()
    const card = cardOf('H_GARDEN')
    expect(within(card).getAllByText('★ Recommended').length).toBeGreaterThan(0)
    expect(within(card).getByText('#1')).toBeInTheDocument()
    expect(within(cardOf('H_STEPWELL')).getByText('#2')).toBeInTheDocument()
    expect(within(cardOf('H_STEPWELL')).getByText('✓ Within budget')).toBeInTheDocument()
  })

  it('shows over-budget hotels unranked with the exact shortfall', () => {
    show()
    const over = okResult.hotels.filter((h) => h.label === 'OVER_BUDGET')
    expect(over).toHaveLength(4)
    for (const h of over) {
      const card = cardOf(h.id)
      expect(within(card).getByText('✕ Over budget')).toBeInTheDocument()
      expect(within(card).getByText(/^Over budget by ₹[\d,]+$/)).toBeInTheDocument()
      expect(within(card).queryByText(/^#\d+$/)).toBeNull()
      expect(within(card).getByText('Unranked')).toBeInTheDocument()
    }
    expect(
      within(cardOf('H_GHANTA')).getByText('Over budget by ₹6,500'),
    ).toBeInTheDocument()
    expect(
      within(cardOf('H_MAHAL')).getByText('Over budget by ₹22,000'),
    ).toBeInTheDocument()
  })

  it('shows remaining budget, including zero', () => {
    const hotels = okResult.hotels.map((h) =>
      h.id === 'H_NEELGHAT' ? { ...h, remaining_budget: 0 } : h,
    )
    show({ result: { ...okResult, hotels } })
    expect(
      within(cardOf('H_NEELGHAT')).getByText('₹0 left in budget'),
    ).toBeInTheDocument()
    expect(
      within(cardOf('H_GARDEN')).getByText('₹13,500 left in budget'),
    ).toBeInTheDocument()
  })

  it('shows price and the accessibility numbers from the API', () => {
    show()
    const card = cardOf('H_GARDEN')
    expect(within(card).getByText(/Complete stay: ₹16,500/)).toBeInTheDocument()
    expect(
      within(card).getByText('Weighted total: 2234 importance-minutes'),
    ).toBeInTheDocument()
    expect(within(card).getByText('55.9')).toBeInTheDocument()
    expect(within(card).getByText('min average')).toBeInTheDocument()
    expect(within(card).getByText('Longest round trip: 86 min')).toBeInTheDocument()
  })

  it('gives the price bar a text equivalent, with an over-budget label', () => {
    show()
    expect(
      within(cardOf('H_GARDEN')).getByText('Stay ₹16,500 against a budget of ₹30,000'),
    ).toBeInTheDocument()
    expect(
      within(cardOf('H_MAHAL')).getByText('Stay ₹52,000 is over the budget of ₹30,000'),
    ).toBeInTheDocument()
  })

  it('calls inspectHotel on click', async () => {
    const c = show()
    await userEvent.click(
      within(cardOf('H_CIVIL')).getByRole('button', { name: /H_CIVIL/ }),
    )
    expect(c.inspectHotel).toHaveBeenCalledWith('H_CIVIL')
  })

  it('calls inspectHotel on Enter and Space', async () => {
    const c = show()
    within(cardOf('H_HILLTOP'))
      .getByRole('button', { name: /H_HILLTOP/ })
      .focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(c.inspectHotel).toHaveBeenCalledTimes(2)
    expect(c.inspectHotel).toHaveBeenCalledWith('H_HILLTOP')
  })

  it('marks only the inspected card', () => {
    show({ inspectedHotelId: 'H_CIVIL' })
    expect(screen.getAllByRole('button', { current: true })).toHaveLength(1)
    expect(within(cardOf('H_CIVIL')).getByText('Inspecting')).toBeInTheDocument()
    expect(screen.getAllByText('Inspecting')).toHaveLength(1)
  })

  it('summarises with the affordable count', () => {
    show()
    expect(screen.getByText('6 of 10 hotels fit the budget')).toBeInTheDocument()
  })

  it('shows no winner and no ranks when nothing is affordable', () => {
    show({ result: noHotelResult, inspectedHotelId: 'H_CIVIL' })
    expect(screen.getByText('No hotel fits this budget')).toBeInTheDocument()
    expect(screen.queryByText(/★/)).toBeNull()
    expect(screen.queryByText(/^#\d+$/)).toBeNull()
    expect(cards()).toHaveLength(10)
    expect(
      within(cardOf('H_GHANTA')).getByText('Over budget by ₹36,500'),
    ).toBeInTheDocument()
  })

  it('renders nothing without a result (Results shows the empty state)', () => {
    show({ result: null, phase: 'idle', loaded: false })
    expect(screen.queryByRole('region', { name: 'Ranked hotels' })).toBeNull()
  })

  it('opens the explanation for the inspected card only, behind "Why this score?"', async () => {
    show({ inspectedHotelId: 'H_GARDEN' })
    expect(screen.getAllByRole('table', { name: /Calculation for/ })).toHaveLength(1)
    const own = within(cardOf('H_GARDEN')).getByRole('button', { name: /Why this score/ })
    expect(own).toHaveAttribute('aria-expanded', 'true')
    const other = within(cardOf('H_CIVIL')).getByRole('button', {
      name: /Why this score/,
    })
    expect(other).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(own)
    expect(screen.queryByRole('table', { name: /Calculation for/ })).toBeNull()
  })

  it('"Why this score?" on another card inspects it first', async () => {
    const c = show({ inspectedHotelId: 'H_GARDEN' })
    await userEvent.click(
      within(cardOf('H_CIVIL')).getByRole('button', { name: /Why this score/ }),
    )
    expect(c.inspectHotel).toHaveBeenCalledWith('H_CIVIL')
  })

  it('shows the average as the large score', () => {
    show()
    expect(within(cardOf('H_STEPWELL')).getByText(/^\d+\.\d$/)).toBeInTheDocument()
  })

  it('is busy while stale', () => {
    show({ isStale: true, phase: 'loading' })
    expect(screen.getByRole('region', { name: 'Ranked hotels' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })

  it('is not busy when fresh', () => {
    show()
    expect(screen.getByRole('region', { name: 'Ranked hotels' })).toHaveAttribute(
      'aria-busy',
      'false',
    )
  })
})
