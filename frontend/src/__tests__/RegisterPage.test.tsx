import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RegisterPage } from '../pages/RegisterPage'
import { AuthProvider } from '../context/AuthContext'
import * as authApi from '../api/authApi'

jest.mock('../api/authApi', () => ({
  register: jest.fn(),
  apiClient: { interceptors: { request: { use: jest.fn() } } },
}))

const mockRegister = authApi.register as jest.MockedFunction<typeof authApi.register>

function renderRegisterPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/register']}>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('renders all registration form fields', () => {
    renderRegisterPage()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create my account/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty form submission', async () => {
    const user = userEvent.setup()
    renderRegisterPage()
    await user.click(screen.getByRole('button', { name: /create my account/i }))
    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })

  it('shows password strength indicator when typing password', async () => {
    const user = userEvent.setup()
    renderRegisterPage()
    await user.type(screen.getByLabelText(/^password$/i), 'weak')
    expect(await screen.findByText(/password strength/i)).toBeInTheDocument()
  })

  it('validates password does not meet requirements', async () => {
    const user = userEvent.setup()
    renderRegisterPage()
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email address/i), 'john@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'weak')
    await user.click(screen.getByRole('button', { name: /create my account/i }))
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('validates passwords must match', async () => {
    const user = userEvent.setup()
    renderRegisterPage()
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password2')
    await user.click(screen.getByRole('button', { name: /create my account/i }))
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('shows success message after successful registration', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({
      message: 'Registration successful. Please check your email to verify your account.',
    })
    renderRegisterPage()

    await user.type(screen.getByLabelText(/first name/i), 'Sergio')
    await user.type(screen.getByLabelText(/last name/i), 'Gutierrez')
    await user.type(screen.getByLabelText(/email address/i), 'sergio@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /create my account/i }))

    expect(
      await screen.findByText(/registration successful/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go to sign in/i })).toBeInTheDocument()
  })

  it('shows error alert on 409 duplicate email', async () => {
    const user = userEvent.setup()
    mockRegister.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: 'An account with this email address already exists.' },
      },
    })
    renderRegisterPage()

    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email address/i), 'taken@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /create my account/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i),
    )
  })
})
