import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

describe('App shell', () => {
  it('renders all six stubs and the temporary DevPanel inside the provider', () => {
    render(<App />)
    for (const id of [
      'controls-stub',
      'status-banner-stub',
      'hotel-ranking-stub',
      'city-map-stub',
      'explanation-panel-stub',
      'travel-matrix-stub',
      'dev-panel',
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument()
  })
})
