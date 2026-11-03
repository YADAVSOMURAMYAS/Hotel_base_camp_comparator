import { act, renderHook } from '@testing-library/react'
import { useViewMode } from '../state/useViewMode'

describe('useViewMode', () => {
  it('starts on the plan screen with the drawer closed', () => {
    const { result } = renderHook(() => useViewMode())
    expect(result.current.mode).toBe('plan')
    expect(result.current.drawerOpen).toBe(false)
  })

  it('switches screens and closes the drawer when it does', () => {
    const { result } = renderHook(() => useViewMode())
    act(() => result.current.showResults())
    act(() => result.current.openDrawer())
    expect(result.current.mode).toBe('results')
    expect(result.current.drawerOpen).toBe(true)
    act(() => result.current.showPlan())
    expect(result.current.mode).toBe('plan')
    expect(result.current.drawerOpen).toBe(false)
  })

  it('remembers the screen across a reload', () => {
    const first = renderHook(() => useViewMode())
    act(() => first.result.current.showResults())
    first.unmount()
    const second = renderHook(() => useViewMode())
    expect(second.result.current.mode).toBe('results')
  })

  it('ignores a junk saved value', () => {
    localStorage.setItem('hbc.view', JSON.stringify('nonsense'))
    const { result } = renderHook(() => useViewMode())
    expect(result.current.mode).toBe('plan')
  })
})
