import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { resourceConfigs, supportResources } from '../config/resources'
import { getDashboardSummary } from '../api/resources'
import { invalidateApiCache } from '../api/client'
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
    case 'kinerjaKaryawan':
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
    case 'layanan':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    case 'masterPekerjaan':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
  const [navParams, setNavParams] = useState(null)
  const [navVersion, setNavVersion] = useState(0)

  const handleNavigate = useCallback((key, params = null) => {
    invalidateApiCache()
    setNavParams(params)
    setActiveKey(key)
    setNavVersion((v) => v + 1)
  }, [])

  const isDashboardActive = activeKey === 'dashboard'
  const isResourceActive = allowedResources.some((r) => r.key === activeKey)
  const currentActiveKey = isDashboardActive || isResourceActive ? activeKey : 'dashboard'

  const activeConfig = useMemo(() => {
    if (currentActiveKey === 'dashboard') return null
    return allowedResources.find((resource) => resource.key === currentActiveKey) || allowedResources[0]
  }, [allowedResources, currentActiveKey])

  // Dark Mode Toggle State & Sinkronisasi Otomatis Tema dengan OS (Windows/Android/macOS)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      // Jika pengguna sudah pernah memilih secara eksplisit, hormati pilihan pengguna
      if (saved === 'dark') return true
      if (saved === 'light') return false
      // Default: Otomatis mendeteksi tema sistem operasi pengguna (OS Dark/Light mode)
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  // Sinkronisasi otomatis secara dinamis saat OS Windows/Android berganti tema (misal jadwal malam OS)
  useEffect(() => {
    if (!window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleOsThemeChange = (e) => {
      const saved = localStorage.getItem('theme')
      // Jika belum ada override manual di localStorage, ikuti perubahan tema OS secara real-time
      if (!saved) {
        setIsDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleOsThemeChange)
    return () => mediaQuery.removeEventListener('change', handleOsThemeChange)
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Notification Center State & Data
  const [notifications, setNotifications] = useState([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    try {
      invalidateApiCache()
      const res = await getDashboardSummary()
      const data = res?.data || res || {}
      const notifs = []
      const todayStr = new Date().toISOString().split('T')[0]

      // 1. Pengingat Tugas Rutin Bulanan (Role Pimpinan, Admin, Operator, Sales)
      const monthlyReminders = data.monthly_reminders || []
      if (monthlyReminders.length > 0 && ['admin', 'pimpinan', 'operator', 'sales'].includes(user?.role)) {
        notifs.push({
          category: 'Penugasan Rutin',
          title: `${monthlyReminders.length} Paket Rutin Belum Ditugaskan`,
          description: `Terdapat ${monthlyReminders.length} paket pekerjaan bulanan kontrak aktif bulan ini yang siap ditugaskan ke karyawan.`,
          count: monthlyReminders.length,
          dotColor: 'bg-amber-500',
          onClick: () => {
            handleNavigate('dashboard')
            setIsNotifOpen(false)
          },
        })
      }

      // 2. Notifikasi Khusus Karyawan (Role Karyawan)
      if (user?.role === 'karyawan') {
        const recentTasks = data.recent_tasks || []

        // 2a. Tugas Perlu Revisi dari Pimpinan (Prioritas Utama)
        const revisionTasks = recentTasks.filter((t) => ['revision_needed', 'revision'].includes(t.status))
        const revisionCount = revisionTasks.length > 0 ? revisionTasks.length : Number(data.totals?.revision_tasks || data.work_by_status?.revision_needed || data.work_by_status?.revision || 0)
        if (revisionCount > 0) {
          if (revisionTasks.length === 1) {
            const task = revisionTasks[0]
            notifs.push({
              category: 'Perlu Revisi',
              title: `Perbaikan: ${task.judul}`,
              description: `Pimpinan meminta revisi: "${task.catatan_review || 'Mohon tinjau catatan instruksi dan unggah perbaikan.'}"`,
              count: 1,
              dotColor: 'bg-amber-500',
              onClick: () => {
                handleNavigate('reporting')
                setIsNotifOpen(false)
              },
            })
          } else {
            notifs.push({
              category: 'Perlu Revisi',
              title: `${revisionCount} Tugas Memerlukan Perbaikan`,
              description: 'Pimpinan meminta revisi pada hasil pengerjaan tugas Anda.',
              count: revisionCount,
              dotColor: 'bg-amber-500',
              onClick: () => {
                handleNavigate('reporting')
                setIsNotifOpen(false)
              },
            })
          }
        }

        // 2b. Tugas Melewati Deadline (Overdue)
        const overdueTasks = recentTasks.filter((t) =>
          !['completed', 'approved', 'submitted', 'revision_needed', 'revision'].includes(t.status) &&
          t.deadline && t.deadline < todayStr
        )
        const overdueCount = overdueTasks.length > 0 ? overdueTasks.length : Number(data.totals?.overdue_tasks || 0)
        if (overdueCount > 0) {
          notifs.push({
            category: 'Tenggat Waktu',
            title: `${overdueCount} Tugas Melewati Batas Waktu`,
            description: 'Terdapat tugas Anda yang telah melewati batas waktu pengerjaan. Segera selesaikan dan laporkan.',
            count: overdueCount,
            dotColor: 'bg-error-500',
            onClick: () => {
              handleNavigate('pekerjaan')
              setIsNotifOpen(false)
            },
          })
        }

        // 2c. Tugas Baru yang Ditugaskan (Status 'baru')
        const newTasks = recentTasks.filter((t) =>
          t.status === 'baru' && (!t.deadline || t.deadline >= todayStr)
        )
        const newCount = newTasks.length > 0 ? newTasks.length : Number(data.totals?.new_tasks || data.work_by_status?.baru || 0)
        if (newCount > 0) {
          if (newTasks.length === 1) {
            const task = newTasks[0]
            notifs.push({
              category: 'Penugasan Baru',
              title: `Tugas Baru: ${task.judul}`,
              description: `Klien: ${task.klien || '-'} • Batas: ${task.deadline || '-'} • Siap untuk Anda kerjakan.`,
              count: 1,
              dotColor: 'bg-brand-500',
              onClick: () => {
                handleNavigate('pekerjaan')
                setIsNotifOpen(false)
              },
            })
          } else {
            notifs.push({
              category: 'Penugasan Baru',
              title: `${newCount} Tugas Baru Ditugaskan`,
              description: `Terdapat ${newCount} tugas baru yang telah ditugaskan kepada Anda dan siap dikerjakan.`,
              count: newCount,
              dotColor: 'bg-brand-500',
              onClick: () => {
                handleNavigate('pekerjaan')
                setIsNotifOpen(false)
              },
            })
          }
        }

        // 2d. Tugas Sedang Berjalan / Dalam Pengerjaan (Status 'in_progress')
        const inProgressTasks = recentTasks.filter((t) =>
          t.status === 'in_progress' && (!t.deadline || t.deadline >= todayStr)
        )
        const inProgCount = inProgressTasks.length > 0 ? inProgressTasks.length : Number(data.totals?.in_progress_tasks || data.work_by_status?.in_progress || 0)
        if (inProgCount > 0) {
          if (inProgressTasks.length === 1) {
            const task = inProgressTasks[0]
            notifs.push({
              category: 'Dalam Pengerjaan',
              title: `Sedang Dikerjakan: ${task.judul}`,
              description: `Klien: ${task.klien || '-'} • Batas: ${task.deadline || '-'} • Laporkan jika telah selesai.`,
              count: 1,
              dotColor: 'bg-blue-light-500',
              onClick: () => {
                handleNavigate('pekerjaan')
                setIsNotifOpen(false)
              },
            })
          } else {
            notifs.push({
              category: 'Dalam Pengerjaan',
              title: `${inProgCount} Tugas Sedang Berjalan`,
              description: `Terdapat ${inProgCount} tugas aktif yang sedang Anda kerjakan.`,
              count: inProgCount,
              dotColor: 'bg-blue-light-500',
              onClick: () => {
                handleNavigate('pekerjaan')
                setIsNotifOpen(false)
              },
            })
          }
        }
      }

      // 3. Tugas Melewati Deadline untuk Non-Karyawan (Pimpinan, Admin, Operator, Sales)
      if (user?.role !== 'karyawan') {
        const overdueTasks = Number(data.totals?.overdue_tasks || 0)
        if (overdueTasks > 0) {
          notifs.push({
            category: 'Tenggat Waktu',
            title: `${overdueTasks} Tugas Melewati Batas Waktu`,
            description: 'Perlu peninjauan batas waktu atau percepatan penyelesaian tugas operasional.',
            count: overdueTasks,
            dotColor: 'bg-error-500',
            onClick: () => {
              handleNavigate('pekerjaan')
              setIsNotifOpen(false)
            },
          })
        }
      }

      // 4. Laporan Karyawan Menunggu Persetujuan Pimpinan
      const submittedReports = Number(data.work_by_status?.submitted || 0)
      if (submittedReports > 0 && ['admin', 'pimpinan'].includes(user?.role)) {
        notifs.push({
          category: 'Persetujuan Laporan',
          title: `${submittedReports} Laporan Menunggu Ditinjau`,
          description: 'Karyawan telah mengumpulkan bukti tugas dan menanti persetujuan pimpinan.',
          count: submittedReports,
          dotColor: 'bg-blue-light-500',
          onClick: () => {
            handleNavigate('reporting')
            setIsNotifOpen(false)
          },
        })
      }

      setNotifications(notifs)
    } catch {
      // Ignore background summary loading error
    }
  }, [user?.id_user, user?.role, handleNavigate])

  const totalNotifCount = useMemo(() => {
    return notifications.reduce((sum, item) => sum + (item.count || 1), 0)
  }, [notifications])

  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 30000)
    return () => clearInterval(timer)
  }, [loadNotifications, currentActiveKey])

  // Sinkronkan notifikasi lonceng seketika setiap kali ada data baru yang dibuat atau diperbarui di sistem
  useEffect(() => {
    function handleDataMutated() {
      loadNotifications()
    }
    window.addEventListener('simkk:data-mutated', handleDataMutated)
    return () => window.removeEventListener('simkk:data-mutated', handleDataMutated)
  }, [loadNotifications])

  // Tutup panel notifikasi jika pengguna mengklik di luar area
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false)
      }
    }
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isNotifOpen])

  async function handleConfirmLogout() {
    setLoggingOut(true)
    setShowLogoutModal(false)
    try {
      await logout()
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

  const roleShortLabel = {
    admin: 'Pimpinan',
    pimpinan: 'Pimpinan',
    operator: 'Operator',
    sales: 'Operator',
    karyawan: 'Karyawan',
  }[user?.role] || user?.role

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('simkk_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('simkk_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Group resources for clean TailAdmin sidebar sections
  const crmResources = allowedResources.filter((r) => ['calonKlien', 'kontrak'].includes(r.key))
  const operationsResources = allowedResources.filter((r) => ['klien', 'pekerjaan'].includes(r.key))
  const reportingResources = allowedResources.filter((r) => ['reporting', 'performanceReviews', 'kinerjaKaryawan'].includes(r.key))
  const masterResources = allowedResources.filter((r) => ['layanan', 'masterPekerjaan'].includes(r.key))
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

      {/* TailAdmin Sleek Sidebar - Responsive with Desktop Collapse Toggle */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full ${
          isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 shrink-0 flex-col justify-between border-r border-gray-200/80 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Brand Header */}
          <div className={`flex h-16 shrink-0 items-center justify-between border-b border-gray-100 ${isSidebarCollapsed ? 'lg:px-3.5' : 'px-5'} dark:border-gray-800 transition-all`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden shadow-xs ring-2 ring-brand-500/20 bg-white dark:bg-gray-800 shrink-0">
                <img
                  src="/images/logo/loading-logo.png"
                  alt="Logo SIM-KK"
                  className="size-full object-cover"
                />
              </div>
              <div className={`min-w-0 ${isSidebarCollapsed ? 'lg:hidden' : 'block'}`}>
                <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                  SIM-KK
                </h2>
              </div>
            </div>

            {/* Desktop Collapse Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar (Mode Mini)'}
              aria-label="Toggle sidebar collapse"
            >
              <svg className={`size-4.5 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

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
              {!isSidebarCollapsed ? (
                <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
                  Menu Utama
                </p>
              ) : (
                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              )}
              <button
                type="button"
                onClick={() => {
                  handleNavigate('dashboard', null)
                  setIsMobileOpen(false)
                }}
                title="Dasbor Utama"
                className={`group flex w-full items-center ${
                  isSidebarCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-3'
                } rounded-xl py-2 text-sm font-medium transition-all cursor-pointer ${
                  currentActiveKey === 'dashboard'
                    ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                <NavIcon
                  type="dashboard"
                  className={currentActiveKey === 'dashboard' ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                />
                <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : 'inline'}`}>Dasbor Utama</span>
              </button>
            </div>

            {/* CRM & Sales */}
            {crmResources.length > 0 && (
              <div>
                {!isSidebarCollapsed ? (
                  <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
                    CRM & Penjualan
                  </p>
                ) : (
                  <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
                )}
                <div className="space-y-0.5">
                  {crmResources.map((res) => {
                    const isActive = currentActiveKey === res.key
                    return (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          handleNavigate(res.key, null)
                          setIsMobileOpen(false)
                        }}
                        title={res.label}
                        className={`group flex w-full items-center ${
                          isSidebarCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-3'
                        } rounded-xl py-2 text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <NavIcon
                          type={res.key}
                          className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                        />
                        <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : 'inline'}`}>{res.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Operasional Proyek */}
            {operationsResources.length > 0 && (
              <div>
                {!isSidebarCollapsed ? (
                  <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
                    {user?.role === 'karyawan' ? 'Tugas & Pekerjaan' : 'Operasional Proyek'}
                  </p>
                ) : (
                  <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
                )}
                <div className="space-y-0.5">
                  {operationsResources.map((res) => {
                    const isActive = currentActiveKey === res.key
                    const itemLabel = res.key === 'pekerjaan' && user?.role === 'karyawan' ? 'Pekerjaan Saya' : res.label
                    return (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          handleNavigate(res.key, null)
                          setIsMobileOpen(false)
                        }}
                        title={itemLabel}
                        className={`group flex w-full items-center ${
                          isSidebarCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-3'
                        } rounded-xl py-2 text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <NavIcon
                          type={res.key}
                          className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                        />
                        <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : 'inline'}`}>{itemLabel}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Laporan & Review */}
            {reportingResources.length > 0 && (
              <div>
                {!isSidebarCollapsed ? (
                  <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
                    Laporan & Evaluasi
                  </p>
                ) : (
                  <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
                )}
                <div className="space-y-0.5">
                  {reportingResources.map((res) => {
                    const isActive = currentActiveKey === res.key
                    const itemLabel =
                      res.key === 'kinerjaKaryawan' && user?.role === 'karyawan'
                        ? 'Kinerja Saya'
                        : res.label
                    return (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          handleNavigate(res.key, null)
                          setIsMobileOpen(false)
                        }}
                        title={itemLabel}
                        className={`group flex w-full items-center ${
                          isSidebarCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-3'
                        } rounded-xl py-2 text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <NavIcon
                          type={res.key}
                          className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                        />
                        <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : 'inline'}`}>{itemLabel}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Data Master - Khusus Pimpinan */}
            {masterResources.length > 0 && user?.role === 'pimpinan' && (
              <div>
                {!isSidebarCollapsed ? (
                  <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
                    Data Master (Katalog)
                  </p>
                ) : (
                  <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
                )}
                <div className="space-y-0.5">
                  {masterResources.map((res) => {
                    const isActive = currentActiveKey === res.key
                    return (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          handleNavigate(res.key, null)
                          setIsMobileOpen(false)
                        }}
                        title={res.label}
                        className={`group flex w-full items-center ${
                          isSidebarCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-3'
                        } rounded-xl py-2 text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <NavIcon
                          type={res.key}
                          className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                        />
                        <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : 'inline'}`}>{res.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Administrasi Akun */}
            {adminResources.length > 0 && (
              <div>
                {!isSidebarCollapsed ? (
                  <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
                    Sistem & User
                  </p>
                ) : (
                  <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
                )}
                <div className="space-y-0.5">
                  {adminResources.map((res) => {
                    const isActive = currentActiveKey === res.key
                    return (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          handleNavigate(res.key, null)
                          setIsMobileOpen(false)
                        }}
                        title={res.label}
                        className={`group flex w-full items-center ${
                          isSidebarCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-3'
                        } rounded-xl py-2 text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400 shadow-xs'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                        }`}
                      >
                        <NavIcon
                          type={res.key}
                          className={isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
                        />
                        <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : 'inline'}`}>{res.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className={`shrink-0 border-t border-gray-100 ${isSidebarCollapsed ? 'p-2 lg:p-2.5' : 'p-3.5'} dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 transition-all`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'gap-3'}`} title={user?.nama || 'Pengguna'}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-xs shadow-xs">
              {user?.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className={`min-w-0 flex-1 ${isSidebarCollapsed ? 'lg:hidden' : 'block'}`}>
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

            {/* Breadcrumb / Title Indicator (Disembunyikan di Mobile, Ditampilkan di Layar Laptop / Desktop) */}
            <div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                <button
                  type="button"
                  onClick={() => handleNavigate('dashboard')}
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
                >
                  SIM-KK
                </button>
                <span>/</span>
                <span className="text-gray-600 dark:text-gray-300 font-semibold">
                  {currentActiveKey === 'dashboard'
                    ? 'Ikhtisar'
                    : ['calonKlien', 'kontrak'].includes(currentActiveKey)
                    ? 'CRM & Kontrak'
                    : ['klien', 'pekerjaan'].includes(currentActiveKey)
                    ? 'Operasional'
                    : ['reporting', 'performanceReviews', 'kinerjaKaryawan'].includes(currentActiveKey)
                    ? 'Laporan & Kinerja'
                    : ['layanan', 'masterPekerjaan'].includes(currentActiveKey)
                    ? 'Data Master'
                    : 'Administrasi'}
                </span>
                {currentActiveKey !== 'dashboard' && (
                  <>
                    <span>/</span>
                    <span className="text-brand-600 dark:text-brand-400 font-bold truncate max-w-[120px] sm:max-w-xs">
                      {activeConfig?.key === 'pekerjaan' && user?.role === 'karyawan'
                        ? 'Pekerjaan Saya'
                        : activeConfig?.key === 'kinerjaKaryawan' && user?.role === 'karyawan'
                        ? 'Kinerja Saya'
                        : activeConfig?.label}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight mt-0.5">
                {currentActiveKey === 'dashboard'
                  ? 'Dasbor Utama'
                  : activeConfig?.key === 'pekerjaan' && user?.role === 'karyawan'
                  ? 'Pekerjaan Saya'
                  : activeConfig?.key === 'kinerjaKaryawan' && user?.role === 'karyawan'
                  ? 'Kinerja Saya'
                  : activeConfig?.label || 'Modul Operasional'}
              </h1>
            </div>
          </div>

          {/* Right Header: Theme Toggle, Notifications, Role Pill & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Tombol Pengubah Mode Gelap (Dark Mode Toggle) */}
            <button
              type="button"
              onClick={() => {
                setIsDarkMode((prev) => {
                  const next = !prev
                  try {
                    localStorage.setItem('theme', next ? 'dark' : 'light')
                  } catch {}
                  return next
                })
              }}
              className="flex size-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title={isDarkMode ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="size-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="size-4.5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Pusat Notifikasi / Lonceng Notifikasi */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className={`relative flex size-9 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                  isNotifOpen
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 dark:border-brand-600'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
                title="Pusat Pemberitahuan & Pengingat"
                aria-label="Buka notifikasi"
              >
                <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {totalNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex min-w-4.5 h-4.5 px-1 items-center justify-center rounded-full bg-error-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-gray-900 animate-pulse">
                    {totalNotifCount > 99 ? '99+' : totalNotifCount}
                  </span>
                )}
              </button>

              {/* Dropdown Popover Panel Notifikasi (Responsive Mobile & Desktop) */}
              {isNotifOpen && (
                <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2.5 w-auto sm:w-96 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-hidden animate-fade-in max-h-[80vh] flex flex-col">
                  <div className="flex items-center justify-between p-3.5 border-b border-gray-100 dark:border-gray-700/80 bg-gray-50/75 dark:bg-gray-900/60">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                        Pemberitahuan
                      </h4>
                      {totalNotifCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300">
                          {totalNotifCount} Perlu Tindakan
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={loadNotifications}
                      className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                    >
                      Segarkan
                    </button>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500">
                        <div className="size-10 mx-auto mb-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Semua beres!</p>
                        <p className="mt-0.5">Tidak ada tugas mendesak atau laporan tertunda saat ini.</p>
                      </div>
                    ) : (
                      notifications.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            item.onClick()
                            setIsNotifOpen(false)
                          }}
                          className="w-full text-left p-3.5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-start gap-3 cursor-pointer group"
                        >
                          <span className={`size-2.5 mt-1 rounded-full shrink-0 ${item.dotColor || 'bg-brand-500'} group-hover:scale-125 transition-transform`} />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
                              {item.category}
                            </span>
                            <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Badge size="sm" color={roleBadgeColor} className="uppercase font-bold tracking-wide">
              <span className="hidden sm:inline">{roleLabel}</span>
              <span className="sm:hidden">{roleShortLabel}</span>
            </Badge>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 transition hover:bg-error-50 hover:border-error-200 hover:text-error-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-error-500/10 dark:hover:text-error-400 cursor-pointer shadow-2xs active:scale-95"
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
          <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6 lg:p-7 pb-36 md:pb-8">
            {currentActiveKey === 'dashboard' ? (
              <DashboardView key={`dashboard_${navVersion}`} onNavigate={handleNavigate} />
            ) : activeConfig ? (
              <ResourceDashboard
                key={`${currentActiveKey}_${navVersion}`}
                config={activeConfig}
                resourceConfigs={resourceConfigs}
                supportResources={supportResources}
                onNavigate={handleNavigate}
                initialNavParams={activeConfig.key === 'pekerjaan' ? navParams : null}
                onClearNavParams={() => setNavParams(null)}
              />
            ) : (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                Tidak ada modul yang tersedia untuk peran Anda.
              </div>
            )}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Fixed bottom on screens < md) */}
        <nav
          aria-label="Navigasi Bawah Mobile"
          className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/90 dark:border-gray-800/90 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        >
          <div className="grid grid-cols-5 items-center justify-around gap-1 max-w-lg mx-auto">
            {/* 1. Dasbor */}
            <button
              type="button"
              onClick={() => handleNavigate('dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all select-none cursor-pointer ${
                currentActiveKey === 'dashboard'
                  ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <NavIcon
                type="dashboard"
                className={`size-5 transition-colors ${currentActiveKey === 'dashboard' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}
              />
              <span className="text-[10px] mt-0.5 truncate leading-tight">Dasbor</span>
            </button>

            {/* 2. Calon Klien / Klien */}
            {allowedResources.some((r) => ['klien', 'calonKlien'].includes(r.key)) && (
              <button
                type="button"
                onClick={() => handleNavigate(allowedResources.some((r) => r.key === 'klien') ? 'klien' : 'calonKlien')}
                className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all select-none cursor-pointer ${
                  ['klien', 'calonKlien'].includes(currentActiveKey)
                    ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <NavIcon
                  type="klien"
                  className={`size-5 transition-colors ${['klien', 'calonKlien'].includes(currentActiveKey) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}
                />
                <span className="text-[10px] mt-0.5 truncate leading-tight">Klien</span>
              </button>
            )}

            {/* 3. Pekerjaan */}
            {allowedResources.some((r) => r.key === 'pekerjaan') && (
              <button
                type="button"
                onClick={() => handleNavigate('pekerjaan')}
                className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all select-none cursor-pointer ${
                  currentActiveKey === 'pekerjaan'
                    ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <NavIcon
                  type="pekerjaan"
                  className={`size-5 transition-colors ${currentActiveKey === 'pekerjaan' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}
                />
                <span className="text-[10px] mt-0.5 truncate leading-tight">Tugas</span>
              </button>
            )}

            {/* 4. Reporting / Kinerja */}
            {allowedResources.some((r) => ['reporting', 'kinerjaKaryawan'].includes(r.key)) && (
              <button
                type="button"
                onClick={() => handleNavigate(allowedResources.some((r) => r.key === 'reporting') ? 'reporting' : 'kinerjaKaryawan')}
                className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all select-none cursor-pointer ${
                  ['reporting', 'kinerjaKaryawan'].includes(currentActiveKey)
                    ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <NavIcon
                  type="reporting"
                  className={`size-5 transition-colors ${['reporting', 'kinerjaKaryawan'].includes(currentActiveKey) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}
                />
                <span className="text-[10px] mt-0.5 truncate leading-tight">Laporan</span>
              </button>
            )}

            {/* 5. Menu Lainnya (Buka Sidebar Drawer Mobile) */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all select-none cursor-pointer"
            >
              <div className="size-5 flex items-center justify-center">
                <svg className="size-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <span className="text-[10px] mt-0.5 truncate leading-tight">Lainnya</span>
            </button>
          </div>
        </nav>
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
