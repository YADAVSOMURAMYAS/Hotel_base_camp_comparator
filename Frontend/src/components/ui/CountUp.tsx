import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 800

const reducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** The number as text with the same decimals as `value` (so "28.0" counts 0.0, 5.6 ... 28.0). */
function atFraction(value: string, fraction: number): string {
  const decimals = value.includes('.') ? value.split('.')[1].length : 0
  return (parseFloat(value) * fraction).toFixed(decimals)
}

const canCount = (value: string) => /^\d+(\.\d+)?$/.test(value)

/**
 * Shows an API number. The first time it appears it counts up from zero, then it is exactly
 * the string the API gave (the animation never rounds or changes the final value). With
 * reduced motion, or when the value later changes, it simply shows the value.
 */
export default function CountUp({ value }: { value: string }) {
  const [shown, setShown] = useState(() =>
    reducedMotion() || !canCount(value) ? value : atFraction(value, 0),
  )
  const first = useRef(true)

  useEffect(() => {
    const animate = first.current && !reducedMotion() && canCount(value)
    first.current = false
    let frame = 0
    if (!animate) {
      frame = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(frame)
    }
    let t0: number | null = null
    const step = (now: number) => {
      t0 ??= now
      const t = Math.min(1, (now - t0) / DURATION_MS)
      setShown(t === 1 ? value : atFraction(value, easeOut(t)))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <>{shown}</>
}
