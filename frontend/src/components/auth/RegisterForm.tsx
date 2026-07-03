import { useState } from 'react'
import { ErrorAlert } from '../common/ErrorAlert'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1'
const ERROR_CLASS = 'mt-1 text-xs text-red-600'

type FieldKey = 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword'

interface RegisterFormProps {
  onSubmit: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => void
  isLoading: boolean
  error: string | null
  onDismissError: () => void
}

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'Password must be at least 8 characters'
  if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter'
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter'
  if (!/\d/.test(pwd)) return 'Password must contain at least one digit'
  return null
}

export function RegisterForm({ onSubmit, isLoading, error, onDismissError }: RegisterFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({})

  function validate(): boolean {
    const errors: Partial<Record<FieldKey, string>> = {}
    if (!firstName.trim()) errors.firstName = 'First name is required'
    if (!lastName.trim()) errors.lastName = 'Last name is required'
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    const pwdError = validatePassword(password)
    if (pwdError) errors.password = pwdError
    if (password && confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit({ firstName, lastName, email, password })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && <ErrorAlert message={error} onDismiss={onDismissError} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className={LABEL_CLASS}>
            First name
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={INPUT_CLASS}
          />
          {fieldErrors.firstName && <p className={ERROR_CLASS}>{fieldErrors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className={LABEL_CLASS}>
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={INPUT_CLASS}
          />
          {fieldErrors.lastName && <p className={ERROR_CLASS}>{fieldErrors.lastName}</p>}
        </div>
      </div>

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
        />
        {fieldErrors.email && <p className={ERROR_CLASS}>{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className={LABEL_CLASS}>
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT_CLASS}
        />
        <PasswordStrengthIndicator password={password} />
        {fieldErrors.password && <p className={ERROR_CLASS}>{fieldErrors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className={LABEL_CLASS}>
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={INPUT_CLASS}
        />
        {fieldErrors.confirmPassword && (
          <p className={ERROR_CLASS}>{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Creating account…' : 'Create My Account'}
      </button>
    </form>
  )
}
