import { describe, expect, it } from 'vitest'
import { sampleCity, samplePreset } from '../Controls/renderWithComparator'
import { boxOf, placeLabels, type LabelBox, type LabelMarker } from './labelLayout'

const markers: LabelMarker[] = [
  ...sampleCity.hotels.filter((h) => samplePreset.hotel_ids.includes(h.id)),
  ...sampleCity.places.filter((p) => samplePreset.place_ids.includes(p.id)),
].map((m) => ({ id: m.id, name: m.name, x: m.position.x, y: m.position.y }))

const overlap = (a: LabelBox, b: LabelBox) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

describe('placeLabels', () => {
  const spots = placeLabels(markers, sampleCity.map.width)

  it('places every marker', () => {
    expect(spots.size).toBe(25)
  })

  it('starts on the right in the left part of the map and on the left in the right part', () => {
    const wide = placeLabels([{ id: 'A', name: 'A', x: 100, y: 100 }], 1000)
    const far = placeLabels([{ id: 'B', name: 'B', x: 900, y: 100 }], 1000)
    expect(wide.get('A')?.anchor).toBe('start')
    expect(far.get('B')?.anchor).toBe('end')
  })

  it('no label box overlaps another label box on the Demo positions', () => {
    const boxes = markers.map((m) => boxOf(spots.get(m.id)!, m.name))
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++)
        expect(overlap(boxes[i], boxes[j])).toBe(false)
  })

  it('no label box covers another marker on the Demo positions', () => {
    for (const m of markers) {
      const box = boxOf(spots.get(m.id)!, m.name)
      for (const other of markers) {
        if (other.id === m.id) continue
        const inside =
          other.x > box.left &&
          other.x < box.right &&
          other.y > box.top &&
          other.y < box.bottom
        expect(inside, `${m.id} label covers ${other.id}`).toBe(false)
      }
    }
  })

  it('moves a label away from a marker that sits right next to it', () => {
    const pair: LabelMarker[] = [
      { id: 'A', name: 'Long marker name', x: 100, y: 100 },
      { id: 'B', name: 'Other', x: 140, y: 100 },
    ]
    const result = placeLabels(pair, 1000)
    expect(result.get('A')?.anchor === 'start' && result.get('A')?.y === 104).toBe(false)
  })
})
