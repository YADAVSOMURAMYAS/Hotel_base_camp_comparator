import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { Comparator } from '../../state/useComparator'
import type { City } from '../../types/contracts'
import {
  loadedComparator,
  fullSurmapurCity,
  okResult,
  sampleCity,
  shikharpurCity,
} from '../../test/renderWithComparator'
import CityMap from '.'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(comparator: Comparator) {
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  return render(<CityMap selectable />)
}

const onFull = (over: Partial<Comparator> = {}) =>
  loadedComparator({ city: fullSurmapurCity, ...over })
const markers = () => screen.getAllByTestId(/^marker-(hotel|place)-/)
const links = () => screen.queryAllByTestId(/^link-label-/)
const modeRadio = (name: 'Inspect' | 'Select') => screen.getByRole('radio', { name })
const selectMode = () => userEvent.click(modeRadio('Select'))

const demo = loadedComparator().selection
const unselectedHotel = fullSurmapurCity.hotels.find(
  (h) => !demo.hotel_ids.includes(h.id),
)!
const unselectedPlace = fullSurmapurCity.places.find(
  (p) => !demo.place_ids.includes(p.id),
)!
const selectedHotel = fullSurmapurCity.hotels.find((h) => demo.hotel_ids.includes(h.id))!

describe('CityMap mode switch', () => {
  it('offers an Inspect / Select radio group, Inspect first and checked', () => {
    show(onFull())
    const group = screen.getByRole('radiogroup', { name: 'Map mode' })
    expect(within(group).getAllByRole('radio')).toHaveLength(2)
    expect(modeRadio('Inspect')).toBeChecked()
    expect(modeRadio('Select')).not.toBeChecked()
  })

  it('Inspect mode with the Demo selection still has exactly 25 markers and 15 links', () => {
    show(onFull())
    expect(markers()).toHaveLength(25)
    expect(links()).toHaveLength(15)
  })

  it('positions never change any number shown on a link', () => {
    const moved: City = {
      ...sampleCity,
      hotels: sampleCity.hotels.map((h) => ({ ...h, position: { x: 10, y: 10 } })),
      places: sampleCity.places.map((p, i) => ({
        ...p,
        position: { x: 20 + i, y: 500 },
      })),
    }
    show(loadedComparator({ city: moved }))
    const inspected = okResult.hotels.find(
      (h) => h.id === okResult.default_inspected_hotel_id,
    )!
    for (const c of inspected.contributions) {
      expect(screen.getByTestId(`link-label-${c.place_id}`)).toHaveTextContent(
        `${c.minutes} min · ${c.contribution}`,
      )
    }
  })
})

describe('CityMap Select mode', () => {
  it('draws all 80 catalog markers and no comparison links', async () => {
    show(onFull())
    await selectMode()
    expect(markers()).toHaveLength(80)
    expect(links()).toHaveLength(0)
  })

  it('marks markers as checkboxes with aria-checked, focusable', async () => {
    show(onFull())
    await selectMode()
    const on = screen.getByTestId(`marker-hotel-${selectedHotel.id}`)
    const off = screen.getByTestId(`marker-hotel-${unselectedHotel.id}`)
    expect(on).toHaveAttribute('role', 'checkbox')
    expect(on).toHaveAttribute('aria-checked', 'true')
    expect(off).toHaveAttribute('aria-checked', 'false')
    expect(off).toHaveAttribute('tabindex', '0')
  })

  it('labels selected markers permanently but unselected ones only on hover or focus', async () => {
    show(onFull())
    await selectMode()
    expect(screen.getByText(selectedHotel.name)).toBeVisible()
    expect(screen.queryByText(unselectedHotel.name)).not.toBeInTheDocument()
    expect(screen.queryByText(unselectedPlace.name)).not.toBeInTheDocument()

    const hotel = screen.getByTestId(`marker-hotel-${unselectedHotel.id}`)
    await userEvent.hover(hotel)
    expect(screen.getByText(unselectedHotel.name)).toBeVisible()
    await userEvent.unhover(hotel)
    expect(screen.queryByText(unselectedHotel.name)).not.toBeInTheDocument()

    const place = screen.getByTestId(`marker-place-${unselectedPlace.id}`)
    fireEvent.focus(place)
    expect(screen.getByText(unselectedPlace.name)).toBeVisible()
    fireEvent.blur(place)
    expect(screen.queryByText(unselectedPlace.name)).not.toBeInTheDocument()
  })

  it('every marker still has its name in an SVG title for assistive tech', async () => {
    show(onFull())
    await selectMode()
    const marker = screen.getByTestId(`marker-hotel-${unselectedHotel.id}`)
    expect(marker.querySelector('title')?.textContent).toContain(unselectedHotel.name)
  })

  it('clicking a selected hotel or place toggles it', async () => {
    const c = onFull()
    show(c)
    await selectMode()
    await userEvent.click(screen.getByTestId(`marker-hotel-${selectedHotel.id}`))
    expect(c.toggleHotel).toHaveBeenCalledWith(selectedHotel.id)
    const placeId = c.selection.place_ids[0]
    await userEvent.click(screen.getByTestId(`marker-place-${placeId}`))
    expect(c.togglePlace).toHaveBeenCalledWith(placeId)
  })

  it('Enter and Space toggle from the keyboard', async () => {
    const c = onFull({
      selection: { hotel_ids: [selectedHotel.id], place_ids: [] },
    })
    show(c)
    await selectMode()
    const marker = screen.getByTestId(`marker-hotel-${unselectedHotel.id}`)
    fireEvent.keyDown(marker, { key: 'Enter' })
    fireEvent.keyDown(marker, { key: ' ' })
    expect(c.toggleHotel).toHaveBeenCalledTimes(2)
    expect(c.toggleHotel).toHaveBeenCalledWith(unselectedHotel.id)
  })

  it('respects the limits: unselected markers do not toggle at 10 hotels / 15 places', async () => {
    const c = onFull() // the Demo trip is already at 10 hotels and 15 places
    show(c)
    await selectMode()
    await userEvent.click(screen.getByTestId(`marker-hotel-${unselectedHotel.id}`))
    expect(screen.getByTestId('map-notice')).toHaveTextContent(/limit of 10 hotels/i)
    await userEvent.click(screen.getByTestId(`marker-place-${unselectedPlace.id}`))
    expect(screen.getByTestId('map-notice')).toHaveTextContent(/limit of 15 places/i)
    expect(c.toggleHotel).not.toHaveBeenCalled()
    expect(c.togglePlace).not.toHaveBeenCalled()
    // deselecting is still allowed
    await userEvent.click(screen.getByTestId(`marker-hotel-${selectedHotel.id}`))
    expect(c.toggleHotel).toHaveBeenCalledWith(selectedHotel.id)
  })

  it('behaves as Select mode when nothing is selected, and says so', () => {
    show(
      loadedComparator({
        city: shikharpurCity,
        selection: { hotel_ids: [], place_ids: [] },
        result: null,
        inspectedHotelId: null,
      }),
    )
    expect(markers()).toHaveLength(80)
    expect(screen.getByText(/Nothing selected yet/)).toBeInTheDocument()
    expect(links()).toHaveLength(0)
  })

  it('keeps the "not routes" caption and a mode-specific legend note', async () => {
    show(onFull())
    expect(screen.getByText(/Comparison links, not routes/)).toBeInTheDocument()
    await selectMode()
    expect(screen.getByText(/Comparison links, not routes/)).toBeInTheDocument()
    expect(
      screen.getByText(/Click or press Enter on a marker to select/),
    ).toBeInTheDocument()
  })
})
