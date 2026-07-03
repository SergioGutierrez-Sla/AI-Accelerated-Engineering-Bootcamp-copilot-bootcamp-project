import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm'
import { useForgotPassword } from '../api/hooks/useForgotPassword'
import { extractApiError } from '../utils/apiError'

export function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword()
  const [apiError, setApiError] = useState<string | null>(null)

  function handleSubmit(email: string) {
    setApiError(null)
    forgotMutation.mutate(email, {
      onError: (error) => setApiError(extractApiError(error)),
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">🐾 Pet Manager</h1>
          <h2 className="mt-2 text-lg font-semibold text-gray-700">Forgot your password?</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {forgotMutation.isSuccess ? (
          <div className="text-center" aria-live="polite">
            <p className="mb-4 text-sm text-gray-700">{forgotMutation.data?.message}</p>
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <ForgotPasswordForm
              onSubmit={handleSubmit}
              isLoading={forgotMutation.isPending}
              error={apiError}
            />
            <p className="mt-6 text-center text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
