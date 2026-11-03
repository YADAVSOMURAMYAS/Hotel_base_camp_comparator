// U6b: hover and click effects on the Results map, and the two-way link with the ranked cards.
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useComparatorContext } from '../../state/ComparatorContext'
import { LinkedViewProvider } from '../../state/linkedView'
import type { Comparator } from '../../state/useComparator'
import { loadedComparator, okResult, sampleCity } from '../../test/renderWithComparator'
import HotelRanking from '../HotelRanking'
import CityMap from '.'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(comparator: Comparator) {
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  return render(
    <LinkedViewProvider>
      <CityMap hero />
      <HotelRanking />
    </LinkedViewProvider>,
  )
}

const marker = (id: string) => screen.getByTestId(`marker-hotel-${id}`)
const best = okResult.hotels.find((h) => h.id === 'H_GARDEN')!
const other = okResult.hotels.find((h) => h.id === 'H_CIVIL')!
const hotelName = (id: string) => sampleCity.hotels.find((h) => h.id === id)!.name
const cardOf = (id: string) => {
  const list = screen.getByRole('list', { name: 'Hotels in rank order' })
  return within(list)
    .getAllByRole('listitem')
    .filter((li) => li.parentElement === list)
    .find((li) => li.querySelector('.ranking-id')!.textContent === id)!
}

beforeEach(() => vi.mocked(useComparatorContext).mockReset())

describe('hover on the map', () => {
  it('a hotel marker springs up and shows a card with the API numbers', async () => {
    show(loadedComparator())
    await userEvent.hover(marker(other.id))
    expect(marker(other.id)).toHaveClass('citymap-hot')
    const tip = screen
      .getByText(other.weighted_average_display + ' min average')
      .closest('.mapcard')!
    expect(tip).toHaveTextContent(hotelName(other.id))
    expect(tip).toHaveTextContent('₹')
    expect(tip).toHaveTextContent(`${other.longest_trip} min`)
    await userEvent.unhover(marker(other.id))
    expect(marker(other.id)).not.toHaveClass('citymap-hot')
    expect(document.querySelector('.mapcard-tooltip')).toBeNull()
  })

  it('keyboard focus on a marker does the same as hovering it', () => {
    show(loadedComparator())
    act(() => marker(other.id).focus())
    expect(document.querySelector('.mapcard-tooltip')).not.toBeNull()
  })

  it('a place marker shows its importance and the trip time from the inspected hotel', async () => {
    show(loadedComparator({ inspectedHotelId: best.id }))
    const c = best.contributions[0]
    await userEvent.hover(screen.getByTestId(`marker-place-${c.place_id}`))
    const tip = document.querySelector('.mapcard-tooltip')!
    expect(tip).toHaveTextContent(`${c.importance} of 5`)
    expect(tip).toHaveTextContent(`${c.minutes} min`)
  })

  it('hovering a marker lights its ranked card', async () => {
    show(loadedComparator())
    await userEvent.hover(marker(other.id))
    expect(cardOf(other.id)).toHaveClass('ranking-card-lit')
    expect(cardOf(best.id)).not.toHaveClass('ranking-card-lit')
    await userEvent.unhover(marker(other.id))
    expect(cardOf(other.id)).not.toHaveClass('ranking-card-lit')
  })

  it('hovering a ranked card pulses its marker, without a tooltip on the map', async () => {
    show(loadedComparator())
    await userEvent.hover(cardOf(other.id))
    expect(marker(other.id)).toHaveClass('citymap-pulse')
    expect(document.querySelector('.mapcard-tooltip')).toBeNull()
    await userEvent.unhover(cardOf(other.id))
    expect(marker(other.id)).not.toHaveClass('citymap-pulse')
  })
})

describe('click on a marker', () => {
  it('inspects the hotel, ripples, and opens a detail popup that can be closed', async () => {
    const c = loadedComparator({ inspectedHotelId: other.id })
    show(c)
    fireEvent.click(marker(other.id))
    expect(c.inspectHotel).toHaveBeenCalledWith(other.id)
    expect(document.querySelectorAll('.citymap-ripple')).toHaveLength(1)
    const popup = screen.getByRole('group', {
      name: `Details for ${hotelName(other.id)}`,
    })
    expect(popup).toHaveTextContent(`${other.weighted_total} importance-minutes`)
    expect(popup).toHaveTextContent(`${other.longest_trip} min`)
    await userEvent.click(within(popup).getByRole('button', { name: 'Close details' }))
    expect(screen.queryByRole('group', { name: /Details for/ })).toBeNull()
  })

  it('the popup is not shown for a hotel that is no longer the inspected one', () => {
    show(loadedComparator({ inspectedHotelId: best.id }))
    fireEvent.click(marker(other.id))
    expect(screen.queryByRole('group', { name: /Details for/ })).toBeNull()
  })

  it('unfolds a card that was folded shut', async () => {
    show(loadedComparator({ inspectedHotelId: best.id }))
    const toggle = within(cardOf(best.id)).getByRole('button', { name: /Why this score/ })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(marker(best.id))
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('a ripple removes itself after a moment', () => {
    vi.useFakeTimers()
    try {
      show(loadedComparator({ inspectedHotelId: other.id }))
      fireEvent.click(marker(other.id))
      expect(document.querySelector('.citymap-ripple')).not.toBeNull()
      act(() => {
        vi.advanceTimersByTime(900)
      })
      expect(document.querySelector('.citymap-ripple')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('click on empty map', () => {
  it('forgets the inspected hotel and closes the popup, with a ripple', async () => {
    const c = loadedComparator({ inspectedHotelId: other.id })
    show(c)
    fireEvent.click(marker(other.id))
    expect(screen.getByRole('group', { name: /Details for/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('img', { name: /Schematic map/ }))
    await waitFor(() => expect(c.inspectHotel).toHaveBeenLastCalledWith(null))
    expect(screen.queryByRole('group', { name: /Details for/ })).toBeNull()
    expect(document.querySelectorAll('.citymap-ripple').length).toBeGreaterThan(0)
  })

  it('a click on a marker or a map button is not an empty-map click', async () => {
    const c = loadedComparator()
    show(c)
    fireEvent.click(marker(other.id))
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    await new Promise((r) => setTimeout(r, 300))
    expect(c.inspectHotel).not.toHaveBeenCalledWith(null)
  })

  it('a double-click (zoom) does not clear the inspection', async () => {
    const c = loadedComparator()
    show(c)
    const svg = screen.getByRole('img', { name: /Schematic map/ })
    fireEvent.click(svg)
    fireEvent.doubleClick(svg)
    await new Promise((r) => setTimeout(r, 300))
    expect(c.inspectHotel).not.toHaveBeenCalledWith(null)
  })
})

describe('links to the chosen places', () => {
  it('are drawn for the inspected hotel, thicker for a more important place', () => {
    show(loadedComparator({ inspectedHotelId: best.id }))
    const lines = screen.getByTestId('citymap-links').querySelectorAll('line')
    expect(lines).toHaveLength(best.contributions.length)
    best.contributions.forEach((c, i) => {
      expect(lines[i].getAttribute('style')).toContain(`--w: ${c.importance}`)
    })
  })

  it('carry the API minutes and contribution on their labels', () => {
    show(loadedComparator({ inspectedHotelId: best.id }))
    for (const c of best.contributions) {
      expect(screen.getByTestId(`link-label-${c.place_id}`)).toHaveTextContent(
        `${c.minutes} min · ${c.contribution}`,
      )
    }
  })

  it('are gone when nothing is inspected', () => {
    show(loadedComparator({ inspectedHotelId: null }))
    expect(screen.getByTestId('citymap-links').querySelectorAll('line')).toHaveLength(0)
  })
})
