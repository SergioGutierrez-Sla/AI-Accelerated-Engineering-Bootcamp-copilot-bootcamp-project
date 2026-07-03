import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm'
import { useResetPassword } from '../api/hooks/useResetPassword'
import { extractApiError } from '../utils/apiError'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const resetMutation = useResetPassword()
  const [apiError, setApiError] = useState<string | null>(null)

  function handleSubmit(newPassword: string) {
    if (!token) {
      setApiError('No reset token found. Please use the link from your email.')
      return
    }
    setApiError(null)
    resetMutation.mutate(
      { token, newPassword },
      {
        onError: (error) => setApiError(extractApiError(error)),
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">🐾 Pet Manager</h1>
          <h2 className="mt-2 text-lg font-semibold text-gray-700">Set a new password</h2>
        </div>

        {resetMutation.isSuccess ? (
          <div className="text-center" aria-live="polite">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mb-6 text-sm text-gray-700">{resetMutation.data?.message}</p>
            <Link
              to="/login"
              className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            {!token && (
              <p className="mb-4 text-sm text-red-600" aria-live="polite">
                No reset token found. Please use the link from your email or{' '}
                <Link to="/forgot-password" className="text-blue-600 hover:underline">
                  request a new one
                </Link>
                .
              </p>
            )}
            <ResetPasswordForm
              onSubmit={handleSubmit}
              isLoading={resetMutation.isPending}
              error={apiError}
            />
          </>
        )}
      </div>
    </div>
  )
}
