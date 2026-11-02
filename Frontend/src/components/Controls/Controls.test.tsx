import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useComparatorContext } from '../../state/ComparatorContext'
import type { Comparator } from '../../state/useComparator'
import type { ComparisonResult, ValidationError } from '../../types/contracts'
import Controls from './index'
import {
  idleComparator,
  loadedComparator,
  noHotelResult,
  okResult,
  sampleCity,
  samplePreset,
} from './renderWithComparator'

vi.mock('../../state/ComparatorContext', () => ({ useComparatorContext: vi.fn() }))

function show(comparator: Comparator) {
  vi.mocked(useComparatorContext).mockReturnValue(comparator)
  return render(<Controls />)
}

function invalidWith(errors: ValidationError[]): ComparisonResult {
  return {
    ...okResult,
    status: 'INVALID',
    errors,
    budget: null,
    recommended_hotel_id: null,
    hotels: [],
  }
}

const budgetInput = () => screen.getByLabelText('Budget for the complete stay (₹)')
const placeName = (id: string) => sampleCity.places.find((p) => p.id === id)!.name
const importanceInput = (id: string) =>
  screen.getByLabelText(`Importance for ${placeName(id)}`)

describe('Controls before load', () => {
  it('enables only the Load button and shows a hint', () => {
    show(idleComparator())
    expect(screen.getByRole('button', { name: 'Load Demo trip' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
    expect(budgetInput()).toBeDisabled()
    expect(screen.getByText(/Load the Demo trip to enable these controls/)).toBeVisible()
  })

  it('disables Load while loading and keeps its label', () => {
    show(idleComparator({ phase: 'loading' }))
    expect(screen.getByRole('button', { name: 'Load Demo trip' })).toBeDisabled()
  })

  it('calls loadDemo when Load is clicked', async () => {
    const comparator = idleComparator()
    show(comparator)
    await userEvent.click(screen.getByRole('button', { name: 'Load Demo trip' }))
    expect(comparator.loadDemo).toHaveBeenCalledTimes(1)
  })
})

describe('Controls after load', () => {
  it('keeps Load enabled with the same label and enables the rest', () => {
    show(loadedComparator())
    expect(screen.getByRole('button', { name: 'Load Demo trip' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled()
    expect(budgetInput()).toBeEnabled()
    expect(screen.queryByText(/to enable these controls/)).not.toBeInTheDocument()
  })

  it('renders one labelled importance row per preset place, in selection order', () => {
    show(loadedComparator())
    const group = screen.getByRole('group', { name: 'Importance per place (1–5)' })
    const rows = within(group).getAllByRole('listitem')
    expect(rows).toHaveLength(15)
    samplePreset.place_ids.forEach((id, i) => {
      expect(within(rows[i]).getByText(placeName(id))).toBeInTheDocument()
      expect(importanceInput(id)).toHaveValue(String(samplePreset.importances[id]))
      expect(
        within(rows[i]).getByText(`original: ${samplePreset.importances[id]}`),
      ).toBeInTheDocument()
    })
  })

  it('shows a text-and-symbol type chip for attractions and food', () => {
    show(loadedComparator())
    expect(screen.getAllByText(/◆ Attraction/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/● Food/).length).toBeGreaterThan(0)
  })

  it('shows the budget the backend applied, formatted in rupees', () => {
    show(loadedComparator())
    expect(screen.getByText(/Applied by backend: ₹30,000/)).toBeInTheDocument()
  })

  it('hides the applied budget when the result has none', () => {
    show(loadedComparator({ result: invalidWith([]) }))
    expect(screen.queryByText(/Applied by backend/)).not.toBeInTheDocument()
  })

  it('calls reset when Reset is clicked', async () => {
    const comparator = loadedComparator()
    show(comparator)
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(comparator.reset).toHaveBeenCalledTimes(1)
  })

  it('keeps the inputs editable while a comparison is loading', () => {
    show(loadedComparator({ phase: 'loading', isStale: true }))
    expect(budgetInput()).toBeEnabled()
    expect(importanceInput('CLOCK')).toBeEnabled()
  })
})

describe('Controls input forwarding', () => {
  it.each(['-5', '12.5', 'abc'])('forwards budget text %j exactly as typed', (text) => {
    const comparator = loadedComparator()
    show(comparator)
    fireEvent.change(budgetInput(), { target: { value: text } })
    expect(comparator.setBudgetText).toHaveBeenCalledWith(text)
  })

  it('uses a text input with a numeric keyboard hint, not type=number', () => {
    show(loadedComparator())
    expect(budgetInput()).toHaveAttribute('type', 'text')
    expect(budgetInput()).toHaveAttribute('inputmode', 'numeric')
  })

  it.each(['0', '6'])('forwards importance text %j with the place id', (text) => {
    const comparator = loadedComparator()
    show(comparator)
    fireEvent.change(importanceInput('MUSEUM'), { target: { value: text } })
    expect(comparator.setImportanceText).toHaveBeenCalledWith('MUSEUM', text)
  })
})

describe('Controls field-level errors', () => {
  const budgetError = {
    field: 'budget',
    code: 'BUDGET_INVALID',
    message: 'Budget must be a whole number from 0 to 1,000,000',
  }
  const importanceError = {
    field: 'importances.MUSEUM',
    code: 'IMPORTANCE_INVALID',
    message: 'Importance for MUSEUM must be a whole number from 1 to 5',
  }

  it('marks the budget input invalid and links its message', () => {
    show(loadedComparator({ result: invalidWith([budgetError]) }))
    expect(budgetInput()).toHaveAttribute('aria-invalid', 'true')
    expect(budgetInput()).toHaveAccessibleDescription(new RegExp(budgetError.message))
  })

  it('marks only the failing importance input', () => {
    show(loadedComparator({ result: invalidWith([importanceError]) }))
    expect(importanceInput('MUSEUM')).toHaveAttribute('aria-invalid', 'true')
    expect(importanceInput('MUSEUM')).toHaveAccessibleDescription(
      new RegExp(importanceError.message),
    )
    expect(importanceInput('CLOCK')).not.toHaveAttribute('aria-invalid', 'true')
    expect(budgetInput()).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('does not mark any input for errors on other fields', () => {
    const other = {
      field: 'hotel_ids',
      code: 'HOTEL_COUNT',
      message: 'Pick 2 to 10 hotels',
    }
    show(loadedComparator({ result: invalidWith([other]) }))
    expect(budgetInput()).not.toHaveAttribute('aria-invalid', 'true')
    expect(importanceInput('CLOCK')).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText(other.message)).not.toBeInTheDocument()
  })

  it('marks nothing for an OK or NO_AFFORDABLE_HOTEL result', () => {
    show(loadedComparator({ result: noHotelResult }))
    expect(budgetInput()).not.toHaveAttribute('aria-invalid', 'true')
  })
})
