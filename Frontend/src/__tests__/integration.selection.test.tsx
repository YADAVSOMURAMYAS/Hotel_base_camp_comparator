// End-to-end selection flow: the real <App/>, real provider and real components. Only the
// network functions are replaced by a fake that answers with REAL backend responses
// (src/test/samples/*.json). The Shikharpur numbers 501 / 753 / 778 were computed by hand in
// Backend/tests/api/test_selection_api.py and are asserted here as literals too.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../App'
import * as client from '../api/client'
import type {
  City,
  CitySummary,
  CompareRequest,
  ComparisonResult,
  DemoPreset,
} from '../types/contracts'
import citiesJson from '../test/samples/cities_list.json'
import surmapurJson from '../test/samples/city_surmapur.json'
import shikharpurJson from '../test/samples/city_shikharpur.json'
import okJson from '../test/samples/compare_ok.json'
import presetJson from '../test/samples/preset_demo.json'
import smallJson from '../test/samples/flow_shikharpur_small_ok.json'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getCities: vi.fn(),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

const as = <T,>(json: unknown) => json as T
const cities = as<{ cities: CitySummary[] }>(citiesJson).cities
const surmapur = as<City>(surmapurJson)
const shikharpur = as<City>(shikharpurJson)
const preset = as<DemoPreset>(presetJson)
const demoOk = as<ComparisonResult>(okJson)
const small = as<ComparisonResult>(smallJson)
const compareMock = vi.mocked(client.compare)

/** Real responses only: the Demo trip, or the 3x4 Shikharpur selection. Anything else fails loudly. */
function respond(body: CompareRequest): ComparisonResult {
  if (body.city_id === 'surmapur') return demoOk
  if (body.city_id === 'shikharpur' && body.hotel_ids.length === 3) return small
  return { ...small, hotels: small.hotels.slice(0, body.hotel_ids.length) }
}

beforeEach(() => {
  vi.mocked(client.getCities).mockReset().mockResolvedValue(cities)
  vi.mocked(client.getCity)
    .mockReset()
    .mockImplementation(async (id) => (id === 'surmapur' ? surmapur : shikharpur))
  vi.mocked(client.getDemoPreset).mockReset().mockResolvedValue(preset)
  compareMock.mockReset().mockImplementation(async (body) => respond(body))
})

const plan = () => screen.getByRole('region', { name: 'Plan your trip' })
const mapPanel = () => screen.getByRole('region', { name: 'City map' })
const ranking = () => screen.getByRole('region', { name: 'Ranked hotels' })
const banner = () => document.querySelector<HTMLElement>('.statusbanner')!
const hotelsGroup = () => within(plan()).getByRole('group', { name: 'Hotels' })
const placesGroup = () => within(plan()).getByRole('group', { name: 'Places' })
const budgetInput = () => screen.getByLabelText(/Budget for the complete stay/)
const compareButton = () => screen.getByRole('button', { name: /Compare hotels/ })
const nameOf = (list: { id: string; name: string }[], id: string) =>
  list.find((x) => x.id === id)!.name
const hotelName = (id: string) => nameOf(shikharpur.hotels, id)
const placeName = (id: string) => nameOf(shikharpur.places, id)
const markers = () => document.querySelectorAll('[data-testid^="marker-"]')

const tickHotel = (id: string) =>
  fireEvent.click(
    within(hotelsGroup()).getByRole('button', { name: new RegExp(hotelName(id)) }),
  )
const tickPlace = (id: string) =>
  fireEvent.click(
    within(placesGroup()).getByRole('button', { name: new RegExp(placeName(id)) }),
  )
/** Importance is a segmented 1-5 control per chosen place. */
const setImportance = (placeId: string, value: number) =>
  fireEvent.click(
    within(screen.getByRole('group', { name: new RegExp(placeName(placeId)) })).getByRole(
      'radio',
      { name: String(value) },
    ),
  )
const hint = (text: string | RegExp) => within(plan()).getByText(text)
/** From the Plan screen to Results, once the plan is complete. */
async function compare() {
  await waitFor(() => expect(compareButton()).toBeEnabled())
  fireEvent.click(compareButton())
  await screen.findByRole('region', { name: 'Results' })
}
const clickMapMarker = (kind: 'hotel' | 'place', id: string) =>
  fireEvent.click(screen.getByTestId(`marker-${kind}-${id}`))
const selectMapMode = () => fireEvent.click(screen.getByRole('radio', { name: 'Select' }))

async function openShikharpur() {
  render(<App />)
  await waitFor(() => expect(within(plan()).getAllByRole('option')).toHaveLength(3))
  fireEvent.change(screen.getByRole('combobox', { name: 'City' }), {
    target: { value: 'shikharpur' },
  })
  await waitFor(() => expect(screen.getByText('0/10 hotels')).toBeInTheDocument())
}

/** The small hand-computed selection, using the list for some and the map for others. */
async function pickSmallSelection() {
  tickHotel('H_ROPEWAY') // out of catalog order on purpose
  selectMapMode()
  clickMapMarker('hotel', 'H_BARRACK')
  clickMapMarker('hotel', 'H_MALLROAD')
  clickMapMarker('place', 'FALLS')
  clickMapMarker('place', 'MONASTERY')
  tickPlace('CHOLE')
  tickPlace('TOYTRAIN')
  await waitFor(() => expect(screen.getByText('4/15 places')).toBeInTheDocument())
}

describe('choosing a city', () => {
  it('starts with the empty state and lists both cities with counts', async () => {
    render(<App />)
    expect(screen.getByText('Pick a city to get started.')).toBeInTheDocument()
    await waitFor(() => expect(within(plan()).getAllByRole('option')).toHaveLength(3))
    expect(
      within(plan())
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toContain('Shikharpur (30 hotels, 50 places)')
  })

  it('shows 0/10 and 0/15, the guidance banner, and an empty-selection map of 80 markers', async () => {
    await openShikharpur()
    expect(screen.getByText('0/15 places')).toBeInTheDocument()
    expect(hint('Choose 2 more hotels to compare.')).toBeInTheDocument()
    expect(hint('Choose 3 more places you want to visit.')).toBeInTheDocument()
    expect(hint('Add your budget for the complete stay.')).toBeInTheDocument()
    expect(markers()).toHaveLength(80)
    expect(compareMock).not.toHaveBeenCalled()
  })
})

describe('the small Shikharpur selection (hand-computed 501 / 753 / 778)', () => {
  it('compares the selected IDs in catalog order and shows the backend result', async () => {
    await openShikharpur()
    await pickSmallSelection()
    expect(compareMock).not.toHaveBeenCalled() // no budget yet
    expect(hint('Add your budget for the complete stay.')).toBeInTheDocument()
    expect(compareButton()).toBeDisabled()

    setImportance('MONASTERY', 2)
    setImportance('CHOLE', 3)
    fireEvent.change(budgetInput(), { target: { value: '13000' } })
    await compare()

    await waitFor(() => expect(banner()).toHaveTextContent('Recommended'))
    expect(compareMock).toHaveBeenCalledTimes(1)
    expect(compareMock).toHaveBeenLastCalledWith(
      {
        city_id: 'shikharpur',
        hotel_ids: ['H_MALLROAD', 'H_BARRACK', 'H_ROPEWAY'],
        place_ids: ['TOYTRAIN', 'MONASTERY', 'CHOLE', 'FALLS'],
        importances: { TOYTRAIN: 5, MONASTERY: 2, CHOLE: 3, FALLS: 4 },
        budget: 13000,
      },
      expect.anything(),
    )

    // literals, then the same values from the real backend sample
    expect(banner()).toHaveTextContent(`Recommended: ${hotelName('H_MALLROAD')}`)
    const list = within(ranking()).getByRole('list', { name: 'Hotels in rank order' })
    const totals = within(list)
      .getAllByRole('listitem')
      .filter((li) => li.parentElement === list)
      .map((li) => li.textContent!)
    expect(totals[0]).toContain('Weighted total: 501')
    expect(totals[1]).toContain('Weighted total: 753')
    expect(totals[2]).toContain('Weighted total: 778')
    expect(totals[2]).toContain('Over budget by ₹1,400')
    expect(small.hotels.map((h) => h.weighted_total)).toEqual([501, 753, 778])
    for (const h of small.hotels)
      expect(ranking()).toHaveTextContent(`Weighted total: ${h.weighted_total}`)
  })

  it('the Inspect map shows only the 7 selected markers and the inspected hotel links', async () => {
    await openShikharpur()
    await pickSmallSelection()
    fireEvent.change(budgetInput(), { target: { value: '13000' } })
    await waitFor(() => expect(compareButton()).toBeEnabled())
    fireEvent.click(screen.getByRole('radio', { name: 'Inspect' }))
    expect(markers()).toHaveLength(7)
    expect(mapPanel().querySelectorAll('line')).toHaveLength(4)
  })

  it('deselecting the inspected hotel moves inspection to the backend default', async () => {
    await openShikharpur()
    await pickSmallSelection()
    fireEvent.change(budgetInput(), { target: { value: '13000' } })
    await waitFor(() => expect(compareButton()).toBeEnabled())
    fireEvent.click(screen.getByRole('radio', { name: 'Inspect' }))
    fireEvent.click(screen.getByTestId('marker-hotel-H_ROPEWAY'))
    expect(screen.getByTestId('marker-hotel-H_ROPEWAY')).toHaveAttribute(
      'aria-current',
      'true',
    )

    tickHotel('H_ROPEWAY') // deselect it in the list
    await waitFor(() => expect(screen.getByText('2/10 hotels')).toBeInTheDocument())
    await waitFor(() =>
      expect(screen.getByTestId('marker-hotel-H_MALLROAD')).toHaveAttribute(
        'aria-current',
        'true',
      ),
    )
  })
})

describe('limits', () => {
  it('blocks an 11th hotel in the list and on the map', async () => {
    await openShikharpur()
    const first10 = shikharpur.hotels.slice(0, 10).map((h) => h.id)
    for (const id of first10) tickHotel(id)
    expect(screen.getByText('10/10 hotels')).toBeInTheDocument()

    const eleventh = shikharpur.hotels[10].id
    expect(
      within(hotelsGroup()).getByRole('button', {
        name: new RegExp(hotelName(eleventh)),
      }),
    ).toBeDisabled()
    expect(within(hotelsGroup()).getByText(/Limit of 10 hotels reached/)).toBeVisible()

    selectMapMode()
    clickMapMarker('hotel', eleventh)
    expect(screen.getByText('10/10 hotels')).toBeInTheDocument()
    expect(screen.getByTestId('map-notice')).toHaveTextContent(/limit of 10 hotels/i)
  })
})

describe('switching, loading the Demo trip and reset', () => {
  it('switching city clears selection, budget and result', async () => {
    await openShikharpur()
    await pickSmallSelection()
    fireEvent.change(budgetInput(), { target: { value: '13000' } })
    await waitFor(() => expect(compareButton()).toBeEnabled())

    fireEvent.change(screen.getByRole('combobox', { name: 'City' }), {
      target: { value: 'surmapur' },
    })
    await waitFor(() => expect(screen.getByText('0/10 hotels')).toBeInTheDocument())
    expect(screen.getByText('0/15 places')).toBeInTheDocument()
    expect(budgetInput()).toHaveValue('')
    expect(compareButton()).toBeDisabled()
    expect(hint('Choose 2 more hotels to compare.')).toBeInTheDocument()
  })

  it('Load Demo trip from Shikharpur switches to Surmapur with the Phase A result', async () => {
    await openShikharpur()
    await pickSmallSelection()
    fireEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    // Load Demo trip goes straight to Results with the Phase A result.
    await screen.findByRole('region', { name: 'Results' })
    await waitFor(() => expect(banner()).toHaveTextContent('Recommended'))
    expect(markers()).toHaveLength(25)
    expect(mapPanel().querySelectorAll('line')).toHaveLength(15)
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }))
    expect(screen.getByText('10/10 hotels')).toBeInTheDocument()
    expect(screen.getByText('15/15 places')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveValue('surmapur')
    expect(budgetInput()).toHaveValue(String(preset.budget))
  })

  it('Reset on Shikharpur clears the selection', async () => {
    await openShikharpur()
    await pickSmallSelection()
    fireEvent.change(budgetInput(), { target: { value: '13000' } })
    await waitFor(() => expect(compareButton()).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(screen.getByText('0/10 hotels')).toBeInTheDocument())
    expect(screen.getByText('0/15 places')).toBeInTheDocument()
    expect(budgetInput()).toHaveValue('')
    expect(compareButton()).toBeDisabled()
  })
})
