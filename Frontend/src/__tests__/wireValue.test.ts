import { toWireValue } from '../utils/wireValue'

describe('toWireValue', () => {
  it.each([
    ['12', 12],
    [' 12 ', 12],
    ['-5', -5],
    ['0', 0],
    ['12.5', 12.5],
    ['', null],
    ['   ', null],
    ['abc', 'abc'],
    ['1e3', '1e3'],
    ['12abc', '12abc'],
    ['99999999999999999999', '99999999999999999999'],
  ])('maps %j to %j', (text, expected) => {
    expect(toWireValue(text)).toStrictEqual(expected)
  })
})
