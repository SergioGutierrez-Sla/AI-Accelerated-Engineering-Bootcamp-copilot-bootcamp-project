import { useMutation } from '@tanstack/react-query'
import { login } from '../authApi'
import type { LoginRequest } from '../../types/auth'

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
  })
}
