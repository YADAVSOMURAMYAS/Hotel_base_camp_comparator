import type { KeyboardEvent } from 'react'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { CatalogHotel, CatalogPlace, HotelResult } from '../../types/contracts'
import { FONT_SIZE, placeLabels, type LabelSpot } from './labelLayout'
import './CityMap.css'

const LINK_LABEL_AT = 0.6
const LINK_CHAR_WIDTH = 6.5

function statusText(hotel: HotelResult | undefined): string {
  if (!hotel) return ''
  if (hotel.label === 'RECOMMENDED') return 'Recommended'
  if (hotel.label === 'OVER_BUDGET') return 'Over budget'
  return `Rank ${hotel.rank}`
}

function Label({ spot, name, bold }: { spot: LabelSpot; name: string; bold?: boolean }) {
  return (
    <text
      className={bold ? 'citymap-label citymap-label-bold' : 'citymap-label'}
      x={spot.x}
      y={spot.y}
      textAnchor={spot.anchor}
    >
      {name}
    </text>
  )
}

function HotelMarker(props: {
  hotel: CatalogHotel
  result: HotelResult | undefined
  spot: LabelSpot
  inspected: boolean
  onInspect: (id: string) => void
}) {
  const { hotel, result, spot, inspected, onInspect } = props
  const { x, y } = hotel.position
  const status = statusText(result)
  const symbol =
    result?.label === 'RECOMMENDED' ? '★' : result?.label === 'OVER_BUDGET' ? '✕' : null
  const tone =
    result?.label === 'RECOMMENDED'
      ? 'citymap-hotel-best'
      : result?.label === 'OVER_BUDGET'
        ? 'citymap-hotel-over'
        : ''
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onInspect(hotel.id)
    }
  }
  return (
    <g
      data-testid={`marker-hotel-${hotel.id}`}
      className={`citymap-hotel ${tone}`}
      role="button"
      tabIndex={0}
      aria-current={inspected ? 'true' : undefined}
      onClick={() => onInspect(hotel.id)}
      onKeyDown={onKeyDown}
    >
      <title>{status ? `${hotel.name}, ${status}` : hotel.name}</title>
      {inspected && (
        <rect
          className="citymap-ring"
          x={x - 17}
          y={y - 17}
          width={34}
          height={34}
          rx={4}
        />
      )}
      <rect
        className="citymap-hotel-shape"
        x={x - 11}
        y={y - 11}
        width={22}
        height={22}
        rx={3}
      />
      <text className="citymap-hotel-letter" x={x} y={y + 5} textAnchor="middle">
        H
      </text>
      {symbol && (
        <text className="citymap-badge" x={x + 13} y={y - 9} textAnchor="middle">
          {symbol}
        </text>
      )}
      <Label spot={spot} name={hotel.name} bold={inspected} />
    </g>
  )
}

function PlaceMarker({ place, spot }: { place: CatalogPlace; spot: LabelSpot }) {
  const { x, y } = place.position
  const kind = place.type === 'food' ? 'food' : 'attraction'
  return (
    <g
      data-testid={`marker-place-${place.id}`}
      className={`citymap-place citymap-${kind}`}
    >
      <title>{`${place.name}, ${kind}`}</title>
      {kind === 'food' ? (
        <polygon points={`${x},${y - 10} ${x + 10},${y} ${x},${y + 10} ${x - 10},${y}`} />
      ) : (
        <circle cx={x} cy={y} r={8} />
      )}
      <Label spot={spot} name={place.name} />
    </g>
  )
}

function Legend() {
  return (
    <ul className="citymap-legend" aria-label="Map legend">
      <li>
        <svg width="16" height="16" aria-hidden="true">
          <rect
            className="citymap-hotel-shape"
            x="1"
            y="1"
            width="14"
            height="14"
            rx="2"
          />
        </svg>
        Hotel
      </li>
      <li>
        <svg width="16" height="16" aria-hidden="true">
          <circle className="citymap-attraction-shape" cx="8" cy="8" r="6" />
        </svg>
        Attraction
      </li>
      <li>
        <svg width="16" height="16" aria-hidden="true">
          <polygon className="citymap-food-shape" points="8,1 15,8 8,15 1,8" />
        </svg>
        Food
      </li>
      <li>★ Recommended</li>
      <li>✕ Over budget</li>
    </ul>
  )
}

export default function CityMap() {
  const { city, selection, result, inspectedHotelId, isStale, phase, inspectHotel } =
    useComparatorContext()

  if (!city) {
    return (
      <section className="panel" aria-label="City map" data-testid="city-map-stub">
        <h2>City map</h2>
        <p className="muted">
          {phase === 'loading' ? 'Loading map…' : 'Load the Demo trip to see the map.'}
        </p>
      </section>
    )
  }

  const hotels = city.hotels.filter((h) => selection.hotel_ids.includes(h.id))
  const places = city.places.filter((p) => selection.place_ids.includes(p.id))
  const spots = placeLabels(
    [...hotels, ...places].map((m) => ({
      id: m.id,
      name: m.name,
      x: m.position.x,
      y: m.position.y,
    })),
    city.map.width,
  )
  const resultOf = (id: string) => result?.hotels.find((h) => h.id === id)
  const inspected = inspectedHotelId
    ? hotels.find((h) => h.id === inspectedHotelId)
    : undefined
  const links = inspected ? (resultOf(inspected.id)?.contributions ?? []) : []
  const placeById = new Map(places.map((p) => [p.id, p]))

  return (
    <section
      className="panel citymap"
      aria-label="City map"
      aria-busy={isStale}
      data-testid="city-map-stub"
    >
      <h2>City map</h2>
      <svg
        className="citymap-svg"
        viewBox={`0 0 ${city.map.width} ${city.map.height}`}
        role="img"
        aria-labelledby="citymap-title"
        aria-describedby="citymap-desc"
      >
        <title id="citymap-title">{`Schematic map of ${city.name}`}</title>
        <desc id="citymap-desc">
          Schematic map of the selected hotels and places. Comparison links show the
          inspected hotel only. The full data is in the Travel times table.
        </desc>
        <defs>
          <pattern id="citymap-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" className="citymap-grid-line" />
          </pattern>
        </defs>
        <rect width={city.map.width} height={city.map.height} className="citymap-bg" />
        <rect width={city.map.width} height={city.map.height} fill="url(#citymap-grid)" />

        <g
          data-testid="citymap-links"
          className={isStale ? 'citymap-links citymap-stale' : 'citymap-links'}
        >
          {inspected &&
            links.map((c) => {
              const place = placeById.get(c.place_id)
              if (!place) return null
              const from = inspected.position
              const to = place.position
              const text = `${c.minutes} min · ${c.contribution}`
              const lx = from.x + (to.x - from.x) * LINK_LABEL_AT
              const ly = from.y + (to.y - from.y) * LINK_LABEL_AT
              const width = text.length * LINK_CHAR_WIDTH + 8
              return (
                <g key={c.place_id}>
                  <line
                    className="citymap-link"
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                  />
                  <g data-testid={`link-label-${c.place_id}`}>
                    <rect
                      className="citymap-link-bg"
                      x={lx - width / 2}
                      y={ly - FONT_SIZE / 2 - 2}
                      width={width}
                      height={FONT_SIZE + 4}
                      rx={3}
                    />
                    <text
                      className="citymap-link-text"
                      x={lx}
                      y={ly + 4}
                      textAnchor="middle"
                    >
                      {text}
                    </text>
                  </g>
                </g>
              )
            })}
        </g>

        <g className={isStale ? 'citymap-stale-badges' : undefined}>
          {places.map((p) => (
            <PlaceMarker key={p.id} place={p} spot={spots.get(p.id)!} />
          ))}
          {hotels.map((h) => (
            <HotelMarker
              key={h.id}
              hotel={h}
              result={resultOf(h.id)}
              spot={spots.get(h.id)!}
              inspected={h.id === inspectedHotelId}
              onInspect={inspectHotel}
            />
          ))}
        </g>
      </svg>
      <p className="muted">
        Comparison links, not routes. Line length is not travel time.
      </p>
      <Legend />
    </section>
  )
}
