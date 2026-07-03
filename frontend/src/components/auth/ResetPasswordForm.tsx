import { useState } from 'react'
import { ErrorAlert } from '../common/ErrorAlert'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1'
const ERROR_CLASS = 'mt-1 text-xs text-red-600'

interface ResetPasswordFormProps {
  onSubmit: (newPassword: string) => void
  isLoading: boolean
  error: string | null
}

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'Password must be at least 8 characters'
  if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter'
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter'
  if (!/\d/.test(pwd)) return 'Password must contain at least one digit'
  return null
}

export function ResetPasswordForm({ onSubmit, isLoading, error }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({})

  function validate(): boolean {
    const errors: { newPassword?: string; confirmPassword?: string } = {}
    const pwdError = validatePassword(newPassword)
    if (pwdError) errors.newPassword = pwdError
    if (newPassword && confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your new password'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit(newPassword)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && <ErrorAlert message={error} />}

      <div>
        <label htmlFor="newPassword" className={LABEL_CLASS}>
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={INPUT_CLASS}
        />
        <PasswordStrengthIndicator password={newPassword} />
        {fieldErrors.newPassword && <p className={ERROR_CLASS}>{fieldErrors.newPassword}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className={LABEL_CLASS}>
          Confirm new password
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
        {isLoading ? 'Resetting password…' : 'Reset Password'}
      </button>
    </form>
  )
}
