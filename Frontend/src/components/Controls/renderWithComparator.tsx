// Local test helper (T10). T14 should consolidate it into src/test/ (see docs/DECISIONS.md).
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ComparatorProvider } from '../../state/ComparatorContext'
import type { Comparator } from '../../state/useComparator'
import type { City, ComparisonResult, DemoPreset } from '../../types/contracts'
import cityJson from '../../test/samples/city_surmapur.json'
import invalidJson from '../../test/samples/compare_invalid.json'
import noHotelJson from '../../test/samples/compare_no_affordable_hotel.json'
import okJson from '../../test/samples/compare_ok.json'
import presetJson from '../../test/samples/preset_demo.json'

export const sampleCity = cityJson as unknown as City
export const samplePreset = presetJson as unknown as DemoPreset
export const okResult = okJson as unknown as ComparisonResult
export const noHotelResult = noHotelJson as unknown as ComparisonResult
export const invalidResult = invalidJson as unknown as ComparisonResult

/** A Comparator as if the Demo trip were loaded, with spies for every action. */
export function loadedComparator(overrides: Partial<Comparator> = {}): Comparator {
  return {
    loaded: true,
    city: sampleCity,
    preset: samplePreset,
    inputs: {
      budgetText: String(samplePreset.budget),
      importanceTexts: Object.fromEntries(
        Object.entries(samplePreset.importances).map(([id, v]) => [id, String(v)]),
      ),
    },
    selection: { hotel_ids: samplePreset.hotel_ids, place_ids: samplePreset.place_ids },
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

/** A Comparator before anything was loaded. */
export function idleComparator(overrides: Partial<Comparator> = {}): Comparator {
  return loadedComparator({
    loaded: false,
    city: null,
    preset: null,
    inputs: { budgetText: '', importanceTexts: {} },
    selection: { hotel_ids: [], place_ids: [] },
    inspectedHotelId: null,
    result: null,
    phase: 'idle',
    ...overrides,
  })
}

/** Renders inside the real provider (the API client must be mocked by the test). */
export function renderWithProvider(ui: ReactElement) {
  return render(<ComparatorProvider>{ui}</ComparatorProvider>)
}
