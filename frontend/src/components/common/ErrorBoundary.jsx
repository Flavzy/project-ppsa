import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 font-outfit text-gray-800 dark:text-gray-200">
          <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl text-center space-y-5">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/15">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Terjadi Kendala Tampilan
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Sistem mengalami kesalahan sementara saat merender halaman. Anda dapat memuat ulang halaman untuk melanjutkan.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-left text-2xs font-mono text-gray-600 dark:text-gray-300 max-h-24 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-2xs cursor-pointer"
              >
                Coba Lagi
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white shadow-theme-xs transition cursor-pointer"
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
