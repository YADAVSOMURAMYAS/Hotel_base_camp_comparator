import type { HotelLabel, HotelResult, PlaceType } from '../types/contracts'
import { formatRupees } from './currency'

// The one place for status and place-type wording. Status is always symbol + text, never
// colour alone. Everything is chosen from API values; nothing is computed here.

export const STATUS_SYMBOL: Record<HotelLabel, string> = {
  RECOMMENDED: '★',
  RANKED: '✓',
  OVER_BUDGET: '✕',
}

export const STATUS_TEXT: Record<HotelLabel, string> = {
  RECOMMENDED: 'Recommended',
  RANKED: 'Within budget',
  OVER_BUDGET: 'Over budget',
}

/** "★ Recommended", "✓ Within budget", "✕ Over budget". */
export function statusLabel(label: HotelLabel): string {
  return `${STATUS_SYMBOL[label]} ${STATUS_TEXT[label]}`
}

/** Full wording for the explanation header. */
export function statusLong(hotel: HotelResult): string {
  if (hotel.label === 'RANKED') return `✓ Within budget, rank #${hotel.rank}`
  return statusLabel(hotel.label)
}

/** Short wording for a table cell. */
export function statusShort(hotel: HotelResult): string {
  if (hotel.label === 'RANKED') return `✓ #${hotel.rank}`
  return statusLabel(hotel.label)
}

/** "Over budget by ₹1,500"; a missing shortfall shows as a dash. */
export function overBudgetBy(shortfall: number | null): string {
  return `Over budget by ${shortfall === null ? '–' : formatRupees(shortfall)}`
}

export const TYPE_SYMBOL: Record<PlaceType, string> = { attraction: '◆', food: '●' }
export const TYPE_TEXT: Record<PlaceType, string> = {
  attraction: 'Attraction',
  food: 'Food',
}

/** "◆ Attraction" or "● Food". */
export function typeChip(type: PlaceType): string {
  return `${TYPE_SYMBOL[type]} ${TYPE_TEXT[type]}`
}
