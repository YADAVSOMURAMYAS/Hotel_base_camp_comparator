import { render, screen, within } from '@testing-library/react'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { Comparator } from '../../state/useComparator'
import type { ComparisonResult } from '../../types/contracts'
import {
  idleComparator,
  invalidResult,
  loadedComparator,
  noHotelResult,
  okResult,
} from '../../test/renderWithComparator'
import StatusBanner from './index'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(comparator: Comparator) {
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  return render(<StatusBanner />)
}

describe('StatusBanner', () => {
  it('idle: invites loading the Demo trip', () => {
    show(idleComparator())
    expect(screen.getByRole('status')).toHaveTextContent('Load the Demo trip to begin.')
  })

  it('loading with no result: shows Loading…', () => {
    show(idleComparator({ phase: 'loading' }))
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
  })

  it('stale: shows only Updating… and is aria-busy', () => {
    show(loadedComparator({ phase: 'loading', isStale: true }))
    const region = screen.getByRole('status')
    expect(region).toHaveTextContent('Updating…')
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(region).not.toHaveTextContent(/Recommended/)
  })

  it('OK: names the recommended hotel and its remaining budget', () => {
    show(loadedComparator())
    const region = screen.getByRole('status')
    expect(region).toHaveTextContent('✓ Recommended: Garden Court Hotel')
    expect(region).toHaveTextContent('Remaining budget: ₹13,500')
    expect(region).not.toHaveAttribute('aria-busy', 'true')
  })

  it('OK: falls back to the id when the hotel is not in the list', () => {
    show(loadedComparator({ result: { ...okResult, hotels: [] } }))
    expect(screen.getByRole('status')).toHaveTextContent('✓ Recommended: H_GARDEN')
  })

  it('NO_AFFORDABLE_HOTEL: says nothing is recommended and names no winner', () => {
    show(loadedComparator({ result: noHotelResult }))
    const region = screen.getByRole('status')
    expect(region).toHaveTextContent(
      '⚠ No hotel fits this budget. Nothing is recommended.',
    )
    expect(region).not.toHaveTextContent(/✓|Recommended:/)
    for (const hotel of noHotelResult.hotels) {
      expect(region).not.toHaveTextContent(hotel.name)
    }
  })

  it('INVALID: alerts, lists every error with field, code and message, names no winner', () => {
    const many: ComparisonResult = {
      ...invalidResult,
      errors: [
        ...invalidResult.errors,
        {
          field: 'importances.DOSA',
          code: 'IMPORTANCE_INVALID',
          message: 'Importance for DOSA must be a whole number from 1 to 5',
        },
        { field: 'hotel_ids', code: 'HOTEL_COUNT', message: 'Pick 2 to 10 hotels' },
      ],
    }
    show(loadedComparator({ result: many }))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('✕ Cannot compare: fix the highlighted inputs')
    const items = within(alert).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    for (const [i, e] of many.errors.entries()) {
      expect(items[i]).toHaveTextContent(e.field)
      expect(items[i]).toHaveTextContent(e.code)
      expect(items[i]).toHaveTextContent(e.message)
    }
    expect(alert).not.toHaveTextContent(/Recommended/)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('error phase: alerts with the readable message', () => {
    show(
      idleComparator({
        phase: 'error',
        error: 'Could not reach the comparison service.',
      }),
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('✕ The comparison service is unavailable')
    expect(alert).toHaveTextContent('Could not reach the comparison service.')
  })
})
