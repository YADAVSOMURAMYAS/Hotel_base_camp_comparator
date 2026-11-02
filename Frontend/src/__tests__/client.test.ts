import { ApiError, compare, getCity, getDemoPreset, isAbortError } from '../api/client'
import type { CompareRequest } from '../types/contracts'
import city from '../test/samples/city_surmapur.json'
import invalid from '../test/samples/compare_invalid.json'
import noHotel from '../test/samples/compare_no_affordable_hotel.json'
import ok from '../test/samples/compare_ok.json'
import preset from '../test/samples/preset_demo.json'

const request: CompareRequest = {
  city_id: 'surmapur',
  hotel_ids: ['H_GARDEN', 'H_CIVIL'],
  place_ids: ['CLOCK'],
  importances: { CLOCK: 5 },
  budget: 30000,
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('compare', () => {
  it.each([
    ['OK', ok],
    ['NO_AFFORDABLE_HOTEL', noHotel],
    ['INVALID', invalid],
  ])('returns a %s result as a normal 200 body', async (status, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body))
    const result = await compare(request)
    expect(result.status).toBe(status)
    expect(result).toStrictEqual(body)
  })

  it('POSTs the raw request as JSON to /api/compare', async () => {
    fetchMock.mockResolvedValue(jsonResponse(ok))
    const controller = new AbortController()
    await compare(request, controller.signal)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/compare')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toStrictEqual(request)
    expect(init.signal).toBe(controller.signal)
  })

  it('throws ApiError with a readable message on non-2xx', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Unknown city 'x'" }, 404))
    const error = await compare(request).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toContain("Unknown city 'x'")
  })

  it('throws ApiError on a non-JSON error body', async () => {
    fetchMock.mockResolvedValue(new Response('<html>boom</html>', { status: 500 }))
    await expect(compare(request)).rejects.toBeInstanceOf(ApiError)
  })

  it('throws ApiError when the network fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = await compare(request).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toMatch(/reach the server/i)
  })

  it('throws a recognisable AbortError when aborted', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))
    const error = await compare(request).catch((e: unknown) => e)
    expect(isAbortError(error)).toBe(true)
    expect(error).not.toBeInstanceOf(ApiError)
  })
})

describe('catalog endpoints', () => {
  it('getCity GETs /api/cities/{id}', async () => {
    fetchMock.mockResolvedValue(jsonResponse(city))
    expect(await getCity('surmapur')).toStrictEqual(city)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/cities/surmapur')
  })

  it('getDemoPreset GETs the demo preset', async () => {
    fetchMock.mockResolvedValue(jsonResponse(preset))
    expect(await getDemoPreset('surmapur')).toStrictEqual(preset)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/cities/surmapur/presets/demo')
  })
})
