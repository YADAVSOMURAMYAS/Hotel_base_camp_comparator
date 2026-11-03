import type { CSSProperties, ReactNode } from 'react'
import type { CatalogHotel, HotelResult } from '../../types/contracts'
import { formatRupees } from '../../utils/currency'
import { overBudgetBy, statusLabel } from '../../utils/hotelLabels'
import './MapCards.css'

interface Anchor {
  /** Pixel position of the marker inside the map box. */
  x: number
  y: number
  /** Map box size, so a card near the right or bottom edge flips to stay visible. */
  width: number
  height: number
}

const CARD_WIDTH = 240
const CARD_HEIGHT = 190

function place({ x, y, width, height }: Anchor): CSSProperties {
  const left = x + 20 + CARD_WIDTH > width ? x - 20 - CARD_WIDTH : x + 20
  const top = Math.min(Math.max(8, y - 16), Math.max(8, height - CARD_HEIGHT))
  return { left: Math.max(8, left), top, width: CARD_WIDTH }
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mapcard-line">
      <span className="muted">{label}</span>
      <span>{children}</span>
    </div>
  )
}

/** Hover card for a hotel: name, status, score, price, longest trip; catalog data only without a result. */
export function HotelTooltip(props: {
  hotel: CatalogHotel
  result?: HotelResult
  anchor: Anchor
}) {
  const { hotel, result, anchor } = props
  return (
    <div className="mapcard mapcard-tooltip" style={place(anchor)} role="presentation">
      <strong>{hotel.name}</strong>
      {result && <span className="mapcard-status">{statusLabel(result.label)}</span>}
      {result && (
        <Line label="Score">{`${result.weighted_average_display} min average`}</Line>
      )}
      <Line label="Complete stay">{formatRupees(hotel.stay_cost)}</Line>
      {result && <Line label="Longest trip">{`${result.longest_trip} min`}</Line>}
    </div>
  )
}

/** Hover card for a place: name, type and the importance and trip time the API reported. */
export function PlaceTooltip(props: {
  name: string
  typeText: string
  importance?: number
  minutes?: number
  fromHotel?: string
  anchor: Anchor
}) {
  const { name, typeText, importance, minutes, fromHotel, anchor } = props
  return (
    <div className="mapcard mapcard-tooltip" style={place(anchor)} role="presentation">
      <strong>{name}</strong>
      <span className="mapcard-status">{typeText}</span>
      {importance !== undefined && <Line label="Importance">{`${importance} of 5`}</Line>}
      {minutes !== undefined && fromHotel && (
        <Line label={`Round trip from ${fromHotel}`}>{`${minutes} min`}</Line>
      )}
    </div>
  )
}

/** Detail popup that stays open after a click on a hotel marker. */
export function HotelPopup(props: {
  hotel: CatalogHotel
  result?: HotelResult
  anchor: Anchor
  onClose: () => void
}) {
  const { hotel, result, anchor, onClose } = props
  return (
    <div
      className="mapcard mapcard-popup"
      style={place(anchor)}
      role="group"
      aria-label={`Details for ${hotel.name}`}
    >
      <div className="mapcard-head">
        <strong>{hotel.name}</strong>
        <button type="button" aria-label="Close details" onClick={onClose}>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      {result && <span className="mapcard-status">{statusLabel(result.label)}</span>}
      <Line label="Complete stay">{formatRupees(hotel.stay_cost)}</Line>
      {result?.shortfall != null && (
        <Line label="Budget">{overBudgetBy(result.shortfall)}</Line>
      )}
      {result?.remaining_budget != null && (
        <Line label="Budget">{`${formatRupees(result.remaining_budget)} left`}</Line>
      )}
      {result && (
        <>
          <Line label="Score">{`${result.weighted_average_display} min average`}</Line>
          <Line label="Weighted total">{`${result.weighted_total} importance-minutes`}</Line>
          <Line label="Longest trip">{`${result.longest_trip} min`}</Line>
        </>
      )}
    </div>
  )
}
