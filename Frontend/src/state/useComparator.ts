import { useCallback, useEffect, useRef, useState } from 'react'
import * as client from '../api/client'
import type {
  City,
  CitySummary,
  CompareRequest,
  ComparisonResult,
  DemoPreset,
} from '../types/contracts'
import { clearSavedTrip, loadSavedTrip, saveTrip, type SavedTrip } from './savedTrip'
import { MAX_HOTELS, MAX_PLACES, MIN_HOTELS, MIN_PLACES } from '../utils/selectionLimits'
import { toWireValue } from '../utils/wireValue'

// Used only when the city list could not be loaded; normally the list says which city owns the preset.
const FALLBACK_DEMO_CITY_ID = 'surmapur'

export type Phase = 'idle' | 'loading' | 'ready' | 'error'

export interface Inputs {
  budgetText: string
  importanceTexts: Record<string, string>
}

export interface Selection {
  hotel_ids: string[]
  place_ids: string[]
}

const NO_SELECTION: Selection = { hotel_ids: [], place_ids: [] }
const NO_INPUTS: Inputs = { budgetText: '', importanceTexts: {} }

/**
 * UI guidance only: counts and what is missing. The backend decides whether values are valid.
 * A budget counts as missing only while it has never been entered; once the user typed
 * something (even if they cleared it again) the text goes to the backend to be judged.
 */
export function readinessOf(
  selection: Selection,
  budgetText: string,
  budgetTouched: boolean,
) {
  const hotelCount = selection.hotel_ids.length
  const placeCount = selection.place_ids.length
  const budgetMissing = budgetText.trim() === '' && !budgetTouched
  const countsInRange =
    hotelCount >= MIN_HOTELS &&
    hotelCount <= MAX_HOTELS &&
    placeCount >= MIN_PLACES &&
    placeCount <= MAX_PLACES
  return {
    hotelCount,
    placeCount,
    hotelsNeeded: Math.max(0, MIN_HOTELS - hotelCount),
    placesNeeded: Math.max(0, MIN_PLACES - placeCount),
    budgetMissing,
    canCompare: countsInRange && !budgetMissing,
  }
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

/** Catalog IDs that are chosen, in catalog order (not click order). */
function inCatalogOrder(catalog: { id: string }[], chosen: string[], toggled: string) {
  const adding = !chosen.includes(toggled)
  return catalog
    .map((item) => item.id)
    .filter((id) => (id === toggled ? adding : chosen.includes(id)))
}

/** The only place that holds comparison state. All numbers come from the API as given. */
export function useComparator() {
  const [loaded, setLoaded] = useState(false)
  const [cities, setCities] = useState<CitySummary[]>([])
  const [citiesError, setCitiesError] = useState<string | null>(null)
  const [city, setCity] = useState<City | null>(null)
  const [preset, setPreset] = useState<DemoPreset | null>(null)
  const [inputs, setInputs] = useState<Inputs>(NO_INPUTS)
  const [selection, setSelection] = useState<Selection>(NO_SELECTION)
  const [inspectedHotelId, setInspectedHotelId] = useState<string | null>(null)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  // A saved trip is restored on mount, so the first render is already 'loading'.
  const [phase, setPhase] = useState<Phase>(() => (loadSavedTrip() ? 'loading' : 'idle'))
  const [error, setError] = useState<string | null>(null)
  const [budgetTouched, setBudgetTouched] = useState(false)

  // Latest values for actions that must build a request without waiting for a re-render.
  const citiesRef = useRef<CitySummary[]>([])
  const cityRef = useRef<City | null>(null)
  const presetRef = useRef<DemoPreset | null>(null)
  const inputsRef = useRef(inputs)
  const selectionRef = useRef(selection)
  const inspectedRef = useRef<string | null>(null)
  const budgetTouchedRef = useRef(false)

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

  const touchBudget = useCallback((touched: boolean) => {
    budgetTouchedRef.current = touched
    setBudgetTouched(touched)
  }, [])

  const setInspected = useCallback((id: string | null) => {
    inspectedRef.current = id
    setInspectedHotelId(id)
  }, [])

  /** Cancels whatever is in flight so a late response cannot overwrite newer state. */
  const dropPending = useCallback(() => {
    controllerRef.current?.abort()
    seqRef.current += 1
  }, [])

  /** Calls the backend only with the minimums and a budget present; otherwise there is no result. */
  const maybeCompare = useCallback(
    async (cityId: string, sel: Selection, inp: Inputs) => {
      if (!readinessOf(sel, inp.budgetText, budgetTouchedRef.current).canCompare) {
        dropPending()
        setResult(null)
        setError(null)
        setPhase('ready')
        return
      }
      const next = await runCompare(cityId, sel, inp)
      // Inspection follows the user; it moves only when the inspected hotel left the selection.
      const current = inspectedRef.current
      if (next && (current === null || !sel.hotel_ids.includes(current))) {
        setInspected(next.default_inspected_hotel_id)
      }
    },
    [dropPending, runCompare, setInspected],
  )

  const changeSelection = useCallback(
    (nextSelection: Selection, nextInputs: Inputs) => {
      selectionRef.current = nextSelection
      inputsRef.current = nextInputs
      setSelection(nextSelection)
      setInputs(nextInputs)
      const cityId = cityRef.current?.city_id
      if (cityId) void maybeCompare(cityId, nextSelection, nextInputs)
    },
    [maybeCompare],
  )

  const showCity = useCallback((nextCity: City, nextPreset: DemoPreset | null) => {
    cityRef.current = nextCity
    presetRef.current = nextPreset
    setCity(nextCity)
    setPreset(nextPreset)
    setLoaded(true)
  }, [])

  const applyPreset = useCallback(
    async (p: DemoPreset) => {
      const nextInputs = inputsFromPreset(p)
      const nextSelection = { hotel_ids: p.hotel_ids, place_ids: p.place_ids }
      inputsRef.current = nextInputs
      selectionRef.current = nextSelection
      touchBudget(true)
      setInputs(nextInputs)
      setSelection(nextSelection)
      const next = await runCompare(p.city_id, nextSelection, nextInputs)
      // The backend picks the default; the frontend never decides it.
      if (next) setInspected(next.default_inspected_hotel_id)
    },
    [runCompare, setInspected, touchBudget],
  )

  /** Empty selection, empty inputs, no result, nothing inspected. */
  const clearAll = useCallback(() => {
    dropPending()
    selectionRef.current = NO_SELECTION
    inputsRef.current = NO_INPUTS
    touchBudget(false)
    setSelection(NO_SELECTION)
    setInputs(NO_INPUTS)
    setResult(null)
    setInspected(null)
    setError(null)
    setPhase('ready')
  }, [dropPending, setInspected, touchBudget])

  const loadDemo = useCallback(async () => {
    dropPending()
    const seq = seqRef.current
    setPhase('loading')
    setError(null)
    try {
      const demoCityId =
        citiesRef.current.find((c) => c.has_demo_preset)?.city_id ?? FALLBACK_DEMO_CITY_ID
      const [nextCity, nextPreset] = await Promise.all([
        client.getCity(demoCityId),
        client.getDemoPreset(demoCityId),
      ])
      if (seq !== seqRef.current) return
      showCity(nextCity, nextPreset)
      await applyPreset(nextPreset)
    } catch (e) {
      if (seq !== seqRef.current) return
      setError(messageOf(e))
      setPhase('error')
    }
  }, [applyPreset, dropPending, showCity])

  const selectCity = useCallback(
    async (cityId: string) => {
      dropPending()
      const seq = seqRef.current
      setPhase('loading')
      setError(null)
      try {
        const ownsPreset = citiesRef.current.find(
          (c) => c.city_id === cityId,
        )?.has_demo_preset
        const [nextCity, nextPreset] = await Promise.all([
          client.getCity(cityId),
          ownsPreset ? client.getDemoPreset(cityId) : Promise.resolve(null),
        ])
        if (seq !== seqRef.current) return
        showCity(nextCity, nextPreset)
        clearAll()
      } catch (e) {
        if (seq !== seqRef.current) return
        setError(messageOf(e))
        setPhase('error')
      }
    },
    [clearAll, dropPending, showCity],
  )

  const edit = useCallback(
    (next: Inputs) => {
      inputsRef.current = next
      setInputs(next)
      const cityId = cityRef.current?.city_id
      if (cityId) void maybeCompare(cityId, selectionRef.current, next)
    },
    [maybeCompare],
  )

  const setBudgetText = useCallback(
    (text: string) => {
      touchBudget(true)
      edit({ ...inputsRef.current, budgetText: text })
    },
    [edit, touchBudget],
  )

  const setImportanceText = useCallback(
    (placeId: string, text: string) =>
      edit({
        ...inputsRef.current,
        importanceTexts: { ...inputsRef.current.importanceTexts, [placeId]: text },
      }),
    [edit],
  )

  const toggleHotel = useCallback(
    (id: string) => {
      const hotel_ids = inCatalogOrder(
        cityRef.current?.hotels ?? [],
        selectionRef.current.hotel_ids,
        id,
      )
      changeSelection({ ...selectionRef.current, hotel_ids }, inputsRef.current)
    },
    [changeSelection],
  )

  const togglePlace = useCallback(
    (id: string) => {
      const catalog = cityRef.current?.places ?? []
      const place_ids = inCatalogOrder(catalog, selectionRef.current.place_ids, id)
      const importanceTexts = { ...inputsRef.current.importanceTexts }
      if (place_ids.includes(id)) {
        const place = catalog.find((p) => p.id === id)
        if (place) importanceTexts[id] = String(place.default_importance)
      } else {
        delete importanceTexts[id]
      }
      changeSelection(
        { ...selectionRef.current, place_ids },
        { ...inputsRef.current, importanceTexts },
      )
    },
    [changeSelection],
  )

  const clearSelection = useCallback(() => {
    setInspected(null)
    changeSelection(NO_SELECTION, { ...inputsRef.current, importanceTexts: {} })
  }, [changeSelection, setInspected])

  // Inspection is a view choice: it never calls the API.
  const inspectHotel = useCallback(
    (id: string | null) => setInspected(id),
    [setInspected],
  )

  const reset = useCallback(async () => {
    if (!cityRef.current) return
    if (presetRef.current) await applyPreset(presetRef.current)
    else clearAll()
  }, [applyPreset, clearAll])

  /** Brings back the trip saved by the last visit; any failure just leaves the empty start screen. */
  const restoreTrip = useCallback(
    async (saved: SavedTrip) => {
      dropPending()
      const seq = seqRef.current
      try {
        const nextCity = await client.getCity(saved.cityId)
        const nextPreset = nextCity.has_demo_preset
          ? await client.getDemoPreset(saved.cityId)
          : null
        if (seq !== seqRef.current) return
        showCity(nextCity, nextPreset)
        selectionRef.current = saved.selection
        inputsRef.current = saved.inputs
        touchBudget(saved.budgetTouched)
        setSelection(saved.selection)
        setInputs(saved.inputs)
        await maybeCompare(saved.cityId, saved.selection, saved.inputs)
      } catch {
        if (seq !== seqRef.current) return
        clearSavedTrip()
        setPhase('idle')
      }
    },
    [dropPending, maybeCompare, showCity, touchBudget],
  )

  useEffect(() => {
    const saved = loadSavedTrip()
    // Started from a promise callback so no state is set synchronously inside the effect.
    if (saved) void Promise.resolve(saved).then(restoreTrip)
  }, [restoreTrip])

  // Remember the choices (never the result) once a city is showing.
  useEffect(() => {
    if (city) {
      saveTrip({ cityId: city.city_id, selection, inputs, budgetTouched })
    }
  }, [city, selection, inputs, budgetTouched])

  useEffect(() => {
    const controller = new AbortController()
    client
      .getCities(controller.signal)
      .then((list) => {
        citiesRef.current = list
        setCities(list)
      })
      .catch((e: unknown) => {
        if (!client.isAbortError(e)) setCitiesError(messageOf(e))
      })
    return () => controller.abort()
  }, [])

  return {
    loaded,
    cities,
    citiesError,
    city,
    preset,
    inputs,
    selection,
    inspectedHotelId,
    result,
    phase,
    error,
    isStale: phase === 'loading' && result !== null,
    readiness: readinessOf(selection, inputs.budgetText, budgetTouched),
    selectCity,
    toggleHotel,
    togglePlace,
    clearSelection,
    loadDemo,
    setBudgetText,
    setImportanceText,
    inspectHotel,
    reset,
  }
}

export type Comparator = ReturnType<typeof useComparator>
