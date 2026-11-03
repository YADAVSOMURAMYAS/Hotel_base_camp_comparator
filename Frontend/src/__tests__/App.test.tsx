import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getCities: vi.fn().mockResolvedValue([]),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

describe('App shell', () => {
  it('opens on the Plan screen with the app name as the page heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Hotel Base-Camp Comparator',
    )
    expect(screen.getByRole('region', { name: 'Plan your trip' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Results' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Load Demo trip' })).toBeEnabled()
  })

  it('each screen is a keyed, animated container, so a mode switch slides it in', () => {
    render(<App />)
    expect(screen.getByRole('main')).toHaveClass('screen')
  })

  it('opens on Results when that was the last screen', () => {
    localStorage.setItem('hbc.view', JSON.stringify('results'))
    render(<App />)
    expect(screen.getByRole('region', { name: 'Results' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument()
  })
})
