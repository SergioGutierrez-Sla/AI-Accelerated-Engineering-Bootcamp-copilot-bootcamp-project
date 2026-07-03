import { useMutation } from '@tanstack/react-query'
import { confirmPasswordReset } from '../authApi'
import type { PasswordResetConfirmRequest } from '../../types/auth'

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: PasswordResetConfirmRequest) => confirmPasswordReset(data),
  })
}
