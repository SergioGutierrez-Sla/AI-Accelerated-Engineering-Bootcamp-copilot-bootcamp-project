import axios from 'axios'
import type {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  PasswordResetConfirmRequest,
  MessageResponse,
} from '../types/auth'

const BASE_URL =
  ((import.meta as unknown) as { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const apiClient = axios.create({ baseURL: BASE_URL })

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function register(data: RegisterRequest): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/api/auth/register', data)
  return response.data
}

export async function verifyEmail(token: string): Promise<MessageResponse> {
  const response = await apiClient.get<MessageResponse>('/api/auth/verify-email', {
    params: { token },
  })
  return response.data
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', data)
  return response.data
}

export async function requestPasswordReset(email: string): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/api/auth/password-reset/request', {
    email,
  })
  return response.data
}

export async function confirmPasswordReset(
  data: PasswordResetConfirmRequest,
): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/api/auth/password-reset/confirm', data)
  return response.data
}
