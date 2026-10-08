import { useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { resourceConfigs, supportResources } from '../config/resources'
import ConfirmModal from './ConfirmModal'
import DashboardView from './DashboardView'
import ResourceDashboard from './ResourceDashboard'
import Badge from './ui/Badge'
import LoadingSpinner from './common/LoadingSpinner'

// SVG Icons strictly sized with size-5 (20px) and shrink-0
function NavIcon({ type, className = '' }) {
  const iconClasses = `size-5 shrink-0 transition-colors ${className}`

  switch (type) {
    case 'dashboard':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    case 'calonKlien':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    case 'kontrak':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'klien':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    case 'pekerjaan':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    case 'reporting':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    case 'performanceReviews':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    case 'users':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    default:
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
  }
}

export default function ProtectedShell() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Filter accessible resources based on user role
  const allowedResources = useMemo(() => {
    return resourceConfigs.filter((resource) => {
      if (!resource.allowedRoles) return true
      return resource.allowedRoles.includes(user?.role)
    })
  }, [user?.role])

  // Active resource selection state
  const [activeKey, setActiveKey] = useState('dashboard')

  const isDashboardActive = activeKey === 'dashboard'
  const isResourceActive = allowedResources.some((r) => r.key === activeKey)
  const currentActiveKey = isDashboardActive || isResourceActive ? activeKey : 'dashboard'

  const activeConfig = useMemo(() => {
    if (currentActiveKey === 'dashboard') return null
    return allowedResources.find((resource) => resource.key === currentActiveKey) || allowedResources[0]
  }, [allowedResources, currentActiveKey])

  async function handleConfirmLogout() {
    setLoggingOut(true)
    setShowLogoutModal(false)
    try {
      await Promise.all([
        logout(),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ])
    } catch {
      setLoggingOut(false)
    }
  }

  const roleBadgeColor = {
    admin: 'primary',
    pimpinan: 'primary',
    operator: 'success',
    sales: 'success',
    karyawan: 'info',
  }[user?.role] || 'light'

  const roleLabel = {
    admin: 'Pimpinan (Admin Utama)',
    pimpinan: 'Pimpinan (Admin Utama)',
    operator: 'Operator',
    sales: 'Operator',
    karyawan: 'Karyawan',
  }[user?.role] || user?.role

  // Group resources for clean TailAdmin sidebar sections
  const crmResources = allowedResources.filter((r) => ['calonKlien', 'kontrak'].includes(r.key))
  const operationsResources = allowedResources.filter((r) => ['klien', 'pekerjaan'].includes(r.key))
  const reportingResources = allowedResources.filter((r) => ['reporting', 'performanceReviews'].includes(r.key))
  const adminResources = allowedResources.filter((r) => ['users'].includes(r.key))

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50/75 dark:bg-gray-950 font-outfit text-gray-800 dark:text-gray-200">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* TailAdmin Sleek Sidebar - Fixed stationary w-64 size */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col justify-between border-r border-gray-200/80 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Brand Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50/80 p-1.5 border border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20 shadow-theme-xs">
                <img
                  src="/images/logo/loading-logo.png"
                  alt="Logo"
                  className="size-7 object-contain drop-shadow-xs"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                  SIM-KK
                </h2>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              onClick={() => setIsMobileOpen(false)}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links - Scrollable without ugly scrollbars */}
          <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-800">
            {/* Menu Utama */}
            <div>
              <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                Menu Utama
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveKey('dashboard')
                  setIsMobileOpen(false)
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                  currentActiveKey === 'dashboard'
                    ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                <NavIcon
                  type="dashboard"
                  className={currentActiveKey === 'dashboard' ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                />
                <span className="truncate">Dasbor Utama</span>
              </button>
            </div>

            {/* CRM & Sales */}
            {crmResources.length > 0 && (
              <div>
                <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  CRM & Penjualan
                </p>
                <div className="space-y-0.5">
                  {crmResources.map((res) => {
                    const isActive = currentActiveKey === res.key
                    return (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          setActiveKey(res.key)
                          setIsMobileOpen(false)
                        }}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <NavIcon
                          type={res.key}
                          className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                        />
                        <span className="truncate">{res.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Operasional Proyek */}
            {operationsResources.length > 0 && (
              <div>
                <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  {user?.role === 'karyawan' ? 'Tugas & Pekerjaan' : 'Operasional Proyek'}
                </p>
                <div className="space-y-0.5">
                  {operationsResources.map((res) => {
                    const isActive = currentActiveKey === res.key
                    const itemLabel = res.key === 'pekerjaan' && user?.role === 'karyawan' ? 'Pekerjaan Saya' : res.label
                    return (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          setActiveKey(res.key)
                          setIsMobileOpen(false)
                        }}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <NavIcon
                          type={res.key}
                          className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                        />
                        <span className="truncate">{itemLabel}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Laporan & Review */}
            {reportingResources.length > 0 && (
              <div>
                <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  Laporan & Evaluasi
                </p>
                <div className="space-y-0.5">
                  {reportingResources.map((res) => {
                    const isActive = currentActiveKey === res.key
                    return (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          setActiveKey(res.key)
                          setIsMobileOpen(false)
                        }}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <NavIcon
                          type={res.key}
                          className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                        />
                        <span className="truncate">{res.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Administrasi Akun */}
            {adminResources.length > 0 && (
              <div>
                <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  Sistem & User
                </p>
                <div className="space-y-0.5">
                  {adminResources.map((res) => {
                    const isActive = currentActiveKey === res.key
                    return (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          setActiveKey(res.key)
                          setIsMobileOpen(false)
                        }}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <NavIcon
                          type={res.key}
                          className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                        />
                        <span className="truncate">{res.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="shrink-0 border-t border-gray-100 p-3.5 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-xs shadow-xs">
              {user?.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                {user?.nama || 'Pengguna'}
              </p>
              <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* TailAdmin Fixed Top Header */}
        <header className="shrink-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex items-center gap-3">
            {/* Hamburger button for Mobile */}
            <button
              type="button"
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Toggle mobile menu"
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb / Title Indicator */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                SIM-KK
              </span>
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight">
                {currentActiveKey === 'dashboard'
                  ? 'Dasbor Utama'
                  : activeConfig?.label || 'Modul Operasional'}
              </h1>
            </div>
          </div>

          {/* Right Header: Role Pill & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge size="sm" color={roleBadgeColor} className="uppercase font-bold tracking-wide">
              {roleLabel}
            </Badge>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-error-50 hover:border-error-200 hover:text-error-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-error-500/10 dark:hover:text-error-400 cursor-pointer shadow-xs"
              title="Keluar dari akun Anda"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">{loggingOut ? 'Keluar...' : 'Keluar'}</span>
            </button>
          </div>
        </header>

        {/* Main Body with balanced TailAdmin padding */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6 lg:p-7">
            {currentActiveKey === 'dashboard' ? (
              <DashboardView />
            ) : activeConfig ? (
              <ResourceDashboard
                key={currentActiveKey}
                config={activeConfig}
                resourceConfigs={resourceConfigs}
                supportResources={supportResources}
              />
            ) : (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                Tidak ada modul yang tersedia untuk peran Anda.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        open={showLogoutModal}
        title="Konfirmasi Keluar Sistem"
        message="Apakah Anda yakin ingin keluar dari sistem SIM-KK? Sesi aktif akun Anda akan diakhiri."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        type="logout"
        loading={loggingOut}
        onConfirm={handleConfirmLogout}
        onClose={() => setShowLogoutModal(false)}
      />

      {/* Fullscreen Pure White Loading saat Logout (Hanya Logo di Tengah) */}
      {loggingOut && (
        <LoadingSpinner size="screen" text="" />
      )}
    </div>
  )
}
