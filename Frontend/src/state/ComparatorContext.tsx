import { createContext, useContext, type ReactNode } from 'react'
import { useComparator, type Comparator } from './useComparator'

const ComparatorContext = createContext<Comparator | null>(null)

export function ComparatorProvider({ children }: { children: ReactNode }) {
  return <ComparatorContext value={useComparator()}>{children}</ComparatorContext>
}

// Provider and its hook stay together so the context object is never exported.
// oxlint-disable-next-line react/only-export-components
export function useComparatorContext(): Comparator {
  const value = useContext(ComparatorContext)
  if (value === null) {
    throw new Error('useComparatorContext must be used inside a ComparatorProvider')
  }
  return value
}
