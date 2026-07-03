import { useState } from 'react'
import { ErrorAlert } from '../common/ErrorAlert'

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1'

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => void
  isLoading: boolean
  error: string | null
}

export function ForgotPasswordForm({ onSubmit, isLoading, error }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError(null)
    return true
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit(email)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && <ErrorAlert message={error} />}

      <div>
        <label htmlFor="email" className={LABEL_CLASS}>
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className={INPUT_CLASS}
        />
        {emailError && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {emailError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Sending reset link…' : 'Send Reset Link'}
      </button>
    </form>
  )
}
