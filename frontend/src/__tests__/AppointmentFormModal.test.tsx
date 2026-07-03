import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppointmentFormModal } from '../components/pets/AppointmentFormModal'

function renderModal(props: Partial<React.ComponentProps<typeof AppointmentFormModal>> = {}) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AppointmentFormModal
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

describe('AppointmentFormModal', () => {
  it('renders all form fields in create mode', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Schedule Appointment')).toBeInTheDocument()
    expect(screen.getByLabelText(/^type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date and time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/clinic or doctor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('shows edit mode title and pre-populates fields when appointment is provided', () => {
    renderModal({
      appointment: {
        id: 1,
        appointmentType: 'SURGERY',
        dateTime: '2026-09-15T09:00',
        clinicOrDoctor: 'Animal Hospital',
        notes: 'Pre-op check required',
      },
    })
    expect(screen.getByText('Edit Appointment')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Animal Hospital')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Pre-op check required')).toBeInTheDocument()
  })

  it('shows validation error when clinic field is empty', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn()
    renderModal({ onSubmit: mockSubmit })

    await user.click(screen.getByRole('button', { name: /schedule/i }))

    expect(await screen.findByText(/clinic or doctor.*required/i)).toBeInTheDocument()
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn()
    renderModal({ onSubmit: mockSubmit })

    await user.type(screen.getByLabelText(/clinic or doctor/i), 'City Clinic')
    // datetime-local input
    const dtInput = screen.getByLabelText(/date and time/i)
    await user.type(dtInput, '2026-08-01T10:30')

    await user.click(screen.getByRole('button', { name: /schedule/i }))

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicOrDoctor: 'City Clinic',
        appointmentType: 'CHECK_UP',
      }),
    )
  })

  it('shows loading state and disables save button', () => {
    renderModal({ isLoading: true })
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('shows API error alert inside the modal', () => {
    renderModal({ apiError: 'Failed to save appointment.' })
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save appointment.')
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
