// End-to-end workflow for the Demo trip: the real <App/>, real provider and real
// components. Only the network functions are replaced by a fake that answers with REAL
// backend responses (src/test/samples/flow_*.json, compare_*.json), chosen by the request.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../App'
import * as client from '../api/client'
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

// ---- DOM helpers: one per panel, found by role and accessible name ----
const controls = () => screen.getByRole('region', { name: 'Controls' })
// The banner is role=status normally and role=alert when INVALID, so find it by its class.
const banner = () => document.querySelector<HTMLElement>('.statusbanner')!
const mapPanel = () => screen.getByRole('region', { name: 'City map' })
const ranking = () => screen.getByRole('region', { name: 'Ranked hotels' })
const explanation = () => screen.getByRole('region', { name: 'Explanation' })
const table = () => screen.getByRole('region', { name: 'Travel times' })

const hotelName = (id: string) => city.hotels.find((h) => h.id === id)!.name
const hotelOf = (result: ComparisonResult, id: string): HotelResult =>
  result.hotels.find((h) => h.id === id)!
const budgetInput = () => screen.getByLabelText(/Budget for the complete stay/)
const importanceInput = (placeId: string) =>
  document.getElementById(`controls-importance-${placeId}`) as HTMLInputElement

function rankingIds(): string[] {
  return within(ranking())
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.ranking-id')!.textContent!)
}
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

/** The panels that must never mention a recommendation in INVALID / NO_AFFORDABLE states. */
function expectNoRecommendation() {
  for (const panel of [ranking(), explanation(), table()]) {
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

/** The four views plus the 15 map links all agree on the inspected hotel, using API values. */
function expectInspected(result: ComparisonResult, id: string) {
  const hotel = hotelOf(result, id)
  const name = hotelName(id)
  // ranking
  const card = within(ranking())
    .getAllByRole('listitem')
    .find((li) => li.querySelector('.ranking-id')!.textContent === id)!
  expect(within(card).getByRole('button')).toHaveAttribute('aria-current', 'true')
  expect(within(ranking()).getAllByRole('button', { current: true })).toHaveLength(1)
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
  // explanation
  expect(within(explanation()).getByRole('heading', { level: 3 })).toHaveTextContent(name)
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

async function setBudget(text: string) {
  fireEvent.change(budgetInput(), { target: { value: text } })
}

describe('page structure', () => {
  it('has one h1, a header outside <main>, and every workspace panel inside <main>', () => {
    render(<App />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const main = screen.getByRole('main')
    const header = screen.getByRole('banner')
    expect(main.contains(header)).toBe(false)
    for (const panel of [controls(), mapPanel(), ranking(), explanation(), table()]) {
      expect(main.contains(panel)).toBe(true)
    }
    expect(main.contains(banner())).toBe(true)
  })

  it('has no temporary scaffolding', () => {
    render(<App />)
    expect(document.querySelector('[data-testid$="-stub"]')).toBeNull()
    expect(screen.queryByText(/dev panel/i)).toBeNull()
  })

  it('uses headings in order (h1, then h2 panels) and unique element ids', async () => {
    await loadDemo()
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName[1]))
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    }
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('announces through exactly one live region (the banner)', async () => {
    await loadDemo()
    const live = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')
    expect(live).toHaveLength(1)
    expect(live[0]).toBe(banner())
  })
})

describe('a. before loading', () => {
  it('enables only Load and shows an empty state in every panel', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Load Demo trip' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
    expect(budgetInput()).toBeDisabled()
    expect(within(controls()).queryAllByLabelText(/Importance for/)).toHaveLength(0)
    expect(banner()).toHaveTextContent('Load the Demo trip to begin.')
    expect(ranking()).toHaveTextContent('Load the Demo trip to see ranked hotels.')
    expect(mapPanel()).toHaveTextContent('Load the Demo trip to see the map.')
    expect(explanation()).toHaveTextContent('Load the Demo trip, then pick a hotel')
    expect(table()).toHaveTextContent('Load the Demo trip to see the travel-time table.')
    expect(compareMock).not.toHaveBeenCalled()
  })
})

describe('b. Load Demo trip', () => {
  it('shows the recommended hotel everywhere, in the order the API sent', async () => {
    await loadDemo()
    const recommended = ok.recommended_hotel_id!
    expect(banner()).toHaveTextContent(`Recommended: ${hotelName(recommended)}`)
    expect(rankingIds()).toEqual(ok.hotels.map((h) => h.id))
    expect(markers()).toHaveLength(25)
    expectInspected(ok, ok.default_inspected_hotel_id!)
    expect(ok.default_inspected_hotel_id).toBe(recommended)
    expect(compareMock).toHaveBeenCalledTimes(1)
  })

  it('shows over-budget hotels unranked with their shortfall, including the most accessible one', async () => {
    await loadDemo()
    const lowest = [...ok.hotels].sort((a, b) => a.weighted_total - b.weighted_total)[0]
    expect(lowest.label).toBe('OVER_BUDGET')
    const cards = within(ranking()).getAllByRole('listitem')
    for (const hotel of ok.hotels.filter((h) => h.label === 'OVER_BUDGET')) {
      const card = cards.find(
        (li) => li.querySelector('.ranking-id')!.textContent === hotel.id,
      )!
      expect(card).toHaveTextContent('✕ Over budget')
      expect(card).toHaveTextContent(/Over budget by ₹[\d,]+/)
      expect(card).toHaveTextContent('Unranked')
      expect(card.querySelector('.ranking-rank')!.textContent).not.toMatch(/#\d/)
    }
    expect(
      cards.find((li) => li.querySelector('.ranking-id')!.textContent === lowest.id),
    ).toHaveTextContent('✕ Over budget')
  })
})

describe('c. inspecting another hotel', () => {
  const other = () => ok.hotels.find((h) => h.label === 'RANKED')!

  it.each([
    [
      'a ranking card',
      (id: string) =>
        fireEvent.click(
          within(ranking())
            .getAllByRole('listitem')
            .find((li) => li.querySelector('.ranking-id')!.textContent === id)!
            .querySelector('button')!,
        ),
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
    const cardOf = () =>
      within(ranking())
        .getAllByRole('listitem')
        .find((li) => li.querySelector('.ranking-id')!.textContent === best)!

    await setBudget(String(atBest.budget))
    await waitFor(() =>
      expect(banner()).toHaveTextContent(`Recommended: ${hotelName(best)}`),
    )
    expect(rankingIds()).toEqual(atBest.hotels.map((h) => h.id))
    expect(cardOf()).toHaveTextContent('★ Recommended')
    expect(cardOf()).toHaveTextContent('₹0 left in budget')
    expect(explanation()).toHaveTextContent('★ Recommended')

    await setBudget(String(oneLess.budget))
    await waitFor(() =>
      expect(banner()).toHaveTextContent(
        `Recommended: ${hotelName(oneLess.recommended_hotel_id!)}`,
      ),
    )
    expect(rankingIds()).toEqual(oneLess.hotels.map((h) => h.id))
    expect(cardOf()).toHaveTextContent('Over budget by ₹1')
    expect(cardOf()).toHaveTextContent('Unranked')
    expect(cardOf()).not.toHaveTextContent('★ Recommended')
    expect(explanation()).toHaveTextContent('✕ Over budget')
  })

  it('keeps the inspected hotel contributions identical across a budget-only change', async () => {
    await loadDemo()
    const before = within(explanation()).getByRole('table').textContent
    await setBudget(String(atBest.budget))
    await waitFor(() => expect(banner()).toHaveTextContent(hotelName('H_GHANTA')))
    expect(within(explanation()).getByRole('table').textContent).toBe(before)
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
    fireEvent.change(importanceInput('MUSEUM'), { target: { value: '1' } })
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
    expect(within(explanation()).getByRole('table')).toHaveTextContent('1 × 19 = 19')
  })
})

describe('f. exact budget', () => {
  it('shows ₹0 left in budget at the exact cost and Over budget by ₹1 one rupee below', async () => {
    await loadDemo()
    const id = 'H_NEELGHAT'
    const cardOf = () =>
      within(ranking())
        .getAllByRole('listitem')
        .find((li) => li.querySelector('.ranking-id')!.textContent === id)!

    await setBudget(String(exact.budget))
    await waitFor(() => expect(cardOf()).toHaveTextContent('₹0 left in budget'))
    expect(cardOf()).toHaveTextContent('✓ Within budget')
    expect(cardOf()).toHaveTextContent(`#${hotelOf(exact, id).rank}`)

    await setBudget(String(oneOver.budget))
    await waitFor(() => expect(cardOf()).toHaveTextContent('Over budget by ₹1'))
    expect(cardOf()).toHaveTextContent('Unranked')
    expect(cardOf().textContent).not.toMatch(/₹0 left/)
    expect(rankingIds()).toEqual(oneOver.hotels.map((h) => h.id))
  })
})

describe('g. invalid inputs', () => {
  const cases: [string, () => HTMLElement, string, ComparisonResult][] = [
    ['budget -5', budgetInput, '-5', as(invalidBudgetJson)],
    ['budget 12.5', budgetInput, '12.5', as(invalidBudgetJson)],
    ['budget abc', budgetInput, 'abc', as(invalidBudgetJson)],
    ['importance 6', () => importanceInput('MUSEUM'), '6', as(invalidImportanceJson)],
  ]

  it.each(cases)(
    '%s clears every derived view and keeps the markers',
    async (_n, input, value, sample) => {
      await loadDemo()
      fireEvent.change(input(), { target: { value } })
      await waitFor(() => expect(banner()).toHaveTextContent('Cannot compare'))
      for (const e of sample.errors) expect(banner()).toHaveTextContent(e.message)
      expect(input()).toHaveAttribute('aria-invalid', 'true')
      expect(ranking()).toHaveTextContent('No ranking while inputs are invalid.')
      expect(within(ranking()).queryAllByRole('listitem')).toHaveLength(0)
      expect(explanation()).toHaveTextContent('No explanation while inputs are invalid.')
      expect(linkLines()).toHaveLength(0)
      expect(table().textContent).not.toMatch(/#\d|Over budget|Within budget/)
      expect(markers()).toHaveLength(25)
      expectNoRecommendation()
    },
  )

  it('recovers when the input becomes valid again', async () => {
    await loadDemo()
    await setBudget('abc')
    await waitFor(() => expect(banner()).toHaveTextContent('Cannot compare'))
    await setBudget('30000')
    await waitFor(() => expect(banner()).toHaveTextContent('Recommended:'))
    expect(budgetInput()).not.toHaveAttribute('aria-invalid')
  })
})

describe('h. no affordable hotel', () => {
  it('shows shortfalls and no star, no rank and no recommendation', async () => {
    await loadDemo()
    await setBudget('0')
    await waitFor(() => expect(banner()).toHaveTextContent('No hotel fits this budget'))
    expect(ranking()).toHaveTextContent('No hotel fits this budget')
    const cards = within(ranking()).getAllByRole('listitem')
    expect(cards).toHaveLength(10)
    for (const card of cards) {
      expect(card).toHaveTextContent(/Over budget by ₹[\d,]+/)
      expect(card).toHaveTextContent('Unranked')
    }
    expect(rankingIds()).toEqual(noHotel.hotels.map((h) => h.id))
    expect(mapPanel().querySelector('.citymap-badge')?.textContent).toBe('✕')
    expect(
      [...mapPanel().querySelectorAll('.citymap-badge')].every(
        (b) => b.textContent === '✕',
      ),
    ).toBe(true)
    expectNoRecommendation()
    expect(explanation()).toHaveTextContent('nothing is recommended')
  })
})

describe('i. reset', () => {
  it('restores the preset inputs, the recommendation and the inspected hotel', async () => {
    await loadDemo()
    await setBudget('36500')
    fireEvent.change(importanceInput('MUSEUM'), { target: { value: '1' } })
    fireEvent.click(screen.getByTestId('marker-hotel-H_HILLTOP'))
    await waitFor(() => expect(banner()).toHaveTextContent('Recommended:'))

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(banner()).toHaveTextContent(
        `Recommended: ${hotelName(ok.recommended_hotel_id!)}`,
      ),
    )
    expect(budgetInput()).toHaveValue(String(preset.budget))
    for (const [placeId, value] of Object.entries(preset.importances)) {
      expect(importanceInput(placeId)).toHaveValue(String(value))
    }
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
    expect(ranking()).toHaveTextContent('Weighted total: 99999')
    expect(ranking()).toHaveTextContent('Average: 9.9 min')
    expect(explanation()).toHaveTextContent('Weighted total = 99999')
  })
})
