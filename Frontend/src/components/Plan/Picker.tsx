import { useState } from 'react'
import type { District } from '../../types/contracts'
import { ChipToggle } from '../ui/Chip'

export interface Entry {
  id: string
  name: string
  district_id: string
  meta: string
}

interface Props {
  legend: 'Hotels' | 'Places'
  entries: Entry[]
  districts: District[]
  selectedIds: string[]
  max: number
  onToggle: (id: string) => void
}

/** One searchable group of chips per district; a checkmark shows what is chosen. */
export default function Picker({
  legend,
  entries,
  districts,
  selectedIds,
  max,
  onToggle,
}: Props) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const shown = entries.filter(
    (e) => e.name.toLowerCase().includes(needle) || e.id.toLowerCase().includes(needle),
  )
  const atLimit = selectedIds.length >= max
  const word = legend.toLowerCase()
  const searchId = `plan-search-${word}`

  return (
    <fieldset className="plan-picker">
      <legend>{legend}</legend>
      <p className="plan-counter" aria-live="polite">
        {`${selectedIds.length}/${max} ${word}`}
      </p>
      {atLimit && (
        <p className="plan-limit">{`Limit of ${max} ${word} reached. Untick one to choose another.`}</p>
      )}
      <label htmlFor={searchId} className="plan-search-label">{`Search ${word}`}</label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Name or ID"
      />
      {shown.length === 0 && <p className="muted">{`No ${word} match.`}</p>}
      <div className="plan-scroll">
        {districts.map((district) => {
          const inDistrict = shown.filter((e) => e.district_id === district.id)
          if (inDistrict.length === 0) return null
          return (
            <div key={district.id} className="plan-district">
              <h4>{district.name}</h4>
              <div className="plan-chips">
                {inDistrict.map((e) => {
                  const pressed = selectedIds.includes(e.id)
                  return (
                    <ChipToggle
                      key={e.id}
                      pressed={pressed}
                      disabled={atLimit && !pressed}
                      onClick={() => onToggle(e.id)}
                    >
                      <span>{e.name}</span>
                      <span className="plan-meta">{e.meta}</span>
                    </ChipToggle>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
