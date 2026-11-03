import { useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from 'react'
import './ui.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  /** Shows the small orange arrow square after the label. */
  arrow?: boolean
}

const RIPPLE_MS = 600

/** Black pill (primary) or white bordered pill (secondary), with a ripple where it is pressed. */
export default function PillButton({
  variant = 'primary',
  arrow,
  className,
  children,
  onClick,
  ...rest
}: Props) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const counter = useRef(0)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const id = ++counter.current
    setRipples((all) => [
      ...all,
      { id, x: event.clientX - box.left, y: event.clientY - box.top },
    ])
    setTimeout(() => setRipples((all) => all.filter((r) => r.id !== id)), RIPPLE_MS)
    onClick?.(event)
  }

  const classes = ['pill', variant === 'secondary' && 'pill-secondary', className]
  return (
    <button
      type="button"
      {...rest}
      className={classes.filter(Boolean).join(' ')}
      onClick={handleClick}
    >
      {children}
      {arrow && (
        <span className="pill-arrow" aria-hidden="true">
          →
        </span>
      )}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pill-ripple"
          aria-hidden="true"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </button>
  )
}
