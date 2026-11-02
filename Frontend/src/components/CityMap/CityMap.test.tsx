import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { Comparator } from '../../state/useComparator'
import type { City } from '../../types/contracts'
import {
  idleComparator,
  invalidResult,
  loadedComparator,
  noHotelResult,
  okResult,
  sampleCity,
} from '../../test/renderWithComparator'
import CityMap from '.'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(comparator: Comparator) {
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  return render(<CityMap />)
}

const hotelMarkers = () => screen.getAllByTestId(/^marker-hotel-/)
const placeMarkers = () => screen.getAllByTestId(/^marker-place-/)
const links = () => screen.queryAllByTestId(/^link-label-/)
const hotelMarker = (id: string) => screen.getByTestId(`marker-hotel-${id}`)

const contributionsOf = (hotelId: string) =>
  okResult.hotels.find((h) => h.id === hotelId)!.contributions

beforeEach(() => vi.mocked(useComparatorContext).mockReset())

describe('CityMap empty state', () => {
  it('invites loading the Demo trip and draws no map before load', () => {
    show(idleComparator())
    expect(screen.getByText('Load the Demo trip to see the map.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('CityMap markers', () => {
  it('renders exactly 25 markers: 10 hotels and 15 places', () => {
    show(loadedComparator())
    expect(hotelMarkers()).toHaveLength(10)
    expect(placeMarkers()).toHaveLength(15)
  })

  it('gives every marker a visible name label', () => {
    show(loadedComparator())
    for (const h of sampleCity.hotels) expect(screen.getByText(h.name)).toBeVisible()
    for (const p of sampleCity.places) expect(screen.getByText(p.name)).toBeVisible()
  })

  it('names the svg and points to the Travel times table', () => {
    show(loadedComparator())
    const svg = screen.getByRole('img')
    expect(svg).toHaveAccessibleName(/map/i)
    expect(svg).toHaveAccessibleDescription(/travel times table/i)
  })

  it('has a legend and the not-routes caption', () => {
    show(loadedComparator())
    const legend = screen.getByRole('list', { name: /legend/i })
    for (const text of [
      /hotel/i,
      /attraction/i,
      /food/i,
      /recommended/i,
      /over budget/i,
    ]) {
      expect(within(legend).getByText(text)).toBeInTheDocument()
    }
    expect(
      screen.getByText('Comparison links, not routes. Line length is not travel time.'),
    ).toBeInTheDocument()
  })
})

describe('CityMap status symbols', () => {
  it('puts ★ only on the recommended hotel', () => {
    show(loadedComparator())
    const starred = hotelMarkers().filter((m) => within(m).queryByText('★'))
    expect(starred).toEqual([hotelMarker('H_GARDEN')])
  })

  it('puts ✕ on each over-budget hotel and on no other', () => {
    show(loadedComparator())
    const crossed = hotelMarkers()
      .filter((m) => within(m).queryByText('✕'))
      .map((m) => m.dataset.testid)
    const overBudget = okResult.hotels
      .filter((h) => h.label === 'OVER_BUDGET')
      .map((h) => `marker-hotel-${h.id}`)
    expect(overBudget).toHaveLength(4)
    expect(crossed.sort()).toEqual(overBudget.sort())
  })

  it('NO_AFFORDABLE_HOTEL: no ★ and ✕ on every hotel', () => {
    show(loadedComparator({ result: noHotelResult, inspectedHotelId: 'H_CIVIL' }))
    expect(screen.queryByText('★')).not.toBeInTheDocument()
    expect(screen.getAllByText('✕')).toHaveLength(10)
  })

  it('result null: 25 markers stay, no links, no symbols', () => {
    show(loadedComparator({ result: null, inspectedHotelId: null }))
    expect(hotelMarkers()).toHaveLength(10)
    expect(placeMarkers()).toHaveLength(15)
    expect(links()).toHaveLength(0)
    expect(screen.queryByText('★')).not.toBeInTheDocument()
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('INVALID result: markers stay, nothing derived is drawn', () => {
    show(loadedComparator({ result: invalidResult, inspectedHotelId: null }))
    expect(hotelMarkers()).toHaveLength(10)
    expect(links()).toHaveLength(0)
    expect(screen.queryByText('★')).not.toBeInTheDocument()
  })
})

describe('CityMap comparison links', () => {
  it('draws 15 links for the inspected hotel with API minutes and contribution', () => {
    show(loadedComparator())
    expect(links()).toHaveLength(15)
    for (const c of contributionsOf('H_GARDEN')) {
      expect(screen.getByTestId(`link-label-${c.place_id}`)).toHaveTextContent(
        `${c.minutes} min · ${c.contribution}`,
      )
    }
  })

  it('moves the links to another inspected hotel and keeps 25 markers', () => {
    const { rerender } = show(loadedComparator())
    vi.mocked(useComparatorContext).mockReturnValue(
      loadedComparator({ inspectedHotelId: 'H_GHANTA' }),
    )
    rerender(<CityMap />)
    expect(links()).toHaveLength(15)
    for (const c of contributionsOf('H_GHANTA')) {
      expect(screen.getByTestId(`link-label-${c.place_id}`)).toHaveTextContent(
        `${c.minutes} min · ${c.contribution}`,
      )
    }
    expect(hotelMarkers()).toHaveLength(10)
    expect(placeMarkers()).toHaveLength(15)
  })

  it('marks only the inspected hotel with aria-current', () => {
    show(loadedComparator({ inspectedHotelId: 'H_HAVELI' }))
    const current = hotelMarkers().filter(
      (m) => m.getAttribute('aria-current') === 'true',
    )
    expect(current).toEqual([hotelMarker('H_HAVELI')])
  })

  it('does not change any displayed number when marker positions move', () => {
    const { container } = show(loadedComparator())
    const before = links().map((l) => l.textContent)
    const moved: City = {
      ...sampleCity,
      hotels: sampleCity.hotels.map((h) => ({ ...h, position: { x: 500, y: 300 } })),
      places: sampleCity.places.map((p) => ({
        ...p,
        position: { x: 999 - p.position.x, y: 599 - p.position.y },
      })),
    }
    vi.mocked(useComparatorContext).mockReturnValue(loadedComparator({ city: moved }))
    render(<CityMap />, { container })
    expect(links().map((l) => l.textContent)).toEqual(before)
  })

  it('stale: dims the links and sets aria-busy', () => {
    show(loadedComparator({ isStale: true, phase: 'loading' }))
    expect(screen.getByRole('region', { name: 'City map' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByTestId('citymap-links')).toHaveClass('citymap-stale')
  })

  it('not stale: aria-busy is false', () => {
    show(loadedComparator())
    expect(screen.getByRole('region', { name: 'City map' })).toHaveAttribute(
      'aria-busy',
      'false',
    )
  })
})

describe('CityMap interaction', () => {
  it('click on a hotel marker inspects that hotel', async () => {
    const comparator = loadedComparator()
    show(comparator)
    await userEvent.click(hotelMarker('H_MAHAL'))
    expect(comparator.inspectHotel).toHaveBeenCalledWith('H_MAHAL')
  })

  it('Enter and Space on a focused hotel marker inspect that hotel', async () => {
    const comparator = loadedComparator()
    show(comparator)
    const marker = hotelMarker('H_HILLTOP')
    marker.focus()
    expect(marker).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(comparator.inspectHotel).toHaveBeenCalledTimes(2)
    expect(comparator.inspectHotel).toHaveBeenLastCalledWith('H_HILLTOP')
  })

  it('place markers are not focusable and do not inspect', async () => {
    const comparator = loadedComparator()
    show(comparator)
    const place = screen.getByTestId('marker-place-CLOCK')
    expect(place).not.toHaveAttribute('tabindex')
    await userEvent.click(place)
    fireEvent.keyDown(place, { key: 'Enter' })
    expect(comparator.inspectHotel).not.toHaveBeenCalled()
  })
})
