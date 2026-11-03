import { loadSavedTrip, saveTrip } from '../state/savedTrip'

const trip = {
  cityId: 'surmapur',
  selection: { hotel_ids: ['H_A', 'H_B'], place_ids: ['P_1', 'P_2', 'P_3'] },
  inputs: { budgetText: '30000', importanceTexts: { P_1: '3', P_2: '', P_3: '5' } },
  budgetTouched: true,
}

describe('saved trip', () => {
  it('round-trips the user choices exactly, including blank importance text', () => {
    saveTrip(trip)
    expect(loadSavedTrip()).toEqual(trip)
  })

  it('returns null when nothing is stored', () => {
    expect(loadSavedTrip()).toBeNull()
  })

  it('returns null for junk JSON or the wrong shape', () => {
    localStorage.setItem('hbc.trip', '{not json')
    expect(loadSavedTrip()).toBeNull()
    localStorage.setItem('hbc.trip', JSON.stringify({ cityId: 'x', selection: 5 }))
    expect(loadSavedTrip()).toBeNull()
    localStorage.setItem(
      'hbc.trip',
      JSON.stringify({ ...trip, inputs: { budgetText: 1, importanceTexts: {} } }),
    )
    expect(loadSavedTrip()).toBeNull()
  })

  it('survives blocked storage', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => saveTrip(trip)).not.toThrow()
    spy.mockRestore()
  })
})
