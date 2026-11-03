import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Card from './Card'
import { Chip, ChipToggle } from './Chip'
import PillButton from './PillButton'

describe('ui pieces', () => {
  it('PillButton fires onClick, hides the arrow from the accessible name', async () => {
    const onClick = vi.fn()
    render(
      <PillButton arrow onClick={onClick}>
        Compare hotels
      </PillButton>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Compare hotels' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('PillButton does not fire when disabled', async () => {
    const onClick = vi.fn()
    render(
      <PillButton disabled onClick={onClick}>
        Go
      </PillButton>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('ChipToggle exposes its state with aria-pressed', () => {
    const { rerender } = render(<ChipToggle pressed={false}>Hotel A</ChipToggle>)
    expect(screen.getByRole('button', { name: 'Hotel A' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    rerender(<ChipToggle pressed>Hotel A</ChipToggle>)
    expect(screen.getByRole('button', { name: /Hotel A/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('Chip and Card render their content', () => {
    render(
      <Card accent>
        <Chip>Surmapur</Chip>
      </Card>,
    )
    expect(screen.getByText('Surmapur')).toBeInTheDocument()
  })
})
