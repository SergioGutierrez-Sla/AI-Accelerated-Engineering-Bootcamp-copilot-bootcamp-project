import { useSearchParams } from 'react-router-dom'
import { VerificationStatusCard } from '../components/auth/VerificationStatusCard'
import { useVerifyEmail } from '../api/hooks/useVerifyEmail'
import { extractApiError } from '../utils/apiError'

export function EmailVerificationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const { isPending, isSuccess, isError, error } = useVerifyEmail(token)

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">🐾 Pet Manager</h1>
        </div>

        {!token ? (
          <div className="text-center text-sm text-red-600" aria-live="polite">
            No verification token found. Please use the link from your email.
          </div>
        ) : (
          <VerificationStatusCard
            isPending={isPending}
            isSuccess={isSuccess}
            isError={isError}
            errorMessage={isError ? extractApiError(error) : undefined}
          />
        )}
      </div>
    </div>
  )
}
