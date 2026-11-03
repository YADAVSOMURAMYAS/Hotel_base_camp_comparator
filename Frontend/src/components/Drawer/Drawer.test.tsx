import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Drawer from '.'

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  const close = () => {
    onClose()
    setOpen(false)
  }
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && (
        <Drawer title="Edit your trip" onClose={close}>
          <input aria-label="first" />
          <input aria-label="second" />
        </Drawer>
      )}
    </>
  )
}

describe('Drawer', () => {
  it('is a labelled modal dialog and focuses its first control', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit your trip' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('closes on Escape and gives focus back to the opener', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(opener)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    // Close -> first -> second -> (wraps) Close
    await userEvent.tab()
    expect(screen.getByLabelText('first')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByLabelText('second')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByLabelText('second')).toHaveFocus()
  })

  it('closes from the Close button and from the backdrop', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(document.querySelector('.drawer-backdrop')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('stops the page behind from scrolling while open and restores it after', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(document.body.style.overflow).toBe('hidden')
    await userEvent.keyboard('{Escape}')
    expect(document.body.style.overflow).toBe('')
  })
})
