import { act, renderHook, waitFor } from '@testing-library/react'
import * as client from '../api/client'
import { saveTrip } from '../state/savedTrip'
import { useComparator } from '../state/useComparator'
import type { City, CitySummary, ComparisonResult, DemoPreset } from '../types/contracts'
import citiesJson from '../test/samples/cities_list.json'
import surmapurJson from '../test/samples/city_surmapur.json'
import okJson from '../test/samples/compare_ok.json'
import presetJson from '../test/samples/preset_demo.json'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getCities: vi.fn(),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

const cities = (citiesJson as { cities: CitySummary[] }).cities
const surmapur = surmapurJson as unknown as City
const demo = presetJson as unknown as DemoPreset
const ok = okJson as unknown as ComparisonResult

beforeEach(() => {
  vi.mocked(client.getCities).mockReset().mockResolvedValue(cities)
  vi.mocked(client.getCity).mockReset().mockResolvedValue(surmapur)
  vi.mocked(client.getDemoPreset).mockReset().mockResolvedValue(demo)
  vi.mocked(client.compare).mockReset().mockResolvedValue(ok)
})

describe('saving and restoring the trip', () => {
  it('saves city, selection, budget and importances after Load Demo trip', async () => {
    const { result } = renderHook(() => useComparator())
    await act(() => result.current.loadDemo())
    const saved = JSON.parse(localStorage.getItem('hbc.trip') ?? 'null')
    expect(saved.cityId).toBe(demo.city_id)
    expect(saved.selection.hotel_ids).toEqual(demo.hotel_ids)
    expect(saved.inputs.budgetText).toBe(String(demo.budget))
    expect(saved.budgetTouched).toBe(true)
    expect(saved).not.toHaveProperty('result')
  })

  it('restores the saved trip on mount and asks the API for a fresh result', async () => {
    saveTrip({
      cityId: 'surmapur',
      selection: { hotel_ids: demo.hotel_ids, place_ids: demo.place_ids },
      inputs: {
        budgetText: '31000',
        importanceTexts: Object.fromEntries(
          demo.place_ids.map((id) => [id, String(demo.importances[id])]),
        ),
      },
      budgetTouched: true,
    })
    const { result } = renderHook(() => useComparator())
    await waitFor(() => expect(result.current.result).toEqual(ok))
    expect(result.current.city?.city_id).toBe('surmapur')
    expect(result.current.inputs.budgetText).toBe('31000')
    expect(result.current.selection.hotel_ids).toEqual(demo.hotel_ids)
    expect(vi.mocked(client.compare).mock.calls[0][0].budget).toBe(31000)
  })

  it('falls back to the empty start when the saved city cannot be loaded', async () => {
    saveTrip({
      cityId: 'gone',
      selection: { hotel_ids: [], place_ids: [] },
      inputs: { budgetText: '', importanceTexts: {} },
      budgetTouched: false,
    })
    vi.mocked(client.getCity).mockRejectedValue(new Error('404'))
    const { result } = renderHook(() => useComparator())
    await waitFor(() => expect(result.current.phase).toBe('idle'))
    expect(result.current.city).toBeNull()
    expect(localStorage.getItem('hbc.trip')).toBeNull()
  })
})
