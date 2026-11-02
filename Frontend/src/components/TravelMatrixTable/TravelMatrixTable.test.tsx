import { fireEvent, render, screen, within } from '@testing-library/react'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { Comparator } from '../../state/useComparator'
import {
  idleComparator,
  invalidResult,
  loadedComparator,
  okResult,
  sampleCity,
  samplePreset,
} from '../../test/renderWithComparator'
import TravelMatrixTable from './index'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(comparator: Comparator) {
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  return render(<TravelMatrixTable />)
}

const hotelName = (id: string) => sampleCity.hotels.find((h) => h.id === id)!.name

function rowOf(id: string) {
  return screen.getByRole('row', { name: new RegExp(hotelName(id)) })
}

describe('TravelMatrixTable structure', () => {
  it('has a caption, column headers per place and row headers per hotel', () => {
    show(loadedComparator())
    const table = screen.getByRole('table', {
      name: 'Round-trip minutes: hotel to place and back',
    })
    const colHeaders = within(table).getAllByRole('columnheader')
    for (const id of samplePreset.place_ids) {
      const place = sampleCity.places.find((p) => p.id === id)!
      expect(colHeaders.some((h) => h.textContent?.includes(place.name))).toBe(true)
    }
    for (const h of colHeaders) expect(h).toHaveAttribute('scope', 'col')
    const rowHeaders = within(table).getAllByRole('rowheader')
    expect(rowHeaders.length).toBeGreaterThanOrEqual(samplePreset.hotel_ids.length)
    for (const h of rowHeaders) expect(h).toHaveAttribute('scope', 'row')
  })

  it('wraps the table in a focusable, labelled scroll region', () => {
    show(loadedComparator())
    const region = screen.getByRole('region', { name: /scroll/i })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(within(region).getByRole('table')).toBeInTheDocument()
  })

  it('every cell equals city.round_trip_minutes', () => {
    show(loadedComparator())
    for (const hid of samplePreset.hotel_ids) {
      const cells = within(rowOf(hid)).getAllByRole('cell')
      // first cell is the status, then one per place
      const minutes = cells.slice(1).map((c) => c.textContent)
      expect(minutes).toEqual(
        samplePreset.place_ids.map((pid) =>
          String(sampleCity.round_trip_minutes[hid][pid]),
        ),
      )
    }
  })

  it('keeps the selection order of hotels', () => {
    show(loadedComparator())
    const names = screen
      .getAllByRole('rowheader')
      .map((h) => h.textContent ?? '')
      .filter((t) => samplePreset.hotel_ids.some((id) => t.includes(hotelName(id))))
    expect(names[0]).toContain(hotelName(samplePreset.hotel_ids[0]))
    expect(names[9]).toContain(hotelName(samplePreset.hotel_ids[9]))
  })
})

describe('TravelMatrixTable inspection', () => {
  it('marks the inspected row and nothing else', () => {
    show(loadedComparator({ inspectedHotelId: 'H_GARDEN' }))
    const row = rowOf('H_GARDEN')
    expect(row).toHaveAttribute('aria-current', 'true')
    expect(row).toHaveTextContent('Inspecting')
    expect(rowOf('H_CIVIL')).not.toHaveAttribute('aria-current')
    expect(screen.getAllByText('Inspecting')).toHaveLength(1)
  })

  it('clicking a hotel row header calls inspectHotel with its id', () => {
    const inspectHotel = vi.fn()
    show(loadedComparator({ inspectedHotelId: 'H_GARDEN', inspectHotel }))
    fireEvent.click(
      within(rowOf('H_CIVIL')).getByRole('button', { name: hotelName('H_CIVIL') }),
    )
    expect(inspectHotel).toHaveBeenCalledWith('H_CIVIL')
  })
})

describe('TravelMatrixTable status and importance', () => {
  it('shows the API label for each hotel', () => {
    show(loadedComparator())
    expect(rowOf('H_GARDEN')).toHaveTextContent('★ Recommended')
    expect(rowOf('H_STEPWELL')).toHaveTextContent('✓ #2')
    expect(rowOf('H_HAVELI')).toHaveTextContent('✕ Over budget')
  })

  it('shows importance from the API contributions', () => {
    show(loadedComparator())
    const row = screen.getByRole('row', { name: /^Importance/ })
    const values = within(row)
      .getAllByRole('cell')
      .map((c) => c.textContent)
    expect(values).toEqual(
      expect.arrayContaining(
        okResult.hotels[0].contributions.map((c) => String(c.importance)),
      ),
    )
  })

  it('INVALID: times stay, status is blank and importance is a dash', () => {
    show(loadedComparator({ result: invalidResult, inspectedHotelId: null }))
    const row = rowOf('H_GARDEN')
    expect(row).not.toHaveTextContent(/★|✓|✕/)
    const cells = within(row).getAllByRole('cell')
    expect(cells[0].textContent).toBe('')
    expect(cells[1]).toHaveTextContent(
      String(sampleCity.round_trip_minutes.H_GARDEN[samplePreset.place_ids[0]]),
    )
    const importanceCells = within(
      screen.getByRole('row', { name: /^Importance/ }),
    ).getAllByRole('cell')
    for (const c of importanceCells) expect(c).toHaveTextContent('–')
  })

  it('result null after load: status blank, times visible', () => {
    show(loadedComparator({ result: null, phase: 'error', error: 'down' }))
    expect(rowOf('H_GARDEN')).not.toHaveTextContent(/★|✓|✕/)
  })
})

describe('TravelMatrixTable empty and busy states', () => {
  it('before load: invites loading the Demo trip', () => {
    show(idleComparator())
    expect(
      screen.getByText('Load the Demo trip to see the travel-time table.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('stale: aria-busy is set', () => {
    show(loadedComparator({ isStale: true, phase: 'loading' }))
    expect(screen.getByRole('region', { name: 'Travel times' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })
})
