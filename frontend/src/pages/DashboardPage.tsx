import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b bg-blue-700 px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">🐾 Pet Manager</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-blue-100">{user.email}</span>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-white/40 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">My Pets</h2>
        <p className="mb-8 text-gray-500">Manage your pets' health records and appointments.</p>

        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="text-5xl">🐶🐱</div>
          <p className="mt-4 text-lg font-medium text-gray-700">No pets yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Pet management is coming in the next feature. Stay tuned!
          </p>
          {/* Dev shortcut — seed pet is ID 1 */}
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700 font-medium">Dev shortcut</p>
            <Link
              to="/pets/1"
              className="mt-1 inline-block text-sm text-blue-600 hover:underline"
            >
              Open seed pet (Buddy) →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
