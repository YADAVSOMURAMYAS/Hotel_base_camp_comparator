// Shared test helper: a typed Comparator with spies, typed samples, and a real-provider render.
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ComparatorProvider } from '../state/ComparatorContext'
import type { Comparator } from '../state/useComparator'
import type { City, CitySummary, ComparisonResult, DemoPreset } from '../types/contracts'
import cityJson from './samples/city_surmapur.json'
import citiesJson from './samples/cities_list.json'
import shikharpurJson from './samples/city_shikharpur.json'
import invalidJson from './samples/compare_invalid.json'
import noHotelJson from './samples/compare_no_affordable_hotel.json'
import okJson from './samples/compare_ok.json'
import presetJson from './samples/preset_demo.json'

/** The unfiltered API response: the full 30 x 50 catalog. */
export const fullSurmapurCity = cityJson as unknown as City
export const sampleCities = (citiesJson as unknown as { cities: CitySummary[] }).cities
export const shikharpurCity = shikharpurJson as unknown as City
export const samplePreset = presetJson as unknown as DemoPreset
/**
 * The catalog narrowed to the Demo trip's 10 hotels and 15 places, derived from the preset.
 * Phase A tests were written when the Surmapur sample held only those; they treat sampleCity
 * as "what is on the map". Tests that need the whole catalog use fullSurmapurCity.
 */
export const sampleCity: City = {
  ...fullSurmapurCity,
  hotels: fullSurmapurCity.hotels.filter((h) => samplePreset.hotel_ids.includes(h.id)),
  places: fullSurmapurCity.places.filter((p) => samplePreset.place_ids.includes(p.id)),
}
export const okResult = okJson as unknown as ComparisonResult
export const noHotelResult = noHotelJson as unknown as ComparisonResult
export const invalidResult = invalidJson as unknown as ComparisonResult

/** A Comparator as if the Demo trip were loaded, with spies for every action. */
export function loadedComparator(overrides: Partial<Comparator> = {}): Comparator {
  return {
    loaded: true,
    cities: sampleCities,
    citiesError: null,
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
    readiness: {
      hotelCount: samplePreset.hotel_ids.length,
      placeCount: samplePreset.place_ids.length,
      hotelsNeeded: 0,
      placesNeeded: 0,
      budgetMissing: false,
      canCompare: true,
    },
    selectCity: vi.fn(),
    toggleHotel: vi.fn(),
    togglePlace: vi.fn(),
    clearSelection: vi.fn(),
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
    readiness: {
      hotelCount: 0,
      placeCount: 0,
      hotelsNeeded: 2,
      placesNeeded: 3,
      budgetMissing: true,
      canCompare: false,
    },
    ...overrides,
  })
}

/** Renders inside the real provider (the API client must be mocked by the test). */
export function renderWithProvider(ui: ReactElement) {
  return render(<ComparatorProvider>{ui}</ComparatorProvider>)
}
