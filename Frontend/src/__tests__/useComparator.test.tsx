import { act, renderHook, waitFor } from '@testing-library/react'
import type { CompareRequest, ComparisonResult, DemoPreset } from '../types/contracts'
import * as client from '../api/client'
import { useComparator } from '../state/useComparator'
import city from '../test/samples/city_surmapur.json'
import invalid from '../test/samples/compare_invalid.json'
import noHotel from '../test/samples/compare_no_affordable_hotel.json'
import ok from '../test/samples/compare_ok.json'
import preset from '../test/samples/preset_demo.json'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getCity: vi.fn(),
  getDemoPreset: vi.fn(),
  compare: vi.fn(),
}))

const okResult = ok as unknown as ComparisonResult
const invalidResult = invalid as unknown as ComparisonResult
const noHotelResult = noHotel as unknown as ComparisonResult
const demo = preset as unknown as DemoPreset

const compareMock = vi.mocked(client.compare)

/** A compare() call the test settles by hand. */
function deferred() {
  let resolve!: (r: ComparisonResult) => void
  const promise = new Promise<ComparisonResult>((res) => (resolve = res))
  return { promise, resolve }
}

function lastRequest(): CompareRequest {
  return compareMock.mock.calls.at(-1)![0]
}

async function loaded() {
  const hook = renderHook(() => useComparator())
  await act(() => hook.result.current.loadDemo())
  return hook
}

beforeEach(() => {
  vi.mocked(client.getCity).mockResolvedValue(city as never)
  vi.mocked(client.getDemoPreset).mockResolvedValue(demo)
  compareMock.mockReset().mockResolvedValue(okResult)
})

describe('loadDemo', () => {
  it('starts idle and empty', () => {
    const { result } = renderHook(() => useComparator())
    expect(result.current).toMatchObject({
      loaded: false,
      phase: 'idle',
      result: null,
      inspectedHotelId: null,
      isStale: false,
    })
  })

  it('loads city and preset, fills inputs, runs compare, inspects the default hotel', async () => {
    const { result } = await loaded()
    const s = result.current
    expect(s.loaded).toBe(true)
    expect(s.phase).toBe('ready')
    expect(s.city?.city_id).toBe('surmapur')
    expect(s.selection).toStrictEqual({
      hotel_ids: demo.hotel_ids,
      place_ids: demo.place_ids,
    })
    expect(s.inputs.budgetText).toBe(String(demo.budget))
    expect(s.inputs.importanceTexts.CLOCK).toBe(String(demo.importances.CLOCK))
    expect(s.result).toStrictEqual(okResult)
    expect(s.inspectedHotelId).toBe(okResult.default_inspected_hotel_id)
    expect(lastRequest()).toStrictEqual({
      city_id: demo.city_id,
      hotel_ids: demo.hotel_ids,
      place_ids: demo.place_ids,
      importances: demo.importances,
      budget: demo.budget,
    })
  })

  it('uses the API default inspected hotel when nothing is recommended', async () => {
    compareMock.mockResolvedValue(noHotelResult)
    const { result } = await loaded()
    expect(result.current.inspectedHotelId).toBe('H_CIVIL')
    expect(result.current.inspectedHotelId).toBe(noHotelResult.default_inspected_hotel_id)
  })

  it('leaves no inspected hotel when the first result is INVALID', async () => {
    compareMock.mockResolvedValue(invalidResult)
    const { result } = await loaded()
    expect(result.current.inspectedHotelId).toBeNull()
  })

  it('sets phase error and loaded false when the catalog request fails', async () => {
    vi.mocked(client.getCity).mockRejectedValue(new client.ApiError('Server is down'))
    const { result } = await loaded()
    expect(result.current.phase).toBe('error')
    expect(result.current.error).toBe('Server is down')
    expect(result.current.loaded).toBe(false)
  })
})

describe('editing inputs', () => {
  it.each([
    ['-5', -5],
    ['12.5', 12.5],
    ['abc', 'abc'],
    ['', null],
  ])('sends the raw wire value for budget text %j', async (text, wire) => {
    const { result } = await loaded()
    await act(async () => result.current.setBudgetText(text))
    expect(result.current.inputs.budgetText).toBe(text)
    expect(lastRequest().budget).toStrictEqual(wire)
  })

  it('sends the raw wire value for an importance edit and leaves the others', async () => {
    const { result } = await loaded()
    await act(async () => result.current.setImportanceText('CLOCK', '6'))
    expect(result.current.inputs.importanceTexts.CLOCK).toBe('6')
    expect(lastRequest().importances.CLOCK).toBe(6)
    expect(lastRequest().importances.MUSEUM).toBe(demo.importances.MUSEUM)
  })

  it('clears the visible result on INVALID but keeps the typed text', async () => {
    const { result } = await loaded()
    compareMock.mockResolvedValue(invalidResult)
    await act(async () => result.current.setBudgetText('-5'))
    expect(result.current.phase).toBe('ready')
    expect(result.current.result?.status).toBe('INVALID')
    expect(result.current.result?.hotels).toStrictEqual([])
    expect(result.current.result?.recommended_hotel_id).toBeNull()
    expect(result.current.inputs.budgetText).toBe('-5')
  })

  it('keeps the inspected hotel when the recommendation changes', async () => {
    const { result } = await loaded()
    act(() => result.current.inspectHotel('H_HAVELI'))
    compareMock.mockResolvedValue({ ...okResult, recommended_hotel_id: 'H_CIVIL' })
    await act(async () => result.current.setBudgetText('40000'))
    expect(result.current.inspectedHotelId).toBe('H_HAVELI')
  })

  it('sets phase error, clears the result and keeps inputs when compare fails', async () => {
    const { result } = await loaded()
    compareMock.mockRejectedValue(new client.ApiError('Server is down'))
    await act(async () => result.current.setBudgetText('123'))
    expect(result.current.phase).toBe('error')
    expect(result.current.error).toBe('Server is down')
    expect(result.current.result).toBeNull()
    expect(result.current.inputs.budgetText).toBe('123')
  })
})

describe('request sequencing', () => {
  it('ignores a stale response that arrives last and aborts the older call', async () => {
    const { result } = await loaded()
    const slow = deferred()
    const fast = deferred()
    compareMock
      .mockReset()
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise)

    act(() => result.current.setBudgetText('111'))
    act(() => result.current.setBudgetText('222'))

    expect(compareMock.mock.calls[0][1]?.aborted).toBe(true)
    expect(compareMock.mock.calls[1][1]?.aborted).toBe(false)

    await act(async () => fast.resolve({ ...okResult, budget: 222 }))
    await act(async () => slow.resolve({ ...okResult, budget: 111 }))

    expect(result.current.result?.budget).toBe(222)
    expect(result.current.phase).toBe('ready')
  })

  it('ignores an aborted older call that rejects after the newer one resolved', async () => {
    const { result } = await loaded()
    let rejectSlow!: (e: unknown) => void
    const slow = new Promise<ComparisonResult>((_, rej) => (rejectSlow = rej))
    const fast = deferred()
    compareMock.mockReset().mockReturnValueOnce(slow).mockReturnValueOnce(fast.promise)

    act(() => result.current.setBudgetText('111'))
    act(() => result.current.setBudgetText('222'))
    await act(async () => fast.resolve({ ...okResult, budget: 222 }))
    await act(async () => rejectSlow(new DOMException('aborted', 'AbortError')))

    expect(result.current.phase).toBe('ready')
    expect(result.current.error).toBeNull()
    expect(result.current.result?.budget).toBe(222)
  })
})

describe('isStale', () => {
  it('is true while a recompute is in flight and the previous result is still shown', async () => {
    const { result } = await loaded()
    const pending = deferred()
    compareMock.mockReset().mockReturnValueOnce(pending.promise)

    act(() => result.current.setBudgetText('500'))
    expect(result.current.phase).toBe('loading')
    expect(result.current.result).toStrictEqual(okResult)
    expect(result.current.isStale).toBe(true)

    await act(async () => pending.resolve(okResult))
    expect(result.current.isStale).toBe(false)
  })

  it('is false while loading with no previous result', async () => {
    const pending = deferred()
    compareMock.mockReset().mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useComparator())
    act(() => void result.current.loadDemo())
    await waitFor(() => expect(compareMock).toHaveBeenCalled())
    expect(result.current.phase).toBe('loading')
    expect(result.current.result).toBeNull()
    expect(result.current.isStale).toBe(false)
    await act(async () => pending.resolve(okResult))
  })
})

describe('inspectHotel and reset', () => {
  it('inspectHotel changes only inspectedHotelId and never calls compare', async () => {
    const { result } = await loaded()
    const before = result.current
    compareMock.mockClear()
    act(() => result.current.inspectHotel('H_MAHAL'))
    expect(compareMock).not.toHaveBeenCalled()
    expect(result.current.inspectedHotelId).toBe('H_MAHAL')
    expect(result.current.result).toBe(before.result)
    expect(result.current.inputs).toBe(before.inputs)
  })

  it('reset restores preset inputs, reruns compare and the default inspected hotel', async () => {
    const { result } = await loaded()
    await act(async () => result.current.setBudgetText('1'))
    await act(async () => result.current.setImportanceText('CLOCK', '1'))
    act(() => result.current.inspectHotel('H_MAHAL'))

    compareMock.mockClear().mockResolvedValue(okResult)
    await act(async () => result.current.reset())

    expect(result.current.inputs.budgetText).toBe(String(demo.budget))
    expect(result.current.inputs.importanceTexts.CLOCK).toBe(
      String(demo.importances.CLOCK),
    )
    expect(compareMock).toHaveBeenCalledTimes(1)
    expect(lastRequest().budget).toBe(demo.budget)
    expect(result.current.inspectedHotelId).toBe(okResult.default_inspected_hotel_id)
    expect(result.current.phase).toBe('ready')
  })
})
