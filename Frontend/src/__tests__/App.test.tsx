import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

describe('App shell', () => {
  it('renders every panel, found by role and label, inside the provider', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Hotel Base-Camp Comparator',
    )
    for (const name of [
      'Controls',
      'City map',
      'Ranked hotels',
      'Explanation',
      'Travel times',
    ]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
    expect(screen.getByText('Load the Demo trip to begin.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load Demo trip' })).toBeEnabled()
  })
})
