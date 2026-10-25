import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import GridShape from '../components/common/GridShape'
import LoadingSpinner from '../components/common/LoadingSpinner'

const LOCKOUT_STORAGE_KEY = 'simkk_login_lockout_until'

function formatLockoutTime(totalSeconds) {
  if (totalSeconds >= 60) {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return secs > 0 ? `${mins} menit ${secs} detik` : `${mins} menit`
  }
  return `${totalSeconds} detik`
}

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [lockoutSeconds, setLockoutSeconds] = useState(() => {
    try {
      const savedUntil = Number(localStorage.getItem(LOCKOUT_STORAGE_KEY) || 0)
      if (savedUntil > Date.now()) {
        return Math.ceil((savedUntil - Date.now()) / 1000)
      }
      localStorage.removeItem(LOCKOUT_STORAGE_KEY)
    } catch {}
    return 0
  })

  useEffect(() => {
    if (lockoutSeconds <= 0) return

    const timer = setInterval(() => {
      try {
        const savedUntil = Number(localStorage.getItem(LOCKOUT_STORAGE_KEY) || 0)
        const remaining = Math.ceil((savedUntil - Date.now()) / 1000)
        if (remaining <= 0) {
          localStorage.removeItem(LOCKOUT_STORAGE_KEY)
          setLockoutSeconds(0)
          setError('')
        } else {
          setLockoutSeconds(remaining)
        }
      } catch {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setError('')
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [lockoutSeconds > 0])

  const isLockedOut = lockoutSeconds > 0

  async function handleSubmit(event) {
    event.preventDefault()
    if (isLockedOut) return

    setError('')
    setFieldErrors({})
    setSubmitting(true)

    try {
      await login(email, password)
      try {
        localStorage.removeItem(LOCKOUT_STORAGE_KEY)
      } catch {}
      setLockoutSeconds(0)
      setPassword('')
    } catch (requestError) {
      setSubmitting(false)
      if (requestError.status === 429) {
        const waitSeconds = requestError.retryAfter > 0 ? requestError.retryAfter : 30
        try {
          localStorage.setItem(LOCKOUT_STORAGE_KEY, String(Date.now() + waitSeconds * 1000))
        } catch {}
        setLockoutSeconds(waitSeconds)
        setError(
          requestError.message ||
            `Terlalu banyak percobaan login yang gagal (5 kali berturut-turut). Login diblokir sementara selama ${formatLockoutTime(waitSeconds)}.`,
        )
      } else if (requestError.status === 401) {
        const remainingInfo =
          requestError.remainingAttempts !== undefined
            ? ` (Sisa percobaan: ${requestError.remainingAttempts} kali sebelum diblokir sementara)`
            : ''
        setError(`Kredensial tidak valid. Silakan periksa username dan kata sandi Anda.${remainingInfo}`)
      } else if (requestError.status === 422) {
        setError(requestError.message || 'Data yang diberikan tidak valid.')
        setFieldErrors(requestError.errors || {})
      } else {
        setError(requestError.message || 'Terjadi kesalahan saat masuk. Silakan coba lagi.')
      }
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-gray-950 font-outfit">
      {/* Mobile Top Hero Banner (Illustration & Branding for Phone screens - Never Hidden) */}
      <div className="lg:hidden relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-white px-5 py-7 text-center overflow-hidden border-b border-slate-800">
        <GridShape className="opacity-20 text-slate-500" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-4 w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-brand-500/35 blur-2xl pointer-events-none" />
            <div className="relative w-full h-full rounded-full p-2 bg-gradient-to-b from-white/10 to-white/5 border border-brand-500/30 shadow-xl backdrop-blur-md flex items-center justify-center ring-1 ring-white/10">
              <img
                src="/images/logo/sim-kk-logo.png"
                alt="Emblem Logo SIM-KK PPSA"
                className="w-full h-full object-contain rounded-full drop-shadow-md"
              />
            </div>
          </div>
          <span className="inline-block text-[11px] font-bold tracking-widest text-brand-400 uppercase mb-1.5 px-3 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 backdrop-blur-xs">
            SIM-KK PLATFORM
          </span>
          <h2 className="text-lg font-bold text-white leading-snug max-w-sm">
            Sistem Informasi Manajemen Klien & Kinerja Karyawan
          </h2>
        </div>
      </div>

      {/* Main Left: Sign In Form (Elevated Card Container in Dark & Light Mode) */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-8 sm:px-8 lg:px-10 xl:px-14 bg-slate-50/70 dark:bg-gray-950/80 relative">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-850 dark:bg-gray-800/80 border border-gray-200/90 dark:border-gray-700/80 p-6 sm:p-8 shadow-xl dark:shadow-2xl dark:shadow-black/60 backdrop-blur-xs transition-all">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl overflow-hidden shadow-md ring-2 ring-brand-500/25 bg-white dark:bg-gray-750 dark:bg-gray-700 shrink-0">
                <img
                  src="/images/logo/loading-logo.png"
                  alt="Logo SIM-KK"
                  className="size-full object-cover"
                />
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

          {/* Alert Error / Lockout */}
          {(isLockedOut || error) && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-error-200 bg-error-50 p-3.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
              <svg className="mt-0.5 h-4 w-4 shrink-0 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span>
                {isLockedOut
                  ? `Terlalu banyak percobaan login yang gagal (5 kali berturut-turut). Login diblokir sementara, silakan coba lagi dalam ${formatLockoutTime(lockoutSeconds)}.`
                  : error}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Username <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan username Anda"
                  required
                  autoComplete="username"
                  disabled={submitting || isLockedOut}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white dark:bg-gray-900/80 px-4 py-2.5 text-sm text-gray-800 shadow-2xs placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:text-white transition-colors"
                />
              </div>
              {(fieldErrors.email || fieldErrors.username) && (
                <p className="mt-1 text-xs text-error-500">{(fieldErrors.email || fieldErrors.username)[0]}</p>
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
                  disabled={submitting || isLockedOut}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white dark:bg-gray-900/80 px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-2xs placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:text-white transition-colors [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting || isLockedOut}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50 cursor-pointer"
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
                  disabled={submitting || isLockedOut}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50"
                />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Ingat saya
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || isLockedOut}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-theme-xs shadow-brand-500/20 transition-all hover:bg-brand-600 focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-98"
            >
              {isLockedOut ? (
                <span>Diblokir Sementara ({formatLockoutTime(lockoutSeconds)})</span>
              ) : submitting ? (
                <>
                  <LoadingSpinner size="xs" text="" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                'Masuk ke Sistem'
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons (TailAdmin Badge Style) */}
          <div className="mt-6 border-t border-dashed border-gray-200 pt-5 text-center dark:border-gray-700/80">
            <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400 mb-2.5">
              Akun Uji Coba Cepat (Klik untuk Mengisi):
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                disabled={submitting || isLockedOut}
                onClick={() => {
                  setEmail('pimpinan@example.com')
                  setPassword('password123')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300 cursor-pointer shadow-xs"
              >
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                Pimpinan (Admin Utama)
              </button>

              <button
                type="button"
                disabled={submitting || isLockedOut}
                onClick={() => {
                  setEmail('operator@example.com')
                  setPassword('password123')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-success-200 bg-success-50 px-3.5 py-1.5 text-xs font-semibold text-success-700 transition hover:bg-success-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300 cursor-pointer shadow-xs"
              >
                <span className="h-2 w-2 rounded-full bg-success-500"></span>
                Operator
              </button>

              <button
                type="button"
                disabled={submitting || isLockedOut}
                onClick={() => {
                  setEmail('karyawan@example.com')
                  setPassword('password123')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300 cursor-pointer shadow-xs"
              >
                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                Karyawan
              </button>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          &copy; {new Date().getFullYear()} PT Ascon Inovasi Data. All rights reserved.
        </div>
      </div>

      {/* Main Right: TailAdmin Brand & Illustration Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-white flex-col justify-center items-center p-12 overflow-hidden border-l border-slate-800/80">
        <GridShape className="opacity-20 text-slate-500" />

        <div className="relative z-10 max-w-lg text-center">
          <div className="relative mx-auto mb-8 w-48 h-48 xl:w-56 xl:h-56 flex items-center justify-center">
            {/* Ambient corporate orange glow behind emblem */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-500/40 via-amber-500/30 to-brand-600/20 blur-3xl transform scale-125 pointer-events-none" />
            {/* Elegant glassmorphic badge container with warm brand accent ring */}
            <div className="relative w-full h-full rounded-full p-3.5 bg-gradient-to-b from-white/10 to-white/5 border border-brand-500/30 shadow-2xl backdrop-blur-md flex items-center justify-center ring-1 ring-white/10">
              <img
                src="/images/logo/sim-kk-logo.png"
                alt="Emblem Logo SIM-KK PPSA"
                className="w-full h-full object-contain rounded-full drop-shadow-2xl"
              />
            </div>
          </div>

          <span className="inline-block text-xs font-bold tracking-widest text-brand-400 uppercase mb-3 px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 backdrop-blur-xs">
            SIM-KK PLATFORM
          </span>

          <h2 className="text-2xl xl:text-3xl font-extrabold text-white leading-tight mb-4">
            Sistem Informasi Manajemen Klien & Kinerja Karyawan
          </h2>

          <p className="text-sm xl:text-base text-slate-300 leading-relaxed max-w-md mx-auto">
            Kelola pipeline calon klien, otomasi perjanjian kontrak kerja sama, pengerjaan proyek, dan tinjauan performa tim secara terintegrasi.
          </p>
        </div>
      </div>
    </div>
  )
}
