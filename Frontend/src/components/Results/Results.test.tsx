import { fireEvent, render, screen, within } from '@testing-library/react'
import { useComparatorContext } from '../../state/ComparatorContext'
import {
  idleComparator,
  invalidResult,
  loadedComparator,
  noHotelResult,
  okResult,
} from '../../test/renderWithComparator'
import Results from './index'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(comparator = loadedComparator(), onEdit = vi.fn()) {
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  render(<Results onEdit={onEdit} />)
  return onEdit
}

beforeEach(() => vi.mocked(useComparatorContext).mockReset())

describe('Results screen', () => {
  it('summarises the choices as read-only chips', () => {
    show()
    const chips = within(screen.getByRole('list', { name: 'Your choices' }))
    expect(chips.getByText('Surmapur')).toBeInTheDocument()
    expect(chips.getByText('Budget ₹30,000')).toBeInTheDocument()
    expect(chips.getByText('10 hotels')).toBeInTheDocument()
    expect(chips.getByText('15 places')).toBeInTheDocument()
  })

  it('has no inputs, selects or radios', () => {
    show()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('shows the recommended hotel stats exactly as the API gave them', () => {
    show()
    const best = okResult.hotels.find((h) => h.id === okResult.recommended_hotel_id)!
    const stats = within(
      screen.getByRole('list', { name: 'Recommended hotel at a glance' }),
    )
    expect(stats.getByText(best.weighted_average_display)).toBeInTheDocument()
    expect(stats.getByText(/₹13,500 left/)).toBeInTheDocument()
    expect(stats.getByText(String(best.longest_trip))).toBeInTheDocument()
  })

  it('shows no stat cards when nothing is recommended', () => {
    show(loadedComparator({ result: noHotelResult }))
    expect(
      screen.queryByRole('list', { name: 'Recommended hotel at a glance' }),
    ).toBeNull()
    expect(screen.getByRole('region', { name: 'Ranked hotels' })).toBeInTheDocument()
  })

  it('collapses the travel-time table until asked', () => {
    show()
    expect(screen.queryByRole('region', { name: 'Travel times' })).toBeNull()
    const toggle = screen.getByRole('button', { name: 'Show travel times' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(screen.getByRole('region', { name: 'Travel times' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide travel times' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('shows skeleton blocks, not a ranking, while the first result loads', () => {
    show(loadedComparator({ result: null, phase: 'loading' }))
    expect(screen.queryByRole('region', { name: 'Ranked hotels' })).toBeNull()
    expect(document.querySelector('.results-skeleton')).not.toBeNull()
  })

  it('INVALID: error banner and an empty state; every derived view is gone', () => {
    const onEdit = show(loadedComparator({ result: invalidResult }))
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot compare')
    expect(screen.queryByRole('region', { name: 'Ranked hotels' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'City map' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Edit plan' }))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('nothing loaded: friendly empty state that leads back to the Plan', () => {
    const onEdit = show(idleComparator())
    expect(screen.getByText('Nothing to compare yet')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Plan a trip' }))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('is busy and dimmed while stale', () => {
    show(loadedComparator({ isStale: true, phase: 'loading' }))
    expect(screen.getByRole('region', { name: 'Results' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })
})
