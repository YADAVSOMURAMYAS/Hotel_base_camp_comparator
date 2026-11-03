// Pan/zoom maths for the map viewport. Presentation only: it moves the view over the
// schematic; no coordinate, distance or zoom level ever feeds a hotel number.
import type { Position } from '../../types/contracts'

/** Where the view looks: the centre in map units, and the zoom (1 = whole map fits the container). */
export interface Camera {
  cx: number
  cy: number
  k: number
}

export interface Size {
  w: number
  h: number
}

export interface MapExtent {
  width: number
  height: number
}

export interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

export const MIN_K = 0.8
export const MAX_K = 8
/** A lone marker (or a tight cluster) never zooms in further than this when fitting. */
const MAX_FIT_K = 3

/** The view centre never leaves the map, so the markers can always be found again. */
const clampCentre = (cam: Camera, map: MapExtent): Camera => ({
  ...cam,
  cx: Math.min(map.width, Math.max(0, cam.cx)),
  cy: Math.min(map.height, Math.max(0, cam.cy)),
})

const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k))

/** Pixels per map unit when the whole map just fits the container. */
export function baseScale(size: Size, map: MapExtent): number {
  return Math.min(size.w / map.width, size.h / map.height)
}

export function resetCamera(map: MapExtent): Camera {
  return { cx: map.width / 2, cy: map.height / 2, k: 1 }
}

export function viewBoxOf(cam: Camera, size: Size, map: MapExtent): ViewBox {
  const scale = cam.k * baseScale(size, map)
  const w = size.w / scale
  const h = size.h / scale
  return { x: cam.cx - w / 2, y: cam.cy - h / 2, w, h }
}

/** Zoom by `factor` keeping the map point under (px, py) in the container still. */
export function zoomAt(
  cam: Camera,
  factor: number,
  px: number,
  py: number,
  size: Size,
  map: MapExtent,
): Camera {
  const k = clampK(cam.k * factor)
  if (k === cam.k) return cam
  const before = viewBoxOf(cam, size, map)
  const wx = before.x + (px / size.w) * before.w
  const wy = before.y + (py / size.h) * before.h
  const after = viewBoxOf({ ...cam, k }, size, map)
  const x = wx - (px / size.w) * after.w
  const y = wy - (py / size.h) * after.h
  return clampCentre({ cx: x + after.w / 2, cy: y + after.h / 2, k }, map)
}

/** Move the view so the content follows a drag of (dx, dy) pixels. */
export function panBy(
  cam: Camera,
  dx: number,
  dy: number,
  size: Size,
  map: MapExtent,
): Camera {
  const scale = cam.k * baseScale(size, map)
  if (scale <= 0) return cam
  return clampCentre({ ...cam, cx: cam.cx - dx / scale, cy: cam.cy - dy / scale }, map)
}

/** A camera that shows every point with `padPx` of room; no points means the whole map. */
export function fitCamera(
  points: Position[],
  size: Size,
  map: MapExtent,
  padPx = 72,
): Camera {
  if (points.length === 0) return resetCamera(map)
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const base = baseScale(size, map)
  if (base <= 0) return resetCamera(map)
  const fitX = (size.w - 2 * padPx) / Math.max(maxX - minX, 1)
  const fitY = (size.h - 2 * padPx) / Math.max(maxY - minY, 1)
  const k = Math.min(MAX_FIT_K, clampK(Math.min(fitX, fitY) / base))
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, k }
}

/** Camera partway between two, for animation: zoom moves geometrically so it feels even. */
export function blend(from: Camera, to: Camera, t: number): Camera {
  return {
    cx: from.cx + (to.cx - from.cx) * t,
    cy: from.cy + (to.cy - from.cy) * t,
    k: from.k * Math.pow(to.k / from.k, t),
  }
}
