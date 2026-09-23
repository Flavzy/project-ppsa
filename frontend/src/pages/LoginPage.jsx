import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import GridShape from '../components/common/GridShape'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
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
      setPassword('')
    } catch (requestError) {
      if (requestError.status === 401) {
        setError('Kredensial tidak valid. Silakan periksa email dan kata sandi Anda.')
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-gray-900 font-outfit">
      {/* Mobile Top Hero Banner (Illustration & Branding for Phone screens - Never Hidden) */}
      <div className="lg:hidden relative bg-brand-950 text-white px-5 py-7 text-center overflow-hidden border-b border-brand-900">
        <GridShape className="opacity-30" />
        <div className="relative z-10 flex flex-col items-center">
          <img
            src="/img/startup.svg"
            alt="SIM-KK Portal Illustration"
            className="w-full max-w-[160px] h-auto mb-3 drop-shadow-md"
          />
          <span className="inline-block text-[11px] font-bold tracking-widest text-brand-400 uppercase mb-1">
            SIM-KK / PPSA PLATFORM
          </span>
          <h2 className="text-lg font-bold text-white leading-snug max-w-sm">
            Sistem Informasi Manajemen Klien & Kinerja Karyawan
          </h2>
        </div>
      </div>

      {/* Main Left: Sign In Form (TailAdmin Style) */}
      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 border border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M19 2H9c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H5V8h14v12zm-4-9h-2V9h2v2zm0 4h-2v-2h2v2zm-4-4h-2V9h2v2zm0 4h-2v-2h2v2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Masuk ke Akun
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Masukkan kredensial Anda untuk mengakses dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-error-200 bg-error-50 p-3.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
              <svg className="mt-0.5 h-4 w-4 shrink-0 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Alamat Email <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  disabled={submitting}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-error-500">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Kata Sandi <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={submitting}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-error-500">{fieldErrors.password[0]}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Ingat saya
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-500 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-600 focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Memproses...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Quick Demo Fill Buttons (TailAdmin Badge Style) */}
          <div className="mt-6 border-t border-dashed border-gray-200 pt-5 text-center dark:border-gray-800">
            <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400 mb-2.5">
              Akun Uji Coba Cepat (Klik untuk Mengisi):
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@example.com')
                  setPassword('password123')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 cursor-pointer"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                Admin
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('pimpinan@example.com')
                  setPassword('password123')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300 cursor-pointer"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                Pimpinan
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('sales@example.com')
                  setPassword('password123')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-success-200 bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 transition hover:bg-success-100 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300 cursor-pointer"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-success-500"></span>
                Sales PIC
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('karyawan@example.com')
                  setPassword('password123')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300 cursor-pointer"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                Karyawan PIC
              </button>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} SIM-KK &bull; PPSA Project. Powered by TailAdmin UI.
          </div>
        </div>
      </div>

      {/* Main Right: TailAdmin Brand & Illustration Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-brand-950 text-white flex-col justify-center items-center p-12 overflow-hidden">
        <GridShape className="opacity-40" />

        <div className="relative z-10 max-w-lg text-center">
          <img
            src="/img/startup.svg"
            alt="SIM-KK Portal Illustration"
            className="w-full max-w-[360px] h-auto mx-auto mb-8 drop-shadow-2xl"
          />

          <span className="inline-block text-xs font-bold tracking-widest text-brand-400 uppercase mb-2">
            SIM-KK / PPSA PLATFORM
          </span>

          <h2 className="text-2xl xl:text-3xl font-extrabold text-white leading-tight mb-4">
            Sistem Informasi Manajemen Klien & Kinerja Karyawan
          </h2>

          <p className="text-sm xl:text-base text-gray-300 leading-relaxed max-w-md mx-auto">
            Kelola pipeline calon klien, otomasi perjanjian kontrak kerja sama, pengerjaan proyek, dan tinjauan performa tim secara terintegrasi.
          </p>
        </div>
      </div>
    </div>
  )
}
