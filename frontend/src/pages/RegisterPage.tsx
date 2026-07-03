import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/auth/RegisterForm'
import { useRegister } from '../api/hooks/useRegister'
import { extractApiError } from '../utils/apiError'
import type { RegisterRequest } from '../types/auth'

export function RegisterPage() {
  const registerMutation = useRegister()
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleSubmit(data: RegisterRequest) {
    setApiError(null)
    registerMutation.mutate(data, {
      onSuccess: (response) => {
        setSuccessMessage(response.message)
      },
      onError: (error) => {
        setApiError(extractApiError(error))
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">🐾 Join Pet Manager</h1>
          <p className="mt-1 text-sm text-gray-500">Create your free account to get started</p>
        </div>

        {successMessage ? (
          <div className="text-center" aria-live="polite">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Check your inbox!</h2>
            <p className="mb-6 text-sm text-gray-600">{successMessage}</p>
            <Link
              to="/login"
              className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            <RegisterForm
              onSubmit={handleSubmit}
              isLoading={registerMutation.isPending}
              error={apiError}
              onDismissError={() => setApiError(null)}
            />

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
