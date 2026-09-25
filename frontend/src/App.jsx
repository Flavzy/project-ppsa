import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedShell from './components/ProtectedShell'
import LoginPage from './pages/LoginPage'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner size="screen" text="" />
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
