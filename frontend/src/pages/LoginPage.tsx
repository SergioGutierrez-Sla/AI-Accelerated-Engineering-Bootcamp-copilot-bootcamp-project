import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useLogin } from '../api/hooks/useLogin'
import { useAuth } from '../context/AuthContext'
import { extractApiError } from '../utils/apiError'

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-700 to-blue-500 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {children}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [apiError, setApiError] = useState<string | null>(null)

  function handleSubmit(email: string, password: string) {
    setApiError(null)
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          login(data.token)
          navigate('/dashboard')
        },
        onError: (error) => {
          setApiError(extractApiError(error))
        },
      },
    )
  }

  return (
    <AuthCard>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold !text-gray-900">🐾 Pet Manager</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to manage your pets' health records</p>
      </div>

      <LoginForm
        onSubmit={handleSubmit}
        isLoading={loginMutation.isPending}
        error={apiError}
        onDismissError={() => setApiError(null)}
      />

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:underline">
          Create one
        </Link>
      </p>
    </AuthCard>
  )
}
