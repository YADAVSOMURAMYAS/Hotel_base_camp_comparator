import {
  MAX_K,
  MIN_K,
  blend,
  fitCamera,
  panBy,
  resetCamera,
  viewBoxOf,
  zoomAt,
} from './camera'

const map = { width: 1000, height: 600 }
const size = { w: 1000, h: 600 }

describe('camera', () => {
  it('reset shows the whole map', () => {
    expect(viewBoxOf(resetCamera(map), size, map)).toEqual({
      x: 0,
      y: 0,
      w: 1000,
      h: 600,
    })
  })

  it('zooming keeps the point under the cursor where it was', () => {
    const cam = resetCamera(map)
    const px = 250
    const py = 150
    const before = viewBoxOf(cam, size, map)
    const worldX = before.x + (px / size.w) * before.w
    const worldY = before.y + (py / size.h) * before.h
    const zoomed = zoomAt(cam, 2, px, py, size, map)
    const after = viewBoxOf(zoomed, size, map)
    expect(zoomed.k).toBe(2)
    expect(after.x + (px / size.w) * after.w).toBeCloseTo(worldX)
    expect(after.y + (py / size.h) * after.h).toBeCloseTo(worldY)
  })

  it('clamps zoom to the allowed range', () => {
    const cam = resetCamera(map)
    expect(zoomAt(cam, 100, 0, 0, size, map).k).toBe(MAX_K)
    expect(zoomAt(cam, 0.001, 0, 0, size, map).k).toBe(MIN_K)
  })

  it('panning follows the drag direction', () => {
    const cam = resetCamera(map)
    const moved = panBy(cam, 100, 0, size, map)
    expect(moved.cx).toBe(cam.cx - 100)
  })

  it('panning and zooming never take the view centre off the map', () => {
    const far = panBy(resetCamera(map), -5000, 5000, size, map)
    expect(far.cx).toBe(map.width)
    expect(far.cy).toBe(0)
    const zoomed = zoomAt({ cx: 0, cy: 0, k: 1 }, 2, 900, 500, size, map)
    expect(zoomed.cx).toBeGreaterThanOrEqual(0)
  })

  it('fit shows every point with room around it', () => {
    const points = [
      { x: 200, y: 100 },
      { x: 700, y: 400 },
    ]
    const cam = fitCamera(points, size, map)
    const vb = viewBoxOf(cam, size, map)
    for (const p of points) {
      expect(p.x).toBeGreaterThan(vb.x)
      expect(p.x).toBeLessThan(vb.x + vb.w)
      expect(p.y).toBeGreaterThan(vb.y)
      expect(p.y).toBeLessThan(vb.y + vb.h)
    }
    expect(cam.cx).toBe(450)
    expect(cam.cy).toBe(250)
  })

  it('fit does not zoom far into a single point, and falls back to the whole map with none', () => {
    expect(fitCamera([{ x: 500, y: 300 }], size, map).k).toBeLessThanOrEqual(3)
    expect(fitCamera([], size, map)).toEqual(resetCamera(map))
  })

  it('blend runs from one camera to the other', () => {
    const a = { cx: 0, cy: 0, k: 1 }
    const b = { cx: 100, cy: 50, k: 4 }
    expect(blend(a, b, 0)).toEqual(a)
    expect(blend(a, b, 1)).toEqual(b)
    expect(blend(a, b, 0.5).k).toBeCloseTo(2)
  })
})
