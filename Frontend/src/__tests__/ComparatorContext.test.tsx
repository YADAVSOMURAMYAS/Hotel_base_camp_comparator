import { renderHook } from '@testing-library/react'
import { useComparatorContext } from '../state/ComparatorContext'

describe('useComparatorContext', () => {
  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useComparatorContext())).toThrow(/ComparatorProvider/)
  })
})
