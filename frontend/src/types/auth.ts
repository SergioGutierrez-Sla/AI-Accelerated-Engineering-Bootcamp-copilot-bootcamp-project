export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
  role: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
}

export interface MessageResponse {
  message: string
}

export interface AuthUser {
  sub: string    // userId as string
  email: string
  role: string
  exp: number    // expiry (seconds since epoch)
  iat: number    // issued at (seconds since epoch)
}

export interface ApiErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: Array<{ field: string; message: string }>
}
