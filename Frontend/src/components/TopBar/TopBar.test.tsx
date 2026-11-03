import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TopBar from '.'

describe('TopBar', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('shows the app name as the page heading and renders its slot', () => {
    render(
      <TopBar>
        <span>slot content</span>
      </TopBar>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Hotel Base-Camp Comparator',
    )
    expect(screen.getByText('slot content')).toBeInTheDocument()
  })

  it('toggles the theme on <html> and remembers it', async () => {
    render(<TopBar />)
    await userEvent.click(screen.getByRole('button', { name: /dark mode/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('hbc.theme')).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: /light mode/i }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('starts from the saved theme', () => {
    localStorage.setItem('hbc.theme', 'dark')
    render(<TopBar />)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
