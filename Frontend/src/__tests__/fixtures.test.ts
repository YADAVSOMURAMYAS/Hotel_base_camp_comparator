import {
  fullSurmapurCity,
  sampleCity,
  samplePreset,
  shikharpurCity,
} from '../test/renderWithComparator'

describe('shared test fixtures', () => {
  it('sampleCity is the catalog narrowed to the Demo trip', () => {
    expect(sampleCity.hotels).toHaveLength(10)
    expect(sampleCity.places).toHaveLength(15)
    expect(sampleCity.hotels.map((h) => h.id).sort()).toEqual(
      [...samplePreset.hotel_ids].sort(),
    )
    expect(sampleCity.places.map((p) => p.id).sort()).toEqual(
      [...samplePreset.place_ids].sort(),
    )
  })

  it('fullSurmapurCity and shikharpurCity are the unfiltered 30 x 50 catalogs', () => {
    for (const city of [fullSurmapurCity, shikharpurCity]) {
      expect(city.hotels).toHaveLength(30)
      expect(city.places).toHaveLength(50)
    }
  })
})
