// Mirrors docs/API_SPECIFICATION.md field for field. Change the doc first, then this file.

/** A value the UI forwards untouched; the backend validator judges it. */
export type RawValue = number | string | boolean | null

export type Status = 'OK' | 'NO_AFFORDABLE_HOTEL' | 'INVALID'
export type HotelLabel = 'RECOMMENDED' | 'RANKED' | 'OVER_BUDGET'
export type PlaceType = 'attraction' | 'food'

export interface ValidationError {
  field: string
  code: string
  message: string
}

export interface Contribution {
  place_id: string
  minutes: number
  importance: number
  contribution: number
}

export interface HotelResult {
  id: string
  name: string
  stay_cost: number
  affordable: boolean
  rank: number | null
  remaining_budget: number | null
  shortfall: number | null
  label: HotelLabel
  weighted_total: number
  weighted_average_display: string
  longest_trip: number
  contributions: Contribution[]
}

export interface ComparisonResult {
  status: Status
  errors: ValidationError[]
  importance_total: number | null
  budget: number | null
  recommended_hotel_id: string | null
  default_inspected_hotel_id: string | null
  hotels: HotelResult[]
}

export interface Position {
  x: number
  y: number
}

export interface District {
  id: string
  name: string
}

export interface CatalogHotel {
  id: string
  name: string
  stay_cost: number
  district_id: string
  position: Position
}

export interface CatalogPlace {
  id: string
  name: string
  type: PlaceType
  default_importance: number
  district_id: string
  position: Position
}

export interface City {
  city_id: string
  name: string
  map: { width: number; height: number }
  districts: District[]
  hotels: CatalogHotel[]
  places: CatalogPlace[]
  round_trip_minutes: Record<string, Record<string, number>>
  has_demo_preset: boolean
}

export interface CitySummary {
  city_id: string
  name: string
  hotel_count: number
  place_count: number
  has_demo_preset: boolean
}

export interface DemoPreset {
  city_id: string
  hotel_ids: string[]
  place_ids: string[]
  importances: Record<string, number>
  budget: number
}

export interface CompareRequest {
  city_id: string
  hotel_ids: string[]
  place_ids: string[]
  importances: Record<string, RawValue>
  budget: RawValue
}
