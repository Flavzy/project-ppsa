import { useEffect } from 'react'

export default function ToastNotification({
  open,
  message,
  severity = 'success', // 'success', 'error', 'info', 'warning'
  action = null,
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!open) return
    const effectiveDuration = action ? Math.max(duration, 7000) : duration
    const timer = setTimeout(() => {
      onClose?.()
    }, effectiveDuration)
    return () => clearTimeout(timer)
  }, [open, duration, action, onClose])

  if (!open) return null

  const config = {
    success: {
      bg: 'bg-white dark:bg-gray-900 border-success-200 dark:border-success-800',
      iconBg: 'bg-success-50 text-success-600 dark:bg-success-500/20',
      title: 'Berhasil',
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-white dark:bg-gray-900 border-error-200 dark:border-error-800',
      iconBg: 'bg-error-50 text-error-600 dark:bg-error-500/20',
      title: 'Terjadi Kesalahan',
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-white dark:bg-gray-900 border-warning-200 dark:border-warning-800',
      iconBg: 'bg-warning-50 text-warning-600 dark:bg-warning-500/20',
      title: 'Peringatan',
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-white dark:bg-gray-900 border-blue-light-200 dark:border-blue-light-800',
      iconBg: 'bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/20',
      title: 'Informasi',
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }[severity] || config?.info

  return (
    <div className="fixed top-5 right-5 z-99999 flex w-full max-w-sm animate-fade-in flex-col">
      <div
        className={`flex items-start gap-3.5 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all ${config.bg}`}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{config.title}</p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{message}</p>
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick?.()
                onClose?.()
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors cursor-pointer group"
            >
              <span className="underline">{action.label}</span>
              <svg className="size-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          aria-label="Tutup notifikasi"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
