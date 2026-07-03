import { useMutation } from '@tanstack/react-query'
import { register } from '../authApi'
import type { RegisterRequest } from '../../types/auth'

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
  })
}
