// End-to-end workflow for the Demo trip: the real <App/>, real provider and real
// components. Only the network functions are replaced by a fake that answers with REAL
// backend responses (src/test/samples/flow_*.json, compare_*.json), chosen by the request.
// Flow under test: Plan screen -> Load Demo trip -> Results; edits go Edit (drawer) -> Update results.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../App'
import * as client from '../api/client'
import { saveTrip } from '../state/savedTrip'
import type {
  City,
  CompareRequest,
  ComparisonResult,
  DemoPreset,
  HotelResult,
} from '../types/contracts'
import cityJson from '../test/samples/city_surmapur.json'
import presetJson from '../test/samples/preset_demo.json'
import okJson from '../test/samples/compare_ok.json'
import noHotelJson from '../test/samples/compare_no_affordable_hotel.json'
import invalidBudgetJson from '../test/samples/compare_invalid.json'
import atBestJson from '../test/samples/flow_budget_at_best_cost.json'
import oneLessJson from '../test/samples/flow_budget_one_less.json'
import importanceJson from '../test/samples/flow_importance_whatif.json'
import exactJson from '../test/samples/flow_exact_budget_hotel.json'
import oneOverJson from '../test/samples/flow_one_over_budget_hotel.json'
import invalidImportanceJson from '../test/samples/flow_invalid_importance.json'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

const as = <T,>(json: unknown) => json as T
const city = as<City>(cityJson)
const preset = as<DemoPreset>(presetJson)
const ok = as<ComparisonResult>(okJson)
const noHotel = as<ComparisonResult>(noHotelJson)
const atBest = as<ComparisonResult>(atBestJson)
const oneLess = as<ComparisonResult>(oneLessJson)
const importanceWhatIf = as<ComparisonResult>(importanceJson)
const exact = as<ComparisonResult>(exactJson)
const oneOver = as<ComparisonResult>(oneOverJson)

/** Picks the real response that matches what the app asked for. Unknown requests fail loudly. */
function respond(body: CompareRequest): ComparisonResult {
  const { budget, importances } = body
  // The backend answers every invalid budget (-5, 12.5, "abc") with this same body.
  if (budget === -5 || budget === 12.5 || budget === 'abc') return as(invalidBudgetJson)
  if (importances.MUSEUM === 6) return as(invalidImportanceJson)
  if (budget === 0) return noHotel
  if (budget === 36500) return atBest
  if (budget === 36499) return oneLess
  if (budget === 29500) return exact
  if (budget === 29499) return oneOver
  if (budget === 30000) return importances.MUSEUM === 1 ? importanceWhatIf : ok
  throw new Error(`No sample for request: ${JSON.stringify(body)}`)
}

const compareMock = vi.mocked(client.compare)

beforeEach(() => {
  vi.mocked(client.getCity).mockResolvedValue(city)
  vi.mocked(client.getDemoPreset).mockResolvedValue(preset)
  compareMock.mockReset()
  compareMock.mockImplementation(async (body) => respond(body))
})

// ---- DOM helpers: found by role and accessible name ----
// The banner is role=status normally and role=alert when INVALID, so find it by its class.
const banner = () => document.querySelector<HTMLElement>('.statusbanner')!
const mapPanel = () => screen.getByRole('region', { name: 'City map' })
const ranking = () => screen.getByRole('region', { name: 'Ranked hotels' })
const plan = () => screen.getByRole('region', { name: 'Plan your trip' })
const budgetInput = () => screen.getByLabelText(/Budget for the complete stay/)
// The main button is "Compare hotels" on the Plan screen and "Update results" in the Edit drawer.
const compareButton = () =>
  screen.getByRole('button', { name: /Compare hotels|Update results/ })

/** The travel-time table is collapsed until asked for. */
function table(): HTMLElement {
  const toggle = screen.queryByRole('button', { name: 'Show travel times' })
  if (toggle) fireEvent.click(toggle)
  return screen.getByRole('region', { name: 'Travel times' })
}

const hotelName = (id: string) => city.hotels.find((h) => h.id === id)!.name
const placeName = (id: string) => city.places.find((p) => p.id === id)!.name
const hotelOf = (result: ComparisonResult, id: string): HotelResult =>
  result.hotels.find((h) => h.id === id)!

/** The ranking's own cards (an open card holds a nested list that is not a card). */
function cards(): HTMLElement[] {
  const list = within(ranking()).getByRole('list', { name: 'Hotels in rank order' })
  return within(list)
    .getAllByRole('listitem')
    .filter((li) => li.parentElement === list)
}
const idOf = (card: HTMLElement) => card.querySelector('.ranking-id')!.textContent!
const cardOf = (id: string) => cards().find((c) => idOf(c) === id)!
const rankingIds = () => cards().map(idOf)
/** The open "Why this score?" body of a card. */
const whyOf = (id: string) => document.getElementById(`why-${id}`)!

const markers = () => document.querySelectorAll('[data-testid^="marker-"]')
const linkLines = () => screen.getByTestId('citymap-links').querySelectorAll('line')
const linkLabels = () =>
  Object.fromEntries(
    [
      ...screen
        .getByTestId('citymap-links')
        .querySelectorAll('[data-testid^="link-label-"]'),
    ].map((g) => [
      g.getAttribute('data-testid')!.replace('link-label-', ''),
      g.textContent!,
    ]),
  )

/** Panels that must never mention a recommendation in INVALID / NO_AFFORDABLE states. */
function expectNoRecommendation() {
  for (const panel of [ranking(), table()]) {
    expect(panel.textContent).not.toMatch(/Recommended/)
  }
  expect(banner().textContent).not.toMatch(/Recommended/)
  expect(mapPanel().querySelector('.citymap-badge')?.textContent ?? '').not.toBe('★')
  expect(
    [...mapPanel().querySelectorAll('title')].some((t) =>
      /Recommended/.test(t.textContent!),
    ),
  ).toBe(false)
  expect(mapPanel().querySelector('.citymap-hotel-best')).toBeNull()
}

/** The views plus the 15 map links all agree on the inspected hotel, using API values. */
function expectInspected(result: ComparisonResult, id: string) {
  const hotel = hotelOf(result, id)
  const name = hotelName(id)
  // ranking: exactly one inspected card, and it is open
  expect(
    within(cardOf(id)).getByRole('button', { name: new RegExp(id) }),
  ).toHaveAttribute('aria-current', 'true')
  expect(within(ranking()).getAllByRole('button', { current: true })).toHaveLength(1)
  expect(whyOf(id)).toBeInTheDocument()
  // map: ring marker + 15 links starting at this hotel, labelled from the API
  expect(mapPanel().querySelector(`[data-testid="marker-hotel-${id}"]`)).toHaveAttribute(
    'aria-current',
    'true',
  )
  const position = city.hotels.find((h) => h.id === id)!.position
  const lines = linkLines()
  expect(lines).toHaveLength(15)
  for (const line of lines) {
    expect(line.getAttribute('x1')).toBe(String(position.x))
    expect(line.getAttribute('y1')).toBe(String(position.y))
  }
  expect(linkLabels()).toEqual(
    Object.fromEntries(
      hotel.contributions.map((c) => [
        c.place_id,
        `${c.minutes} min · ${c.contribution}`,
      ]),
    ),
  )
  // explanation inside the card
  expect(within(whyOf(id)).getByRole('heading', { level: 3 })).toHaveTextContent(name)
  // table: exactly one highlighted row, and it is this hotel
  const current = table().querySelectorAll('tr[aria-current="true"]')
  expect(current).toHaveLength(1)
  expect(current[0].querySelector('th button')).toHaveTextContent(name)
}

async function loadDemo(): Promise<void> {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
  await screen.findByText(/Recommended:/)
}

/** Results -> Edit drawer with the Plan steps inside. */
async function backToPlan() {
  fireEvent.click(screen.getByRole('button', { name: /Edit/ }))
  await screen.findByRole('dialog')
}

async function toResults() {
  await waitFor(() => expect(compareButton()).toBeEnabled())
  fireEvent.click(compareButton())
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  await screen.findByRole('region', { name: 'Results' })
}

/** Edit -> change the budget text -> Compare hotels. */
async function setBudget(text: string) {
  await backToPlan()
  fireEvent.change(budgetInput(), { target: { value: text } })
  await toResults()
}

/** The 1-5 segmented control of one place, in the Plan screen. */
function importanceRadio(placeId: string, value: number): HTMLElement {
  const group = screen.getByRole('group', { name: new RegExp(`^${placeName(placeId)}`) })
  return within(group).getByRole('radio', { name: String(value) })
}

async function setImportance(placeId: string, value: number) {
  await backToPlan()
  fireEvent.click(importanceRadio(placeId, value))
  await toResults()
}

/** Opens Results straight from a saved trip, as a reload would (used for INVALID inputs). */
async function openSavedTrip(budgetText: string, museumText = '3') {
  saveTrip({
    cityId: preset.city_id,
    selection: { hotel_ids: preset.hotel_ids, place_ids: preset.place_ids },
    inputs: {
      budgetText,
      importanceTexts: {
        ...Object.fromEntries(
          Object.entries(preset.importances).map(([k, v]) => [k, String(v)]),
        ),
        MUSEUM: museumText,
      },
    },
    budgetTouched: true,
  })
  localStorage.setItem('hbc.view', JSON.stringify('results'))
  render(<App />)
  await screen.findByText(/Cannot compare/)
}

describe('page structure', () => {
  it('has one h1, a header outside <main>, and the Results panels inside <main>', async () => {
    await loadDemo()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const main = screen.getByRole('main')
    expect(main.contains(screen.getByRole('banner'))).toBe(false)
    for (const panel of [mapPanel(), ranking(), banner()]) {
      expect(main.contains(panel)).toBe(true)
    }
  })

  it('has no temporary scaffolding', () => {
    render(<App />)
    expect(document.querySelector('[data-testid$="-stub"]')).toBeNull()
    expect(screen.queryByText(/dev panel/i)).toBeNull()
  })

  it('uses headings in order and unique element ids', async () => {
    await loadDemo()
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName[1]))
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    }
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps the banner the only status/alert on Results; the map notice is the only other live region', async () => {
    await loadDemo()
    const roles = document.querySelectorAll('[role="status"], [role="alert"]')
    expect(roles).toHaveLength(1)
    expect(roles[0]).toBe(banner())
    const polite = [...document.querySelectorAll('[aria-live]')]
    expect(polite.map((e) => e.textContent)).toEqual([''])
    for (const region of polite) {
      expect(region).toHaveAttribute('aria-live', 'polite')
      expect(region).not.toHaveAttribute('role')
    }
  })

  it('shows no edit controls on Results', async () => {
    await loadDemo()
    expect(screen.queryByLabelText(/Budget for the complete stay/)).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument()
  })
})

describe('a. before loading', () => {
  it('Plan: only Load is enabled and the user is told what to do next', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Load Demo trip' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
    expect(budgetInput()).toBeDisabled()
    expect(compareButton()).toBeDisabled()
    expect(within(plan()).getByText('Pick a city to get started.')).toBeInTheDocument()
    expect(compareMock).not.toHaveBeenCalled()
  })

  it('Results with nothing loaded shows a friendly empty state', () => {
    localStorage.setItem('hbc.view', JSON.stringify('results'))
    render(<App />)
    expect(screen.getByText('Nothing to compare yet')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Ranked hotels' })).toBeNull()
  })
})

describe('b. Load Demo trip', () => {
  it('goes straight to Results and shows the recommended hotel everywhere, in the order the API sent', async () => {
    await loadDemo()
    const recommended = ok.recommended_hotel_id!
    expect(banner()).toHaveTextContent(`Recommended: ${hotelName(recommended)}`)
    expect(rankingIds()).toEqual(ok.hotels.map((h) => h.id))
    expect(markers()).toHaveLength(25)
    expectInspected(ok, ok.default_inspected_hotel_id!)
    expect(ok.default_inspected_hotel_id).toBe(recommended)
    expect(compareMock).toHaveBeenCalledTimes(1)
  })

  it('shows the three headline numbers of the recommended hotel from the API', async () => {
    await loadDemo()
    const best = hotelOf(ok, ok.recommended_hotel_id!)
    const stats = screen.getByRole('list', { name: 'Recommended hotel at a glance' })
    expect(stats).toHaveTextContent(best.weighted_average_display)
    expect(stats).toHaveTextContent(`${best.longest_trip} min`)
    expect(stats).toHaveTextContent('Total cost vs budget')
  })

  it('shows over-budget hotels unranked with their shortfall, including the most accessible one', async () => {
    await loadDemo()
    const lowest = [...ok.hotels].sort((a, b) => a.weighted_total - b.weighted_total)[0]
    expect(lowest.label).toBe('OVER_BUDGET')
    for (const hotel of ok.hotels.filter((h) => h.label === 'OVER_BUDGET')) {
      const card = cardOf(hotel.id)
      expect(card).toHaveTextContent('✕ Over budget')
      expect(card).toHaveTextContent(/Over budget by ₹[\d,]+/)
      expect(card).toHaveTextContent('Unranked')
      expect(card.querySelector('.ranking-rank')!.textContent).not.toMatch(/#\d/)
    }
    expect(cardOf(lowest.id)).toHaveTextContent('✕ Over budget')
  })
})

describe('c. inspecting another hotel', () => {
  const other = () => ok.hotels.find((h) => h.label === 'RANKED')!

  it.each([
    [
      'a ranking card',
      (id: string) =>
        fireEvent.click(within(cardOf(id)).getByRole('button', { name: new RegExp(id) })),
    ],
    [
      'a map hotel marker',
      (id: string) => fireEvent.click(screen.getByTestId(`marker-hotel-${id}`)),
    ],
    [
      'a table row header',
      (id: string) =>
        fireEvent.click(within(table()).getByRole('button', { name: hotelName(id) })),
    ],
  ])('via %s moves every view and sends no new request', async (_label, click) => {
    await loadDemo()
    const calls = compareMock.mock.calls.length
    const target = other()
    click(target.id)
    expectInspected(ok, target.id)
    // and back to an over-budget hotel
    const over = ok.hotels.find((h) => h.label === 'OVER_BUDGET')!
    click(over.id)
    expectInspected(ok, over.id)
    expect(compareMock).toHaveBeenCalledTimes(calls)
  })
})

describe('d. budget what-if', () => {
  it('makes the best hotel recommended at exactly its cost and over budget one rupee less', async () => {
    await loadDemo()
    const best = atBest.recommended_hotel_id!
    fireEvent.click(screen.getByTestId(`marker-hotel-${best}`))

    await setBudget(String(atBest.budget))
    await waitFor(() =>
      expect(banner()).toHaveTextContent(`Recommended: ${hotelName(best)}`),
    )
    expect(rankingIds()).toEqual(atBest.hotels.map((h) => h.id))
    expect(cardOf(best)).toHaveTextContent('★ Recommended')
    expect(cardOf(best)).toHaveTextContent('₹0 left in budget')
    expect(whyOf(best)).toHaveTextContent('★ Recommended')

    await setBudget(String(oneLess.budget))
    await waitFor(() =>
      expect(banner()).toHaveTextContent(
        `Recommended: ${hotelName(oneLess.recommended_hotel_id!)}`,
      ),
    )
    expect(rankingIds()).toEqual(oneLess.hotels.map((h) => h.id))
    expect(cardOf(best)).toHaveTextContent('Over budget by ₹1')
    expect(cardOf(best)).toHaveTextContent('Unranked')
    expect(cardOf(best)).not.toHaveTextContent('★ Recommended')
    expect(whyOf(best)).toHaveTextContent('✕ Over budget')
  })

  it('keeps the inspected hotel contributions identical across a budget-only change', async () => {
    await loadDemo()
    const before = within(whyOf('H_GARDEN')).getByRole('table').textContent
    await setBudget(String(atBest.budget))
    await waitFor(() => expect(banner()).toHaveTextContent(hotelName('H_GHANTA')))
    expect(within(whyOf('H_GARDEN')).getByRole('table').textContent).toBe(before)
    expect(linkLabels()).toEqual(
      Object.fromEntries(
        hotelOf(ok, 'H_GARDEN').contributions.map((c) => [
          c.place_id,
          `${c.minutes} min · ${c.contribution}`,
        ]),
      ),
    )
  })
})

describe('e. importance what-if', () => {
  it('changes the recommendation, the contributions and the map link labels', async () => {
    await loadDemo()
    const labelsBefore = linkLabels()
    await setImportance('MUSEUM', 1)
    await waitFor(() =>
      expect(banner()).toHaveTextContent(
        `Recommended: ${hotelName(importanceWhatIf.recommended_hotel_id!)}`,
      ),
    )
    expect(importanceWhatIf.recommended_hotel_id).not.toBe(ok.recommended_hotel_id)
    expect(rankingIds()).toEqual(importanceWhatIf.hotels.map((h) => h.id))
    // the inspected hotel (still the original one) now shows the new contributions
    expectInspected(importanceWhatIf, ok.default_inspected_hotel_id!)
    expect(linkLabels()).not.toEqual(labelsBefore)
    expect(linkLabels().MUSEUM).toBe(labelsBefore.MUSEUM.replace(/· \d+$/, '· 19'))
    expect(within(whyOf('H_GARDEN')).getByRole('table')).toHaveTextContent('1 × 19 = 19')
  })
})

describe('f. exact budget', () => {
  it('shows ₹0 left in budget at the exact cost and Over budget by ₹1 one rupee below', async () => {
    await loadDemo()
    const id = 'H_NEELGHAT'

    await setBudget(String(exact.budget))
    await waitFor(() => expect(cardOf(id)).toHaveTextContent('₹0 left in budget'))
    expect(cardOf(id)).toHaveTextContent('✓ Within budget')
    expect(cardOf(id)).toHaveTextContent(`#${hotelOf(exact, id).rank}`)

    await setBudget(String(oneOver.budget))
    await waitFor(() => expect(cardOf(id)).toHaveTextContent('Over budget by ₹1'))
    expect(cardOf(id)).toHaveTextContent('Unranked')
    expect(cardOf(id).textContent).not.toMatch(/₹0 left/)
    expect(rankingIds()).toEqual(oneOver.hotels.map((h) => h.id))
  })
})

describe('g. invalid inputs', () => {
  const cases: [string, string, string, ComparisonResult][] = [
    ['budget -5', '-5', '3', as(invalidBudgetJson)],
    ['budget 12.5', '12.5', '3', as(invalidBudgetJson)],
    ['budget abc', 'abc', '3', as(invalidBudgetJson)],
    ['importance 6', '30000', '6', as(invalidImportanceJson)],
  ]

  it.each(cases)(
    '%s clears every derived view on Results',
    async (_name, budgetText, museumText, sample) => {
      await openSavedTrip(budgetText, museumText)
      for (const e of sample.errors) expect(banner()).toHaveTextContent(e.message)
      expect(screen.queryByRole('region', { name: 'Ranked hotels' })).toBeNull()
      expect(screen.queryByRole('region', { name: 'City map' })).toBeNull()
      expect(
        screen.queryByRole('list', { name: 'Recommended hotel at a glance' }),
      ).toBeNull()
      expect(screen.getByRole('main').textContent).not.toMatch(
        /★|Recommended|#\d|Within budget|Over budget by/,
      )
    },
  )

  it('Plan shows the API message at the field and blocks Compare', async () => {
    await openSavedTrip('abc')
    fireEvent.click(screen.getByRole('button', { name: 'Edit plan' }))
    await screen.findByRole('dialog')
    expect(budgetInput()).toHaveAttribute('aria-invalid', 'true')
    expect(compareButton()).toBeDisabled()
  })

  it('recovers when the input becomes valid again', async () => {
    await openSavedTrip('abc')
    fireEvent.click(screen.getByRole('button', { name: 'Edit plan' }))
    await screen.findByRole('dialog')
    fireEvent.change(budgetInput(), { target: { value: '30000' } })
    await toResults()
    await waitFor(() => expect(banner()).toHaveTextContent('Recommended:'))
  })
})

describe('h. no affordable hotel', () => {
  it('shows shortfalls and no star, no rank and no recommendation', async () => {
    await loadDemo()
    await setBudget('0')
    await waitFor(() => expect(banner()).toHaveTextContent('No hotel fits this budget'))
    expect(ranking()).toHaveTextContent('No hotel fits this budget')
    expect(cards()).toHaveLength(10)
    for (const card of cards()) {
      expect(card).toHaveTextContent(/Over budget by ₹[\d,]+/)
      expect(card).toHaveTextContent('Unranked')
    }
    expect(rankingIds()).toEqual(noHotel.hotels.map((h) => h.id))
    expect(
      [...mapPanel().querySelectorAll('.citymap-badge')].every(
        (b) => b.textContent === '✕',
      ),
    ).toBe(true)
    expect(
      screen.queryByRole('list', { name: 'Recommended hotel at a glance' }),
    ).toBeNull()
    expectNoRecommendation()
    expect(ranking()).toHaveTextContent('nothing is recommended')
  })
})

describe('i. reset', () => {
  it('restores the preset inputs, the recommendation and the inspected hotel', async () => {
    await loadDemo()
    await setBudget('36500')
    await setImportance('MUSEUM', 1)
    fireEvent.click(screen.getByTestId('marker-hotel-H_HILLTOP'))
    await waitFor(() => expect(banner()).toHaveTextContent('Recommended:'))

    await backToPlan()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(budgetInput()).toHaveValue(String(preset.budget)))
    for (const [placeId, value] of Object.entries(preset.importances)) {
      await waitFor(() => expect(importanceRadio(placeId, value)).toBeChecked())
    }
    await toResults()
    await waitFor(() =>
      expect(banner()).toHaveTextContent(
        `Recommended: ${hotelName(ok.recommended_hotel_id!)}`,
      ),
    )
    expect(rankingIds()).toEqual(ok.hotels.map((h) => h.id))
    expectInspected(ok, ok.default_inspected_hotel_id!)
  })
})

describe('the frontend never re-sorts or computes', () => {
  it('renders hotels in the API order even when the order is not the ranking', async () => {
    const shuffled: ComparisonResult = {
      ...ok,
      hotels: [ok.hotels[1], ok.hotels[0], ...ok.hotels.slice(2)],
    }
    compareMock.mockImplementation(async () => shuffled)
    await loadDemo()
    expect(rankingIds()).toEqual(shuffled.hotels.map((h) => h.id))
    expect(rankingIds().slice(0, 2)).toEqual([ok.hotels[1].id, ok.hotels[0].id])
  })

  it('shows API numbers verbatim, even when they contradict the data', async () => {
    const tampered: ComparisonResult = {
      ...ok,
      hotels: ok.hotels.map((h) =>
        h.id === 'H_GARDEN'
          ? { ...h, weighted_total: 99999, weighted_average_display: '9.9' }
          : h,
      ),
    }
    compareMock.mockImplementation(async () => tampered)
    await loadDemo()
    expect(cardOf('H_GARDEN')).toHaveTextContent('Weighted total: 99999')
    expect(cardOf('H_GARDEN')).toHaveTextContent('9.9')
    expect(whyOf('H_GARDEN')).toHaveTextContent('Weighted total = 99999')
  })
})
