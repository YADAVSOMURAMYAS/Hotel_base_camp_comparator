// Local test helper (T11): a typed Comparator with spies. The test file mocks
// useComparatorContext to return it. T14 may consolidate with the Controls helper.
import type { Comparator } from '../../state/useComparator'
import type { ComparisonResult } from '../../types/contracts'
import noHotelJson from '../../test/samples/compare_no_affordable_hotel.json'
import okJson from '../../test/samples/compare_ok.json'

export const okResult = okJson as unknown as ComparisonResult
export const noHotelResult = noHotelJson as unknown as ComparisonResult

export function makeComparator(overrides: Partial<Comparator> = {}): Comparator {
  return {
    loaded: true,
    city: null,
    preset: null,
    inputs: { budgetText: '', importanceTexts: {} },
    selection: { hotel_ids: [], place_ids: [] },
    inspectedHotelId: okResult.default_inspected_hotel_id,
    result: okResult,
    phase: 'ready',
    error: null,
    isStale: false,
    loadDemo: vi.fn(),
    setBudgetText: vi.fn(),
    setImportanceText: vi.fn(),
    inspectHotel: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  }
}
