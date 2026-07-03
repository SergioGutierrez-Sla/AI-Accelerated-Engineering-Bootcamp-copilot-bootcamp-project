import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PetDetailPage } from '../pages/PetDetailPage'
import { AuthProvider } from '../context/AuthContext'
import * as petApi from '../api/petApi'
import * as jwtDecode from 'jwt-decode'

jest.mock('../api/petApi', () => ({
  getPet: jest.fn(),
  listEvents: jest.fn(),
  listAppointments: jest.fn(),
  createEvent: jest.fn(),
  createAppointment: jest.fn(),
  updateEvent: jest.fn(),
  updateAppointment: jest.fn(),
  deleteEvent: jest.fn(),
  deleteAppointment: jest.fn(),
}))

jest.mock('../api/authApi', () => ({
  apiClient: { interceptors: { request: { use: jest.fn() } } },
}))

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}))

const mockGetPet = petApi.getPet as jest.MockedFunction<typeof petApi.getPet>
const mockListEvents = petApi.listEvents as jest.MockedFunction<typeof petApi.listEvents>
const mockListAppointments = petApi.listAppointments as jest.MockedFunction<
  typeof petApi.listAppointments
>
const mockJwtDecode = (jwtDecode as unknown as { jwtDecode: jest.Mock }).jwtDecode

function renderPetDetailPage(petId = '1') {
  const futureExp = Math.floor(Date.now() / 1000) + 3600
  mockJwtDecode.mockReturnValue({
    sub: '10',
    email: 'owner@test.com',
    role: 'ROLE_USER',
    exp: futureExp,
    iat: Math.floor(Date.now() / 1000),
  })
  localStorage.setItem('auth_token', 'fake.valid.token')

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/pets/${petId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/pets/:petId" element={<PetDetailPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PetDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('shows loading skeletons while fetching pet data', () => {
    mockGetPet.mockImplementation(() => new Promise(() => {}))
    mockListAppointments.mockImplementation(() => new Promise(() => {}))
    mockListEvents.mockImplementation(() => new Promise(() => {}))
    renderPetDetailPage()
    // Loading state: skeletons are present (pulse animation divs)
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders pet header and tabs after loading', async () => {
    mockGetPet.mockResolvedValue({
      id: 1,
      name: 'Buddy',
      species: 'Dog',
      breed: 'Labrador',
      photoUrl: null,
    })
    mockListAppointments.mockResolvedValue([])
    mockListEvents.mockResolvedValue([])
    renderPetDetailPage()

    expect(await screen.findByText('Buddy')).toBeInTheDocument()
    expect(screen.getByText(/dog/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /appointments/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /health events/i })).toBeInTheDocument()
  })

  it('defaults to Appointments tab and shows empty state', async () => {
    mockGetPet.mockResolvedValue({ id: 1, name: 'Buddy', species: 'Dog', breed: null, photoUrl: null })
    mockListAppointments.mockResolvedValue([])
    mockListEvents.mockResolvedValue([])
    renderPetDetailPage()

    expect(await screen.findByText(/no appointments scheduled yet/i)).toBeInTheDocument()
  })

  it('switches to Events tab and shows empty state', async () => {
    const user = userEvent.setup()
    mockGetPet.mockResolvedValue({ id: 1, name: 'Buddy', species: 'Dog', breed: null, photoUrl: null })
    mockListAppointments.mockResolvedValue([])
    mockListEvents.mockResolvedValue([])
    renderPetDetailPage()

    await screen.findByText(/no appointments/i)
    await user.click(screen.getByRole('button', { name: /health events/i }))

    expect(await screen.findByText(/no health events recorded yet/i)).toBeInTheDocument()
  })

  it('renders appointments list when data exists', async () => {
    mockGetPet.mockResolvedValue({ id: 1, name: 'Buddy', species: 'Dog', breed: null, photoUrl: null })
    mockListAppointments.mockResolvedValue([
      {
        id: 1,
        appointmentType: 'CHECK_UP' as const,
        dateTime: '2099-08-01T10:30',
        clinicOrDoctor: 'City Clinic',
        notes: null,
      },
    ])
    mockListEvents.mockResolvedValue([])
    renderPetDetailPage()

    expect(await screen.findByText(/City Clinic/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit appointment/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete appointment/i })).toBeInTheDocument()
  })

  it('opens schedule appointment modal when clicking Schedule button', async () => {
    const user = userEvent.setup()
    mockGetPet.mockResolvedValue({ id: 1, name: 'Buddy', species: 'Dog', breed: null, photoUrl: null })
    mockListAppointments.mockResolvedValue([])
    mockListEvents.mockResolvedValue([])
    renderPetDetailPage()

    await screen.findByText(/no appointments/i)
    // Click the header '+ Schedule' button (not the empty-state one)
    const scheduleButtons = screen.getAllByRole('button', { name: /schedule/i })
    await user.click(scheduleButtons[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Schedule Appointment')).toBeInTheDocument()
  })

  it('shows 403 error page when access is denied', async () => {
    const error = { response: { status: 403 } }
    mockGetPet.mockRejectedValue(error)
    mockListEvents.mockResolvedValue([])
    mockListAppointments.mockResolvedValue([])
    renderPetDetailPage()

    expect(await screen.findByText(/access denied/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to my pets/i })).toBeInTheDocument()
  })

  it('shows 404 error page when pet is not found', async () => {
    const error = { response: { status: 404 } }
    mockGetPet.mockRejectedValue(error)
    mockListEvents.mockResolvedValue([])
    mockListAppointments.mockResolvedValue([])
    renderPetDetailPage()

    expect(await screen.findByText(/pet not found/i)).toBeInTheDocument()
  })

  it('opens delete confirmation modal when clicking Delete on an appointment', async () => {
    const user = userEvent.setup()
    mockGetPet.mockResolvedValue({ id: 1, name: 'Buddy', species: 'Dog', breed: null, photoUrl: null })
    mockListAppointments.mockResolvedValue([
      {
        id: 1,
        appointmentType: 'CHECK_UP' as const,
        dateTime: '2099-08-01T10:30',
        clinicOrDoctor: 'City Clinic',
        notes: null,
      },
    ])
    mockListEvents.mockResolvedValue([])
    renderPetDetailPage()

    await screen.findByText(/City Clinic/i)
    await user.click(screen.getByRole('button', { name: /delete appointment/i }))

    expect(await screen.findByText('Confirm Delete')).toBeInTheDocument()
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
  })
})
