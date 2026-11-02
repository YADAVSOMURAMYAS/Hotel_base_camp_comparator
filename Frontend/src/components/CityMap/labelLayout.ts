// Label placement for the schematic map. Positions are used for drawing only (rule: never
// for any calculation); nothing here touches totals, ranks or order.
export const FONT_SIZE = 13
const CHAR_WIDTH = 7
const MARKER_RADIUS = 11
const GAP = 6

export interface LabelMarker {
  id: string
  name: string
  x: number
  y: number
}

export interface LabelSpot {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
}

export interface LabelBox {
  left: number
  right: number
  top: number
  bottom: number
}

export function boxOf(spot: LabelSpot, name: string): LabelBox {
  const width = name.length * CHAR_WIDTH
  const left =
    spot.anchor === 'start'
      ? spot.x
      : spot.anchor === 'end'
        ? spot.x - width
        : spot.x - width / 2
  return { left, right: left + width, top: spot.y - FONT_SIZE, bottom: spot.y + 3 }
}

function overlaps(a: LabelBox, b: LabelBox): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

function markerBox(m: LabelMarker): LabelBox {
  return {
    left: m.x - MARKER_RADIUS,
    right: m.x + MARKER_RADIUS,
    top: m.y - MARKER_RADIUS,
    bottom: m.y + MARKER_RADIUS,
  }
}

/** Candidate spots in preference order: the natural side first, then below, above, other side. */
function candidates(m: LabelMarker, mapWidth: number): LabelSpot[] {
  const reach = MARKER_RADIUS + GAP
  const right: LabelSpot = { x: m.x + reach, y: m.y + 4, anchor: 'start' }
  const left: LabelSpot = { x: m.x - reach, y: m.y + 4, anchor: 'end' }
  const below: LabelSpot = { x: m.x, y: m.y + reach + FONT_SIZE - 3, anchor: 'middle' }
  const above: LabelSpot = { x: m.x, y: m.y - reach, anchor: 'middle' }
  const rightSide = m.x <= mapWidth * 0.7
  return rightSide ? [right, below, above, left] : [left, below, above, right]
}

/** Greedy: each label takes the first spot that hits no marker, no earlier label and no map edge. */
export function placeLabels(
  markers: LabelMarker[],
  mapWidth: number,
): Map<string, LabelSpot> {
  const spots = new Map<string, LabelSpot>()
  const taken: LabelBox[] = []
  for (const m of markers) {
    const options = candidates(m, mapWidth)
    const free = options.find((spot) => {
      const box = boxOf(spot, m.name)
      if (box.left < 0 || box.right > mapWidth) return false
      if (taken.some((t) => overlaps(box, t))) return false
      return !markers.some((o) => o.id !== m.id && overlaps(box, markerBox(o)))
    })
    const chosen = free ?? options[0]
    spots.set(m.id, chosen)
    taken.push(boxOf(chosen, m.name))
  }
  return spots
}
