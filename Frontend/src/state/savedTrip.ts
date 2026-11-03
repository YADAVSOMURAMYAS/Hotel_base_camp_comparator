import type { Inputs, Selection } from './useComparator'
import { readJson, removeKey, writeJson } from './storage'

const KEY = 'hbc.trip'

/** What survives a reload: the user's choices only, never a result (the API recomputes it). */
export interface SavedTrip {
  cityId: string
  selection: Selection
  inputs: Inputs
  budgetTouched: boolean
}

const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

const isTexts = (v: unknown): v is Record<string, string> =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.values(v).every((x) => typeof x === 'string')

export function saveTrip(trip: SavedTrip): void {
  writeJson(KEY, trip)
}

export function clearSavedTrip(): void {
  removeKey(KEY)
}

/** The saved trip, or null when nothing usable is stored. */
export function loadSavedTrip(): SavedTrip | null {
  const raw = readJson(KEY) as Partial<SavedTrip> | null
  if (!raw || typeof raw.cityId !== 'string' || raw.cityId === '') return null
  const { selection, inputs } = raw
  if (
    !selection ||
    !isStrings(selection.hotel_ids) ||
    !isStrings(selection.place_ids) ||
    !inputs ||
    typeof inputs.budgetText !== 'string' ||
    !isTexts(inputs.importanceTexts)
  ) {
    return null
  }
  return {
    cityId: raw.cityId,
    selection: { hotel_ids: selection.hotel_ids, place_ids: selection.place_ids },
    inputs: { budgetText: inputs.budgetText, importanceTexts: inputs.importanceTexts },
    budgetTouched: raw.budgetTouched === true,
  }
}
