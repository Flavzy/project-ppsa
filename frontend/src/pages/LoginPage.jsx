import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setSubmitting(true)

    try {
      await login(email, password)
      // Password state cleared immediately
      setPassword('')
    } catch (requestError) {
      if (requestError.status === 401) {
        setError('Kredensial tidak valid. Silakan periksa email dan password Anda.')
      } else if (requestError.status === 422) {
        setError(requestError.message || 'Data yang diberikan tidak valid.')
        setFieldErrors(requestError.errors || {})
      } else {
        setError(requestError.message || 'Terjadi kesalahan saat masuk. Silakan coba lagi.')
      }
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <p className="eyebrow">Sistem Informasi Manajemen Klien & Kinerja Karyawan</p>
          <h1>SIM-KK</h1>
          <p className="login-subtitle">Masuk untuk mengakses dasbor dan manajemen data</p>
        </div>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              required
              autoComplete="email"
              autoFocus
              disabled={submitting}
            />
            {fieldErrors.email && (
              <small className="field-error">{fieldErrors.email[0]}</small>
            )}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={submitting}
            />
            {fieldErrors.password && (
              <small className="field-error">{fieldErrors.password[0]}</small>
            )}
          </label>

          <button
            type="submit"
            className="primary-button login-button"
            disabled={submitting}
          >
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
