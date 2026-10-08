import { useEffect, useState } from 'react'
import { getDashboardSummary } from '../api/resources'
import { useAuth } from '../auth/useAuth'
import Badge from './ui/Badge'
import GridShape from './common/GridShape'
import LoadingSpinner from './common/LoadingSpinner'

// Status labels & Tailwind color maps
const WORK_STATUS_CONFIG = {
  baru: { label: 'Baru', color: 'bg-blue-light-500', badgeColor: 'info' },
  draft: { label: 'Draft', color: 'bg-gray-400', badgeColor: 'light' },
  in_progress: { label: 'Dalam Pengerjaan', color: 'bg-brand-500', badgeColor: 'primary' },
  submitted: { label: 'Diajukan', color: 'bg-warning-500', badgeColor: 'warning' },
  review: { label: 'Menunggu Review', color: 'bg-warning-500', badgeColor: 'warning' },
  revision: { label: 'Perlu Revisi', color: 'bg-error-500', badgeColor: 'error' },
  revision_needed: { label: 'Perlu Revisi', color: 'bg-error-500', badgeColor: 'error' },
  approved: { label: 'Disetujui', color: 'bg-success-500', badgeColor: 'success' },
  completed: { label: 'Selesai', color: 'bg-success-600', badgeColor: 'success' },
}

const LEAD_STATUS_CONFIG = {
  prospek: { label: 'Prospek Awal', color: 'bg-gray-400', badgeColor: 'light' },
  approach: { label: 'Pendekatan', color: 'bg-blue-light-500', badgeColor: 'info' },
  negotiation: { label: 'Negosiasi', color: 'bg-warning-500', badgeColor: 'warning' },
  deal: { label: 'Deal (Berhasil)', color: 'bg-success-500', badgeColor: 'success' },
  lost: { label: 'Batal / Lost', color: 'bg-error-400', badgeColor: 'error' },
}

const CONTRACT_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-400', badgeColor: 'light' },
  aktif: { label: 'Aktif Berjalan', color: 'bg-success-500', badgeColor: 'success' },
  selesai: { label: 'Selesai', color: 'bg-blue-light-500', badgeColor: 'info' },
  batal: { label: 'Dibatalkan', color: 'bg-error-500', badgeColor: 'error' },
}

const ROLE_BADGE_CONFIG = {
  admin: { label: 'Pimpinan (Admin Utama)', color: 'primary' },
  pimpinan: { label: 'Pimpinan (Admin Utama)', color: 'primary' },
  operator: { label: 'Operator', color: 'success' },
  sales: { label: 'Operator', color: 'success' },
  karyawan: { label: 'Karyawan', color: 'info' },
}

// Subcomponent: TailAdmin Metric Stat Card - Crisp and proportional
function MetricCard({ title, value, subtitle, icon, iconBg = 'bg-brand-50 text-brand-600 dark:bg-brand-500/15', alert = false, badgeText, badgeColor = 'primary' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all shadow-xs hover:shadow-md ${
        alert
          ? 'border-error-200 bg-error-25/40 dark:border-error-800 dark:bg-error-500/5'
          : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${alert ? 'bg-error-50 text-error-600 dark:bg-error-500/15' : iconBg}`}>
          {icon}
        </div>
        {badgeText && (
          <Badge size="sm" color={badgeColor}>
            {badgeText}
          </Badge>
        )}
      </div>

      <div className="mt-3.5">
        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate block">{title}</span>
        <h4 className={`mt-1 text-xl sm:text-2xl font-bold tracking-tight ${alert ? 'text-error-600 dark:text-error-400' : 'text-gray-900 dark:text-white'}`}>
          {value}
        </h4>
        {subtitle && (
          <p className={`mt-1 text-xs truncate ${alert ? 'text-error-500' : 'text-gray-400 dark:text-gray-500'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// Subcomponent: Welcome Banner Widget with GridShape
function WelcomeBannerWidget({ user }) {
  const roleConfig = ROLE_BADGE_CONFIG[user?.role] || {
    label: user?.role,
    color: 'primary',
  }

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-r from-brand-50/60 via-white to-white p-5 sm:p-6 md:p-7 dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 shadow-xs mb-6">
      <GridShape />
      <div className="relative z-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge color={roleConfig.color} size="sm">
              {roleConfig.label}
            </Badge>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              • {todayFormatted}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Selamat datang kembali, {user?.nama || 'Pengguna'}!
          </h1>

          <p className="mt-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {user?.role === 'karyawan' &&
              'Pantau progres tugas harian Anda, kelola batas waktu pengerjaan, dan pantau catatan ulasan kinerja Anda secara real-time.'}
            {['operator', 'sales'].includes(user?.role) &&
              'Kelola saluran prospek calon klien, tentukan penanggung jawab (PIC) untuk klien penyewa jasa, dan pantau kelola pekerjaan.'}
            {['pimpinan', 'admin'].includes(user?.role) &&
              'Akses ikhtisar performa eksekutif, kelola administrasi pengguna, tinjau progres operasional proyek, dan pantau metrik kinerja perusahaan.'}
          </p>
        </div>

        <div className="hidden sm:flex shrink-0 items-center justify-center">
          <img
            src="/img/welcome.svg"
            alt="SIM-KK Welcome"
            className="w-36 md:w-44 h-auto object-contain drop-shadow-xs"
          />
        </div>
      </div>
    </div>
  )
}

// Subcomponent: Status Breakdown Card
function StatusBreakdownCard({ title, icon, data, configMap, totalLabel = 'Total' }) {
  const entries = Object.entries(data || {})
  const total = entries.reduce((sum, [, count]) => sum + Number(count || 0), 0)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
                {icon}
              </div>
            )}
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <Badge size="sm" color="light">
            {totalLabel}: {total}
          </Badge>
        </div>

        {entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Belum ada data status untuk ditampilkan
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {entries.map(([key, count]) => {
              const config = configMap[key] || { label: key, color: 'bg-brand-500', badgeColor: 'primary' }
              const percentage = total > 0 ? Math.round((Number(count) / total) * 100) : 0

              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className={`size-2 rounded-full ${config.color}`} />
                      {config.label}
                    </span>
                    <span className="text-gray-900 dark:text-white font-bold">
                      {count} <span className="font-normal text-gray-400">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${config.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Subcomponent: Employee Leaderboard Table
function LeaderboardTable({ employees }) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Peringkat Kinerja Karyawan Teratas
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Berdasarkan akumulasi evaluasi pimpinan & kecepatan penyelesaian
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-3">Peringkat</th>
              <th className="py-3 px-3">Karyawan</th>
              <th className="py-3 px-3">Jumlah Evaluasi</th>
              <th className="py-3 px-3 text-right">Rata-rata Skor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-400">
                  Belum ada catatan evaluasi kinerja karyawan
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => {
                const rankBadges = ['bg-amber-400 text-white', 'bg-slate-400 text-white', 'bg-amber-700 text-white']
                const isTop3 = index < 3

                return (
                  <tr key={emp.id_user} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                          isTop3 ? rankBadges[index] : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs">
                          {emp.nama ? emp.nama.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                            {emp.nama || `Karyawan #${emp.id_user}`}
                          </p>
                          <span className="text-xs text-gray-400 font-mono">ID: {emp.id_user}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300 font-medium">
                      {emp.total_reviews} evaluasi
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Badge
                        size="sm"
                        color={emp.average_score >= 80 ? 'success' : emp.average_score >= 60 ? 'warning' : 'error'}
                      >
                        {emp.average_score} / 100
                      </Badge>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Subcomponent: Admin Dashboard View
function AdminDashboardView({ totals, workByStatus, leadByStatus, contractByStatus, employeeScores }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="Total Calon Klien"
          value={totals.leads ?? 0}
          subtitle={`${totals.lead_deal ?? 0} Deal / ${totals.lead_lost ?? 0} Lost`}
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBg="bg-brand-50 text-brand-600 dark:bg-brand-500/15"
        />

        <MetricCard
          title="Klien Aktif"
          value={totals.active_clients ?? 0}
          subtitle="Klien resmi terdaftar"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconBg="bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15"
        />

        <MetricCard
          title="Total Kontrak"
          value={totals.contracts ?? 0}
          subtitle="Perjanjian kerja sama"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          iconBg="bg-success-50 text-success-600 dark:bg-success-500/15"
        />

        <MetricCard
          title="Total Pekerjaan"
          value={totals.tasks ?? 0}
          subtitle="Tugas operasional aktif"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          iconBg="bg-orange-50 text-orange-600 dark:bg-orange-500/15"
        />

        <MetricCard
          title="Tugas Terlambat"
          value={totals.overdue_tasks ?? 0}
          subtitle={totals.overdue_tasks > 0 ? 'Perlu perhatian segera' : 'Semua tepat waktu'}
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-error-50 text-error-600 dark:bg-error-500/15"
          alert={totals.overdue_tasks > 0}
        />

        <MetricCard
          title="Rata-rata Kinerja"
          value={totals.average_performance_score ? `${totals.average_performance_score}` : '-'}
          subtitle="Indeks evaluasi tim"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          iconBg="bg-warning-50 text-warning-600 dark:bg-warning-500/15"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusBreakdownCard
          title="Distribusi Status Pekerjaan"
          icon={
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          data={workByStatus}
          configMap={WORK_STATUS_CONFIG}
          totalLabel="Total Tugas"
        />

        <StatusBreakdownCard
          title="Pipeline Calon Klien (CRM)"
          icon={
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          data={leadByStatus}
          configMap={LEAD_STATUS_CONFIG}
          totalLabel="Total Leads"
        />

        <StatusBreakdownCard
          title="Status Kontrak Kerja Sama"
          icon={
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          data={contractByStatus}
          configMap={CONTRACT_STATUS_CONFIG}
          totalLabel="Total Kontrak"
        />
      </div>

      <LeaderboardTable employees={employeeScores} />
    </>
  )
}

// Subcomponent: Pimpinan Dashboard View
function PimpinanDashboardView({ totals, workByStatus, leadByStatus, employeeScores }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Kontrak Bisnis"
          value={totals.contracts ?? 0}
          subtitle={`${totals.active_clients ?? 0} Klien aktif terhubung`}
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          iconBg="bg-brand-50 text-brand-600 dark:bg-brand-500/15"
        />

        <MetricCard
          title="Konversi Lead (Deal)"
          value={totals.lead_deal ?? 0}
          subtitle={`Dari total ${totals.leads ?? 0} calon klien`}
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
          iconBg="bg-success-50 text-success-600 dark:bg-success-500/15"
        />

        <MetricCard
          title="Pekerjaan Terlambat"
          value={totals.overdue_tasks ?? 0}
          subtitle={totals.overdue_tasks > 0 ? 'Membutuhkan eskalasi' : 'Operasional lancar'}
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-error-50 text-error-600 dark:bg-error-500/15"
          alert={totals.overdue_tasks > 0}
        />

        <MetricCard
          title="Rata-rata Kinerja Tim"
          value={totals.average_performance_score ? `${totals.average_performance_score} / 100` : '-'}
          subtitle="Hasil evaluasi berkala pimpinan"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          iconBg="bg-warning-50 text-warning-600 dark:bg-warning-500/15"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatusBreakdownCard
          title="Progres Pengerjaan Proyek & Tugas"
          icon={
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          data={workByStatus}
          configMap={WORK_STATUS_CONFIG}
          totalLabel="Total Tugas"
        />

        <StatusBreakdownCard
          title="Kesehatan Pipeline Penjualan"
          icon={
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          data={leadByStatus}
          configMap={LEAD_STATUS_CONFIG}
          totalLabel="Total Leads"
        />
      </div>

      <LeaderboardTable employees={employeeScores} />
    </>
  )
}

// Subcomponent: Sales Dashboard View
function SalesDashboardView({ totals, leadByStatus, contractByStatus }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          title="Total Calon Klien"
          value={totals.leads ?? 0}
          subtitle="Pipeline prospek aktif"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBg="bg-brand-50 text-brand-600 dark:bg-brand-500/15"
        />

        <MetricCard
          title="Prospek Deal"
          value={totals.lead_deal ?? 0}
          subtitle="Siap terbit kontrak"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
          iconBg="bg-success-50 text-success-600 dark:bg-success-500/15"
        />

        <MetricCard
          title="Prospek Lost"
          value={totals.lead_lost ?? 0}
          subtitle="Peluang terhenti"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          iconBg="bg-gray-100 text-gray-500 dark:bg-gray-800"
        />

        <MetricCard
          title="Klien Aktif"
          value={totals.active_clients ?? 0}
          subtitle="Resmi bermitra"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          iconBg="bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15"
        />

        <MetricCard
          title="Total Kontrak"
          value={totals.contracts ?? 0}
          subtitle="Dokumen kontrak resmi"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          iconBg="bg-orange-50 text-orange-600 dark:bg-orange-500/15"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7">
          <StatusBreakdownCard
            title="Funnel Tahapan Calon Klien (CRM)"
            icon={
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            data={leadByStatus}
            configMap={LEAD_STATUS_CONFIG}
            totalLabel="Total Calon Klien"
          />
        </div>
        <div className="md:col-span-5">
          <StatusBreakdownCard
            title="Distribusi Status Kontrak"
            icon={
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            data={contractByStatus}
            configMap={CONTRACT_STATUS_CONFIG}
            totalLabel="Total Kontrak"
          />
        </div>
      </div>
    </>
  )
}

// Subcomponent: Karyawan Dashboard View
function KaryawanDashboardView({ totals, workByStatus, recentTasks = [] }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Tugas Saya"
          value={totals.tasks ?? 0}
          subtitle="Tugas yang ditugaskan ke Anda"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          iconBg="bg-brand-50 text-brand-600 dark:bg-brand-500/15"
        />

        <MetricCard
          title="Tugas Selesai"
          value={totals.completed_tasks ?? 0}
          subtitle="Telah disetujui pimpinan"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
          iconBg="bg-success-50 text-success-600 dark:bg-success-500/15"
        />

        <MetricCard
          title="Tugas Terlambat"
          value={totals.overdue_tasks ?? 0}
          subtitle={totals.overdue_tasks > 0 ? 'Melewati batas deadline' : 'Semua pengerjaan tepat waktu'}
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-error-50 text-error-600 dark:bg-error-500/15"
          alert={totals.overdue_tasks > 0}
        />

        <MetricCard
          title="Skor Kinerja Saya"
          value={totals.average_performance_score ? `${totals.average_performance_score} / 100` : 'Belum Ada'}
          subtitle="Berdasarkan evaluasi pimpinan"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          iconBg="bg-warning-50 text-warning-600 dark:bg-warning-500/15"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        <div className="md:col-span-7">
          <StatusBreakdownCard
            title="Distribusi Status Tugas Saya"
            icon={
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            data={workByStatus}
            configMap={WORK_STATUS_CONFIG}
            totalLabel="Tugas Terdaftar"
          />
        </div>

        <div className="md:col-span-5">
          <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Panduan Produktivitas
                </h3>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Pastikan Anda memperbarui status tugas secara berkala pada modul <strong>Pekerjaan Saya</strong>. Kirimkan laporan atau ajukan persetujuan sebelum batas deadline untuk menjaga indeks evaluasi kerja pimpinan tetap prima.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Status Sistem: <strong className="text-success-600">Online & Aktif</strong>
              </span>
              <Badge size="sm" color="light">
                SIM-KK Portal
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Tugas Terkini Langsung di Dasbor */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Daftar Tugas Saya
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pekerjaan yang ditugaskan kepada Anda oleh Operator / Pimpinan
              </p>
            </div>
          </div>
          <Badge size="sm" color="info">
            {recentTasks.length} Tugas Terdaftar
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-3">Judul Pekerjaan</th>
                <th className="py-3 px-3">Klien</th>
                <th className="py-3 px-3">Tgl Penugasan</th>
                <th className="py-3 px-3">Batas Waktu</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Belum ada tugas yang ditugaskan kepada Anda saat ini.
                  </td>
                </tr>
              ) : (
                recentTasks.map((task) => {
                  const statusInfo = WORK_STATUS_CONFIG[task.status] || { label: task.status, badgeColor: 'light' }
                  return (
                    <tr key={task.id_pekerjaan} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {task.judul}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300">
                        {task.klien}
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400 text-xs">
                        {task.tgl_penugasan}
                      </td>
                      <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                        {task.deadline}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Badge size="sm" color={statusInfo.badgeColor}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

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
    return <LoadingSpinner size="screen" text="" />
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-error-200 bg-error-50 p-4 text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
          <p className="font-semibold text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const totals = summary?.totals || {}
  const workByStatus = summary?.work_by_status || {}
  const leadByStatus = summary?.lead_by_status || {}
  const contractByStatus = summary?.contract_by_status || {}
  const employeeScores = summary?.employee_scores || []

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner Widget */}
      <WelcomeBannerWidget user={user} />

      {/* 2. Role-Based Dashboard View */}
      {['admin', 'pimpinan'].includes(user?.role) && (
        <AdminDashboardView
          totals={totals}
          workByStatus={workByStatus}
          leadByStatus={leadByStatus}
          contractByStatus={contractByStatus}
          employeeScores={employeeScores}
        />
      )}

      {['operator', 'sales'].includes(user?.role) && (
        <SalesDashboardView
          totals={totals}
          leadByStatus={leadByStatus}
          contractByStatus={contractByStatus}
        />
      )}

      {user?.role === 'karyawan' && (
        <KaryawanDashboardView
          totals={totals}
          workByStatus={workByStatus}
          recentTasks={summary?.recent_tasks || []}
        />
      )}
    </div>
  )
}
