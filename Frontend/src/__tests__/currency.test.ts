import { formatRupees } from '../utils/currency'

describe('formatRupees', () => {
  it.each([
    [0, '₹0'],
    [999, '₹999'],
    [1000, '₹1,000'],
    [36500, '₹36,500'],
    [125000, '₹1,25,000'],
    [1000000, '₹10,00,000'],
    [10000000, '₹1,00,00,000'],
    [-1500, '-₹1,500'],
  ])('formats %i as %s', (n, expected) => {
    expect(formatRupees(n)).toBe(expected)
  })

  it('treats negative zero as zero', () => {
    expect(formatRupees(-0)).toBe('₹0')
  })

  it.each([1.5, NaN, Infinity, -Infinity])('throws for %s', (n) => {
    expect(() => formatRupees(n)).toThrow(/integer/i)
  })
})
