import { act, renderHook, waitFor } from '@testing-library/react'
import * as client from '../api/client'
import { useComparator } from '../state/useComparator'
import type { City, CitySummary, ComparisonResult, DemoPreset } from '../types/contracts'
import citiesJson from '../test/samples/cities_list.json'
import surmapurJson from '../test/samples/city_surmapur.json'
import shikharpurJson from '../test/samples/city_shikharpur.json'
import okJson from '../test/samples/compare_ok.json'
import presetJson from '../test/samples/preset_demo.json'
import smallJson from '../test/samples/flow_shikharpur_small_ok.json'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getCities: vi.fn(),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

const cities = (citiesJson as { cities: CitySummary[] }).cities
const surmapur = surmapurJson as unknown as City
const shikharpur = shikharpurJson as unknown as City
const demo = presetJson as unknown as DemoPreset
const ok = okJson as unknown as ComparisonResult
const small = smallJson as unknown as ComparisonResult
const compareMock = vi.mocked(client.compare)

// Catalog order in Shikharpur: H_MALLROAD(4) < H_BARRACK(22) < H_ROPEWAY(26);
// TOYTRAIN(3) < MONASTERY(9) < CHOLE(40) < FALLS(43).
const hotelIds = (n: number) => shikharpur.hotels.slice(0, n).map((h) => h.id)
const placeIds = (n: number) => shikharpur.places.slice(0, n).map((p) => p.id)

function deferred() {
  let resolve!: (r: ComparisonResult) => void
  const promise = new Promise<ComparisonResult>((res) => (resolve = res))
  return { promise, resolve }
}

async function onShikharpur() {
  const hook = renderHook(() => useComparator())
  await waitFor(() => expect(hook.result.current.cities).toHaveLength(2))
  await act(() => hook.result.current.selectCity('shikharpur'))
  return hook
}

beforeEach(() => {
  vi.mocked(client.getCities).mockReset().mockResolvedValue(cities)
  vi.mocked(client.getCity)
    .mockReset()
    .mockImplementation((id) =>
      Promise.resolve(id === 'surmapur' ? surmapur : shikharpur),
    )
  vi.mocked(client.getDemoPreset).mockReset().mockResolvedValue(demo)
  compareMock.mockReset().mockResolvedValue(small)
})

describe('cities list', () => {
  it('fetches the cities once on mount', async () => {
    const { result } = renderHook(() => useComparator())
    await waitFor(() => expect(result.current.cities).toEqual(cities))
    expect(client.getCities).toHaveBeenCalledTimes(1)
    expect(result.current.phase).toBe('idle')
  })

  it('a failed list is not fatal: citiesError is set and phase stays idle', async () => {
    vi.mocked(client.getCities).mockRejectedValue(new client.ApiError('down'))
    const { result } = renderHook(() => useComparator())
    await waitFor(() => expect(result.current.citiesError).toBe('down'))
    expect(result.current.phase).toBe('idle')
  })
})

describe('selectCity', () => {
  it('loads the catalog with an empty selection, no budget and no result', async () => {
    const { result } = await onShikharpur()
    expect(result.current.city?.city_id).toBe('shikharpur')
    expect(result.current.loaded).toBe(true)
    expect(result.current.selection).toEqual({ hotel_ids: [], place_ids: [] })
    expect(result.current.inputs).toEqual({ budgetText: '', importanceTexts: {} })
    expect(result.current.result).toBeNull()
    expect(result.current.phase).toBe('ready')
    expect(compareMock).not.toHaveBeenCalled()
  })

  it('switching city clears selection, budget and result', async () => {
    const { result } = await onShikharpur()
    await act(() => result.current.toggleHotel('H_MALLROAD'))
    await act(() => result.current.setBudgetText('9000'))
    await act(() => result.current.selectCity('surmapur'))
    expect(result.current.city?.city_id).toBe('surmapur')
    expect(result.current.selection).toEqual({ hotel_ids: [], place_ids: [] })
    expect(result.current.inputs.budgetText).toBe('')
    expect(result.current.result).toBeNull()
  })
})

describe('toggling', () => {
  it('keeps catalog order, not click order', async () => {
    const { result } = await onShikharpur()
    for (const id of ['H_ROPEWAY', 'H_MALLROAD', 'H_BARRACK'])
      await act(() => result.current.toggleHotel(id))
    expect(result.current.selection.hotel_ids).toEqual([
      'H_MALLROAD',
      'H_BARRACK',
      'H_ROPEWAY',
    ])
    for (const id of ['FALLS', 'TOYTRAIN', 'CHOLE'])
      await act(() => result.current.togglePlace(id))
    expect(result.current.selection.place_ids).toEqual(['TOYTRAIN', 'CHOLE', 'FALLS'])
  })

  it('adds the catalog default importance text and removes it on deselect', async () => {
    const { result } = await onShikharpur()
    await act(() => result.current.togglePlace('TOYTRAIN'))
    expect(result.current.inputs.importanceTexts).toEqual({ TOYTRAIN: '5' })
    await act(() => result.current.togglePlace('FALLS'))
    expect(result.current.inputs.importanceTexts).toEqual({ TOYTRAIN: '5', FALLS: '4' })
    await act(() => result.current.togglePlace('TOYTRAIN'))
    expect(result.current.inputs.importanceTexts).toEqual({ FALLS: '4' })
  })

  it('does not decide validity: it will select an 11th hotel when asked', async () => {
    const { result } = await onShikharpur()
    for (const id of hotelIds(11)) await act(() => result.current.toggleHotel(id))
    expect(result.current.selection.hotel_ids).toHaveLength(11)
  })

  it('clearSelection empties selection, importances and result but keeps the budget', async () => {
    const { result } = await onShikharpur()
    await act(() => result.current.setBudgetText('13000'))
    for (const id of hotelIds(2)) await act(() => result.current.toggleHotel(id))
    for (const id of placeIds(3)) await act(() => result.current.togglePlace(id))
    expect(result.current.result).not.toBeNull()
    await act(() => result.current.clearSelection())
    expect(result.current.selection).toEqual({ hotel_ids: [], place_ids: [] })
    expect(result.current.inputs).toEqual({ budgetText: '13000', importanceTexts: {} })
    expect(result.current.result).toBeNull()
  })
})

describe('compare gating', () => {
  it('does not call the client until minimums and budget are met, then calls exactly once', async () => {
    const { result } = await onShikharpur()
    for (const id of hotelIds(2)) await act(() => result.current.toggleHotel(id))
    for (const id of placeIds(2)) await act(() => result.current.togglePlace(id))
    expect(result.current.readiness).toEqual({
      hotelCount: 2,
      placeCount: 2,
      hotelsNeeded: 0,
      placesNeeded: 1,
      budgetMissing: true,
      canCompare: false,
    })
    await act(() => result.current.setBudgetText('13000'))
    expect(compareMock).not.toHaveBeenCalled()
    expect(result.current.result).toBeNull()
    expect(result.current.phase).toBe('ready')

    await act(() => result.current.togglePlace(placeIds(3)[2]))
    expect(compareMock).toHaveBeenCalledTimes(1)
    expect(result.current.readiness.canCompare).toBe(true)
    expect(result.current.result).toEqual(small)
    expect(result.current.inspectedHotelId).toBe(small.default_inspected_hotel_id)
  })

  it('does not call the client when only the budget is missing', async () => {
    const { result } = await onShikharpur()
    for (const id of hotelIds(2)) await act(() => result.current.toggleHotel(id))
    for (const id of placeIds(3)) await act(() => result.current.togglePlace(id))
    expect(compareMock).not.toHaveBeenCalled()
    expect(result.current.readiness.budgetMissing).toBe(true)
  })

  it('still sends invalid values to the backend (bad budget text, unknown place ID)', async () => {
    const { result } = await onShikharpur()
    for (const id of hotelIds(2)) await act(() => result.current.toggleHotel(id))
    for (const id of placeIds(3)) await act(() => result.current.togglePlace(id))
    await act(() => result.current.setBudgetText('abc'))
    expect(compareMock).toHaveBeenCalledTimes(1)
    expect(compareMock.mock.calls[0][0].budget).toBe('abc')
    await act(() => result.current.setImportanceText(placeIds(3)[0], '9'))
    expect(compareMock.mock.calls.at(-1)![0].importances[placeIds(3)[0]]).toBe(9)
  })

  it('drops a result that is no longer comparable', async () => {
    const { result } = await onShikharpur()
    await act(() => result.current.setBudgetText('13000'))
    for (const id of hotelIds(2)) await act(() => result.current.toggleHotel(id))
    for (const id of placeIds(3)) await act(() => result.current.togglePlace(id))
    expect(result.current.result).toEqual(small)
    await act(() => result.current.togglePlace(placeIds(3)[0]))
    expect(result.current.result).toBeNull()
  })
})

describe('budget that was never entered', () => {
  const invalidBudget = (): ComparisonResult => ({
    ...small,
    status: 'INVALID',
    errors: [
      { field: 'budget', code: 'BUDGET_TYPE', message: 'Budget must be a number.' },
    ],
    importance_total: null,
    budget: null,
    recommended_hotel_id: null,
    default_inspected_hotel_id: null,
    hotels: [],
  })

  it('(i) does not compare an otherwise valid selection and reports budgetMissing', async () => {
    const { result } = await onShikharpur()
    for (const id of hotelIds(2)) await act(() => result.current.toggleHotel(id))
    for (const id of placeIds(3)) await act(() => result.current.togglePlace(id))
    expect(compareMock).not.toHaveBeenCalled()
    expect(result.current.readiness.budgetMissing).toBe(true)
    expect(result.current.readiness.canCompare).toBe(false)
  })

  it('(ii) typed then cleared: the empty text IS sent (null) and the backend says INVALID', async () => {
    const { result } = await onShikharpur()
    for (const id of hotelIds(2)) await act(() => result.current.toggleHotel(id))
    for (const id of placeIds(3)) await act(() => result.current.togglePlace(id))
    await act(() => result.current.setBudgetText('5'))
    compareMock.mockResolvedValue(invalidBudget())
    await act(() => result.current.setBudgetText(''))
    expect(compareMock.mock.calls.at(-1)![0].budget).toBeNull()
    expect(result.current.readiness.budgetMissing).toBe(false)
    expect(result.current.result?.status).toBe('INVALID')
    expect(result.current.result?.errors[0].field).toBe('budget')
    expect(result.current.result?.hotels).toEqual([])
  })

  it('(iii) after loading the Demo trip, clearing the budget sends null', async () => {
    compareMock.mockResolvedValue(ok)
    const { result } = renderHook(() => useComparator())
    await act(() => result.current.loadDemo())
    await act(() => result.current.setBudgetText(''))
    expect(compareMock.mock.calls.at(-1)![0].budget).toBeNull()
  })

  it('selectCity and reset-without-preset make the budget "never entered" again', async () => {
    const { result } = await onShikharpur()
    await act(() => result.current.setBudgetText('9000'))
    await act(() => result.current.reset())
    expect(result.current.readiness.budgetMissing).toBe(true)
    await act(() => result.current.setBudgetText('9000'))
    await act(() => result.current.selectCity('surmapur'))
    expect(result.current.readiness.budgetMissing).toBe(true)
  })

  it('reset to the preset counts as entered', async () => {
    compareMock.mockResolvedValue(ok)
    const { result } = renderHook(() => useComparator())
    await act(() => result.current.loadDemo())
    await act(() => result.current.selectCity('surmapur'))
    await act(() => result.current.reset())
    expect(result.current.readiness.budgetMissing).toBe(false)
  })
})

describe('inspection after deselect', () => {
  it('moves to the default hotel when the inspected one is deselected', async () => {
    const { result } = await onShikharpur()
    await act(() => result.current.setBudgetText('13000'))
    for (const id of ['H_MALLROAD', 'H_BARRACK', 'H_ROPEWAY'])
      await act(() => result.current.toggleHotel(id))
    for (const id of ['TOYTRAIN', 'MONASTERY', 'CHOLE', 'FALLS'])
      await act(() => result.current.togglePlace(id))
    act(() => result.current.inspectHotel('H_ROPEWAY'))
    expect(result.current.inspectedHotelId).toBe('H_ROPEWAY')
    compareMock.mockResolvedValue({
      ...small,
      default_inspected_hotel_id: 'H_MALLROAD',
      hotels: small.hotels.filter((h) => h.id !== 'H_ROPEWAY'),
    })
    await act(() => result.current.toggleHotel('H_ROPEWAY'))
    expect(result.current.inspectedHotelId).toBe('H_MALLROAD')
  })

  it('keeps the user inspection while it is still selected', async () => {
    const { result } = await onShikharpur()
    await act(() => result.current.setBudgetText('13000'))
    for (const id of ['H_MALLROAD', 'H_BARRACK'])
      await act(() => result.current.toggleHotel(id))
    for (const id of ['TOYTRAIN', 'MONASTERY', 'CHOLE'])
      await act(() => result.current.togglePlace(id))
    act(() => result.current.inspectHotel('H_BARRACK'))
    await act(() => result.current.togglePlace('FALLS'))
    expect(result.current.inspectedHotelId).toBe('H_BARRACK')
  })
})

describe('reset and loadDemo', () => {
  it('loadDemo from Shikharpur switches to Surmapur and applies the preset', async () => {
    compareMock.mockResolvedValue(ok)
    const { result } = await onShikharpur()
    await act(() => result.current.loadDemo())
    expect(client.getCity).toHaveBeenLastCalledWith('surmapur')
    expect(result.current.city?.city_id).toBe('surmapur')
    expect(result.current.selection.hotel_ids).toEqual(demo.hotel_ids)
    expect(result.current.inputs.budgetText).toBe(String(demo.budget))
    expect(result.current.result).toEqual(ok)
  })

  it('reset without a preset clears selection, budget and importances', async () => {
    const { result } = await onShikharpur()
    await act(() => result.current.setBudgetText('13000'))
    await act(() => result.current.toggleHotel('H_MALLROAD'))
    await act(() => result.current.togglePlace('TOYTRAIN'))
    await act(() => result.current.reset())
    expect(result.current.selection).toEqual({ hotel_ids: [], place_ids: [] })
    expect(result.current.inputs).toEqual({ budgetText: '', importanceTexts: {} })
    expect(result.current.result).toBeNull()
  })

  it('reset with a preset restores the Demo trip, selection included', async () => {
    compareMock.mockResolvedValue(ok)
    const { result } = renderHook(() => useComparator())
    await act(() => result.current.loadDemo())
    await act(() => result.current.toggleHotel(demo.hotel_ids[0]))
    await act(() => result.current.reset())
    expect(result.current.selection.hotel_ids).toEqual(demo.hotel_ids)
    expect(result.current.result).toEqual(ok)
  })
})

describe('request sequencing for selection changes', () => {
  it('ignores an older response that arrives after a newer one', async () => {
    const { result } = await onShikharpur()
    await act(() => result.current.setBudgetText('13000'))
    for (const id of hotelIds(2)) await act(() => result.current.toggleHotel(id))
    for (const id of placeIds(2)) await act(() => result.current.togglePlace(id))

    const first = deferred()
    const second = deferred()
    compareMock
      .mockReset()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    act(() => void result.current.togglePlace(placeIds(3)[2]))
    act(() => void result.current.toggleHotel(hotelIds(3)[2]))

    await act(async () => second.resolve({ ...small, importance_total: 99 }))
    await act(async () => first.resolve({ ...small, importance_total: 1 }))
    expect(result.current.result?.importance_total).toBe(99)
    expect(result.current.phase).toBe('ready')
  })
})
