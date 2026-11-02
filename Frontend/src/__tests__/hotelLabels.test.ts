import type { HotelResult } from '../types/contracts'
import {
  overBudgetBy,
  statusLabel,
  statusLong,
  statusShort,
  typeChip,
} from '../utils/hotelLabels'

const hotel = (label: HotelResult['label'], rank: number | null) =>
  ({ label, rank }) as HotelResult

describe('hotelLabels', () => {
  it('pairs every status with a symbol and text', () => {
    expect(statusLabel('RECOMMENDED')).toBe('★ Recommended')
    expect(statusLabel('RANKED')).toBe('✓ Within budget')
    expect(statusLabel('OVER_BUDGET')).toBe('✕ Over budget')
  })

  it('writes the long and short status from the API label and rank', () => {
    expect(statusLong(hotel('RECOMMENDED', 1))).toBe('★ Recommended')
    expect(statusLong(hotel('RANKED', 3))).toBe('✓ Within budget, rank #3')
    expect(statusLong(hotel('OVER_BUDGET', null))).toBe('✕ Over budget')
    expect(statusShort(hotel('RECOMMENDED', 1))).toBe('★ Recommended')
    expect(statusShort(hotel('RANKED', 3))).toBe('✓ #3')
    expect(statusShort(hotel('OVER_BUDGET', null))).toBe('✕ Over budget')
  })

  it('formats the shortfall with Indian grouping and shows a dash when missing', () => {
    expect(overBudgetBy(1)).toBe('Over budget by ₹1')
    expect(overBudgetBy(125000)).toBe('Over budget by ₹1,25,000')
    expect(overBudgetBy(null)).toBe('Over budget by –')
  })

  it('writes the place-type chip', () => {
    expect(typeChip('attraction')).toBe('◆ Attraction')
    expect(typeChip('food')).toBe('● Food')
  })
})
