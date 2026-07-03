import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventFormModal } from '../components/pets/EventFormModal'

function renderModal(props: Partial<React.ComponentProps<typeof EventFormModal>> = {}) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EventFormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          isLoading={false}
          apiError={null}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EventFormModal', () => {
  it('renders all form fields in create mode', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Record Health Event')).toBeInTheDocument()
    expect(screen.getByLabelText(/event type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/clinic or vet/i)).toBeInTheDocument()
  })

  it('shows edit mode title and pre-populates fields when event is provided', () => {
    renderModal({
      event: {
        id: 1,
        eventType: 'ALLERGY',
        title: 'Pollen allergy',
        date: '2026-05-10',
        description: 'Sneezing in spring',
        clinicOrVet: 'Dr. Jones',
      },
    })
    expect(screen.getByText('Edit Health Event')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Pollen allergy')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-05-10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Sneezing in spring')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dr. Jones')).toBeInTheDocument()
  })

  it('shows validation errors when submitting with empty required fields', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn()
    renderModal({ onSubmit: mockSubmit })

    // Clear the title field and submit
    const titleInput = screen.getByLabelText(/title/i)
    await user.clear(titleInput)
    await user.click(screen.getByRole('button', { name: /save event/i }))

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn()
    renderModal({ onSubmit: mockSubmit })

    await user.type(screen.getByLabelText(/title/i), 'Annual vaccine')
    await user.type(screen.getByLabelText(/^date/i), '2026-08-01')
    await user.click(screen.getByRole('button', { name: /save event/i }))

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Annual vaccine',
        date: '2026-08-01',
        eventType: 'VACCINE',
      }),
    )
  })

  it('shows loading state and disables save button', () => {
    renderModal({ isLoading: true })
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('shows API error alert inside the modal', () => {
    renderModal({ apiError: 'Something went wrong on the server.' })
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong on the server.')
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const mockClose = jest.fn()
    renderModal({ onClose: mockClose })

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
