import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as client from '../../api/client'
import App from '../../App'
import { ComparatorProvider } from '../../state/ComparatorContext'
import {
  invalidResult,
  okResult,
  sampleCities,
  sampleCity,
  samplePreset,
} from '../../test/renderWithComparator'
import Plan from './index'
import StepIndicator from './StepIndicator'

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  getCities: vi.fn(),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(client.getCities).mockReset().mockResolvedValue(sampleCities)
  vi.mocked(client.getCity).mockReset().mockResolvedValue(sampleCity)
  vi.mocked(client.getDemoPreset).mockReset().mockResolvedValue(samplePreset)
  vi.mocked(client.compare).mockReset().mockResolvedValue(okResult)
})

function renderPlan(onCompare = vi.fn()) {
  render(
    <ComparatorProvider>
      <StepIndicator />
      <Plan onCompare={onCompare} />
    </ComparatorProvider>,
  )
  return onCompare
}

describe('Plan screen', () => {
  it('starts with a friendly prompt instead of a banner, and Compare is disabled', () => {
    renderPlan()
    expect(screen.getByText('Pick a city to get started.')).toBeInTheDocument()
    expect(screen.queryByText('Load the Demo trip to begin.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Compare hotels/ })).toBeDisabled()
    expect(screen.getByLabelText(/Budget for the complete stay/)).toBeDisabled()
  })

  it('Load Demo trip fills the plan and goes straight to Results', async () => {
    const onCompare = renderPlan()
    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    await waitFor(() => expect(onCompare).toHaveBeenCalledOnce())
    expect(screen.getByLabelText(/Budget for the complete stay/)).toHaveValue(
      String(samplePreset.budget),
    )
    expect(client.compare).toHaveBeenCalledTimes(1)
  })

  it('shows counters, chips with checkmarks, and a segmented 1-5 control per place', async () => {
    renderPlan()
    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    await screen.findByText('10/10 hotels')
    expect(screen.getByText('15/15 places')).toBeInTheDocument()
    const groups = screen.getAllByRole('group', { name: /^(?!Hotels|Places)/ })
    const museum = groups.find((g) => within(g).queryAllByRole('radio').length === 5)
    expect(museum).toBeDefined()
    const radios = within(museum!).getAllByRole('radio')
    expect(radios.filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1)
  })

  it('sends a changed importance through the existing compare path', async () => {
    renderPlan()
    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    await screen.findByText('15/15 places')
    const firstPlace = sampleCity.places.find((p) => p.id === samplePreset.place_ids[0])!
    const group = screen.getByRole('group', { name: new RegExp(firstPlace.name) })
    await userEvent.click(within(group).getByRole('radio', { name: '1' }))
    await waitFor(() => {
      const last = vi.mocked(client.compare).mock.calls.at(-1)![0]
      expect(last.importances[firstPlace.id]).toBe(1)
    })
  })

  it('tells the user what is missing after a city is chosen', async () => {
    renderPlan()
    await userEvent.selectOptions(await screen.findByLabelText('City'), 'surmapur')
    await screen.findByText('0/10 hotels')
    expect(screen.getByText('Choose 2 more hotels to compare.')).toBeInTheDocument()
    expect(
      screen.getByText('Choose 3 more places you want to visit.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Add your budget for the complete stay.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Compare hotels/ })).toBeDisabled()
  })

  it('enables Compare once the plan is complete and calls onCompare', async () => {
    const onCompare = renderPlan()
    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    await waitFor(() => expect(onCompare).toHaveBeenCalledOnce())
    const compare = screen.getByRole('button', { name: /Compare hotels/ })
    await waitFor(() => expect(compare).toBeEnabled())
    await userEvent.click(compare)
    expect(onCompare).toHaveBeenCalledTimes(2)
  })

  it('blocks Compare and shows the API message when the backend says INVALID', async () => {
    vi.mocked(client.compare).mockResolvedValue(invalidResult)
    renderPlan()
    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Compare hotels/ })).toBeDisabled(),
    )
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
  })

  it('marks the current step and ticks finished ones', async () => {
    renderPlan()
    const steps = within(screen.getByRole('list', { name: 'Progress' }))
    expect(steps.getByText('City').closest('li')).toHaveAttribute('aria-current', 'step')
    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    await waitFor(() =>
      expect(steps.getByText('City').closest('li')).not.toHaveAttribute('aria-current'),
    )
    expect(steps.getAllByText('(done)')).toHaveLength(3)
  })
})

describe('App screens', () => {
  it('opens on the Plan screen and moves to Results after Load Demo trip', async () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Find your perfect base camp' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    await screen.findByRole('region', { name: 'Ranked hotels' })
    expect(
      screen.queryByRole('heading', { name: 'Find your perfect base camp' }),
    ).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('hbc.view') ?? 'null')).toBe('results')
  })
})
