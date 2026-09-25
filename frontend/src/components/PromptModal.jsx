import { useEffect, useState } from 'react'
import LoadingSpinner from './common/LoadingSpinner'

function PromptModalInner({
  open,
  title,
  message,
  defaultValue = '',
  placeholder,
  confirmText,
  cancelText,
  loading,
  onConfirm,
  onClose,
}) {
  const [value, setValue] = useState(defaultValue)

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

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm(value)
  }

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 h-full w-full bg-gray-900/50 backdrop-blur-[6px] transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 transition-all z-10 animate-fade-in">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              {message && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <textarea
              autoFocus
              rows={4}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
              className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 p-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-brand-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-all disabled:opacity-50"
            />
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 font-semibold text-sm text-white transition-all shadow-theme-xs shadow-brand-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="xs" text="" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PromptModal({
  open,
  title = 'Masukkan Informasi',
  message = 'Silakan isi keterangan di bawah ini:',
  defaultValue = '',
  placeholder = 'Tuliskan catatan...',
  confirmText = 'Simpan',
  cancelText = 'Batal',
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null

  return (
    <PromptModalInner
      open={open}
      title={title}
      message={message}
      defaultValue={defaultValue}
      placeholder={placeholder}
      confirmText={confirmText}
      cancelText={cancelText}
      loading={loading}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
