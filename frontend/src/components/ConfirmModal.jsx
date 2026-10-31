import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import LoadingSpinner from './common/LoadingSpinner'

export default function ConfirmModal({
  open,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'warning', // 'warning', 'logout', 'danger', 'info'
  loading = false,
  onConfirm,
  onClose,
}) {
  const isDanger = type === 'danger' || type === 'logout'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose?.()
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, loading, onClose])

  if (!open) return null

  const iconConfig = {
    logout: {
      bg: 'bg-error-50 text-error-600 dark:bg-error-500/15',
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
    danger: {
      bg: 'bg-error-50 text-error-600 dark:bg-error-500/15',
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15',
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15',
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }[type] || {
    bg: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  }

  const modalContent = (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 h-full w-full bg-gray-900/50 backdrop-blur-[6px] transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 transition-all z-10 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconConfig.bg}`}>
            {iconConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-5 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95 shadow-theme-xs cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-error-500 hover:bg-error-600 active:bg-error-700 shadow-error-500/20'
                : 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 shadow-brand-500/20'
            }`}
          >
            {loading ? (
              <>
                <LoadingSpinner size="xs" text="" />
                <span>Memproses...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}
