import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import type { Position } from '../../types/contracts'
import {
  blend,
  fitCamera,
  panBy,
  resetCamera,
  viewBoxOf,
  zoomAt,
  type Camera,
  type MapExtent,
  type Size,
} from './camera'
import './MapViewport.css'

const START_SIZE: Size = { w: 1000, h: 600 }
const DRAG_THRESHOLD_PX = 4
const KEY_PAN_PX = 80
const BUTTON_ZOOM = 1.5
const MARKER = '[role="button"], [role="checkbox"]'

const reducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Ask the view to fly to a point; a new `nonce` is a new request. */
export interface FocusRequest {
  x: number
  y: number
  /** Zoom to reach (the view never zooms out to get there). */
  k: number
  nonce: number
}

/** What floating HTML (tooltips, popups) needs to sit on a map point. */
export interface ViewApi {
  toPx: (p: Position) => { x: number; y: number }
  size: Size
}

interface Props {
  map: MapExtent
  /** Marker positions the "Fit all markers" button and the auto-fit bring into view. */
  fitPoints: Position[]
  /** When this changes (a different set of markers), the view animates to fit them again. */
  fitKey: string
  labelledBy: string
  describedBy: string
  /** Floating pieces: top-left (map mode) and bottom-right (legend). */
  topLeft?: ReactNode
  bottomRight?: ReactNode
  /** Taller, full-width hero look used on the Results screen. */
  hero?: boolean
  focus?: FocusRequest | null
  /** A click on empty map (not a marker, button or panel), reported in map units after a double-click could no longer follow. */
  onBackgroundClick?: (point: Position) => void
  /** HTML layered over the map that follows map points, e.g. a tooltip. */
  floating?: (api: ViewApi) => ReactNode
  /** SVG content in map units. */
  children: ReactNode
}

interface Gesture {
  startX: number
  startY: number
  lastX: number
  lastY: number
  lastT: number
  vx: number
  vy: number
  moved: boolean
}

/**
 * Pan and zoom over the schematic map: drag with inertia, wheel and pinch zoom, double-click,
 * right-click, keyboard, and floating buttons. The camera only changes the SVG viewBox.
 */
export default function MapViewport(props: Props) {
  const {
    map,
    fitPoints,
    fitKey,
    labelledBy,
    describedBy,
    topLeft,
    bottomRight,
    hero,
    focus,
    floating,
  } = props
  const hintId = useId()
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size>(START_SIZE)
  const [cam, setCam] = useState<Camera>(() => fitCamera(fitPoints, START_SIZE, map))
  const [dragging, setDragging] = useState(false)
  const [nativeFs, setNativeFs] = useState(false)
  const [pseudoFs, setPseudoFs] = useState(false)

  const camRef = useRef(cam)
  const sizeRef = useRef(size)
  const latest = useRef({ map, fitPoints, onBackgroundClick: props.onBackgroundClick })
  const clickTimer = useRef(0)
  const frame = useRef(0)
  const touched = useRef(false)
  const lastKey = useRef<string | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<Gesture | null>(null)
  const pinchDistance = useRef(0)
  const suppressClick = useRef(false)

  useEffect(() => {
    latest.current = { map, fitPoints, onBackgroundClick: props.onBackgroundClick }
  })

  const apply = useCallback((next: Camera) => {
    camRef.current = next
    setCam(next)
  }, [])

  const stop = useCallback(() => cancelAnimationFrame(frame.current), [])

  const animateTo = useCallback(
    (target: Camera, ms = 450) => {
      stop()
      if (ms === 0 || reducedMotion()) {
        frame.current = requestAnimationFrame(() => apply(target))
        return
      }
      const from = camRef.current
      // Time starts at the first frame, so the clock the browser hands to rAF is all we rely on.
      let t0: number | null = null
      const step = (now: number) => {
        t0 ??= now
        const t = Math.min(1, Math.max(0, (now - t0) / ms))
        apply(blend(from, target, easeOut(t)))
        if (t < 1) frame.current = requestAnimationFrame(step)
      }
      frame.current = requestAnimationFrame(step)
    },
    [apply, stop],
  )

  // Follow the container's size.
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) {
        const next = { w: r.width, h: r.height }
        sizeRef.current = next
        setSize(next)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Fit on first show and when the marker set changes (animated); keep fitting on resize until the user moves the map.
  useEffect(() => {
    const target = fitCamera(latest.current.fitPoints, size, latest.current.map)
    if (lastKey.current === null) {
      animateTo(target, 0)
    } else if (lastKey.current !== fitKey) {
      touched.current = false
      animateTo(target)
    } else if (!touched.current) {
      animateTo(target, 0)
    }
    lastKey.current = fitKey
  }, [fitKey, size, animateTo])

  useEffect(() => stop, [stop])
  useEffect(() => () => window.clearTimeout(clickTimer.current), [])

  // Fly to a requested point, zooming in if needed but never out.
  useEffect(() => {
    if (!focus) return
    touched.current = true
    animateTo({ cx: focus.x, cy: focus.y, k: Math.max(camRef.current.k, focus.k) }, 600)
  }, [focus, animateTo])

  // Wheel must be non-passive to stop the page scrolling while the map zooms.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      stop()
      touched.current = true
      const r = el.getBoundingClientRect()
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015))
      apply(
        zoomAt(
          camRef.current,
          factor,
          event.clientX - r.left,
          event.clientY - r.top,
          sizeRef.current,
          latest.current.map,
        ),
      )
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [apply, stop])

  useEffect(() => {
    const onChange = () => setNativeFs(document.fullscreenElement === box.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const localPoint = (clientX: number, clientY: number) => {
    const r = box.current?.getBoundingClientRect()
    return { x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0) }
  }

  const zoomBy = (factor: number) => {
    touched.current = true
    const s = sizeRef.current
    animateTo(
      zoomAt(camRef.current, factor, s.w / 2, s.h / 2, s, latest.current.map),
      250,
    )
  }

  const fitAll = () => {
    touched.current = false
    animateTo(fitCamera(latest.current.fitPoints, sizeRef.current, latest.current.map))
  }

  const resetView = () => {
    touched.current = false
    animateTo(resetCamera(latest.current.map))
  }

  const toggleFullscreen = () => {
    const el = box.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else if (typeof el.requestFullscreen === 'function') {
      el.requestFullscreen().catch(() => setPseudoFs((on) => !on))
    } else {
      setPseudoFs((on) => !on)
    }
  }

  const inertia = (vx: number, vy: number) => {
    let last: number | null = null
    let x = vx
    let y = vy
    const step = (now: number) => {
      const dt = last === null ? 0 : now - last
      last = now
      const decay = Math.exp(-dt / 325)
      x *= decay
      y *= decay
      apply(panBy(camRef.current, x * dt, y * dt, sizeRef.current, latest.current.map))
      if (Math.hypot(x, y) > 0.02) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    stop()
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
    gesture.current = {
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastT: performance.now(),
      vx: 0,
      vy: 0,
      moved: false,
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    const known = pointers.current.get(event.pointerId)
    const g = gesture.current
    if (!known || !g) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDistance.current > 0 && distance > 0) {
        const mid = localPoint((a.x + b.x) / 2, (a.y + b.y) / 2)
        touched.current = true
        g.moved = true
        apply(
          zoomAt(
            camRef.current,
            distance / pinchDistance.current,
            mid.x,
            mid.y,
            sizeRef.current,
            latest.current.map,
          ),
        )
      }
      pinchDistance.current = distance
      return
    }

    if (
      !g.moved &&
      Math.hypot(event.clientX - g.startX, event.clientY - g.startY) < DRAG_THRESHOLD_PX
    ) {
      return
    }
    if (!g.moved) {
      g.moved = true
      touched.current = true
      setDragging(true)
      box.current?.setPointerCapture?.(event.pointerId)
    }
    const now = performance.now()
    const dt = Math.max(1, now - g.lastT)
    const dx = event.clientX - g.lastX
    const dy = event.clientY - g.lastY
    g.vx = 0.8 * g.vx + (0.2 * dx) / dt
    g.vy = 0.8 * g.vy + (0.2 * dy) / dt
    g.lastX = event.clientX
    g.lastY = event.clientY
    g.lastT = now
    apply(panBy(camRef.current, dx, dy, sizeRef.current, latest.current.map))
  }

  const onPointerEnd = (event: PointerEvent) => {
    pointers.current.delete(event.pointerId)
    const g = gesture.current
    if (pointers.current.size > 0) {
      pinchDistance.current = 0
      return
    }
    gesture.current = null
    setDragging(false)
    if (!g?.moved) return
    // The drag is over, but the browser may still send a click; keep it from selecting a marker.
    suppressClick.current = true
    setTimeout(() => (suppressClick.current = false), 0)
    const idle = performance.now() - g.lastT > 80
    const speed = Math.hypot(g.vx, g.vy)
    if (!idle && speed > 0.05 && !reducedMotion()) inertia(g.vx, g.vy)
  }

  const onClick = (event: MouseEvent) => {
    if (!latest.current.onBackgroundClick) return
    const target = event.target as Element
    if (
      target.closest(`${MARKER}, .mapview-controls, .mapview-corner, .mapview-floating`)
    ) {
      return
    }
    const p = localPoint(event.clientX, event.clientY)
    const view = viewBoxOf(camRef.current, sizeRef.current, latest.current.map)
    const point = {
      x: view.x + (p.x / sizeRef.current.w) * view.w,
      y: view.y + (p.y / sizeRef.current.h) * view.h,
    }
    // Wait a beat: a double-click (zoom) should not also count as a click on empty map.
    window.clearTimeout(clickTimer.current)
    clickTimer.current = window.setTimeout(
      () => latest.current.onBackgroundClick?.(point),
      220,
    )
  }

  const onDoubleClick = (event: MouseEvent) => {
    window.clearTimeout(clickTimer.current)
    if ((event.target as Element).closest(MARKER)) return
    const p = localPoint(event.clientX, event.clientY)
    touched.current = true
    animateTo(
      zoomAt(
        camRef.current,
        event.shiftKey ? 0.5 : 2,
        p.x,
        p.y,
        sizeRef.current,
        latest.current.map,
      ),
      250,
    )
  }

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault()
    const p = localPoint(event.clientX, event.clientY)
    touched.current = true
    animateTo(
      zoomAt(camRef.current, 0.5, p.x, p.y, sizeRef.current, latest.current.map),
      250,
    )
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const pan = (dx: number, dy: number) => {
      event.preventDefault()
      stop()
      touched.current = true
      apply(panBy(camRef.current, dx, dy, sizeRef.current, latest.current.map))
    }
    switch (event.key) {
      case 'ArrowLeft':
        return pan(KEY_PAN_PX, 0)
      case 'ArrowRight':
        return pan(-KEY_PAN_PX, 0)
      case 'ArrowUp':
        return pan(0, KEY_PAN_PX)
      case 'ArrowDown':
        return pan(0, -KEY_PAN_PX)
      case '+':
      case '=':
        event.preventDefault()
        return zoomBy(BUTTON_ZOOM)
      case '-':
      case '_':
        event.preventDefault()
        return zoomBy(1 / BUTTON_ZOOM)
      case '0':
        event.preventDefault()
        return resetView()
      case 'Escape':
        if (pseudoFs) setPseudoFs(false)
    }
  }

  const fullscreen = nativeFs || pseudoFs
  const vb = viewBoxOf(cam, size, map)
  const toPx = (p: Position) => ({
    x: ((p.x - vb.x) / vb.w) * size.w,
    y: ((p.y - vb.y) / vb.h) * size.h,
  })
  const classes = ['mapview']
  if (hero) classes.push('mapview-hero')
  if (dragging) classes.push('mapview-dragging')
  if (pseudoFs) classes.push('mapview-fs')

  return (
    <div
      ref={box}
      className={classes.join(' ')}
      role="group"
      aria-label="Interactive map"
      aria-describedby={hintId}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.stopPropagation()
          event.preventDefault()
        }
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
    >
      <p id={hintId} className="sr-only">
        Drag to pan. Scroll, pinch or press plus and minus to zoom. Arrow keys pan. Press
        0 to reset the view.
      </p>
      <svg
        className="mapview-svg citymap-svg"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        role="img"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {/* The grid covers whatever the view shows, so there is never an edge to drag past. */}
        <defs>
          <pattern id="mapview-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" className="mapview-grid-line" />
          </pattern>
        </defs>
        <rect
          x={vb.x}
          y={vb.y}
          width={vb.w}
          height={vb.h}
          fill="url(#mapview-grid)"
          pointerEvents="none"
        />
        {props.children}
      </svg>

      <div className="mapview-floating">{floating?.({ toPx, size })}</div>
      <div className="mapview-corner mapview-tl">{topLeft}</div>
      <div className="mapview-corner mapview-br">{bottomRight}</div>
      <div className="mapview-controls" role="group" aria-label="Map controls">
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(BUTTON_ZOOM)}>
          <span aria-hidden="true">+</span>
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomBy(1 / BUTTON_ZOOM)}
        >
          <span aria-hidden="true">−</span>
        </button>
        <button type="button" aria-label="Fit all markers" onClick={fitAll}>
          <span aria-hidden="true">◎</span>
        </button>
        <button type="button" aria-label="Reset view" onClick={resetView}>
          <span aria-hidden="true">⟲</span>
        </button>
        <button
          type="button"
          aria-label="Fullscreen"
          aria-pressed={fullscreen}
          onClick={toggleFullscreen}
        >
          <span aria-hidden="true">⛶</span>
        </button>
      </div>
    </div>
  )
}
