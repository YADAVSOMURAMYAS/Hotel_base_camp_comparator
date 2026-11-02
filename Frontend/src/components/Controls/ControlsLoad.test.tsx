import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as client from '../../api/client'
import Controls from './index'
import {
  okResult,
  renderWithProvider,
  sampleCity,
  samplePreset,
} from '../../test/renderWithComparator'

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(client.getCity).mockResolvedValue(sampleCity)
  vi.mocked(client.getDemoPreset).mockResolvedValue(samplePreset)
  vi.mocked(client.compare).mockReset().mockResolvedValue(okResult)
})

describe('Controls load flow (real provider, mocked client)', () => {
  it('loads city, preset and the first comparison from one click', async () => {
    renderWithProvider(<Controls />)
    const budget = screen.getByLabelText('Budget for the complete stay (₹)')
    expect(budget).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))

    await waitFor(() => expect(budget).toBeEnabled())
    expect(client.getCity).toHaveBeenCalledTimes(1)
    expect(client.getDemoPreset).toHaveBeenCalledTimes(1)
    expect(client.compare).toHaveBeenCalledTimes(1)
    expect(budget).toHaveValue(String(samplePreset.budget))
    expect(screen.getAllByRole('listitem')).toHaveLength(15)
    expect(screen.getByRole('button', { name: 'Load Demo trip' })).toBeEnabled()
  })

  it('reflects typed text in the input and re-compares', async () => {
    renderWithProvider(<Controls />)
    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    const budget = await screen.findByLabelText('Budget for the complete stay (₹)')
    await waitFor(() => expect(budget).toBeEnabled())

    await userEvent.clear(budget)
    await userEvent.type(budget, '-5')

    expect(budget).toHaveValue('-5')
    expect(vi.mocked(client.compare).mock.calls.at(-1)![0].budget).toBe(-5)
  })
})
