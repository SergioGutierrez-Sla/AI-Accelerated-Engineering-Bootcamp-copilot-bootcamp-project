import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '../pages/LoginPage'
import { AuthProvider } from '../context/AuthContext'
import * as authApi from '../api/authApi'

// Mock the auth API module
jest.mock('../api/authApi', () => ({
  login: jest.fn(),
  apiClient: { interceptors: { request: { use: jest.fn() } } },
}))

const mockLogin = authApi.login as jest.MockedFunction<typeof authApi.login>

function renderLoginPage(initialPath = '/login') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('renders email and password inputs and submit button', () => {
    renderLoginPage()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows a forgot password link', () => {
    renderLoginPage()
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })

  it('shows inline validation error when submitting empty form', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
  })

  it('calls login API with correct credentials on submit', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ token: 'fake-jwt', expiresIn: 3600, role: 'ROLE_USER' })
    renderLoginPage()

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password1',
    }))
  })

  it('redirects to /dashboard on successful login', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ token: 'fake-jwt', expiresIn: 3600, role: 'ROLE_USER' })
    renderLoginPage()

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/dashboard page/i)).toBeInTheDocument()
  })

  it('shows error alert on 401 invalid credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Invalid email or password.' } },
    })
    renderLoginPage()

    await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'WrongPass1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i)
  })

  it('shows error alert on 403 unverified account', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 403,
        data: { message: 'Your email address has not been verified. Please check your inbox.' },
      },
    })
    renderLoginPage()

    await user.type(screen.getByLabelText(/email address/i), 'unverified@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/not been verified/i)
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()
    mockLogin.mockImplementation(() => new Promise(() => {})) // never resolves
    renderLoginPage()

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })
})
