import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorAlert } from '../common/ErrorAlert'

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1'
const ERROR_CLASS = 'mt-1 text-xs text-red-600'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void
  isLoading: boolean
  error: string | null
  onDismissError: () => void
}

export function LoginForm({ onSubmit, isLoading, error, onDismissError }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password', string>>>({})

  function validate(): boolean {
    const errors: Partial<Record<'email' | 'password', string>> = {}
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!password) errors.password = 'Password is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit(email, password)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && <ErrorAlert message={error} onDismiss={onDismissError} />}

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
          className={INPUT_CLASS}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className={ERROR_CLASS} role="alert">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className={LABEL_CLASS}>
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT_CLASS}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
        />
        {fieldErrors.password && (
          <p id="password-error" className={ERROR_CLASS} role="alert">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end">
        <Link
          to="/forgot-password"
          className="text-xs text-blue-600 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Signing in…' : 'Sign In to Pet Manager'}
      </button>
    </form>
  )
}
