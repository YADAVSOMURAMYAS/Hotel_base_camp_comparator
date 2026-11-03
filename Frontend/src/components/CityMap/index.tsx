import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useComparatorContext } from '../../state/ComparatorContext'
import { useLinkedView } from '../../state/linkedView'
import type { CatalogHotel, CatalogPlace, HotelResult } from '../../types/contracts'
import {
  STATUS_SYMBOL,
  STATUS_TEXT,
  statusLabel,
  typeChip,
} from '../../utils/hotelLabels'
import { MAX_HOTELS, MAX_PLACES } from '../../utils/selectionLimits'
import { FONT_SIZE, placeLabels, type LabelSpot } from './labelLayout'
import { HotelPopup, HotelTooltip, PlaceTooltip } from './MapCards'
import MapViewport, { type FocusRequest } from './MapViewport'
import './CityMap.css'

const RIPPLE_MS = 800
const LINK_LABEL_AT = 0.6
const LINK_CHAR_WIDTH = 6.5

function statusText(hotel: HotelResult | undefined): string {
  if (!hotel) return ''
  if (hotel.label === 'RANKED') return `Rank ${hotel.rank}`
  return STATUS_TEXT[hotel.label]
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
  /** Under the pointer or focus (spring scale). */
  hot: boolean
  /** The matching ranked card is under the pointer (pulse). */
  pulse: boolean
  onInspect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  const { hotel, result, spot, inspected, hot, pulse, onInspect, onHover } = props
  const { x, y } = hotel.position
  const status = statusText(result)
  const symbol =
    result?.label === 'RECOMMENDED' || result?.label === 'OVER_BUDGET'
      ? STATUS_SYMBOL[result.label]
      : null
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
      className={`citymap-hotel ${tone}${hot ? ' citymap-hot' : ''}${pulse ? ' citymap-pulse' : ''}`}
      role="button"
      tabIndex={0}
      aria-current={inspected ? 'true' : undefined}
      onClick={() => onInspect(hotel.id)}
      onKeyDown={onKeyDown}
      onMouseEnter={() => onHover(hotel.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(hotel.id)}
      onBlur={() => onHover(null)}
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
      <g className="citymap-hotel-body">
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
      </g>
      <Label spot={spot} name={hotel.name} bold={inspected} />
    </g>
  )
}

function PlaceMarker(props: {
  place: CatalogPlace
  spot: LabelSpot
  onHover: (id: string | null) => void
}) {
  const { place, spot, onHover } = props
  const { x, y } = place.position
  const kind = place.type === 'food' ? 'food' : 'attraction'
  return (
    <g
      data-testid={`marker-place-${place.id}`}
      className={`citymap-place citymap-${kind}`}
      onMouseEnter={() => onHover(place.id)}
      onMouseLeave={() => onHover(null)}
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

type Mode = 'inspect' | 'select'
type Kind = 'hotel' | 'place'

/** A catalog marker in Select mode: a checkbox. Only selected ones carry a permanent label. */
function SelectMarker(props: {
  kind: Kind
  id: string
  name: string
  type?: CatalogPlace['type']
  x: number
  y: number
  selected: boolean
  spot?: LabelSpot
  onToggle: () => void
  onHover: (key: string | null) => void
}) {
  const { kind, id, name, type, x, y, selected, spot, onToggle, onHover } = props
  const key = `${kind}-${id}`
  const size = selected ? 1 : 0.6
  const noun = kind === 'hotel' ? 'hotel' : (type ?? 'place')
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }
  return (
    <g
      data-testid={`marker-${key}`}
      className={`citymap-select citymap-select-${kind} ${selected ? 'citymap-select-on' : 'citymap-select-off'}`}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      onMouseEnter={() => onHover(key)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(key)}
      onBlur={() => onHover(null)}
    >
      <title>{`${name}, ${noun}, ${selected ? 'selected' : 'not selected'}`}</title>
      {kind === 'hotel' ? (
        <rect
          className="citymap-hotel-shape"
          x={x - 11 * size}
          y={y - 11 * size}
          width={22 * size}
          height={22 * size}
          rx={3}
        />
      ) : type === 'food' ? (
        <polygon
          className="citymap-food-shape"
          points={`${x},${y - 10 * size} ${x + 10 * size},${y} ${x},${y + 10 * size} ${x - 10 * size},${y}`}
        />
      ) : (
        <circle className="citymap-attraction-shape" cx={x} cy={y} r={8 * size} />
      )}
      {selected && spot && <Label spot={spot} name={name} />}
    </g>
  )
}

function Legend({ selecting }: { selecting: boolean }) {
  return (
    <ul className="citymap-legend mapview-glass" aria-label="Map legend">
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
      {selecting ? (
        <li>Large = selected, small = not selected. Names show on hover or focus.</li>
      ) : (
        <>
          <li>{statusLabel('RECOMMENDED')}</li>
          <li>{statusLabel('OVER_BUDGET')}</li>
        </>
      )}
    </ul>
  )
}

interface Props {
  /** Plan screen: adds the Select mode. Results shows the comparison view only. */
  selectable?: boolean
  /** Results screen: full-width, at least 70vh tall. */
  hero?: boolean
}

export default function CityMap({ selectable = false, hero = false }: Props) {
  const {
    city,
    selection,
    result,
    inspectedHotelId,
    isStale,
    phase,
    inspectHotel,
    toggleHotel,
    togglePlace,
  } = useComparatorContext()
  // The chosen mode belongs to one city: a different city starts in Inspect again.
  const [chosen, setChosen] = useState<{ cityId: string; mode: Mode }>({
    cityId: '',
    mode: 'inspect',
  })
  const [hovered, setHovered] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const { hover, setHover, setCollapsedId } = useLinkedView()
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null)
  const [popupId, setPopupId] = useState<string | null>(null)
  const [focus, setFocus] = useState<FocusRequest | null>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const rippleId = useRef(0)

  if (!city) {
    return (
      <section className="panel" aria-label="City map">
        <h2>City map</h2>
        <p className="muted">
          {phase === 'loading' ? 'Loading map…' : 'Load the Demo trip to see the map.'}
        </p>
      </section>
    )
  }

  const mode: Mode = chosen.cityId === city.city_id ? chosen.mode : 'inspect'
  const nothingSelected =
    selection.hotel_ids.length === 0 && selection.place_ids.length === 0
  // With nothing selected there is nothing to inspect, so the map behaves as Select.
  const selecting = selectable && (mode === 'select' || nothingSelected)
  const hotels = city.hotels.filter((h) => selection.hotel_ids.includes(h.id))
  const places = city.places.filter((p) => selection.place_ids.includes(p.id))
  const toggle = (kind: Kind, id: string) => {
    const ids = kind === 'hotel' ? selection.hotel_ids : selection.place_ids
    const max = kind === 'hotel' ? MAX_HOTELS : MAX_PLACES
    if (!ids.includes(id) && ids.length >= max) {
      setNotice(`Limit of ${max} ${kind}s reached. Deselect one to choose another.`)
      return
    }
    setNotice('')
    if (kind === 'hotel') toggleHotel(id)
    else togglePlace(id)
  }
  const hoveredMarker = hovered
    ? ([...city.hotels, ...city.places].find(
        (m) => hovered === `${'type' in m ? 'place' : 'hotel'}-${m.id}`,
      ) ?? null)
    : null
  const hoveredSelected =
    hoveredMarker !== null &&
    (selection.hotel_ids.includes(hoveredMarker.id) ||
      selection.place_ids.includes(hoveredMarker.id))
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

  const addRipple = (x: number, y: number) => {
    const id = ++rippleId.current
    setRipples((all) => [...all, { id, x, y }])
    // Timer, not animationend: with reduced motion the ripple is hidden and never animates.
    setTimeout(() => setRipples((all) => all.filter((r) => r.id !== id)), RIPPLE_MS)
  }
  /** Click on a hotel marker: inspect it, open its card and popup, fly to it. */
  const activate = (id: string) => {
    const hotel = hotels.find((h) => h.id === id)
    inspectHotel(id)
    setCollapsedId(null)
    setPopupId(id)
    if (hotel) {
      addRipple(hotel.position.x, hotel.position.y)
      setFocus((f) => ({ ...hotel.position, k: 2.2, nonce: (f?.nonce ?? 0) + 1 }))
    }
  }
  /** Click on empty map: forget the inspected hotel, with a ripple where the click was. */
  const clearInspection = (point: { x: number; y: number }) => {
    addRipple(point.x, point.y)
    setPopupId(null)
    inspectHotel(null)
  }
  const hotelResult = (id: string) => result?.hotels.find((h) => h.id === id)
  const hotHotel = hover ? hotels.find((h) => h.id === hover.id) : undefined
  const popupHotel =
    popupId !== null && popupId === inspectedHotelId
      ? hotels.find((h) => h.id === popupId)
      : undefined
  const hoveredPlace = hoveredPlaceId ? placeById.get(hoveredPlaceId) : undefined
  const linkOf = (placeId: string) =>
    links.find((c) => c.place_id === placeId) ?? undefined
  const importanceOf = (placeId: string) =>
    result?.hotels[0]?.contributions.find((c) => c.place_id === placeId)?.importance

  return (
    <section className="citymap" aria-label="City map" aria-busy={isStale}>
      <h2 className="sr-only">City map</h2>
      <MapViewport
        map={city.map}
        fitPoints={selectable ? [] : [...hotels, ...places].map((m) => m.position)}
        fitKey={
          selectable
            ? `plan:${city.city_id}`
            : `${city.city_id}:${selection.hotel_ids.join()}|${selection.place_ids.join()}`
        }
        labelledBy="citymap-title"
        describedBy="citymap-desc"
        hero={hero}
        topLeft={
          selectable && (
            <fieldset className="citymap-mode mapview-glass">
              <legend className="citymap-mode-legend">Map mode</legend>
              <div role="radiogroup" aria-label="Map mode">
                {(['inspect', 'select'] as const).map((m) => (
                  <label key={m}>
                    <input
                      type="radio"
                      name="citymap-mode"
                      checked={mode === m}
                      onChange={() => setChosen({ cityId: city.city_id, mode: m })}
                    />{' '}
                    {m === 'inspect' ? 'Inspect' : 'Select'}
                  </label>
                ))}
              </div>
            </fieldset>
          )
        }
        bottomRight={<Legend selecting={selecting} />}
        focus={selecting ? null : focus}
        onBackgroundClick={selecting ? undefined : clearInspection}
        floating={({ toPx, size }) => {
          if (selecting) return null
          const anchorOf = (position: { x: number; y: number }) => ({
            ...toPx(position),
            width: size.w,
            height: size.h,
          })
          return (
            <>
              {popupHotel && (
                <HotelPopup
                  hotel={popupHotel}
                  result={hotelResult(popupHotel.id)}
                  anchor={anchorOf(popupHotel.position)}
                  onClose={() => setPopupId(null)}
                />
              )}
              {hotHotel && hover?.source === 'map' && hotHotel.id !== popupHotel?.id && (
                <HotelTooltip
                  hotel={hotHotel}
                  result={hotelResult(hotHotel.id)}
                  anchor={anchorOf(hotHotel.position)}
                />
              )}
              {hoveredPlace && (
                <PlaceTooltip
                  name={hoveredPlace.name}
                  typeText={typeChip(hoveredPlace.type)}
                  importance={importanceOf(hoveredPlace.id)}
                  minutes={linkOf(hoveredPlace.id)?.minutes}
                  fromHotel={inspected?.name}
                  anchor={anchorOf(hoveredPlace.position)}
                />
              )}
            </>
          )
        }}
      >
        <title id="citymap-title">{`Schematic map of ${city.name}`}</title>
        <desc id="citymap-desc">
          Schematic map of the selected hotels and places. Comparison links show the
          inspected hotel only. The full data is in the Travel times table.
        </desc>

        {!selecting && (
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
                      style={{ '--w': c.importance } as CSSProperties}
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
        )}

        {selecting ? (
          <g>
            {city.places.map((p) => (
              <SelectMarker
                key={p.id}
                kind="place"
                id={p.id}
                name={p.name}
                type={p.type}
                {...p.position}
                selected={selection.place_ids.includes(p.id)}
                spot={spots.get(p.id)}
                onToggle={() => toggle('place', p.id)}
                onHover={setHovered}
              />
            ))}
            {city.hotels.map((h) => (
              <SelectMarker
                key={h.id}
                kind="hotel"
                id={h.id}
                name={h.name}
                {...h.position}
                selected={selection.hotel_ids.includes(h.id)}
                spot={spots.get(h.id)}
                onToggle={() => toggle('hotel', h.id)}
                onHover={setHovered}
              />
            ))}
            {hoveredMarker && !hoveredSelected && (
              <Label
                name={hoveredMarker.name}
                spot={
                  hoveredMarker.position.x > city.map.width - 170
                    ? {
                        x: hoveredMarker.position.x - 14,
                        y: hoveredMarker.position.y - 12,
                        anchor: 'end',
                      }
                    : {
                        x: hoveredMarker.position.x + 14,
                        y: hoveredMarker.position.y - 12,
                        anchor: 'start',
                      }
                }
                bold
              />
            )}
          </g>
        ) : (
          <g className={isStale ? 'citymap-stale-badges' : undefined}>
            {places.map((p) => (
              <PlaceMarker
                key={p.id}
                place={p}
                spot={spots.get(p.id)!}
                onHover={setHoveredPlaceId}
              />
            ))}
            {hotels.map((h) => (
              <HotelMarker
                key={h.id}
                hotel={h}
                result={resultOf(h.id)}
                spot={spots.get(h.id)!}
                inspected={h.id === inspectedHotelId}
                hot={hover?.id === h.id}
                pulse={hover?.id === h.id && hover.source === 'card'}
                onInspect={activate}
                onHover={(id) => setHover(id ? { id, source: 'map' } : null)}
              />
            ))}
          </g>
        )}
        <g className="citymap-ripples" aria-hidden="true">
          {ripples.map((r) => (
            <circle key={r.id} className="citymap-ripple" cx={r.x} cy={r.y} r={16} />
          ))}
        </g>
      </MapViewport>
      <p className="muted">
        Comparison links, not routes. Line length is not travel time.
      </p>
      {selecting && (
        <p className="muted">
          {nothingSelected
            ? 'Nothing selected yet: click markers to choose hotels and places. '
            : ''}
          Click or press Enter on a marker to select or unselect it.
        </p>
      )}
      <p aria-live="polite" data-testid="map-notice" className="citymap-notice">
        {notice}
      </p>
    </section>
  )
}
