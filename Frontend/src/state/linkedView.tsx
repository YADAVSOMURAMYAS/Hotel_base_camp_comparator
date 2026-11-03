import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/** A hotel under the pointer or keyboard focus, and which side it came from. */
export interface Hover {
  id: string
  source: 'map' | 'card'
}

/** View-only state the map and the ranked cards share. It never touches a comparison result. */
export interface LinkedView {
  hover: Hover | null
  setHover: (hover: Hover | null) => void
  /** A card the user folded shut; clicking its marker unfolds it again. */
  collapsedId: string | null
  setCollapsedId: (id: string | null) => void
}

function useLinkedState(): LinkedView {
  const [hover, setHover] = useState<Hover | null>(null)
  const [collapsedId, setCollapsedId] = useState<string | null>(null)
  return useMemo(
    () => ({ hover, setHover, collapsedId, setCollapsedId }),
    [hover, collapsedId],
  )
}

const LinkedViewContext = createContext<LinkedView | null>(null)

export function LinkedViewProvider({ children }: { children: ReactNode }) {
  return <LinkedViewContext value={useLinkedState()}>{children}</LinkedViewContext>
}

/**
 * The shared instance when a provider is above (Results), otherwise a private one, so the
 * map and the cards also work on their own (Plan screen, tests).
 */
// Provider and hook stay together, like ComparatorContext.
// oxlint-disable-next-line react/only-export-components
export function useLinkedView(): LinkedView {
  const shared = useContext(LinkedViewContext)
  const own = useLinkedState()
  return shared ?? own
}
