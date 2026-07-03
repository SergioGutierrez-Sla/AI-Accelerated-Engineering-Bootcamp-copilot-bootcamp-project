import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../routing/ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'
import * as jwtDecodeModule from 'jwt-decode'

// Mock jwt-decode so we control what the token decodes to
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}))

const mockJwtDecode = jwtDecodeModule.jwtDecode as jest.MockedFunction<typeof jwtDecodeModule.jwtDecode>

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected dashboard content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('redirects unauthenticated user to /login', () => {
    renderProtectedRoute()
    expect(screen.getByText(/login page/i)).toBeInTheDocument()
    expect(screen.queryByText(/protected dashboard/i)).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated with valid token', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    mockJwtDecode.mockReturnValue({
      sub: '1',
      email: 'test@example.com',
      role: 'ROLE_USER',
      exp: futureExp,
      iat: Math.floor(Date.now() / 1000),
    })
    localStorage.setItem('auth_token', 'valid.fake.token')

    renderProtectedRoute()
    expect(screen.getByText(/protected dashboard content/i)).toBeInTheDocument()
    expect(screen.queryByText(/login page/i)).not.toBeInTheDocument()
  })

  it('redirects to /login when stored token is expired', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600
    mockJwtDecode.mockReturnValue({
      sub: '1',
      email: 'test@example.com',
      role: 'ROLE_USER',
      exp: pastExp,
      iat: pastExp - 3600,
    })
    localStorage.setItem('auth_token', 'expired.fake.token')

    renderProtectedRoute()
    expect(screen.getByText(/login page/i)).toBeInTheDocument()
  })
})
