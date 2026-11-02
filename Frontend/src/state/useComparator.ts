import { useCallback, useRef, useState } from 'react'
import * as client from '../api/client'
import type {
  City,
  CompareRequest,
  ComparisonResult,
  DemoPreset,
} from '../types/contracts'
import { toWireValue } from '../utils/wireValue'

// Phase A has a single city; the city list endpoint arrives in Phase B (T15).
const DEMO_CITY_ID = 'surmapur'

export type Phase = 'idle' | 'loading' | 'ready' | 'error'

export interface Inputs {
  budgetText: string
  importanceTexts: Record<string, string>
}

export interface Selection {
  hotel_ids: string[]
  place_ids: string[]
}

function inputsFromPreset(preset: DemoPreset): Inputs {
  return {
    budgetText: String(preset.budget),
    importanceTexts: Object.fromEntries(
      Object.entries(preset.importances).map(([id, value]) => [id, String(value)]),
    ),
  }
}

function buildRequest(
  cityId: string,
  selection: Selection,
  inputs: Inputs,
): CompareRequest {
  return {
    city_id: cityId,
    hotel_ids: selection.hotel_ids,
    place_ids: selection.place_ids,
    importances: Object.fromEntries(
      selection.place_ids.map((id) => [
        id,
        toWireValue(inputs.importanceTexts[id] ?? ''),
      ]),
    ),
    budget: toWireValue(inputs.budgetText),
  }
}

function messageOf(error: unknown): string {
  return error instanceof client.ApiError ? error.message : 'Something went wrong.'
}

/** The only place that holds comparison state. All numbers come from the API as given. */
export function useComparator() {
  const [loaded, setLoaded] = useState(false)
  const [city, setCity] = useState<City | null>(null)
  const [preset, setPreset] = useState<DemoPreset | null>(null)
  const [inputs, setInputs] = useState<Inputs>({ budgetText: '', importanceTexts: {} })
  const [selection, setSelection] = useState<Selection>({ hotel_ids: [], place_ids: [] })
  const [inspectedHotelId, setInspectedHotelId] = useState<string | null>(null)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  // Latest values for actions that must build a request without waiting for a re-render.
  const presetRef = useRef<DemoPreset | null>(null)
  const inputsRef = useRef(inputs)
  const selectionRef = useRef(selection)

  // Request sequencing: only the newest compare may touch state.
  const seqRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)

  const runCompare = useCallback(
    async (
      cityId: string,
      sel: Selection,
      inp: Inputs,
    ): Promise<ComparisonResult | null> => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const seq = ++seqRef.current
      setPhase('loading')
      setError(null)
      try {
        const next = await client.compare(
          buildRequest(cityId, sel, inp),
          controller.signal,
        )
        if (seq !== seqRef.current) return null
        setResult(next)
        setPhase('ready')
        return next
      } catch (e) {
        if (seq !== seqRef.current || client.isAbortError(e)) return null
        setResult(null)
        setError(messageOf(e))
        setPhase('error')
        return null
      }
    },
    [],
  )

  const applyPreset = useCallback(
    async (p: DemoPreset) => {
      const nextInputs = inputsFromPreset(p)
      const nextSelection = { hotel_ids: p.hotel_ids, place_ids: p.place_ids }
      inputsRef.current = nextInputs
      selectionRef.current = nextSelection
      setInputs(nextInputs)
      setSelection(nextSelection)
      const next = await runCompare(p.city_id, nextSelection, nextInputs)
      // The backend picks the default; the frontend never decides it.
      if (next) setInspectedHotelId(next.default_inspected_hotel_id)
    },
    [runCompare],
  )

  const loadDemo = useCallback(async () => {
    setPhase('loading')
    setError(null)
    try {
      const [nextCity, nextPreset] = await Promise.all([
        client.getCity(DEMO_CITY_ID),
        client.getDemoPreset(DEMO_CITY_ID),
      ])
      presetRef.current = nextPreset
      setCity(nextCity)
      setPreset(nextPreset)
      setLoaded(true)
      await applyPreset(nextPreset)
    } catch (e) {
      setError(messageOf(e))
      setPhase('error')
    }
  }, [applyPreset])

  const edit = useCallback(
    (next: Inputs) => {
      inputsRef.current = next
      setInputs(next)
      if (presetRef.current)
        void runCompare(presetRef.current.city_id, selectionRef.current, next)
    },
    [runCompare],
  )

  const setBudgetText = useCallback(
    (text: string) => edit({ ...inputsRef.current, budgetText: text }),
    [edit],
  )

  const setImportanceText = useCallback(
    (placeId: string, text: string) =>
      edit({
        ...inputsRef.current,
        importanceTexts: { ...inputsRef.current.importanceTexts, [placeId]: text },
      }),
    [edit],
  )

  // Inspection is a view choice: it never calls the API.
  const inspectHotel = useCallback((id: string) => setInspectedHotelId(id), [])

  const reset = useCallback(async () => {
    if (presetRef.current) await applyPreset(presetRef.current)
  }, [applyPreset])

  return {
    loaded,
    city,
    preset,
    inputs,
    selection,
    inspectedHotelId,
    result,
    phase,
    error,
    isStale: phase === 'loading' && result !== null,
    loadDemo,
    setBudgetText,
    setImportanceText,
    inspectHotel,
    reset,
  }
}

export type Comparator = ReturnType<typeof useComparator>
