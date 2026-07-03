import { useQuery } from '@tanstack/react-query'
import { verifyEmail } from '../authApi'

export function useVerifyEmail(token: string) {
  return useQuery({
    queryKey: ['auth', 'verify-email', token],
    queryFn: () => verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  })
}
