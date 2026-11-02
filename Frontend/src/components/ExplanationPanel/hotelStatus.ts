import type { HotelResult } from '../../types/contracts'

// Status wording from the API label (text + symbol, never colour alone).
// Local to T13; T14 may consolidate it with HotelRanking's labels (see docs/DECISIONS.md).

/** Full wording for the explanation header. */
export function statusLong(hotel: HotelResult): string {
  if (hotel.label === 'RECOMMENDED') return '★ Recommended'
  if (hotel.label === 'RANKED') return `✓ Within budget, rank #${hotel.rank}`
  return '✕ Over budget'
}

/** Short wording for a table cell. */
export function statusShort(hotel: HotelResult): string {
  if (hotel.label === 'RECOMMENDED') return '★ Recommended'
  if (hotel.label === 'RANKED') return `✓ #${hotel.rank}`
  return '✕ Over budget'
}

export const TYPE_SYMBOL = { attraction: '◆', food: '●' } as const
export const TYPE_TEXT = { attraction: 'Attraction', food: 'Food' } as const
