import type { RawValue } from '../types/contracts'

const INTEGER = /^-?\d+$/
const DECIMAL = /^-?\d+\.\d+$/

/**
 * What the UI sends for a typed number. It only forwards raw input; the backend decides
 * validity. Anything that is not a plain number goes out as the original string.
 */
export function toWireValue(text: string): RawValue {
  const trimmed = text.trim()
  if (trimmed === '') return null
  if (INTEGER.test(trimmed)) {
    const n = Number(trimmed)
    return Number.isSafeInteger(n) ? n : text
  }
  if (DECIMAL.test(trimmed)) {
    const n = Number(trimmed)
    // JSON turns Infinity into null, which would hide the bad input from the backend.
    return Number.isFinite(n) ? n : text
  }
  return text
}
