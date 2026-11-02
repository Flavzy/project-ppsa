import { useEffect, useMemo, useState } from 'react'
import { getDashboardSummary } from '../api/resources'
import { getCachedApiData } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Badge from './ui/Badge'
import GridShape from './common/GridShape'
import LoadingSpinner from './common/LoadingSpinner'
import DeadlineBadge from './common/DeadlineBadge'

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
  deal: { label: 'Deal (Berhasil)', color: 'bg-success-500', badgeColor: 'success' },
  belum_deal: { label: 'Belum Deal', color: 'bg-warning-500', badgeColor: 'warning' },
  prospek: { label: 'Belum Deal', color: 'bg-warning-500', badgeColor: 'warning' },
  approach: { label: 'Belum Deal', color: 'bg-warning-500', badgeColor: 'warning' },
  negotiation: { label: 'Belum Deal', color: 'bg-warning-500', badgeColor: 'warning' },
  lost: { label: 'Belum Deal (Lost)', color: 'bg-error-400', badgeColor: 'error' },
}

const CONTRACT_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-400', badgeColor: 'light' },
  aktif: { label: 'Aktif Berjalan', color: 'bg-success-500', badgeColor: 'success' },
  selesai: { label: 'Selesai', color: 'bg-blue-light-500', badgeColor: 'info' },
  nonaktif: { label: 'Nonaktif / Berakhir', color: 'bg-warning-500', badgeColor: 'warning' },
  batal: { label: 'Dibatalkan', color: 'bg-error-500', badgeColor: 'error' },
}

const ROLE_BADGE_CONFIG = {
  admin: { label: 'Pimpinan (Admin Utama)', color: 'primary' },
  pimpinan: { label: 'Pimpinan (Admin Utama)', color: 'primary' },
  operator: { label: 'Operator', color: 'success' },
  sales: { label: 'Operator', color: 'success' },
  karyawan: { label: 'Karyawan', color: 'info' },
}

// Subcomponent: TailAdmin Metric Stat Card - Crisp and proportional (Bentuk Balok Tipis Sudut Diagonal Bawah + Kanan)
function MetricCard({ title, value, subtitle, icon, iconBg = 'bg-brand-50 text-brand-600 dark:bg-brand-500/15', alert = false, badgeText, badgeColor = 'primary' }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-r-[3.5px] border-b-[3.5px] p-3.5 sm:p-5 transition-all duration-200 ease-out transform-gpu hover:-translate-y-0.5 hover:scale-[1.025] hover:shadow-md hover:z-10 cursor-default select-none ${
        alert
          ? 'border-error-200 border-r-error-300 border-b-error-400/90 bg-error-25/40 dark:border-error-800 dark:border-r-error-700 dark:border-b-error-600 dark:bg-error-500/5 shadow-[2px_2px_0_0_rgba(248,113,113,0.15)] hover:border-r-error-400 hover:border-b-error-500'
          : 'border-gray-200 border-r-gray-300/80 border-b-gray-300/95 bg-white dark:border-gray-800 dark:border-r-gray-700/80 dark:border-b-gray-700 dark:bg-gray-900 shadow-[2px_2px_0_0_rgba(203,213,225,0.35)] hover:border-r-brand-300 hover:border-b-brand-400 dark:hover:border-r-brand-500 dark:hover:border-b-brand-500'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className={`flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${alert ? 'bg-error-50 text-error-600 dark:bg-error-500/15' : iconBg}`}>
          {icon}
        </div>
        {badgeText && (
          <Badge size="sm" color={badgeColor} className="text-[10px] sm:text-xs">
            {badgeText}
          </Badge>
        )}
      </div>

      <div className="mt-2.5 sm:mt-3.5">
        <span className="text-[11px] sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate block">{title}</span>
        <h4 className={`mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold tracking-tight ${alert ? 'text-error-600 dark:text-error-400' : 'text-gray-900 dark:text-white'}`}>
          {value}
        </h4>
        {subtitle && (
          <p className={`mt-0.5 sm:mt-1 text-[10px] sm:text-xs truncate ${alert ? 'text-error-500' : 'text-gray-400 dark:text-gray-500'}`}>
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
          <div className="flex items-center gap-1.5 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <svg className="size-3.5 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {todayFormatted}
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
            className="w-36 md:w-44 h-auto object-contain drop-shadow-xs animate-welcome-entrance"
          />
        </div>
      </div>
    </div>
  )
}

// Subcomponent: Status Breakdown Card dengan Hover & Click Tooltip Interaktif
function StatusBreakdownCard({ title, icon, data, configMap, totalLabel = 'Total' }) {
  const entries = Object.entries(data || {})
  const total = entries.reduce((sum, [, count]) => sum + Number(count || 0), 0)
  const [hoveredKey, setHoveredKey] = useState(null)
  const [selectedKey, setSelectedKey] = useState(null)

  const activeKey = hoveredKey || selectedKey

  const toggleSelect = (key) => {
    setSelectedKey((prev) => (prev === key ? null : key))
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between transition-all">
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
          <div className="mt-4">
            {/* 1. Mode Kartu Metrik Ringkas Otomatis Khusus Layar Ponsel Sangat Kecil (< 360px) */}
            <div className="max-[360px]:grid grid-cols-2 gap-2 hidden mb-1">
              {entries.map(([key, count]) => {
                const config = configMap[key] || { label: key, color: 'bg-brand-500', badgeColor: 'primary' }
                const percentage = total > 0 ? Math.round((Number(count) / total) * 100) : 0
                const isSelected = selectedKey === key
                return (
                  <div
                    key={`compact-${key}`}
                    onClick={() => toggleSelect(key)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/20 ring-1 ring-brand-500'
                        : 'border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50'
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                      <span className={`size-2 rounded-full shrink-0 ${config.color}`} />
                      <span className="truncate">{config.label}</span>
                    </span>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                      <span className="text-[10px] font-medium text-gray-400">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 2. Tampilan Normal Grafik Distribusi & Rincian Progress (Layar Standar, Tablet & Desktop >= 360px) */}
            <div className="max-[360px]:hidden">
              {/* Visual Segmented Distribution Bar dengan Hover Tooltip Interaktif & Klik */}
              {total > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    <span>Distribusi Status Interaktif</span>
                    {selectedKey && (
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                        Klik status untuk melepas sorotan
                      </span>
                    )}
                  </div>
                  <div className="h-4.5 w-full rounded-xl bg-gray-100 dark:bg-gray-800 p-0.5 flex gap-1 overflow-visible relative">
                    {entries.map(([key, count]) => {
                      const config = configMap[key] || { label: key, color: 'bg-brand-500', badgeColor: 'primary' }
                      const percentage = total > 0 ? (Number(count) / total) * 100 : 0
                      if (percentage === 0 && Number(count) === 0) return null
                      const isHovered = hoveredKey === key
                      const isSelected = selectedKey === key
                      const isActive = activeKey === key

                      return (
                        <div
                          key={key}
                          onMouseEnter={() => setHoveredKey(key)}
                          onMouseLeave={() => setHoveredKey(null)}
                          onClick={() => toggleSelect(key)}
                          className={`h-full rounded-lg ${config.color} transition-all duration-200 cursor-pointer relative ${
                            isActive
                              ? 'scale-y-125 brightness-110 shadow-sm z-20 ring-2 ring-white/90 dark:ring-gray-900/90'
                              : activeKey
                              ? 'opacity-35'
                              : 'opacity-100 hover:opacity-90'
                          }`}
                          style={{ width: `${Math.max(percentage, 2.5)}%` }}
                          title={`Klik untuk mengunci sorotan status: ${config.label}`}
                        >
                          {/* Hover / Click Tooltip Popover */}
                          {isActive && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                              <div className="bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xs text-white text-xs rounded-xl py-1.5 px-3 shadow-xl border border-gray-700/60 dark:border-gray-600/60 flex items-center gap-2">
                                <span className={`size-2.5 rounded-full ${config.color}`} />
                                <span className="font-semibold">{config.label}:</span>
                                <span className="font-bold text-amber-300">{count}</span>
                                <span className="text-gray-300 text-[11px]">({Math.round(percentage)}%)</span>
                                {isSelected && (
                                  <span className="text-[10px] bg-brand-500/30 text-brand-300 px-1 py-0.5 rounded font-mono">
                                    Terkunci
                                  </span>
                                )}
                              </div>
                              <div className="size-2 bg-gray-900 dark:bg-gray-800 rotate-45 mx-auto -mt-1 border-r border-b border-gray-700/60 dark:border-gray-600/60" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* List Rincian Status dengan Hover Highlight Interaktif & Klik */}
              <div className="space-y-2">
                {entries.map(([key, count]) => {
                  const config = configMap[key] || { label: key, color: 'bg-brand-500', badgeColor: 'primary' }
                  const percentage = total > 0 ? Math.round((Number(count) / total) * 100) : 0
                  const isHovered = hoveredKey === key
                  const isSelected = selectedKey === key
                  const isActive = activeKey === key

                  return (
                    <div
                      key={key}
                      onMouseEnter={() => setHoveredKey(key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={() => toggleSelect(key)}
                      className={`p-2 rounded-xl transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-brand-50/70 dark:bg-brand-500/15 ring-2 ring-brand-500/40 shadow-2xs scale-[1.01]'
                          : activeKey
                          ? 'opacity-40'
                          : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
                      }`}
                      title="Klik untuk menyorot status ini"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                        <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${config.color} ${isActive ? 'ring-2 ring-brand-500/40 scale-110' : ''}`} />
                          <span className={isActive ? 'font-bold text-gray-900 dark:text-white' : ''}>
                            {config.label}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">(Disorot)</span>
                          )}
                        </span>
                        <span className={`text-gray-900 dark:text-white font-bold transition-transform ${isActive ? 'scale-105 text-brand-600 dark:text-brand-400' : ''}`}>
                          {count} <span className="font-normal text-gray-400">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${config.color} transition-all duration-500 ${isActive ? 'brightness-110 shadow-xs' : ''}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper Format Rupiah & Angka Kompak
function formatRupiah(num) {
  if (num === null || num === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

function formatCompactRupiah(num) {
  if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1)} M`
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)} Jt`
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)} Rb`
  return `Rp ${num}`
}

// Subcomponent: Grafik Visual Tren Interaktif dengan Animasi Kursor & Timbul Kartu Rincian Saat Diklik
function InteractiveTrendChartCard({
  monthlyTrends = [],
  userRole = 'admin',
  selectedMonthKey = null,
  onSelectMonth = () => {},
}) {
  const isKaryawan = userRole === 'karyawan'
  const [activeMetric, setActiveMetric] = useState('pekerjaan') // 'pekerjaan' | 'kontrak' | 'calon_klien'
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Opsi switcher tab metrik
  const metricOptions = useMemo(() => {
    if (isKaryawan) {
      return [{ id: 'pekerjaan', label: 'Tugas Operasional Saya', unit: 'Tugas' }]
    }
    return [
      { id: 'pekerjaan', label: 'Pekerjaan & Tugas', unit: 'Tugas' },
      { id: 'kontrak', label: 'Nilai Kontrak (Rp)', unit: 'Rupiah' },
      { id: 'calon_klien', label: 'Calon Klien CRM', unit: 'Leads' },
    ]
  }, [isKaryawan])

  // Normalisasi data titik
  const dataPoints = useMemo(() => {
    if (!monthlyTrends || monthlyTrends.length === 0) return []
    return monthlyTrends.map((m, index) => {
      let value = 0
      let subValue = ''
      let detailDesc = ''

      if (activeMetric === 'pekerjaan') {
        value = Number(m.pekerjaan_total || 0)
        subValue = `${m.pekerjaan_selesai || 0} Selesai`
        detailDesc = `${m.pekerjaan_total || 0} tugas terdaftar (${m.pekerjaan_selesai || 0} selesai)`
      } else if (activeMetric === 'kontrak') {
        value = Number(m.nilai_kontrak || 0)
        subValue = `${m.kontrak_baru || 0} Kontrak`
        detailDesc = `${m.kontrak_baru || 0} kontrak baru diterbitkan`
      } else if (activeMetric === 'calon_klien') {
        value = Number(m.calon_klien || 0)
        subValue = `${m.calon_klien_deal || 0} Deal`
        detailDesc = `${m.calon_klien || 0} calon klien (${m.calon_klien_deal || 0} deal)`
      }

      return {
        ...m,
        index,
        value,
        subValue,
        detailDesc,
      }
    })
  }, [monthlyTrends, activeMetric])

  // Nilai maksimum untuk skala Y
  const maxValue = useMemo(() => {
    const max = Math.max(...dataPoints.map((d) => d.value), 0)
    if (max > 0) return max
    return activeMetric === 'kontrak' ? 5000000 : 10
  }, [dataPoints, activeMetric])

  // Total akumulasi metrik aktif selama 6 bulan
  const activeMetricSum = useMemo(() => {
    return dataPoints.reduce((acc, d) => acc + d.value, 0)
  }, [dataPoints])

  // SVG Dimension & Coordinate Math
  const SVG_W = 680
  const SVG_H = 220
  const PAD_L = 60
  const PAD_R = 40
  const PAD_T = 30
  const PAD_B = 40
  const USABLE_W = SVG_W - PAD_L - PAD_R
  const USABLE_H = SVG_H - PAD_T - PAD_B

  const count = dataPoints.length
  const step = count > 1 ? USABLE_W / (count - 1) : USABLE_W

  const computedPoints = useMemo(() => {
    return dataPoints.map((p, i) => {
      const x = PAD_L + i * step
      const ratio = maxValue > 0 ? p.value / maxValue : 0
      const y = SVG_H - PAD_B - ratio * USABLE_H
      const barHeight = Math.max(ratio * USABLE_H, p.value > 0 ? 6 : 2)
      const barY = SVG_H - PAD_B - barHeight
      return {
        ...p,
        x,
        y: Math.min(Math.max(y, PAD_T), SVG_H - PAD_B),
        barY,
        barHeight,
      }
    })
  }, [dataPoints, maxValue, step, USABLE_H, PAD_B, PAD_L, PAD_T, SVG_H])

  // Smooth Area & Line Path Generation
  const { linePath, areaPath } = useMemo(() => {
    if (computedPoints.length === 0) return { linePath: '', areaPath: '' }
    if (computedPoints.length === 1) {
      const p = computedPoints[0]
      return {
        linePath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
        areaPath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${SVG_H - PAD_B} L ${p.x - 20} ${SVG_H - PAD_B} Z`,
      }
    }

    let d = `M ${computedPoints[0].x} ${computedPoints[0].y}`
    for (let i = 1; i < computedPoints.length; i++) {
      const prev = computedPoints[i - 1]
      const curr = computedPoints[i]
      const cx1 = prev.x + (curr.x - prev.x) / 2
      const cy1 = prev.y
      const cx2 = prev.x + (curr.x - prev.x) / 2
      const cy2 = curr.y
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`
    }

    const first = computedPoints[0]
    const last = computedPoints[computedPoints.length - 1]
    const a = `${d} L ${last.x} ${SVG_H - PAD_B} L ${first.x} ${SVG_H - PAD_B} Z`

    return { linePath: d, areaPath: a }
  }, [computedPoints, PAD_B, SVG_H])

  // Handler interaksi gerakan kursor mouse
  const handleMouseMove = (e) => {
    if (computedPoints.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const relativeX = (mouseX / rect.width) * SVG_W

    let closestIdx = 0
    let minDiff = Infinity
    computedPoints.forEach((p, idx) => {
      const diff = Math.abs(relativeX - p.x)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = idx
      }
    })
    setHoveredIndex(closestIdx)
  }

  // Bulan yang saat ini aktif dipilih (dikunci melalui klik)
  const selectedMonth = useMemo(() => {
    if (!selectedMonthKey) return null
    return monthlyTrends.find((m) => m.periode === selectedMonthKey) || null
  }, [monthlyTrends, selectedMonthKey])

  // Titik yang sedang aktif (hovered)
  const activeHoverPoint = hoveredIndex !== null ? computedPoints[hoveredIndex] : null

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all mb-6">
      {/* 1. Header Kartu: Judul, Switcher Metrik & Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
            <svg className="size-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Grafik Visual Tren Interaktif
              </h3>
              <Badge size="sm" color="primary">
                Tren 6 Bulan
              </Badge>
              {selectedMonthKey && (
                <Badge size="sm" color="success">
                  Terpilih: {selectedMonth?.bulan || selectedMonthKey}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Pantau tren perkembangan 6 bulan terakhir dan <strong>klik titik / bar</strong> untuk memfilter rincian distribusi status.
            </p>
          </div>
        </div>

        {/* Tab Switcher Metrik */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 self-start lg:self-auto overflow-x-auto max-w-full">
          {metricOptions.map((opt) => {
            const isActive = activeMetric === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveMetric(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Ringkasan Cepat Metrik Terpilih */}
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 px-1">
        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Total {metricOptions.find((m) => m.id === activeMetric)?.label} (6 Bulan)
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h4 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {activeMetric === 'kontrak' ? formatRupiah(activeMetricSum) : activeMetricSum}
            </h4>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {activeMetric === 'pekerjaan' && `${computedPoints[computedPoints.length - 1]?.value || 0} Tugas bulan ini`}
              {activeMetric === 'kontrak' && `${computedPoints[computedPoints.length - 1]?.kontrak_baru || 0} Kontrak bulan ini`}
              {activeMetric === 'calon_klien' && `${computedPoints[computedPoints.length - 1]?.value || 0} Calon Klien bulan ini`}
            </span>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-gray-400">
            {selectedMonthKey ? 'Klik bulan lain untuk beralih' : 'Klik titik bulan untuk melihat rincian kartu'}
          </span>
        </div>
      </div>

      {/* 3. Area Visual SVG Chart dengan Gerakan Kursor Interaktif */}
      <div className="mt-4 relative overflow-visible w-full">
        {/* Tooltip Mengambang Interaktif */}
        {activeHoverPoint && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-150 ease-out -translate-x-1/2 -translate-y-full -mt-2.5 hidden sm:block"
            style={{
              left: `${(activeHoverPoint.x / SVG_W) * 100}%`,
              top: `${(activeHoverPoint.y / SVG_H) * 100}%`,
            }}
          >
            <div className="bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md text-white text-xs rounded-2xl py-2 px-3.5 shadow-2xl border border-gray-700/60 dark:border-gray-600/60 min-w-[170px] whitespace-nowrap">
              <div className="flex items-center justify-between gap-3 pb-1 mb-1 border-b border-gray-700/60">
                <span className="font-bold text-gray-200">{activeHoverPoint.bulan}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/30 text-brand-300 font-mono">
                  {activeHoverPoint.short}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="text-gray-300">
                  {activeMetric === 'pekerjaan' ? 'Pekerjaan:' : activeMetric === 'kontrak' ? 'Nilai Kontrak:' : 'Calon Klien:'}
                </span>
                <span className="font-extrabold text-amber-300">
                  {activeMetric === 'kontrak' ? formatRupiah(activeHoverPoint.value) : activeHoverPoint.value}
                </span>
              </div>
              <div className="text-[11px] text-gray-300 mt-0.5">
                {activeHoverPoint.subValue}
              </div>
              <div className="mt-1.5 pt-1 border-t border-gray-700/60 text-[10px] text-brand-300 font-medium flex items-center gap-1">
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span>Klik untuk lihat rincian lengkap</span>
              </div>
            </div>
            <div className="size-2.5 bg-gray-900 dark:bg-gray-800 rotate-45 mx-auto -mt-1.5 border-r border-b border-gray-700/60 dark:border-gray-600/60" />
          </div>
        )}

        {/* SVG Canvas */}
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-auto select-none overflow-visible cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              {/* Linear Gradient untuk Area Fill */}
              <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>

              {/* Linear Gradient untuk Bar Normal */}
              <linearGradient id="trendBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
              </linearGradient>

              {/* Linear Gradient untuk Bar Hover / Selected */}
              <linearGradient id="trendBarGradActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Garis Grid Horizontal & Label Sumbu Y */}
            {[0, 0.5, 1].map((ratio) => {
              const y = SVG_H - PAD_B - ratio * USABLE_H
              const val = Math.round(ratio * maxValue)
              return (
                <g key={ratio}>
                  <line
                    x1={PAD_L - 10}
                    y1={y}
                    x2={SVG_W - PAD_R + 10}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-gray-100 dark:text-gray-800/80"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={PAD_L - 16}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-gray-400 dark:fill-gray-500"
                  >
                    {activeMetric === 'kontrak' ? formatCompactRupiah(val) : val}
                  </text>
                </g>
              )
            })}

            {/* Area Fill Gradient di Bawah Garis */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#trendAreaGrad)"
                className="transition-all duration-300"
              />
            )}

            {/* Batang Bar Vertikal untuk Setiap Bulan */}
            {computedPoints.map((p, idx) => {
              const isHovered = hoveredIndex === idx
              const isSelected = selectedMonthKey === p.periode
              const barW = Math.min(Math.max(step * 0.45, 16), 34)

              return (
                <g key={`bar-${p.periode}`} onClick={() => onSelectMonth(p.periode)}>
                  {/* Invisible Hitbox untuk Mempermudah Klik & Hover */}
                  <rect
                    x={p.x - step / 2}
                    y={PAD_T}
                    width={step}
                    height={USABLE_H + PAD_B}
                    fill="transparent"
                    className="cursor-pointer"
                  />

                  {/* Batang Bar Grafis */}
                  <rect
                    x={p.x - barW / 2}
                    y={p.barY}
                    width={barW}
                    height={p.barHeight}
                    rx={6}
                    fill={isHovered || isSelected ? 'url(#trendBarGradActive)' : 'url(#trendBarGrad)'}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      transformOrigin: `${p.x}px ${SVG_H - PAD_B}px`,
                      transform: isHovered ? 'scaleY(1.04)' : 'scaleY(1)',
                    }}
                  />

                  {/* Garis Pemandu Vertikal Saat Kursor Dekat */}
                  {isHovered && (
                    <line
                      x1={p.x}
                      y1={PAD_T}
                      x2={p.x}
                      y2={SVG_H - PAD_B}
                      stroke="#94a3b8"
                      strokeWidth={1.2}
                      strokeDasharray="3 3"
                      opacity={0.6}
                    />
                  )}
                </g>
              )
            })}

            {/* Garis Kurva Tren (Line Stroke) */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-sm transition-all duration-300"
              />
            )}

            {/* Titik-Titik Data (Data Points) */}
            {computedPoints.map((p, idx) => {
              const isHovered = hoveredIndex === idx
              const isSelected = selectedMonthKey === p.periode

              return (
                <g
                  key={`point-${p.periode}`}
                  onClick={() => onSelectMonth(p.periode)}
                  className="cursor-pointer"
                  style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Cincin Luar Penanda Titik Bersih & Tegas (Tanpa Efek Cahaya Ping Berkedip) */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 6.5 : isHovered ? 5.5 : 4.5}
                    fill={isSelected ? '#1d4ed8' : '#3b82f6'}
                    stroke={isSelected ? '#ffffff' : 'none'}
                    strokeWidth={isSelected ? 2 : 0}
                    className="transition-all duration-150"
                  />

                  {/* Inti Titik Putih */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 2.5 : isHovered ? 2 : 1.8}
                    fill="#ffffff"
                    className="transition-all duration-150"
                  />

                  {/* Label Nama Bulan pada Sumbu X */}
                  <g>
                    {isSelected && (
                      <rect
                        x={p.x - 22}
                        y={SVG_H - PAD_B + 10}
                        width={44}
                        height={18}
                        rx={9}
                        fill="#3b82f6"
                        className="transition-all duration-200"
                      />
                    )}
                    <text
                      x={p.x}
                      y={SVG_H - PAD_B + 23}
                      textAnchor="middle"
                      className={`text-xs font-semibold cursor-pointer select-none transition-colors duration-150 ${
                        isSelected
                          ? 'fill-white font-bold'
                          : isHovered
                          ? 'fill-brand-600 dark:fill-brand-400 font-bold'
                          : 'fill-gray-500 dark:fill-gray-400'
                      }`}
                    >
                      {p.short}
                    </text>
                  </g>
                </g>
              )
            })}
          </svg>
        </div>
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
                    <td className="py-3 px-3 align-middle">
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                          isTop3 ? rankBadges[index] : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 align-middle">
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
                    <td className="py-3 px-3 align-middle text-gray-600 dark:text-gray-300 font-medium">
                      {emp.total_reviews} evaluasi
                    </td>
                    <td className="py-3 px-3 align-middle text-right">
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

// Subcomponent: Monthly Task Reminder Widget for Pimpinan & Operator
function MonthlyTaskReminderWidget({ reminders = [], onNavigate }) {
  const currentMonthFormatted = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())
  const uniqueClientsCount = new Set(reminders.map((r) => r.id_klien)).size
  const [isExpanded, setIsExpanded] = useState(false)

  // Group reminders by (id_klien + id_layanan) agar tidak terjadi repetisi baris kembar
  const groupedReminders = useMemo(() => {
    const groups = {}
    reminders.forEach((r) => {
      const key = `${r.id_klien}_${r.id_layanan}`
      if (!groups[key]) {
        groups[key] = {
          id_klien: r.id_klien,
          nama_perusahaan: r.nama_perusahaan,
          no_kontrak: r.no_kontrak,
          id_layanan: r.id_layanan,
          nama_layanan: r.nama_layanan,
          periode_bulan: r.periode_bulan,
          tasks: [],
        }
      }
      groups[key].tasks.push(r)
    })
    return Object.values(groups)
  }, [reminders])

  // Tugaskan Seluruh Paket Layanan Sekaligus (Hanya tugas yang belum ditugaskan di paket ini)
  const handleAssignGroup = (group) => {
    const targetJobIds = group.tasks.map((t) => Number(t.id_master_pekerjaan))
    const payload = {
      id_klien: group.id_klien,
      id_layanan: group.id_layanan,
      target_job_ids: targetJobIds, // Hanya tugas yang tertera di paket ini!
      id_master_pekerjaan: null,
      nama_pekerjaan: null,
      periode_bulan: group.periode_bulan,
    }
    try {
      sessionStorage.setItem('target_batch_assignment', JSON.stringify(payload))
    } catch {
      // Ignore sessionStorage errors
    }
    if (typeof onNavigate === 'function') {
      onNavigate('pekerjaan', payload)
    }
  }

  // Tugaskan Satuan Pekerjaan Tertentu
  const handleAssignSingle = (task) => {
    const payload = {
      id_klien: task.id_klien,
      id_layanan: task.id_layanan,
      target_job_ids: [Number(task.id_master_pekerjaan)],
      id_master_pekerjaan: task.id_master_pekerjaan,
      nama_pekerjaan: task.nama_pekerjaan,
      periode_bulan: task.periode_bulan,
    }
    try {
      sessionStorage.setItem('target_batch_assignment', JSON.stringify(payload))
    } catch {
      // Ignore sessionStorage errors
    }
    if (typeof onNavigate === 'function') {
      onNavigate('pekerjaan', payload)
    }
  }

  if (reminders.length === 0) {
    return (
      <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/60 via-white to-white dark:from-emerald-950/20 dark:via-gray-900 dark:to-gray-900 p-5 sm:p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Pengingat Penugasan Rutin Bulanan
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {currentMonthFormatted}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Semua tugas rutin bulanan dari kontrak aktif untuk periode <strong>{currentMonthFormatted}</strong> sudah berhasil ditugaskan ke karyawan. Operasional berjalan lancar!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-brand-200 dark:border-brand-900/60 bg-gradient-to-b from-brand-50/30 via-white to-white dark:from-brand-950/20 dark:via-gray-900 dark:to-gray-900 p-4 sm:p-5 shadow-xs mb-6 transition-all">
      {/* 1. Header Strip Ringkas (Usulan 1: Selalu Tampak Ramping ~55px, Tidak Menutupi Dasbor) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-xs">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight">
                Pengingat Penugasan Rutin Bulanan
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                {reminders.length} Tugas Belum Ditugaskan
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-300">
                Periode: {currentMonthFormatted}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
              Ada <strong>{reminders.length} pekerjaan rutin bulanan</strong> dari <strong>{uniqueClientsCount} perusahaan klien</strong> yang belum dibuatkan penugasannya ke karyawan.
            </p>
          </div>
        </div>

        {/* Tombol Toggle Buka / Tutup Rincian Tugas */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto ${
            isExpanded
              ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              : 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-theme-xs shadow-brand-500/20'
          }`}
        >
          <span>{isExpanded ? 'Sembunyikan Rincian' : `Buka Rincian Tugas (${reminders.length})`}</span>
          <svg
            className={`size-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 2. Daftar Rincian Paket Layanan (Hanya Tampil Saat isExpanded = true) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3.5 max-h-[460px] overflow-y-auto pr-1 animate-fade-in">
          {groupedReminders.map((group) => (
            <div
              key={`${group.id_klien}_${group.id_layanan}`}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/60 shadow-2xs hover:shadow-xs transition-all"
            >
              {/* Header: Klien, Paket Layanan & Tombol Penugasan Sekaligus */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                    {group.nama_perusahaan ? group.nama_perusahaan.charAt(0).toUpperCase() : 'K'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                        {group.nama_perusahaan}
                      </h4>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                        <span className="size-1.5 rounded-full bg-brand-500" />
                        {group.nama_layanan}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Kontrak: {group.no_kontrak || '-'}
                    </p>
                  </div>
                </div>

                {/* Action: Tugaskan Seluruh Paket Layanan Ini */}
                <button
                  type="button"
                  onClick={() => handleAssignGroup(group)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs font-bold shadow-theme-xs shadow-brand-500/20 transition-all active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
                  title={`Tugaskan seluruh ${group.tasks.length} pekerjaan paket ini untuk ${group.nama_perusahaan}`}
                >
                  <span>Tugaskan Paket Ini ({group.tasks.length} Tugas)</span>
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              {/* List Tugas dalam Paket Ini */}
              <div className="mt-3 divide-y divide-gray-100/80 dark:divide-gray-700/40">
                {group.tasks.map((task) => (
                  <div key={task.id_master_pekerjaan} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="size-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {task.nama_pekerjaan}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Estimasi pengerjaan: <strong>{task.estimasi_hari || 7} hari kalender</strong>
                        </p>
                      </div>
                    </div>

                    {/* Tombol Tugaskan Satuan */}
                    <button
                      type="button"
                      onClick={() => handleAssignSingle(task)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors self-end sm:self-auto cursor-pointer"
                      title={`Hanya tugaskan pekerjaan ${task.nama_pekerjaan}`}
                    >
                      <span>Tugaskan Satuan</span>
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Subcomponent: Admin Dashboard View
function AdminDashboardView({ totals, workByStatus, leadByStatus, contractByStatus, employeeScores, monthlyTrends = [] }) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(null)

  const handleSelectMonth = (monthKey) => {
    setSelectedMonthKey((prev) => (prev === monthKey ? null : monthKey))
  }

  const selectedMonthData = useMemo(() => {
    if (!selectedMonthKey) return null
    return monthlyTrends.find((m) => m.periode === selectedMonthKey) || null
  }, [monthlyTrends, selectedMonthKey])

  const activeWorkByStatus = selectedMonthData ? selectedMonthData.work_by_status : workByStatus
  const activeLeadByStatus = selectedMonthData ? selectedMonthData.lead_by_status : leadByStatus
  const activeContractByStatus = selectedMonthData ? selectedMonthData.contract_by_status : contractByStatus

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <MetricCard
          title="Total Calon Klien"
          value={totals.leads ?? 0}
          subtitle={`${totals.lead_deal ?? 0} Deal / ${totals.lead_lost ?? 0} Belum Deal`}
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

      {/* 2. Grafik Visual Tren Interaktif */}
      <InteractiveTrendChartCard
        monthlyTrends={monthlyTrends}
        userRole="admin"
        selectedMonthKey={selectedMonthKey}
        onSelectMonth={handleSelectMonth}
      />

      {/* 3. Distribusi Status */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{selectedMonthData ? `Distribusi Status: ${selectedMonthData.bulan}` : 'Distribusi Status Keseluruhan'}</span>
              <Badge size="sm" color={selectedMonthKey ? 'success' : 'light'}>
                {selectedMonthData ? `Periode: ${selectedMonthData.bulan}` : 'Akumulasi Semua Periode'}
              </Badge>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedMonthData
                ? `Menampilkan rincian status khusus periode ${selectedMonthData.bulan}.`
                : 'Menampilkan data status kumulatif. Anda juga dapat mengklik salah satu bulan pada grafik tren di atas untuk melihat rincian bulan tersebut.'}
            </p>
          </div>
          {selectedMonthKey && (
            <button
              type="button"
              onClick={() => setSelectedMonthKey(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
              title="Kembali ke tampilan akumulasi semua periode"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Tutup Rincian Periode Ini</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusBreakdownCard
            title="Distribusi Status Pekerjaan"
            icon={
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            data={activeWorkByStatus}
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
            data={activeLeadByStatus}
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
            data={activeContractByStatus}
            configMap={CONTRACT_STATUS_CONFIG}
            totalLabel="Total Kontrak"
          />
        </div>
      </div>

      <LeaderboardTable employees={employeeScores} />
    </>
  )
}

// Subcomponent: Pimpinan Dashboard View
function PimpinanDashboardView({ totals, workByStatus, leadByStatus, employeeScores, monthlyTrends = [] }) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(null)

  const handleSelectMonth = (monthKey) => {
    setSelectedMonthKey((prev) => (prev === monthKey ? null : monthKey))
  }

  const selectedMonthData = useMemo(() => {
    if (!selectedMonthKey) return null
    return monthlyTrends.find((m) => m.periode === selectedMonthKey) || null
  }, [monthlyTrends, selectedMonthKey])

  const activeWorkByStatus = selectedMonthData ? selectedMonthData.work_by_status : workByStatus
  const activeLeadByStatus = selectedMonthData ? selectedMonthData.lead_by_status : leadByStatus

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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

      {/* 2. Grafik Visual Tren Interaktif */}
      <InteractiveTrendChartCard
        monthlyTrends={monthlyTrends}
        userRole="pimpinan"
        selectedMonthKey={selectedMonthKey}
        onSelectMonth={handleSelectMonth}
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{selectedMonthData ? `Distribusi Status: ${selectedMonthData.bulan}` : 'Distribusi Status Pekerjaan & Pipeline'}</span>
              <Badge size="sm" color={selectedMonthKey ? 'success' : 'light'}>
                {selectedMonthData ? `Periode: ${selectedMonthData.bulan}` : 'Akumulasi Semua Periode'}
              </Badge>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedMonthData
                ? `Menampilkan rincian status untuk periode ${selectedMonthData.bulan}.`
                : 'Menampilkan data status kumulatif. Anda juga dapat mengklik salah satu bulan pada grafik tren di atas untuk melihat rincian bulan tersebut.'}
            </p>
          </div>
          {selectedMonthKey && (
            <button
              type="button"
              onClick={() => setSelectedMonthKey(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
              title="Kembali ke tampilan akumulasi semua periode"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Tutup Rincian Periode Ini</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatusBreakdownCard
            title="Progres Pengerjaan Proyek & Tugas"
            icon={
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            data={activeWorkByStatus}
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
            data={activeLeadByStatus}
            configMap={LEAD_STATUS_CONFIG}
            totalLabel="Total Leads"
          />
        </div>
      </div>

      <LeaderboardTable employees={employeeScores} />
    </>
  )
}

// Subcomponent: Sales & Operator Dashboard View
function SalesDashboardView({ totals, leadByStatus, contractByStatus, workByStatus, monthlyTrends = [] }) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(null)

  const handleSelectMonth = (monthKey) => {
    setSelectedMonthKey((prev) => (prev === monthKey ? null : monthKey))
  }

  const selectedMonthData = useMemo(() => {
    if (!selectedMonthKey) return null
    return monthlyTrends.find((m) => m.periode === selectedMonthKey) || null
  }, [monthlyTrends, selectedMonthKey])

  const activeWorkByStatus = selectedMonthData ? selectedMonthData.work_by_status : workByStatus
  const activeLeadByStatus = selectedMonthData ? selectedMonthData.lead_by_status : leadByStatus
  const activeContractByStatus = selectedMonthData ? selectedMonthData.contract_by_status : contractByStatus

  return (
    <>
      {/* 1. Ringkasan Pipeline & Penjualan (CRM) */}
      <div className="mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Ringkasan Pipeline CRM & Kontrak
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
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
          title="Belum Deal"
          value={totals.lead_lost ?? 0}
          subtitle="Belum berlanjut kontrak"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          iconBg="bg-warning-50 text-warning-600 dark:bg-warning-500/15"
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

      {/* 2. Ringkasan Tugas & Pekerjaan Karyawan */}
      <div className="mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Ringkasan Operasional Tugas & Pekerjaan
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <MetricCard
          title="Total Pekerjaan"
          value={totals.tasks ?? 0}
          subtitle="Penugasan operasional"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          iconBg="bg-brand-50 text-brand-600 dark:bg-brand-500/15"
        />

        <MetricCard
          title="Dalam Pengerjaan"
          value={totals.in_progress_tasks ?? 0}
          subtitle="Sedang diproses karyawan"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15"
        />

        <MetricCard
          title="Menunggu Review"
          value={totals.submitted_tasks ?? 0}
          subtitle="Tugas diajukan karyawan"
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-warning-50 text-warning-600 dark:bg-warning-500/15"
        />

        <MetricCard
          title="Tugas Terlambat"
          value={totals.overdue_tasks ?? 0}
          subtitle={totals.overdue_tasks > 0 ? 'Melewati batas deadline' : 'Semua pengerjaan tepat waktu'}
          icon={
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          iconBg="bg-error-50 text-error-600 dark:bg-error-500/15"
          alert={totals.overdue_tasks > 0}
        />
      </div>

      {/* 3. Grafik Visual Tren Interaktif */}
      <InteractiveTrendChartCard
        monthlyTrends={monthlyTrends}
        userRole="operator"
        selectedMonthKey={selectedMonthKey}
        onSelectMonth={handleSelectMonth}
      />

      {/* 4. Distribusi Status & Funnel */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>{selectedMonthData ? `Distribusi Status: ${selectedMonthData.bulan}` : 'Distribusi Status CRM, Kontrak & Pekerjaan'}</span>
              <Badge size="sm" color={selectedMonthKey ? 'success' : 'light'}>
                {selectedMonthData ? `Periode: ${selectedMonthData.bulan}` : 'Akumulasi Semua Periode'}
              </Badge>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedMonthData
                ? `Menampilkan rincian status khusus periode ${selectedMonthData.bulan}.`
                : 'Menampilkan data status kumulatif. Anda juga dapat mengklik salah satu bulan pada grafik tren di atas untuk melihat rincian bulan tersebut.'}
            </p>
          </div>
          {selectedMonthKey && (
            <button
              type="button"
              onClick={() => setSelectedMonthKey(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
              title="Kembali ke tampilan akumulasi semua periode"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Tutup Rincian Periode Ini</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4">
            <StatusBreakdownCard
              title="Funnel Calon Klien"
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              data={activeLeadByStatus}
              configMap={LEAD_STATUS_CONFIG}
              totalLabel="Total Calon Klien"
            />
          </div>
          <div className="md:col-span-4">
            <StatusBreakdownCard
              title="Distribusi Kontrak"
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              data={activeContractByStatus}
              configMap={CONTRACT_STATUS_CONFIG}
              totalLabel="Total Kontrak"
            />
          </div>
          <div className="md:col-span-4">
            <StatusBreakdownCard
              title="Distribusi Pekerjaan"
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
              data={activeWorkByStatus}
              configMap={WORK_STATUS_CONFIG}
              totalLabel="Total Pekerjaan"
            />
          </div>
        </div>
      </div>
    </>
  )
}

// Subcomponent: Karyawan Dashboard View
function KaryawanDashboardView({ totals, workByStatus, recentTasks = [], monthlyTrends = [], onNavigate }) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(null)

  const handleSelectMonth = (monthKey) => {
    setSelectedMonthKey((prev) => (prev === monthKey ? null : monthKey))
  }

  const selectedMonthData = useMemo(() => {
    if (!selectedMonthKey) return null
    return monthlyTrends.find((m) => m.periode === selectedMonthKey) || null
  }, [monthlyTrends, selectedMonthKey])

  const activeWorkByStatus = selectedMonthData ? selectedMonthData.work_by_status : workByStatus

  const revisionTasks = recentTasks.filter(
    (task) => task.status === 'revision_needed' || task.status === 'revision'
  )

  return (
    <>
      {/* Alert Banner: Tugas Perlu Segera Direvisi */}
      {revisionTasks.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-amber-50/90 to-amber-100/60 p-5 sm:p-6 shadow-md shadow-amber-500/10 dark:border-amber-600/70 dark:from-amber-950/40 dark:via-amber-900/25 dark:to-amber-950/30 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                <svg className="size-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white tracking-wide uppercase">
                    Peringatan Tindakan
                  </span>
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    {revisionTasks.length} Tugas Perlu Segera Diperbaiki
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Ada tugas yang perlu segera Anda perbaiki!
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
                  Pimpinan telah memeriksa hasil tugas Anda dan meminta perbaikan. Mohon tinjau catatan instruksi di bawah ini dan unggah kembali hasil revisi agar pekerjaan dapat disetujui.
                </p>
              </div>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('reporting')}
                className="shrink-0 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Buka Menu Reporting</span>
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>

          {/* List of Tasks Needing Revision */}
          <div className="mt-5 space-y-3">
            {revisionTasks.map((task) => (
              <div
                key={task.id_pekerjaan}
                className="rounded-2xl border border-amber-300/80 bg-white/90 p-4 dark:border-amber-700/60 dark:bg-gray-900/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {task.judul}
                    </span>
                    <span className="text-2xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      Klien: {task.klien}
                    </span>
                    {task.deadline && (
                      <span className="text-2xs px-2 py-0.5 rounded-md font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                        Batas Deadline: {task.deadline}
                      </span>
                    )}
                  </div>

                  {/* Catatan Perbaikan dari Pimpinan */}
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-300">
                      Catatan Perbaikan dari Pimpinan:
                    </span>{' '}
                    <span className="text-gray-800 dark:text-gray-200 font-medium italic">
                      "{task.catatan_review || 'Mohon periksa kembali berkas tugas dan sesuaikan sesuai instruksi pimpinan.'}"
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('reporting')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Perbaiki Sekarang</span>
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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

      {/* 2. Grafik Visual Tren Interaktif Tugas Karyawan */}
      <InteractiveTrendChartCard
        monthlyTrends={monthlyTrends}
        userRole="karyawan"
        selectedMonthKey={selectedMonthKey}
        onSelectMonth={handleSelectMonth}
      />

      {selectedMonthKey && (
        <div className="flex items-center justify-between gap-3 mb-4 p-3.5 rounded-2xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-900 dark:text-brand-200">
              Menampilkan Rincian Status Tugas: {selectedMonthData?.bulan}
            </span>
            <Badge size="sm" color="success">Periode Terpilih</Badge>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMonthKey(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all cursor-pointer shadow-2xs shrink-0"
            title="Kembali ke tampilan akumulasi semua periode"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Tutup Rincian Periode Ini</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        <div className="md:col-span-7">
          <StatusBreakdownCard
            title={selectedMonthData ? `Distribusi Status Tugas (${selectedMonthData.bulan})` : "Distribusi Status Tugas Saya"}
            icon={
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            data={activeWorkByStatus}
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
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex flex-col max-w-xs">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {task.judul}
                          </span>
                          {task.deskripsi && (
                            <span className="text-xs text-gray-400 line-clamp-1 truncate" title={task.deskripsi}>
                              {task.deskripsi}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 align-middle text-gray-600 dark:text-gray-300">
                        {task.klien}
                      </td>
                      <td className="py-3.5 px-3 align-middle text-gray-500 dark:text-gray-400 text-xs">
                        {task.tgl_penugasan}
                      </td>
                      <td className="py-3.5 px-3 align-middle">
                        <DeadlineBadge
                          deadline={task.deadline}
                          status={task.status}
                          submittedAt={task.submitted_at}
                          tglSelesai={task.tgl_selesai}
                        />
                      </td>
                      <td className="py-3.5 px-3 align-middle text-right">
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

export default function DashboardView({ onNavigate }) {
  const { user } = useAuth()
  const cachedData = getCachedApiData('dashboard-summary')
  const [summary, setSummary] = useState(cachedData)
  const [loading, setLoading] = useState(!cachedData)
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

  if (loading && !summary) {
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
  const monthlyTrends = summary?.monthly_trends || []

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner Widget */}
      <WelcomeBannerWidget user={user} />

      {/* 2. Pengingat Penugasan Rutin Bulanan (Khusus Pimpinan & Operator) */}
      {['admin', 'pimpinan', 'operator', 'sales'].includes(user?.role) && (
        <MonthlyTaskReminderWidget
          reminders={summary?.monthly_reminders || []}
          onNavigate={onNavigate}
        />
      )}

      {/* 3. Role-Based Dashboard View */}
      {['admin', 'pimpinan'].includes(user?.role) && (
        <AdminDashboardView
          totals={totals}
          workByStatus={workByStatus}
          leadByStatus={leadByStatus}
          contractByStatus={contractByStatus}
          employeeScores={employeeScores}
          monthlyTrends={monthlyTrends}
        />
      )}

      {['operator', 'sales'].includes(user?.role) && (
        <SalesDashboardView
          totals={totals}
          leadByStatus={leadByStatus}
          contractByStatus={contractByStatus}
          workByStatus={workByStatus}
          monthlyTrends={monthlyTrends}
        />
      )}

      {user?.role === 'karyawan' && (
        <KaryawanDashboardView
          totals={totals}
          workByStatus={workByStatus}
          recentTasks={summary?.recent_tasks || []}
          monthlyTrends={monthlyTrends}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}
