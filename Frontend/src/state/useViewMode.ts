import { useCallback, useState } from 'react'
import { readJson, writeJson } from './storage'

export type ViewMode = 'plan' | 'results'

const KEY = 'hbc.view'

function savedMode(): ViewMode {
  return readJson(KEY) === 'results' ? 'results' : 'plan'
}

/**
 * Which screen is showing, and whether the Edit drawer is open over Results.
 * Pure view state: the trip itself lives in useComparator, so switching never loses data.
 */
export function useViewMode() {
  const [mode, setModeState] = useState<ViewMode>(savedMode)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const setMode = useCallback((next: ViewMode) => {
    setModeState(next)
    setDrawerOpen(false)
    writeJson(KEY, next)
  }, [])

  return {
    mode,
    drawerOpen,
    showPlan: useCallback(() => setMode('plan'), [setMode]),
    showResults: useCallback(() => setMode('results'), [setMode]),
    openDrawer: useCallback(() => setDrawerOpen(true), []),
    closeDrawer: useCallback(() => setDrawerOpen(false), []),
  }
}

export type ViewState = ReturnType<typeof useViewMode>
