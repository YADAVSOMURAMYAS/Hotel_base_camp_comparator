// Motion polish: count-up, button ripple, FLIP deltas.
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { flipDeltas } from '../HotelRanking/flip'
import CountUp from './CountUp'
import PillButton from './PillButton'

const motion = (reduced: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }) as never
}

describe('CountUp', () => {
  afterEach(() => vi.useRealTimers())

  it('with reduced motion shows the value at once', () => {
    motion(true)
    render(<CountUp value="28.0" />)
    expect(screen.getByText('28.0')).toBeInTheDocument()
  })

  it('starts at zero with the same decimals, then ends on exactly the string given', () => {
    motion(false)
    vi.useFakeTimers()
    render(<CountUp value="28.0" />)
    expect(screen.getByText('0.0')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    const midway = Number(document.body.textContent)
    expect(midway).toBeGreaterThan(0)
    expect(midway).toBeLessThan(28)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(document.body.textContent).toBe('28.0')
  })

  it('counts whole numbers as whole numbers', () => {
    motion(false)
    vi.useFakeTimers()
    render(<CountUp value="85" />)
    expect(screen.getByText('0')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(document.body.textContent).toBe('85')
  })

  it('shows anything that is not a plain number as given', () => {
    motion(false)
    render(<CountUp value="n/a" />)
    expect(screen.getByText('n/a')).toBeInTheDocument()
  })

  it('a later change is shown straight away, not counted again', async () => {
    motion(false)
    vi.useFakeTimers()
    const { rerender } = render(<CountUp value="28.0" />)
    act(() => {
      vi.advanceTimersByTime(1200)
    })
    rerender(<CountUp value="31.5" />)
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(document.body.textContent).toBe('31.5')
  })
})

describe('PillButton ripple', () => {
  beforeEach(() => motion(false))

  it('adds a ripple on press and removes it again', async () => {
    const onClick = vi.fn()
    render(<PillButton onClick={onClick}>Go</PillButton>)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      await userEvent.click(screen.getByRole('button', { name: 'Go' }))
      expect(onClick).toHaveBeenCalledOnce()
      expect(document.querySelectorAll('.pill-ripple')).toHaveLength(1)
      act(() => {
        vi.advanceTimersByTime(700)
      })
      expect(document.querySelectorAll('.pill-ripple')).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps the accessible name free of the ripple', async () => {
    render(<PillButton arrow>Compare hotels</PillButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Compare hotels' }))
    expect(screen.getByRole('button', { name: 'Compare hotels' })).toBeInTheDocument()
  })
})

describe('flipDeltas', () => {
  it('gives each moved card the distance back to where it was', () => {
    const before = new Map([
      ['A', 0],
      ['B', 100],
      ['C', 200],
    ])
    const after = new Map([
      ['B', 0],
      ['A', 100],
      ['C', 200],
      ['D', 300],
    ])
    expect(flipDeltas(before, after)).toEqual(
      new Map([
        ['B', 100],
        ['A', -100],
      ]),
    )
  })

  it('has nothing to animate when nothing moved', () => {
    const same = new Map([['A', 0]])
    expect(flipDeltas(same, new Map(same)).size).toBe(0)
  })
})
