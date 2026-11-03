import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MapViewport from './MapViewport'

const map = { width: 1000, height: 600 }

function renderMap(fitPoints = [] as { x: number; y: number }[], fitKey = 'a') {
  const ui = (points: typeof fitPoints, key: string) => (
    <MapViewport
      map={map}
      fitPoints={points}
      fitKey={key}
      labelledBy="t"
      describedBy="d"
      topLeft={<span>top-left piece</span>}
      bottomRight={<span>bottom-right piece</span>}
    >
      <title id="t">Test map</title>
      <desc id="d">Test description</desc>
      <g role="button" tabIndex={0} aria-label="marker" data-testid="marker">
        <circle cx="500" cy="300" r="8" />
      </g>
    </MapViewport>
  )
  const view = render(ui(fitPoints, fitKey))
  return {
    ...view,
    update: (points: typeof fitPoints, key: string) => view.rerender(ui(points, key)),
  }
}

const box = () => screen.getByRole('group', { name: 'Interactive map' })
const viewBox = () =>
  screen
    .getByRole('img', { name: 'Test map' })
    .getAttribute('viewBox')!
    .split(' ')
    .map(Number) as [number, number, number, number]
const width = () => viewBox()[2]
/** Compares the view box allowing for floating-point noise after an animation. */
const expectView = (expected: number[]) =>
  viewBox().forEach((v, i) => expect(v).toBeCloseTo(expected[i], 3))

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never
})

describe('MapViewport', () => {
  it('starts with the whole map in view and offers floating controls', () => {
    renderMap()
    expect(viewBox()).toEqual([0, 0, 1000, 600])
    for (const name of [
      'Zoom in',
      'Zoom out',
      'Fit all markers',
      'Reset view',
      'Fullscreen',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByText('top-left piece')).toBeInTheDocument()
    expect(screen.getByText('bottom-right piece')).toBeInTheDocument()
    expect(box()).toHaveAccessibleDescription(/Drag to pan/)
  })

  it('zooms with the buttons and resets', async () => {
    renderMap()
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    await waitFor(() => expect(width()).toBeLessThan(1000))
    await waitFor(() => expect(width()).toBeCloseTo(1000 / 1.5, 0))
    await userEvent.click(screen.getByRole('button', { name: 'Reset view' }))
    await waitFor(() => expectView([0, 0, 1000, 600]))
  })

  it('zooms out with the button and stops at the minimum', async () => {
    renderMap()
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    }
    await waitFor(() => expect(width()).toBeCloseTo(1000 / 0.8, 0))
  })

  it('keyboard: arrows pan, plus and minus zoom, 0 resets', async () => {
    renderMap()
    box().focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(viewBox()[0]).toBeLessThan(0)
    await userEvent.keyboard('{ArrowDown}')
    expect(viewBox()[1]).toBeGreaterThan(0)
    await userEvent.keyboard('+')
    await waitFor(() => expect(width()).toBeLessThan(1000))
    await userEvent.keyboard('0')
    await waitFor(() => expectView([0, 0, 1000, 600]))
  })

  it('wheel zooms toward the cursor and keeps the page from scrolling', () => {
    renderMap()
    const notPrevented = fireEvent.wheel(box(), { deltaY: -400, clientX: 0, clientY: 0 })
    expect(notPrevented).toBe(false)
    expect(width()).toBeLessThan(1000)
    // the top-left corner was under the cursor, so it stays at the origin
    expect(viewBox()[0]).toBeCloseTo(0)
    expect(viewBox()[1]).toBeCloseTo(0)
  })

  it('dragging pans, and the drag does not click a marker', () => {
    renderMap()
    const onClick = vi.fn()
    screen.getByTestId('marker').addEventListener('click', onClick)
    fireEvent.pointerDown(screen.getByTestId('marker'), {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      button: 0,
    })
    fireEvent.pointerMove(box(), { pointerId: 1, clientX: 180, clientY: 100 })
    fireEvent.pointerMove(box(), { pointerId: 1, clientX: 220, clientY: 100 })
    fireEvent.pointerUp(box(), { pointerId: 1, clientX: 220, clientY: 100 })
    expect(viewBox()[0]).toBeLessThan(0)
    fireEvent.click(screen.getByTestId('marker'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('a plain click on a marker still reaches the marker', () => {
    renderMap()
    const onClick = vi.fn()
    screen.getByTestId('marker').addEventListener('click', onClick)
    fireEvent.pointerDown(screen.getByTestId('marker'), {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      button: 0,
    })
    fireEvent.pointerUp(box(), { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.click(screen.getByTestId('marker'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('double-click zooms in, shift+double-click and right-click zoom out; markers are left alone', async () => {
    renderMap()
    fireEvent.doubleClick(screen.getByTestId('marker'))
    await new Promise((r) => setTimeout(r, 300))
    expect(width()).toBe(1000)

    fireEvent.doubleClick(box(), { clientX: 10, clientY: 10 })
    await waitFor(() => expect(width()).toBeCloseTo(500, 0))
    fireEvent.doubleClick(box(), { shiftKey: true, clientX: 10, clientY: 10 })
    await waitFor(() => expect(width()).toBeCloseTo(1000, 0))
    const notPrevented = fireEvent.contextMenu(box(), { clientX: 10, clientY: 10 })
    expect(notPrevented).toBe(false)
    await waitFor(() => expect(width()).toBeCloseTo(1250, 0))
  })

  it('Fit all markers brings the markers into view; a new marker set refits on its own', async () => {
    const points = [
      { x: 200, y: 100 },
      { x: 300, y: 200 },
    ]
    const { update } = renderMap(points, 'first')
    await waitFor(() => expect(width()).toBeLessThan(1000))
    await userEvent.click(screen.getByRole('button', { name: 'Reset view' }))
    await waitFor(() => expectView([0, 0, 1000, 600]))
    await userEvent.click(screen.getByRole('button', { name: 'Fit all markers' }))
    await waitFor(() => expect(width()).toBeLessThan(1000))
    const [x, , w] = viewBox()
    expect(x).toBeLessThan(200)
    expect(x + w).toBeGreaterThan(300)

    update([{ x: 800, y: 500 }], 'second')
    await waitFor(() => {
      const [nx, , nw] = viewBox()
      expect(nx).toBeLessThan(800)
      expect(nx + nw).toBeGreaterThan(800)
      expect(nx).toBeGreaterThan(300)
    })
  })

  it('Fullscreen falls back to a full-window map when the browser has no Fullscreen API', async () => {
    renderMap()
    const button = screen.getByRole('button', { name: 'Fullscreen' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(box()).toHaveClass('mapview-fs')
    box().focus()
    await userEvent.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('with reduced motion the view jumps instead of animating', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never
    renderMap()
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    await waitFor(() => expect(width()).toBeCloseTo(1000 / 1.5, 5))
  })
})
