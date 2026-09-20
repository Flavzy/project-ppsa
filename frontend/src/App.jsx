import './App.css'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import ProtectedShell from './components/ProtectedShell'
import LoginPage from './pages/LoginPage'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <p className="eyebrow">SIM-KK / PPSA</p>
          <h2>Memeriksa Autentikasi...</h2>
          <p className="text-muted">Menghubungkan ke layanan sistem...</p>
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
