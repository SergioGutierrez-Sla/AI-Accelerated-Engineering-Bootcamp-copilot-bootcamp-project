import { createContext, useContext, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import type { AuthUser } from '../types/auth'

const AUTH_TOKEN_KEY = 'auth_token'

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function tryDecodeToken(token: string): AuthUser | null {
  try {
    return jwtDecode<AuthUser>(token)
  } catch {
    return null
  }
}

function isTokenExpired(user: AuthUser): boolean {
  return user.exp * 1000 < Date.now()
}

function loadStoredToken(): string | null {
  const stored = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!stored) return null
  const decoded = tryDecodeToken(stored)
  if (!decoded || isTokenExpired(decoded)) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    return null
  }
  return stored
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(loadStoredToken)

  const user = useMemo((): AuthUser | null => {
    if (!token) return null
    const decoded = tryDecodeToken(token)
    if (!decoded || isTokenExpired(decoded)) return null
    return decoded
  }, [token])

  function login(newToken: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken)
    setToken(newToken)
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setToken(null)
  }

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated: !!user,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
