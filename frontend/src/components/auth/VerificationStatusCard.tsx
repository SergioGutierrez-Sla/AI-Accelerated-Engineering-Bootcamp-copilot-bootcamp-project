import { Link } from 'react-router-dom'

interface VerificationStatusCardProps {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  errorMessage?: string
}

export function VerificationStatusCard({
  isPending,
  isSuccess,
  isError,
  errorMessage,
}: VerificationStatusCardProps) {
  if (isPending) {
    return (
      <div className="text-center" aria-live="polite" aria-busy="true">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-gray-600">Verifying your email…</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="text-center" aria-live="polite">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Email verified!</h2>
        <p className="mb-6 text-gray-600">Your account is now active. You can sign in to manage your pets.</p>
        <Link
          to="/login"
          className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center" aria-live="polite">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Verification failed</h2>
        <p className="mb-6 text-sm text-gray-600">
          {errorMessage ?? 'The verification link is invalid or has expired.'}
        </p>
        <p className="text-sm text-gray-500">
          Need a new link?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in to request another
          </Link>
        </p>
      </div>
    )
  }

  return null
}
