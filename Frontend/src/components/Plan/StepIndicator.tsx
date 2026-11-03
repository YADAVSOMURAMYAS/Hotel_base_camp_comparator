import { useComparatorContext } from '../../state/ComparatorContext'

const STEPS = ['City', 'Hotels & places', 'Budget']

/** Progress through the three steps: a step is done when its input is complete; the first open one is current. */
export default function StepIndicator() {
  const { city, readiness } = useComparatorContext()
  const chosen = city !== null
  const done = [
    chosen,
    chosen && readiness.hotelsNeeded === 0 && readiness.placesNeeded === 0,
    chosen && !readiness.budgetMissing,
  ]
  const current = done.indexOf(false)
  return (
    <ol className="plan-steps" aria-label="Progress">
      {STEPS.map((label, i) => (
        <li
          key={label}
          aria-current={i === current ? 'step' : undefined}
          className={done[i] ? 'plan-step plan-step-done' : 'plan-step'}
        >
          <span className="plan-step-dot" aria-hidden="true">
            {done[i] ? '✓' : i + 1}
          </span>
          <span className="plan-step-label">{label}</span>
          {done[i] && <span className="plan-visually-hidden"> (done)</span>}
        </li>
      ))}
    </ol>
  )
}
