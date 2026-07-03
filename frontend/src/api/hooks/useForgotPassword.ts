import { useMutation } from '@tanstack/react-query'
import { requestPasswordReset } from '../authApi'

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  })
}
