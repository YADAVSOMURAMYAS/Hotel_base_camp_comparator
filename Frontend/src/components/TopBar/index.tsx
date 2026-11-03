import type { ReactNode } from 'react'
import { useTheme } from '../../state/useTheme'
import './TopBar.css'

/** Sticky slim bar: logo and name on the left, `children` (step indicator, Edit) in the middle/right, theme toggle last. */
export default function TopBar({ children }: { children?: ReactNode }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <header className="topbar">
      <h1 className="topbar-brand">
        <span className="topbar-logo" aria-hidden="true" />
        <span className="topbar-name">Hotel Base-Camp Comparator</span>
      </h1>
      <div className="topbar-slot">{children}</div>
      <button
        type="button"
        className="topbar-theme"
        aria-pressed={theme === 'dark'}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? 'Light' : 'Dark'} mode
      </button>
    </header>
  )
}
