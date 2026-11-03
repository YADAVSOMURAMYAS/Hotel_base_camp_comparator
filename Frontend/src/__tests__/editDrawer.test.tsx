// The Edit drawer on the real <App/>: same Plan steps, values kept, results update behind it.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import * as client from '../api/client'
import type { City, ComparisonResult, DemoPreset } from '../types/contracts'
import cityJson from '../test/samples/city_surmapur.json'
import presetJson from '../test/samples/preset_demo.json'
import okJson from '../test/samples/compare_ok.json'
import atBestJson from '../test/samples/flow_budget_at_best_cost.json'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getCities: vi.fn().mockResolvedValue([]),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

const preset = presetJson as unknown as DemoPreset
const ok = okJson as unknown as ComparisonResult
const atBest = atBestJson as unknown as ComparisonResult
const compareMock = vi.mocked(client.compare)

const budgetInput = () => screen.getByLabelText(/Budget for the complete stay/)
const updateButton = () => screen.getByRole('button', { name: 'Update results' })

beforeEach(() => {
  vi.mocked(client.getCity).mockResolvedValue(cityJson as unknown as City)
  vi.mocked(client.getDemoPreset).mockResolvedValue(preset)
  compareMock
    .mockReset()
    .mockImplementation(async (body) => (body.budget === 36500 ? atBest : ok))
})

async function resultsScreen() {
  render(<App />)
  await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
  await screen.findByRole('region', { name: 'Results' })
  await screen.findByText(/Recommended:/)
}

describe('Edit drawer', () => {
  it('opens with the previous values preserved and the page behind it inert', async () => {
    await resultsScreen()
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }))
    const dialog = screen.getByRole('dialog', { name: 'Edit your trip' })
    expect(within(dialog).getByLabelText(/Budget for the complete stay/)).toHaveValue(
      String(preset.budget),
    )
    expect(within(dialog).getByText('10/10 hotels')).toBeInTheDocument()
    expect(within(dialog).getByText('15/15 places')).toBeInTheDocument()
    expect(updateButton()).toBeEnabled()
    expect(
      screen.getByRole('region', { name: 'Results' }).closest('[inert]'),
    ).not.toBeNull()
    // one map only: the drawer has no second copy
    expect(screen.getAllByRole('region', { name: 'City map' })).toHaveLength(1)
  })

  it('Update results closes the drawer and the new budget shows on Results', async () => {
    await resultsScreen()
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }))
    fireEvent.change(budgetInput(), { target: { value: '36500' } })
    await waitFor(() => expect(updateButton()).toBeEnabled())
    await userEvent.click(updateButton())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('region', { name: 'Results' }).closest('[inert]')).toBeNull()
    await waitFor(() =>
      expect(screen.getByRole('list', { name: 'Your choices' })).toHaveTextContent(
        'Budget ₹36,500',
      ),
    )
  })

  it('Escape closes it without losing the typed value, and Edit reopens it unchanged', async () => {
    await resultsScreen()
    const edit = screen.getByRole('button', { name: /Edit/ })
    await userEvent.click(edit)
    fireEvent.change(budgetInput(), { target: { value: '36500' } })
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(edit).toHaveFocus()
    await userEvent.click(edit)
    expect(budgetInput()).toHaveValue('36500')
  })

  it('shows the API message at the field and blocks Update while the input is invalid', async () => {
    const invalid = {
      ...ok,
      status: 'INVALID',
      hotels: [],
      recommended_hotel_id: null,
      errors: [{ field: 'budget', code: 'x', message: 'Budget must be a whole number.' }],
    } as ComparisonResult
    compareMock.mockImplementation(async (body) => (body.budget === 'abc' ? invalid : ok))
    await resultsScreen()
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }))
    fireEvent.change(budgetInput(), { target: { value: 'abc' } })
    await waitFor(() => expect(updateButton()).toBeDisabled())
    expect(screen.getAllByText('Budget must be a whole number.').length).toBeGreaterThan(
      0,
    )
    expect(budgetInput()).toHaveAttribute('aria-invalid', 'true')
  })
})
