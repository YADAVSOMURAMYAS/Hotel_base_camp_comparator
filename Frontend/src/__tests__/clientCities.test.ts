import { getCities } from '../api/client'
import cities from '../test/samples/cities_list.json'

afterEach(() => vi.unstubAllGlobals())

describe('getCities', () => {
  it('GETs /api/cities and returns the list inside "cities"', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(cities), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const list = await getCities()
    expect(fetchMock).toHaveBeenCalledWith('/api/cities', { signal: undefined })
    expect(list).toEqual(cities.cities)
    expect(list.map((c) => c.city_id)).toEqual(['shikharpur', 'surmapur'])
  })
})
