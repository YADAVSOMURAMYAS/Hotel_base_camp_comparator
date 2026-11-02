import { useComparatorContext } from '../../state/ComparatorContext'
import type { PlaceType, ValidationError } from '../../types/contracts'
import { formatRupees } from '../../utils/currency'
import './Controls.css'

const TYPE_CHIP: Record<PlaceType, string> = {
  attraction: '◆ Attraction',
  food: '● Food',
}

/** The API message for one field, shown beside the input it belongs to. */
function FieldError({ id, error }: { id: string; error?: ValidationError }) {
  if (!error) return null
  return (
    <span id={id} role="alert" className="controls-field-error">
      ✕ {error.message}
    </span>
  )
}

export default function Controls() {
  const {
    loaded,
    city,
    preset,
    inputs,
    selection,
    result,
    phase,
    loadDemo,
    reset,
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

  return (
    // data-testid is temporary: keeps App smoke test green until T14 removes stub test IDs
    <section className="panel controls" aria-label="Controls" data-testid="controls-stub">
      <h2>Controls</h2>

      <div className="controls-actions">
        <button
          type="button"
          disabled={phase === 'loading'}
          onClick={() => void loadDemo()}
        >
          Load Demo trip
        </button>
        <button
          type="button"
          className="controls-secondary"
          disabled={!loaded}
          onClick={() => void reset()}
        >
          Reset
        </button>
      </div>
      {!loaded && <p className="muted">Load the Demo trip to enable these controls.</p>}

      <div className="controls-budget">
        <label htmlFor="controls-budget-input">Budget for the complete stay (₹)</label>
        <input
          id="controls-budget-input"
          type="text"
          inputMode="numeric"
          disabled={!loaded}
          value={inputs.budgetText}
          aria-invalid={budgetError ? true : undefined}
          aria-describedby={budgetError ? 'controls-budget-error' : undefined}
          onChange={(e) => setBudgetText(e.target.value)}
        />
        {result?.budget != null && (
          <span className="muted">{`Applied by backend: ${formatRupees(result.budget)}`}</span>
        )}
        <FieldError id="controls-budget-error" error={budgetError} />
      </div>

      <fieldset className="controls-importances" disabled={!loaded}>
        <legend>Importance per place (1–5)</legend>
        <ul>
          {places.map((place) => {
            const error = errorFor(place.id)
            const inputId = `controls-importance-${place.id}`
            const errorId = `${inputId}-error`
            return (
              <li key={place.id} className="controls-row">
                <span className="controls-place-name">{place.name}</span>
                <span className={`controls-chip controls-chip-${place.type}`}>
                  {TYPE_CHIP[place.type]}
                </span>
                <label htmlFor={inputId}>Importance for {place.name}</label>
                <input
                  id={inputId}
                  type="text"
                  inputMode="numeric"
                  value={inputs.importanceTexts[place.id] ?? ''}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(e) => setImportanceText(place.id, e.target.value)}
                />
                <span className="muted">1–5</span>
                <span className="muted">original: {preset?.importances[place.id]}</span>
                <FieldError id={errorId} error={error} />
              </li>
            )
          })}
        </ul>
      </fieldset>
    </section>
  )
}
