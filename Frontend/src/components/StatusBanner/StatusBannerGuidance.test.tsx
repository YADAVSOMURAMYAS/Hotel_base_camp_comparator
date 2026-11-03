import { render, screen } from '@testing-library/react'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { Comparator } from '../../state/useComparator'
import {
  idleComparator,
  loadedComparator,
  shikharpurCity,
} from '../../test/renderWithComparator'
import StatusBanner from './index'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(comparator: Comparator) {
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  return render(<StatusBanner />)
}

const guidance = (over: Partial<Comparator['readiness']>) =>
  loadedComparator({
    city: shikharpurCity,
    result: null,
    phase: 'ready',
    readiness: {
      hotelCount: 0,
      placeCount: 0,
      hotelsNeeded: 2,
      placesNeeded: 3,
      budgetMissing: true,
      canCompare: false,
      ...over,
    },
  })

describe('StatusBanner guidance', () => {
  it('names the ranges, the counts and everything still missing', () => {
    show(guidance({ hotelCount: 1, placeCount: 2, hotelsNeeded: 1, placesNeeded: 1 }))
    const banner = screen.getByRole('status')
    expect(banner).toHaveTextContent(
      'Pick 2-10 hotels (1 selected) and 3-15 places (2 selected), then enter a budget.',
    )
    expect(banner).toHaveTextContent('1 more hotel')
    expect(banner).toHaveTextContent('1 more place')
    expect(banner).toHaveTextContent('a budget')
  })

  it('pluralises and lists only the missing parts', () => {
    show(
      guidance({
        hotelCount: 2,
        placeCount: 0,
        hotelsNeeded: 0,
        placesNeeded: 3,
        budgetMissing: false,
      }),
    )
    const banner = screen.getByRole('status')
    expect(banner).toHaveTextContent('3 more places')
    expect(banner).not.toHaveTextContent('more hotel')
    expect(banner).not.toHaveTextContent(/Still needed:.*budget/)
  })

  it('does not show once a comparison is possible', () => {
    show(loadedComparator({ result: null, phase: 'ready' }))
    expect(screen.queryByText(/Pick 2-10 hotels/)).not.toBeInTheDocument()
  })

  it('does not replace the idle invitation before any city is loaded', () => {
    show(idleComparator())
    expect(screen.getByRole('status')).toHaveTextContent('Load the Demo trip to begin.')
  })
})
