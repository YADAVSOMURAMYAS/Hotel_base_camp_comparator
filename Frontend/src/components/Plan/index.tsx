import { useComparatorContext } from '../../state/ComparatorContext'
import type { ValidationError } from '../../types/contracts'
import { formatRupees } from '../../utils/currency'
import { typeChip } from '../../utils/hotelLabels'
import { MAX_HOTELS, MAX_PLACES } from '../../utils/selectionLimits'
import CityMap from '../CityMap'
import PillButton from '../ui/PillButton'
import Picker from './Picker'
import './Plan.css'

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

function FieldError({ id, error }: { id: string; error?: ValidationError }) {
  if (!error) return null
  return (
    <span id={id} role="alert" className="plan-field-error">
      ✕ {error.message}
    </span>
  )
}

interface Props {
  /** Called by the main button, and after Load Demo trip. */
  onCompare: () => void
  /** `drawer` is the same steps inside the Edit drawer: no headline, no map, "Update results". */
  variant?: 'screen' | 'drawer'
}

/** Selection screen: three steps, then "Compare hotels". Shows nothing the backend decides. */
export default function Plan({ onCompare, variant = 'screen' }: Props) {
  const inDrawer = variant === 'drawer'
  const {
    loaded,
    cities,
    citiesError,
    city,
    preset,
    inputs,
    selection,
    result,
    phase,
    error,
    readiness,
    selectCity,
    loadDemo,
    reset,
    toggleHotel,
    togglePlace,
    clearSelection,
    setBudgetText,
    setImportanceText,
  } = useComparatorContext()

  const errors = result?.errors ?? []
  const budgetError = errors.find((e) => e.field === 'budget')
  const errorFor = (placeId: string) =>
    errors.find((e) => e.field === `importances.${placeId}`)
  const places = selection.place_ids.flatMap((id) => {
    const place = city?.places.find((p) => p.id === id)
    return place ? [place] : []
  })

  // Friendly "what is still missing" lines, from the UI-only readiness object.
  const hints = [
    !city && 'Pick a city to get started.',
    city &&
      readiness.hotelsNeeded > 0 &&
      `Choose ${plural(readiness.hotelsNeeded, 'more hotel')} to compare.`,
    city &&
      readiness.placesNeeded > 0 &&
      `Choose ${plural(readiness.placesNeeded, 'more place')} you want to visit.`,
    city && readiness.budgetMissing && 'Add your budget for the complete stay.',
    ...errors.map((e) => e.message),
  ].filter(Boolean)
  const canGo = readiness.canCompare && result !== null && result.status !== 'INVALID'

  const startDemo = async () => {
    await loadDemo()
    onCompare()
  }

  return (
    <section
      className={inDrawer ? 'plan plan-drawer' : 'plan'}
      aria-label="Plan your trip"
    >
      {!inDrawer && (
        <div className="plan-hero">
          <h2 className="plan-headline">Find your perfect base camp</h2>
          <p className="plan-lede">
            Pick a city, your hotels and the places you want to reach, then set a budget.
          </p>
        </div>
      )}

      {phase === 'error' && (
        <p role="alert" className="plan-error">
          ✕ The comparison service is unavailable. {error}
        </p>
      )}

      <section className="plan-card" aria-labelledby="plan-step-city">
        <h3 id="plan-step-city">
          <span className="plan-num">1</span> City
        </h3>
        <div className="plan-row">
          <label htmlFor="plan-city-select">City</label>
          <select
            id="plan-city-select"
            value={city?.city_id ?? ''}
            onChange={(e) => e.target.value && void selectCity(e.target.value)}
          >
            {!loaded && <option value="">Choose a city…</option>}
            {city && !cities.some((c) => c.city_id === city.city_id) && (
              <option value={city.city_id}>{city.name}</option>
            )}
            {cities.map((c) => (
              <option key={c.city_id} value={c.city_id}>
                {`${c.name} (${c.hotel_count} hotels, ${c.place_count} places)`}
              </option>
            ))}
          </select>
          <PillButton disabled={phase === 'loading'} onClick={() => void startDemo()}>
            Load Demo trip
          </PillButton>
          <PillButton variant="secondary" disabled={!loaded} onClick={() => void reset()}>
            Reset
          </PillButton>
        </div>
        <p className="muted">The Demo trip uses Surmapur.</p>
        {citiesError && (
          <p className="muted">
            Could not load the city list. The Demo trip still works.
          </p>
        )}
      </section>

      <section className="plan-card" aria-labelledby="plan-step-pick">
        <h3 id="plan-step-pick">
          <span className="plan-num">2</span> Hotels &amp; places
        </h3>
        {!city ? (
          <p className="muted">Choose a city first to see its hotels and places.</p>
        ) : (
          <>
            <div className="plan-pickers">
              <Picker
                legend="Hotels"
                entries={city.hotels.map((h) => ({
                  id: h.id,
                  name: h.name,
                  district_id: h.district_id,
                  meta: formatRupees(h.stay_cost),
                }))}
                districts={city.districts}
                selectedIds={selection.hotel_ids}
                max={MAX_HOTELS}
                onToggle={toggleHotel}
              />
              <Picker
                legend="Places"
                entries={city.places.map((p) => ({
                  id: p.id,
                  name: p.name,
                  district_id: p.district_id,
                  meta: typeChip(p.type),
                }))}
                districts={city.districts}
                selectedIds={selection.place_ids}
                max={MAX_PLACES}
                onToggle={togglePlace}
              />
            </div>
            <PillButton variant="secondary" onClick={clearSelection}>
              Clear selection
            </PillButton>
            {!inDrawer && (
              <div className="plan-map">
                <CityMap selectable />
              </div>
            )}
          </>
        )}
      </section>

      <section className="plan-card" aria-labelledby="plan-step-budget">
        <h3 id="plan-step-budget">
          <span className="plan-num">3</span> Budget &amp; importance
        </h3>
        <div className="plan-row">
          <label htmlFor="plan-budget-input">Budget for the complete stay (₹)</label>
          <input
            id="plan-budget-input"
            type="text"
            inputMode="numeric"
            disabled={!city}
            value={inputs.budgetText}
            aria-invalid={budgetError ? true : undefined}
            aria-describedby={budgetError ? 'plan-budget-error' : undefined}
            onChange={(e) => setBudgetText(e.target.value)}
          />
          <FieldError id="plan-budget-error" error={budgetError} />
        </div>
        {places.length === 0 ? (
          <p className="muted">
            Places you choose appear here so you can rate each from 1 to 5.
          </p>
        ) : (
          <ul className="plan-importances">
            {places.map((place) => {
              const error = errorFor(place.id)
              const errorId = `plan-importance-${place.id}-error`
              return (
                <li key={place.id}>
                  <fieldset
                    className="plan-importance"
                    aria-describedby={error ? errorId : undefined}
                  >
                    <legend>
                      <span>{place.name}</span>{' '}
                      <span className="plan-meta">{typeChip(place.type)}</span>
                    </legend>
                    <div className="plan-segments">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} className="plan-segment">
                          <input
                            type="radio"
                            name={`importance-${place.id}`}
                            checked={inputs.importanceTexts[place.id] === String(n)}
                            onChange={() => setImportanceText(place.id, String(n))}
                          />
                          <span>{n}</span>
                        </label>
                      ))}
                    </div>
                    <span className="muted">
                      original:{' '}
                      {preset?.importances[place.id] ?? place.default_importance}
                    </span>
                    <FieldError id={errorId} error={error} />
                  </fieldset>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="plan-cta">
        {!canGo && hints.length > 0 && (
          <ul className="plan-hints" aria-live="polite">
            {hints.map((h) => (
              <li key={String(h)}>{h}</li>
            ))}
          </ul>
        )}
        <PillButton arrow disabled={!canGo} onClick={onCompare}>
          {inDrawer ? 'Update results' : 'Compare hotels'}
        </PillButton>
      </div>
    </section>
  )
}
