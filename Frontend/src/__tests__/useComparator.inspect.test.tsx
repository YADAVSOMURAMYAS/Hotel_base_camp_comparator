import { act, renderHook } from '@testing-library/react'
import * as client from '../api/client'
import { useComparator } from '../state/useComparator'
import type { City, ComparisonResult, DemoPreset } from '../types/contracts'
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

const ok = okJson as unknown as ComparisonResult

beforeEach(() => {
  vi.mocked(client.getCities).mockReset().mockResolvedValue([])
  vi.mocked(client.getCity)
    .mockReset()
    .mockResolvedValue(surmapurJson as unknown as City)
  vi.mocked(client.getDemoPreset)
    .mockReset()
    .mockResolvedValue(presetJson as unknown as DemoPreset)
  vi.mocked(client.compare).mockReset().mockResolvedValue(ok)
})

describe('inspecting a hotel', () => {
  it('can be cleared (click on empty map) without calling the API or touching the result', async () => {
    const { result } = renderHook(() => useComparator())
    await act(() => result.current.loadDemo())
    expect(result.current.inspectedHotelId).toBe(ok.default_inspected_hotel_id)
    const calls = vi.mocked(client.compare).mock.calls.length

    act(() => result.current.inspectHotel(null))
    expect(result.current.inspectedHotelId).toBeNull()
    expect(result.current.result).toEqual(ok)
    expect(vi.mocked(client.compare).mock.calls.length).toBe(calls)

    act(() => result.current.inspectHotel('H_CIVIL'))
    expect(result.current.inspectedHotelId).toBe('H_CIVIL')
  })
})
