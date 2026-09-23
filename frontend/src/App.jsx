import './App.css'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import ProtectedShell from './components/ProtectedShell'
import LoginPage from './pages/LoginPage'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
            <svg className="size-7 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            SIM-KK / PPSA
          </span>
          <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            Memeriksa Autentikasi...
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Menghubungkan ke layanan sistem...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <ProtectedShell />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
