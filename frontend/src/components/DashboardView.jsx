import { useEffect, useState } from 'react'
import { getDashboardSummary } from '../api/resources'
import { useAuth } from '../auth/useAuth'

export default function DashboardView() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function fetchSummary() {
      try {
        const res = await getDashboardSummary()
        if (!ignore) {
          setSummary(res)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Gagal memuat ringkasan dashboard.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchSummary()

    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <section className="resource-panel">
        <div className="empty-state">Memuat ringkasan data dasbor...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="resource-panel">
        <div className="alert" role="alert">
          {error}
        </div>
      </section>
    )
  }

  const totals = summary?.totals || {}
  const workByStatus = summary?.work_by_status || {}
  const leadByStatus = summary?.lead_by_status || {}
  const contractByStatus = summary?.contract_by_status || {}
  const employeeScores = summary?.employee_scores || []

  return (
    <section className="resource-panel dashboard-view">
      <div className="panel-copy">
        <p className="eyebrow">Ringkasan Sistem</p>
        <h1>Dasbor Eksekutif & Kinerja</h1>
        <p>
          Selamat datang kembali, <strong>{user?.nama}</strong>. Berikut adalah ringkasan data operasional dan kinerja terkini berdasarkan peran Anda.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid">
        {/* Karyawan Specific Stats */}
        {user?.role === 'karyawan' && (
          <>
            <div className="stat-card">
              <span className="stat-label">Total Tugas Saya</span>
              <strong className="stat-value">{totals.tasks ?? 0}</strong>
              <small className="stat-desc">Tugas yang ditugaskan kepada Anda</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tugas Selesai</span>
              <strong className="stat-value success-text">{totals.completed_tasks ?? 0}</strong>
              <small className="stat-desc">Tugas yang telah disetujui pimpinan</small>
            </div>
            <div className={`stat-card ${totals.overdue_tasks > 0 ? 'card-warning' : ''}`}>
              <span className="stat-label">Tugas Terlambat</span>
              <strong className="stat-value danger-text">{totals.overdue_tasks ?? 0}</strong>
              <small className="stat-desc">Melewati tenggat waktu</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Skor Kinerja Rata-rata</span>
              <strong className="stat-value primary-text">
                {totals.average_performance_score ? `${totals.average_performance_score} / 100` : 'Belum Dinilai'}
              </strong>
              <small className="stat-desc">Berdasarkan evaluasi pimpinan</small>
            </div>
          </>
        )}

        {/* Sales Specific Stats */}
        {user?.role === 'sales' && (
          <>
            <div className="stat-card">
              <span className="stat-label">Total Calon Klien</span>
              <strong className="stat-value">{totals.leads ?? 0}</strong>
              <small className="stat-desc">Pipeline prospek bisnis</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Prospek Deal</span>
              <strong className="stat-value success-text">{totals.lead_deal ?? 0}</strong>
              <small className="stat-desc">Siap dikonversi ke kontrak</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Prospek Lost</span>
              <strong className="stat-value muted-text">{totals.lead_lost ?? 0}</strong>
              <small className="stat-desc">Tidak melanjutkan kerjasama</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Klien Aktif</span>
              <strong className="stat-value primary-text">{totals.active_clients ?? 0}</strong>
              <small className="stat-desc">Klien yang telah bekerjasama</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Kontrak</span>
              <strong className="stat-value">{totals.contracts ?? 0}</strong>
              <small className="stat-desc">Dokumen kontrak terdaftar</small>
            </div>
          </>
        )}

        {/* Admin & Pimpinan Stats */}
        {(user?.role === 'admin' || user?.role === 'pimpinan') && (
          <>
            <div className="stat-card">
              <span className="stat-label">Total Calon Klien</span>
              <strong className="stat-value">{totals.leads ?? 0}</strong>
              <small className="stat-desc">{totals.lead_deal ?? 0} Deal / {totals.lead_lost ?? 0} Lost</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Klien Aktif</span>
              <strong className="stat-value primary-text">{totals.active_clients ?? 0}</strong>
              <small className="stat-desc">Klien resmi terdaftar</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Kontrak</span>
              <strong className="stat-value">{totals.contracts ?? 0}</strong>
              <small className="stat-desc">Dokumen perjanjian kerjasama</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Pekerjaan</span>
              <strong className="stat-value">{totals.tasks ?? 0}</strong>
              <small className="stat-desc">Proyek dan tugas operasional</small>
            </div>
            <div className={`stat-card ${totals.overdue_tasks > 0 ? 'card-warning' : ''}`}>
              <span className="stat-label">Pekerjaan Terlambat</span>
              <strong className="stat-value danger-text">{totals.overdue_tasks ?? 0}</strong>
              <small className="stat-desc">Perlu perhatian segera</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">Rata-rata Skor Kinerja</span>
              <strong className="stat-value success-text">
                {totals.average_performance_score ? `${totals.average_performance_score} / 100` : '-'}
              </strong>
              <small className="stat-desc">Evaluasi kinerja karyawan</small>
            </div>
          </>
        )}
      </div>

      {/* BREAKDOWN SECTION */}
      <div className="breakdown-grid">
        {/* Status Pekerjaan */}
        {Object.keys(workByStatus).length > 0 && (
          <div className="breakdown-card">
            <h3>Status Pekerjaan {user?.role === 'karyawan' ? '(Tugas Saya)' : ''}</h3>
            <div className="status-pill-list">
              {Object.entries(workByStatus).map(([statusKey, count]) => (
                <div key={statusKey} className="status-pill-item">
                  <span className={`badge badge-${statusKey}`}>{statusKey}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Calon Klien */}
        {Object.keys(leadByStatus).length > 0 && (
          <div className="breakdown-card">
            <h3>Pipeline Calon Klien</h3>
            <div className="status-pill-list">
              {Object.entries(leadByStatus).map(([statusKey, count]) => (
                <div key={statusKey} className="status-pill-item">
                  <span className={`badge badge-${statusKey}`}>{statusKey}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Kontrak */}
        {Object.keys(contractByStatus).length > 0 && (
          <div className="breakdown-card">
            <h3>Status Kontrak</h3>
            <div className="status-pill-list">
              {Object.entries(contractByStatus).map(([statusKey, count]) => (
                <div key={statusKey} className="status-pill-item">
                  <span className={`badge badge-${statusKey}`}>{statusKey}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LEADERBOARD KINERJA KARYAWAN (Admin & Pimpinan) */}
      {(user?.role === 'admin' || user?.role === 'pimpinan') && employeeScores.length > 0 && (
        <div className="leaderboard-section">
          <h3>Top Kinerja Karyawan</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Peringkat</th>
                  <th>Nama Karyawan</th>
                  <th>Jumlah Evaluasi</th>
                  <th>Rata-rata Skor</th>
                </tr>
              </thead>
              <tbody>
                {employeeScores.map((employee, idx) => (
                  <tr key={employee.id_user}>
                    <td>#{idx + 1}</td>
                    <td><strong>{employee.nama || `Karyawan #${employee.id_user}`}</strong></td>
                    <td>{employee.total_reviews} review</td>
                    <td>
                      <span className="badge badge-completed">
                        {employee.average_score} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
