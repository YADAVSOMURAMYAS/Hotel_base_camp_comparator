import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import './ui.css'

/** Read-only chip (summary bar). */
export function Chip({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} className={['chip', className].filter(Boolean).join(' ')} />
}

/** Toggle chip with a checkmark when selected (hotel and place pickers). */
export function ChipToggle({
  pressed,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean }) {
  return (
    <button type="button" {...rest} className="chip" aria-pressed={pressed}>
      {pressed && <span aria-hidden="true">✓</span>}
      {children}
    </button>
  )
}
