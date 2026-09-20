import { useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { resourceConfigs, supportResources } from '../config/resources'
import DashboardView from './DashboardView'
import ResourceDashboard from './ResourceDashboard'

export default function ProtectedShell() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  // Filter accessible resources based on user role
  const allowedResources = useMemo(() => {
    return resourceConfigs.filter((resource) => {
      if (!resource.allowedRoles) return true
      return resource.allowedRoles.includes(user?.role)
    })
  }, [user?.role])

  // Default to 'dashboard' view for all roles
  const [activeKey, setActiveKey] = useState('dashboard')

  // Validate active key: must be 'dashboard' or one of the allowed resources
  const isDashboardActive = activeKey === 'dashboard'
  const isResourceActive = allowedResources.some((r) => r.key === activeKey)
  const currentActiveKey = isDashboardActive || isResourceActive ? activeKey : 'dashboard'

  const activeConfig = useMemo(() => {
    if (currentActiveKey === 'dashboard') return null
    return allowedResources.find((resource) => resource.key === currentActiveKey) || allowedResources[0]
  }, [allowedResources, currentActiveKey])

  async function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      setLoggingOut(true)
      try {
        await logout()
      } finally {
        setLoggingOut(false)
      }
    }
  }

  const roleLabels = {
    admin: 'Administrator',
    sales: 'Sales / Marketing',
    karyawan: 'Karyawan / PIC',
    pimpinan: 'Pimpinan / Manajer',
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <p className="eyebrow">PPSA Project</p>
          <h2>SIM-KK Dashboard</h2>
        </div>

        <div className="user-profile-card">
          <div className="user-avatar" aria-hidden="true">
            {user?.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <strong className="user-name">{user?.nama || 'Pengguna'}</strong>
            <span className={`role-badge role-${user?.role || 'default'}`}>
              {roleLabels[user?.role] || user?.role}
            </span>
            <small className="user-email">{user?.email}</small>
          </div>
        </div>

        <nav className="resource-nav" aria-label="Navigasi Resource">
          <p className="nav-heading">Menu Utama</p>
          <button
            type="button"
            className={currentActiveKey === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveKey('dashboard')}
          >
            Dasbor Utama
          </button>

          <p className="nav-heading">Modul Bisnis</p>
          {allowedResources.map((resource) => (
            <button
              key={resource.key}
              type="button"
              className={resource.key === currentActiveKey ? 'active' : ''}
              onClick={() => setActiveKey(resource.key)}
            >
              {resource.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="danger-button logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      </aside>

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
        <section className="resource-panel">
          <div className="empty-state">
            Tidak ada modul yang tersedia untuk peran Anda.
          </div>
        </section>
      )}
    </main>
  )
}
