import { useState, useMemo, useEffect } from 'react'
import Badge from './ui/Badge'
import LoadingSpinner from './common/LoadingSpinner'
import DeadlineBadge from './common/DeadlineBadge'
import { isImageFile, ImagePreviewModal } from './ResourceForm'

function TableFileLink({ file, onPreviewImage, isTeal = false }) {
  const fileName = file.name || (file.url ? decodeURIComponent(file.url.split('/').pop()) : 'Berkas')
  const isImg = isImageFile(file.url || fileName)

  if (isImg) {
    return (
      <div className="inline-flex items-center gap-2 p-1 pr-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/70 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs transition-all max-w-[260px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPreviewImage?.(file.url, fileName)
          }}
          className="relative group shrink-0 size-8 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 cursor-pointer shadow-2xs hover:ring-2 hover:ring-brand-500/40 transition-all"
          title={`Klik untuk pratinjau gambar: ${fileName}`}
        >
          <img
            src={file.url}
            alt={fileName}
            className="size-full object-cover group-hover:scale-110 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
            🔍
          </div>
        </button>
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 hover:underline truncate"
          title={`Buka / Unduh ${fileName}`}
        >
          {fileName}
        </a>
      </div>
    )
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold border shadow-2xs transition-all active:scale-95 cursor-pointer max-w-[260px] ${
        isTeal
          ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 dark:hover:bg-teal-500/25 border-teal-200/80 dark:border-teal-800/60'
          : 'bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25 border-brand-200/80 dark:border-brand-800/60'
      }`}
      title={`Buka / Unduh ${fileName}`}
    >
      <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="truncate">{fileName}</span>
    </a>
  )
}

function renderCellValue(column, record, onPreviewImage) {
  const value = record[column.key]

  if (column.key === 'legalitas_status') {
    const totalFiles = [
      record.file_nib,
      record.file_npwp,
      record.file_akta_pendirian,
      record.file_sk_kemenkumham,
      record.file_izin_usaha,
    ].filter(Boolean).length

    return (
      <Badge
        size="sm"
        color={totalFiles >= 5 ? 'success' : totalFiles > 0 ? 'warning' : 'error'}
      >
        {totalFiles}/5 Dokumen
      </Badge>
    )
  }

  // Render PIC (Penanggung Jawab Karyawan)
  if (column.key === 'id_pic') {
    const picName = record.pic?.nama
    if (!value && !picName) {
      return <span className="text-gray-400 text-xs italic">Belum ditentukan</span>
    }
    return (
      <Badge size="sm" color="info">
        <svg className="size-3.5 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {picName || 'Karyawan'}
      </Badge>
    )
  }

  // Render Operator PIC / Pengguna
  if (column.key === 'id_user') {
    const operatorName = record.user?.nama
    if (!value && !operatorName) {
      return <span className="text-gray-400 text-xs italic">Belum ditentukan</span>
    }
    return (
      <Badge size="sm" color="info">
        <svg className="size-3.5 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {operatorName || 'Operator'}
      </Badge>
    )
  }

  // Render Berkas Acuan / Panduan Penugasan (TOR / Brief)
  if (column.key === 'lampiran_instruksi') {
    const urls = record.lampiran_instruksi_urls && record.lampiran_instruksi_urls.length > 0
      ? record.lampiran_instruksi_urls
      : (record.lampiran_instruksi_url
          ? [{ name: 'Unduh TOR', url: record.lampiran_instruksi_url }]
          : (value ? [{ name: 'Unduh TOR', url: value.startsWith('http') ? value : `/storage/${value}` }] : []))

    if (!urls.length) {
      return <span className="text-gray-400 text-xs italic">-</span>
    }

    if (urls.length === 1) {
      return <TableFileLink file={urls[0]} onPreviewImage={onPreviewImage} isTeal />
    }

    return (
      <div className="flex flex-col gap-1.5 items-start py-1">
        {urls.map((file, idx) => (
          <TableFileLink key={idx} file={file} onPreviewImage={onPreviewImage} isTeal />
        ))}
      </div>
    )
  }

  // Render Berkas Tugas Selesai (Pekerjaan)
  if (column.key === 'file_tugas') {
    const urls = record.file_tugas_urls && record.file_tugas_urls.length > 0
      ? record.file_tugas_urls
      : (record.latest_reporting?.dokumen_bukti_urls && record.latest_reporting.dokumen_bukti_urls.length > 0
          ? record.latest_reporting.dokumen_bukti_urls
          : (record.file_tugas_url || record.latest_reporting?.dokumen_bukti_url
              ? [{ name: 'Lihat Berkas', url: record.file_tugas_url || record.latest_reporting?.dokumen_bukti_url }]
              : (value ? [{ name: 'Lihat Berkas', url: value.startsWith('http') ? value : `/storage/${value}` }] : [])))

    if (!urls.length) {
      return <span className="text-gray-400 text-xs italic">-</span>
    }

    if (urls.length === 1) {
      return <TableFileLink file={urls[0]} onPreviewImage={onPreviewImage} />
    }

    return (
      <div className="flex flex-col gap-1.5 items-start py-1">
        {urls.map((file, idx) => (
          <TableFileLink key={idx} file={file} onPreviewImage={onPreviewImage} />
        ))}
      </div>
    )
  }

  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">-</span>
  }

  // Render Calon Klien (Nama Perusahaan)
  if (column.key === 'id_calon_klien') {
    const companyName = record.calon_klien?.nama_perusahaan || record.klien?.nama_perusahaan
    return (
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {companyName || '-'}
      </span>
    )
  }

  // Render Klien (Klien Penyewa Jasa / Nama Perusahaan)
  if (column.key === 'id_klien') {
    const clientName = record.klien?.nama_perusahaan || record.calon_klien?.nama_perusahaan
    return (
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {clientName || '-'}
      </span>
    )
  }

  // Render Kontrak (Nomor Kontrak)
  if (column.key === 'id_kontrak') {
    const contractNo = record.kontrak?.no_kontrak
    return (
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {contractNo || '-'}
      </span>
    )
  }

  // Render Judul Pekerjaan
  if (column.key === 'judul') {
    return (
      <div className="flex flex-col max-w-xs">
        <span className="font-semibold text-gray-900 dark:text-gray-100">{value}</span>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {record.layanan?.nama_layanan && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60">
              {record.layanan.nama_layanan}
            </span>
          )}
          {record.periode_bulan && (
            <span
              className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60"
              title={`Bulan Pengerjaan: ${record.periode_bulan.includes('-') ? `${record.periode_bulan.split('-')[1]}/${record.periode_bulan.split('-')[0]}` : record.periode_bulan}`}
            >
              {record.periode_bulan.includes('-')
                ? `${record.periode_bulan.split('-')[1]}/${record.periode_bulan.split('-')[0]}`
                : record.periode_bulan}
            </span>
          )}
        </div>
        {record.deskripsi && (
          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 truncate mt-0.5" title={record.deskripsi}>
            {record.deskripsi}
          </span>
        )}
      </div>
    )
  }

  // Render Induk Layanan
  if (column.key === 'id_layanan') {
    return (
      <span className="font-semibold text-gray-800 dark:text-gray-200">
        {record.layanan?.nama_layanan || value || '-'}
      </span>
    )
  }

  // Render Sifat Periode Master Pekerjaan
  if (column.key === 'sifat_periode') {
    switch (value) {
      case 'bulanan':
        return <Badge size="sm" color="info">Bulanan</Badge>
      case 'tahunan':
        return <Badge size="sm" color="primary">Tahunan</Badge>
      default:
        return <Badge size="sm" color="success">Sekali Selesai</Badge>
    }
  }

  // Render Kategori Layanan
  if (column.key === 'kategori') {
    const labels = {
      akuntansi_pajak: 'Akuntansi & Pajak',
      teknologi_informasi: 'IT & Software',
      konsultasi: 'Konsultasi Bisnis',
      lainnya: 'Lainnya',
    }
    return (
      <Badge size="sm" color="light">
        {labels[value] || value}
      </Badge>
    )
  }

  // Render Jumlah Template Tugas
  if (column.key === 'master_pekerjaan_count') {
    return (
      <span className="font-semibold text-gray-800 dark:text-gray-200">
        {value || record.master_pekerjaan?.length || 0} Template
      </span>
    )
  }

  // Render Status Aktif
  if (column.key === 'is_active') {
    return value ? (
      <Badge size="sm" color="success">Aktif</Badge>
    ) : (
      <Badge size="sm" color="light">Nonaktif</Badge>
    )
  }

  // Render Pekerjaan (Judul Pekerjaan)
  if (column.key === 'id_pekerjaan') {
    const jobTitle = record.pekerjaan?.judul
    return (
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {jobTitle || '-'}
      </span>
    )
  }

  // Render Dokumen Bukti (Download / View link)
  if (column.key === 'dokumen_bukti') {
    const urls = record.dokumen_bukti_urls && record.dokumen_bukti_urls.length > 0
      ? record.dokumen_bukti_urls
      : (record.dokumen_bukti_url
          ? [{ name: 'Lihat Berkas', url: record.dokumen_bukti_url }]
          : (value ? [{ name: 'Lihat Berkas', url: value.startsWith('http') ? value : `/storage/${value}` }] : []))

    if (!urls.length) {
      return <span className="text-gray-400 text-xs italic">-</span>
    }

    if (urls.length === 1) {
      return <TableFileLink file={urls[0]} onPreviewImage={onPreviewImage} />
    }

    return (
      <div className="flex flex-col gap-1.5 items-start py-1">
        {urls.map((file, idx) => (
          <TableFileLink key={idx} file={file} onPreviewImage={onPreviewImage} />
        ))}
      </div>
    )
  }

  // Render Kontak Person with Email
  if (column.key === 'kontak_person') {
    return (
      <div className="flex flex-col">
        <span className="font-semibold text-gray-900 dark:text-gray-100">{value}</span>
        {record.email && (
          <span className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1 mt-0.5">
            {record.email}
          </span>
        )}
      </div>
    )
  }

  // Render stylized status badges
  if (['status', 'status_prospek', 'review_status', 'prioritas', 'status_laporan'].includes(column.key)) {
    if (column.key === 'status_laporan') {
      const currentVal = value || record.pekerjaan?.status || 'submitted'
      if (['approved', 'completed'].includes(currentVal)) {
        return (
          <Badge size="sm" color="success">
            Disetujui
          </Badge>
        )
      }
      if (['revision_needed', 'revision'].includes(currentVal)) {
        return (
          <Badge size="sm" color="error">
            Perlu Revisi
          </Badge>
        )
      }
      return (
        <Badge size="sm" color="warning">
          Menunggu Ditinjau
        </Badge>
      )
    }

    if (column.key === 'status_prospek') {
      if (value === 'deal') {
        return (
          <Badge size="sm" color="success">
            Deal
          </Badge>
        )
      }
      return (
        <Badge size="sm" color="warning">
          Belum Deal
        </Badge>
      )
    }

    const badgeColors = {
      // Prospek status
      prospek: 'light',
      approach: 'info',
      negotiation: 'warning',
      deal: 'success',
      lost: 'error',
      // Work status
      baru: 'info',
      draft: 'light',
      in_progress: 'primary',
      review: 'warning',
      submitted: 'warning',
      revision: 'error',
      revision_needed: 'error',
      approved: 'success',
      completed: 'success',
      // Priority
      rendah: 'light',
      sedang: 'info',
      tinggi: 'error',
      // General
      aktif: 'success',
      nonaktif: 'error',
      selesai: 'info',
      batal: 'error',
    }

    const statusLabels = {
      baru: 'Baru',
      in_progress: 'Dalam Pengerjaan',
      submitted: 'Diajukan',
      revision_needed: 'Perlu Revisi',
      completed: 'Selesai',
      draft: 'Draft',
      review: 'Ditinjau',
      revision: 'Revisi',
      approved: 'Disetujui',
      aktif: 'Aktif',
      nonaktif: 'Nonaktif',
      batal: 'Batal',
      selesai: 'Selesai',
      rendah: 'Rendah',
      sedang: 'Sedang',
      tinggi: 'Tinggi',
    }

    return (
      <Badge size="sm" color={badgeColors[value] || 'light'}>
        {statusLabels[value] || value}
      </Badge>
    )
  }

  // Render role badges
  if (column.key === 'role') {
    const roleLabels = {
      admin: { label: 'Admin Utama', color: 'primary' },
      pimpinan: { label: 'Pimpinan (Admin Utama)', color: 'primary' },
      operator: { label: 'Operator', color: 'success' },
      sales: { label: 'Operator', color: 'success' },
      karyawan: { label: 'Karyawan', color: 'warning' },
    }
    const roleInfo = roleLabels[value] || { label: value, color: 'light' }
    return (
      <Badge size="sm" color={roleInfo.color}>
        {roleInfo.label}
      </Badge>
    )
  }

  // Render Deadline / Batas Waktu dengan Indikator Keterlambatan Real-time
  if (column.key === 'deadline') {
    return (
      <DeadlineBadge
        deadline={value}
        status={record.status}
        submittedAt={record.submitted_at}
        tglSelesai={record.tgl_selesai}
      />
    )
  }

  // Render Tanggal Selesai dengan Status Ketepatan Waktu
  if (column.key === 'tgl_selesai') {
    if (!value) {
      return (
        <span className="text-gray-400 text-xs italic">
          {['completed', 'approved'].includes(record.status) ? '-' : 'Dalam pengerjaan'}
        </span>
      )
    }

    const cleanFinish = String(value).split(' ')[0]
    let finishBadge = null

    if (record.deadline) {
      const cleanDeadline = String(record.deadline).split(' ')[0]
      const [dYear, dMonth, dDay] = cleanDeadline.split('-').map(Number)
      const [fYear, fMonth, fDay] = cleanFinish.split('-').map(Number)
      if (dYear && dMonth && dDay && fYear && fMonth && fDay) {
        const dDate = new Date(dYear, dMonth - 1, dDay)
        const fDate = new Date(fYear, fMonth - 1, fDay)
        dDate.setHours(0, 0, 0, 0)
        fDate.setHours(0, 0, 0, 0)
        const diffDays = Math.round((fDate.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays > 0) {
          finishBadge = (
            <Badge size="sm" color="error" className="font-semibold text-[11px]">
              Telat {diffDays} hr
            </Badge>
          )
        } else {
          finishBadge = (
            <Badge size="sm" color="success" className="font-semibold text-[11px]">
              Tepat Waktu
            </Badge>
          )
        }
      }
    }

    return (
      <div className="flex flex-col gap-1 items-start justify-center">
        <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-200">
          {cleanFinish}
        </span>
        {finishBadge}
      </div>
    )
  }

  // Render score highlights (dengan indikator penalti keterlambatan jika speed_score < 85)
  if (['final_score', 'speed_score', 'quality_score'].includes(column.key)) {
    const numVal = Number(value)
    return (
      <div className="flex items-center gap-1.5">
        <strong className="text-brand-600 dark:text-brand-400 font-bold">{value}</strong>
        {column.key === 'speed_score' && numVal > 0 && numVal < 85 && (
          <Badge size="sm" color="error" className="text-[10px]">
            Penalti Telat
          </Badge>
        )}
      </div>
    )
  }

  return <span className="text-gray-800 dark:text-gray-200">{String(value)}</span>
}

function ResourceTable({
  config,
  records,
  loading,
  onEdit,
  onDelete,
  onBulkDelete,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  user,
  onConvert,
  onViewLegalitas,
  onViewContract,
  onStartTask,
  onApproveTask,
  onRejectTask,
  onOpenCreate,
}) {
  const isCreateAllowed = typeof canCreate === 'boolean'
    ? canCreate
    : (config.canCreate ? config.canCreate.includes(user?.role) : true)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [selectedIds, setSelectedIds] = useState([])
  const [previewModal, setPreviewModal] = useState({ open: false, url: '', name: '' })

  const handlePreviewImage = (url, name) => {
    setPreviewModal({ open: true, url, name })
  }

  // Reset filter, paginasi, sortir, dan seleksi massal saat modul berganti
  useEffect(() => {
    setStatusFilter('all')
    setSearchQuery('')
    setCurrentPage(1)
    setSortConfig({ key: null, direction: 'asc' })
    setSelectedIds([])
  }, [config.key])

  // Hitung Opsi Filter Status / Kategori Berdasarkan Data (Tersedia Lengkap untuk Semua Modul)
  const statusFilterOptions = useMemo(() => {
    if (!records || !records.length) return []

    if (config.key === 'calonKlien') {
      const dealCount = records.filter((r) => String(r.status_prospek || '').toLowerCase() === 'deal').length
      const lostCount = records.filter((r) => String(r.status_prospek || '').toLowerCase() === 'lost').length
      const belumDealCount = records.filter((r) => !['deal', 'lost'].includes(String(r.status_prospek || '').toLowerCase())).length
      const opts = [
        { key: 'all', label: 'Semua Status', count: records.length },
        { key: 'belum_deal', label: 'Belum Deal', count: belumDealCount },
        { key: 'deal', label: 'Deal', count: dealCount },
      ]
      if (lostCount > 0) {
        opts.push({ key: 'lost', label: 'Lost / Batal', count: lostCount })
      }
      return opts
    }

    if (config.key === 'pekerjaan') {
      const defs = [
        { key: 'baru', label: 'Baru', match: ['baru'] },
        { key: 'in_progress', label: 'Dalam Pengerjaan', match: ['in_progress', 'progress'] },
        { key: 'submitted', label: 'Diajukan', match: ['submitted', 'review'] },
        { key: 'revision_needed', label: 'Perlu Revisi', match: ['revision_needed', 'revision'] },
        { key: 'completed', label: 'Selesai', match: ['completed', 'approved', 'selesai'] },
      ]
      return [
        { key: 'all', label: 'Semua Status', count: records.length },
        ...defs.map((d) => ({
          key: d.key,
          label: d.label,
          count: records.filter((r) => d.match.includes(String(r.status || '').toLowerCase())).length,
        })),
      ]
    }

    if (config.key === 'reporting') {
      const defs = [
        { key: 'submitted', label: 'Menunggu Ditinjau' },
        { key: 'revision_needed', label: 'Perlu Revisi' },
        { key: 'approved', label: 'Disetujui' },
      ]
      return [
        { key: 'all', label: 'Semua Status', count: records.length },
        ...defs.map((d) => {
          let count = 0
          records.forEach((rec) => {
            const val = String(rec.status_laporan || rec.pekerjaan?.status || 'submitted').toLowerCase()
            if (d.key === 'approved' && ['approved', 'completed'].includes(val)) count++
            else if (d.key === 'revision_needed' && ['revision_needed', 'revision'].includes(val)) count++
            else if (d.key === 'submitted' && !['approved', 'completed', 'revision_needed', 'revision'].includes(val)) count++
          })
          return { key: d.key, label: d.label, count }
        }),
      ]
    }

    if (config.key === 'kontrak') {
      const defs = [
        { key: 'draft', label: 'Draft' },
        { key: 'aktif', label: 'Aktif' },
        { key: 'selesai', label: 'Selesai' },
        { key: 'nonaktif', label: 'Nonaktif' },
        { key: 'batal', label: 'Batal' },
      ]
      return [
        { key: 'all', label: 'Semua Status', count: records.length },
        ...defs.map((d) => ({
          ...d,
          count: records.filter((r) => String(r.status || '').toLowerCase() === d.key).length,
        })),
      ]
    }

    if (config.key === 'layanan') {
      const aktifCount = records.filter((r) => Boolean(r.is_active) && r.is_active !== '0' && r.is_active !== 0).length
      const nonaktifCount = records.length - aktifCount
      return [
        { key: 'all', label: 'Semua Status', count: records.length },
        { key: '1', label: 'Aktif', count: aktifCount },
        { key: '0', label: 'Nonaktif', count: nonaktifCount },
      ]
    }

    if (config.key === 'masterPekerjaan') {
      const layananMap = new Map()
      records.forEach((rec) => {
        const id = rec.id_layanan || rec.layanan?.id_layanan
        const name = rec.layanan?.nama_layanan || (id ? `Layanan #${id}` : 'Tanpa Layanan')
        const key = id ? String(id) : 'none'
        if (!layananMap.has(key)) {
          layananMap.set(key, { key, label: name, count: 0 })
        }
        layananMap.get(key).count++
      })

      const layananOptions = Array.from(layananMap.values()).sort((a, b) => a.label.localeCompare(b.label))

      return [
        { key: 'all', label: 'Semua Induk Layanan', count: records.length },
        ...layananOptions,
      ]
    }

    if (config.key === 'users') {
      const roles = [
        { key: 'admin', label: 'Admin' },
        { key: 'pimpinan', label: 'Pimpinan' },
        { key: 'operator', label: 'Operator' },
        { key: 'sales', label: 'Sales' },
        { key: 'karyawan', label: 'Karyawan' },
      ]
      return [
        { key: 'all', label: 'Semua Role', count: records.length },
        ...roles.map((r) => ({
          ...r,
          count: records.filter((u) => String(u.role || '').toLowerCase() === r.key).length,
        })),
      ]
    }

    return []
  }, [records, config.key])

  // Filter Data Berdasarkan Pencarian & Status / Kategori Dropdown
  const filteredRecords = useMemo(() => {
    let result = records || []

    if (statusFilter !== 'all') {
      if (config.key === 'calonKlien') {
        if (statusFilter === 'deal') {
          result = result.filter((rec) => String(rec.status_prospek || '').toLowerCase() === 'deal')
        } else if (statusFilter === 'belum_deal') {
          result = result.filter((rec) => !['deal', 'lost'].includes(String(rec.status_prospek || '').toLowerCase()))
        } else if (statusFilter === 'lost') {
          result = result.filter((rec) => String(rec.status_prospek || '').toLowerCase() === 'lost')
        }
      } else if (config.key === 'pekerjaan') {
        const matchMap = {
          baru: ['baru'],
          in_progress: ['in_progress', 'progress'],
          submitted: ['submitted', 'review'],
          revision_needed: ['revision_needed', 'revision'],
          completed: ['completed', 'approved', 'selesai'],
        }
        const matches = matchMap[statusFilter] || [statusFilter]
        result = result.filter((rec) => matches.includes(String(rec.status || '').toLowerCase()))
      } else if (config.key === 'reporting') {
        result = result.filter((rec) => {
          const val = String(rec.status_laporan || rec.pekerjaan?.status || 'submitted').toLowerCase()
          if (statusFilter === 'approved') return ['approved', 'completed'].includes(val)
          if (statusFilter === 'revision_needed') return ['revision_needed', 'revision'].includes(val)
          if (statusFilter === 'submitted') return !['approved', 'completed', 'revision_needed', 'revision'].includes(val)
          return false
        })
      } else if (config.key === 'kontrak') {
        result = result.filter((rec) => String(rec.status || '').toLowerCase() === statusFilter)
      } else if (config.key === 'layanan') {
        if (statusFilter === '1') {
          result = result.filter((rec) => Boolean(rec.is_active) && rec.is_active !== '0' && rec.is_active !== 0)
        } else if (statusFilter === '0') {
          result = result.filter((rec) => !rec.is_active || rec.is_active === '0' || rec.is_active === 0)
        }
      } else if (config.key === 'masterPekerjaan') {
        if (statusFilter === 'none') {
          result = result.filter((rec) => !rec.id_layanan && !rec.layanan?.id_layanan)
        } else {
          result = result.filter((rec) => String(rec.id_layanan || rec.layanan?.id_layanan) === String(statusFilter))
        }
      } else if (config.key === 'users') {
        result = result.filter((rec) => String(rec.role || '').toLowerCase() === statusFilter)
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((rec) => {
        for (const col of config.columns) {
          const val = rec[col.key]
          if (val && String(val).toLowerCase().includes(q)) return true
        }
        if (rec.nama_perusahaan && String(rec.nama_perusahaan).toLowerCase().includes(q)) return true
        if (rec.klien?.nama_perusahaan && String(rec.klien.nama_perusahaan).toLowerCase().includes(q)) return true
        if (rec.calon_klien?.nama_perusahaan && String(rec.calon_klien.nama_perusahaan).toLowerCase().includes(q)) return true
        if (rec.pic?.nama && String(rec.pic.nama).toLowerCase().includes(q)) return true
        if (rec.user?.nama && String(rec.user.nama).toLowerCase().includes(q)) return true
        if (rec.judul && String(rec.judul).toLowerCase().includes(q)) return true
        if (rec.no_kontrak && String(rec.no_kontrak).toLowerCase().includes(q)) return true
        return false
      })
    }

    return result
  }, [records, statusFilter, searchQuery, config])

  // Pengurutan Kolom Data (Column Sorting A-Z, Angka, Tanggal)
  const sortedRecords = useMemo(() => {
    if (!sortConfig.key) return filteredRecords

    const { key, direction } = sortConfig
    return [...filteredRecords].sort((a, b) => {
      let aVal = a[key]
      let bVal = b[key]

      if (key === 'id_klien') {
        aVal = a.klien?.nama_perusahaan || a.calon_klien?.nama_perusahaan || ''
        bVal = b.klien?.nama_perusahaan || b.calon_klien?.nama_perusahaan || ''
      } else if (key === 'id_calon_klien') {
        aVal = a.calon_klien?.nama_perusahaan || ''
        bVal = b.calon_klien?.nama_perusahaan || ''
      } else if (key === 'id_kontrak') {
        aVal = a.kontrak?.no_kontrak || ''
        bVal = b.kontrak?.no_kontrak || ''
      } else if (key === 'id_pic' || key === 'id_user') {
        aVal = a.pic?.nama || a.user?.nama || ''
        bVal = b.pic?.nama || b.user?.nama || ''
      } else if (key === 'id_layanan') {
        aVal = a.layanan?.nama_layanan || ''
        bVal = b.layanan?.nama_layanan || ''
      }

      if (aVal === null || aVal === undefined) aVal = ''
      if (bVal === null || bVal === undefined) bVal = ''

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal
      }

      const isDateA = typeof aVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(aVal)
      const isDateB = typeof bVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(bVal)
      if (isDateA && isDateB) {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return direction === 'asc'
        ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
        : String(bVal).localeCompare(String(aVal), undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [filteredRecords, sortConfig])

  function handleSort(colKey) {
    setSortConfig((prev) => {
      if (prev.key === colKey) {
        if (prev.direction === 'asc') return { key: colKey, direction: 'desc' }
        return { key: null, direction: 'asc' }
      }
      return { key: colKey, direction: 'asc' }
    })
  }

  // Hitungan Paginasi
  const isViewAll = pageSize >= 100000
  const totalRecords = sortedRecords.length
  const totalPages = isViewAll ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize))
  const validCurrentPage = isViewAll ? 1 : Math.min(Math.max(1, currentPage), totalPages)

  const paginatedRecords = useMemo(() => {
    if (isViewAll) return sortedRecords
    const start = (validCurrentPage - 1) * pageSize
    return sortedRecords.slice(start, start + pageSize)
  }, [sortedRecords, validCurrentPage, pageSize, isViewAll])

  // Logika Aksi Massal (Bulk Selection)
  const primaryKey = config.primaryKey
  const currentPageIds = paginatedRecords.map((r) => r[primaryKey])
  const isAllPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))
  const isSomePageSelected = currentPageIds.some((id) => selectedIds.includes(id)) && !isAllPageSelected

  function handleToggleSelectAllPage() {
    if (isAllPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])))
    }
  }

  function handleToggleRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  if (loading && records.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <LoadingSpinner
          size="md"
          text={`Memuat data ${config.label}...`}
          subtitle="Menyinkronkan data dengan server..."
        />
      </div>
    )
  }

  if (!records.length) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1">Belum Ada Data</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
            {config.key === 'kinerjaKaryawan' && user?.role === 'karyawan'
              ? 'Belum ada catatan evaluasi atau penilaian kinerja dari pimpinan untuk Anda.'
              : isCreateAllowed
              ? `Data untuk modul ${config.label} saat ini belum tersedia. Tambahkan data baru sekarang.`
              : `Data untuk modul ${config.label} saat ini belum tersedia.`}
          </p>
          {isCreateAllowed && onOpenCreate && !['kontrak', 'klien'].includes(config.key) && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs font-semibold shadow-theme-xs shadow-brand-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>
                {config.key === 'calonKlien'
                  ? '+ Tambah Calon Klien'
                  : config.key === 'pekerjaan'
                  ? '+ Buat Penugasan Baru'
                  : config.key === 'users'
                  ? '+ Tambah Pengguna Baru'
                  : config.key === 'reporting'
                  ? '+ Buat Laporan Baru'
                  : config.key === 'masterPekerjaan'
                  ? '+ Tambah Template Pekerjaan'
                  : config.key === 'kinerjaKaryawan'
                  ? '+ Beri Penilaian Kinerja'
                  : config.key === 'layanan'
                  ? '+ Tambah Layanan Baru'
                  : `+ Tambah ${config.label} Baru`}
              </span>
            </button>
          )}
        </div>
      </div>
    )
  }

  const isPekerjaan = config.key === 'pekerjaan'
  const isReporting = config.key === 'reporting'
  const hasWorkflowActions = Boolean(
    (config.key === 'calonKlien' && (onViewLegalitas || onConvert)) ||
    (config.key === 'kontrak' && onViewContract) ||
    (isReporting && ['admin', 'pimpinan'].includes(user?.role) && Boolean(onApproveTask || onRejectTask)) ||
    (isPekerjaan && user?.role === 'karyawan' && Boolean(onStartTask))
  )

  const hasActions = Boolean(canEdit || canDelete || hasWorkflowActions)

  return (
    <div className="space-y-4">
      {/* Toolbar Pencarian & Filter Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Kolom Pencarian Cepat */}
        <div className="relative flex-1 max-w-md">
          <svg className="size-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={`Cari data ${config.label.toLowerCase()}...`}
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold p-0.5 rounded-full cursor-pointer"
              title="Hapus pencarian"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filter Kategori / Status */}
        {statusFilterOptions.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-2xs cursor-pointer appearance-none"
              >
                {statusFilterOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} ({opt.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* State jika hasil pencarian / filter tidak ditemukan */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1">Tidak Ada Data yang Cocok</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
              Tidak ditemukan data yang sesuai dengan kriteria pencarian atau filter yang dipilih.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setCurrentPage(1)
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all cursor-pointer shadow-2xs"
            >
              Reset Filter & Pencarian
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Floating Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 shadow-xs animate-fade-in mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-lg bg-brand-500 text-white font-bold text-xs">
                  {selectedIds.length}
                </span>
                <span className="text-xs font-semibold text-brand-900 dark:text-brand-200">
                  data <strong>{config.label}</strong> dipilih
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer shadow-2xs"
                >
                  Batal Pilih
                </button>
                {canDelete && onBulkDelete && (
                  <button
                    type="button"
                    onClick={() => onBulkDelete(selectedIds, () => setSelectedIds([]))}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-error-600 hover:bg-error-700 active:bg-error-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Hapus Terpilih ({selectedIds.length})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 1. Tampilan Desktop Table (Layar md ke atas) dengan Sticky Header */}
          <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs border-b border-gray-200 dark:border-gray-700 shadow-2xs">
                  <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {canDelete && (
                      <th className="py-3.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          ref={(el) => { if (el) el.indeterminate = isSomePageSelected }}
                          onChange={handleToggleSelectAllPage}
                          className="size-4 rounded-md border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          title="Pilih semua data pada halaman ini"
                        />
                      </th>
                    )}
                    {config.columns.map((column) => {
                      const isSorted = sortConfig.key === column.key
                      return (
                        <th
                          key={column.key}
                          onClick={() => handleSort(column.key)}
                          className="py-3.5 px-4 cursor-pointer select-none group transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-750"
                          title={`Urutkan berdasarkan ${column.label}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{column.label}</span>
                            <span className="flex flex-col shrink-0">
                              {isSorted ? (
                                sortConfig.direction === 'asc' ? (
                                  <svg className="size-3.5 text-brand-600 dark:text-brand-400 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                                  </svg>
                                ) : (
                                  <svg className="size-3.5 text-brand-600 dark:text-brand-400 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )
                              ) : (
                                <svg className="size-3 text-gray-400/50 group-hover:text-gray-500 dark:group-hover:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                              )}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                    {hasActions && (
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">
                        {hasWorkflowActions ? 'Aksi & Alur Kerja' : 'Aksi'}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedRecords.map((record) => {
                    const isLeadOwner = !['operator', 'sales'].includes(user?.role) || Number(record.id_user) === Number(user?.id_user)
                    const isCalonKlien = config.key === 'calonKlien'
                    const isKontrak = config.key === 'kontrak'
                    const operatorPicId =
                      record.operator_pic_id ??
                      record.calon_klien?.id_user ??
                      record.calonKlien?.id_user ??
                      record.kontrak?.calon_klien?.id_user ??
                      record.kontrak?.calonKlien?.id_user ??
                      record.klien?.kontrak?.calon_klien?.id_user ??
                      record.klien?.kontrak?.calonKlien?.id_user
                    const isTaskOperatorOwner = !['operator', 'sales'].includes(user?.role) || (operatorPicId != null && Number(operatorPicId) === Number(user?.id_user))

                    const isReportApproved =
                      isReporting &&
                      (['approved', 'completed'].includes(record.status_laporan) ||
                        ['approved', 'completed'].includes(record.pekerjaan?.status))
                    const isReportRevised =
                      isReporting &&
                      (['revision_needed', 'revision'].includes(record.status_laporan) ||
                        ['revision_needed', 'revision'].includes(record.pekerjaan?.status))
                    const isReportPending = isReporting && !isReportApproved && !isReportRevised

                    const canReviewTask =
                      ['admin', 'pimpinan'].includes(user?.role) &&
                      isReporting &&
                      isReportPending
                    const canStartTask =
                      isPekerjaan &&
                      user?.role === 'karyawan' &&
                      record.status === 'baru' &&
                      Number(record.id_pic) === Number(user?.id_user)
                    const isTaskCompleted = isPekerjaan && ['completed', 'approved'].includes(record.status)
                    const isReportCompleted = isReportApproved
                    const isReadOnlyRow = isTaskCompleted || isReportCompleted || (isPekerjaan && user?.role === 'karyawan')

                    return (
                      <tr
                        key={record[config.primaryKey]}
                        className={`transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40 ${
                          selectedIds.includes(record[config.primaryKey])
                            ? 'bg-brand-50/50 dark:bg-brand-500/15'
                            : ''
                        }`}
                      >
                        {canDelete && (
                          <td className="py-3.5 px-3 w-10 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(record[config.primaryKey])}
                              onChange={() => handleToggleRow(record[config.primaryKey])}
                              className="size-4 rounded-md border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            />
                          </td>
                        )}
                        {config.columns.map((column) => (
                          <td key={column.key} className="py-3.5 px-4 align-middle whitespace-nowrap">
                            {renderCellValue(column, record, handlePreviewImage)}
                          </td>
                        ))}
                        {hasActions && (
                          <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                            <div className="inline-flex items-center justify-center gap-1.5 flex-nowrap">
                              {/* Workflow: Start Task for Karyawan */}
                              {canStartTask && onStartTask && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                  onClick={() => onStartTask(record)}
                                  title="Mulai kerjakan tugas ini (Status berubah menjadi Dalam Pengerjaan)"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Mulai</span>
                                </button>
                              )}

                              {/* Workflow: Approve Task */}
                              {canReviewTask && onApproveTask && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                  onClick={() => onApproveTask(record)}
                                  title="Setujui laporan tugas ini"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Setujui</span>
                                </button>
                              )}

                              {/* Workflow: Reject Task */}
                              {canReviewTask && onRejectTask && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                  onClick={() => onRejectTask(record)}
                                  title="Minta revisi atas laporan tugas ini"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span>Revisi</span>
                                </button>
                              )}

                              {/* Keterangan Status Khusus Reporting */}
                              {isReporting && isReportApproved && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/60 shadow-2xs whitespace-nowrap">
                                  ✓ Selesai
                                </span>
                              )}
                              {isReporting && isReportRevised && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/60 shadow-2xs whitespace-nowrap">
                                  ↺ Revisi
                                </span>
                              )}

                              {/* Keterangan Bukan PIC */}
                              {['pekerjaan', 'kontrak', 'klien'].includes(config.key) && ['operator', 'sales'].includes(user?.role) && !isTaskOperatorOwner && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 whitespace-nowrap"
                                  title="Bukan wewenang Anda (Hanya Operator PIC terkait yang berwenang mengedit data ini)"
                                >
                                  Bukan PIC
                                </span>
                              )}

                              {/* Calon Klien: View Legalitas Modal */}
                              {isCalonKlien && onViewLegalitas && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold bg-blue-light-50 hover:bg-blue-light-100 text-blue-light-700 border border-blue-light-200 dark:bg-blue-light-500/15 dark:text-blue-light-400 dark:border-blue-light-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                  onClick={() => onViewLegalitas(record)}
                                  title="Lihat nomor legalitas & berkas pendukung"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span>Legalitas</span>
                                </button>
                              )}

                              {/* View/Print Contract Document */}
                              {isKontrak && onViewContract && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                  onClick={() => onViewContract(record)}
                                  title="Buka surat perjanjian kontrak untuk dicetak"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                  <span>Cetak</span>
                                </button>
                              )}

                              {/* Compact Edit / Detail Button */}
                              {canEdit && (config.key !== 'calonKlien' || isLeadOwner) && (!['pekerjaan', 'kontrak', 'klien'].includes(config.key) || isTaskOperatorOwner || user?.role === 'karyawan') && (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center size-8 rounded-lg text-gray-700 hover:text-brand-600 bg-white hover:bg-brand-50 border border-gray-300 hover:border-brand-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 dark:hover:border-brand-500/40 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                  onClick={() => onEdit(record)}
                                  title={
                                    isTaskCompleted
                                      ? 'Pekerjaan telah disetujui & selesai (Lihat Detail)'
                                      : isReportCompleted
                                      ? 'Laporan telah disetujui (Lihat Detail)'
                                      : isPekerjaan && user?.role === 'karyawan'
                                      ? 'Lihat detail instruksi pekerjaan'
                                      : 'Edit data'
                                  }
                                >
                                  {isReadOnlyRow ? (
                                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  ) : (
                                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  )}
                                </button>
                              )}

                              {/* Compact Delete Button */}
                              {canDelete && (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center size-8 rounded-lg text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 dark:bg-gray-800 dark:text-rose-400 dark:border-rose-900/60 dark:hover:bg-rose-500/10 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                  onClick={() => onDelete(record)}
                                  title="Hapus data ini"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Tampilan Mobile Card List (Layar < md ponsel pintar) */}
          <div className="md:hidden space-y-3">
            {paginatedRecords.map((record) => {
              const isLeadOwner = !['operator', 'sales'].includes(user?.role) || Number(record.id_user) === Number(user?.id_user)
              const isCalonKlien = config.key === 'calonKlien'
              const isKontrak = config.key === 'kontrak'
              const operatorPicId =
                record.operator_pic_id ??
                record.calon_klien?.id_user ??
                record.calonKlien?.id_user ??
                record.kontrak?.calon_klien?.id_user ??
                record.kontrak?.calonKlien?.id_user ??
                record.klien?.kontrak?.calon_klien?.id_user ??
                record.klien?.kontrak?.calonKlien?.id_user
              const isTaskOperatorOwner = !['operator', 'sales'].includes(user?.role) || (operatorPicId != null && Number(operatorPicId) === Number(user?.id_user))

              const isReportApproved =
                isReporting &&
                (['approved', 'completed'].includes(record.status_laporan) ||
                  ['approved', 'completed'].includes(record.pekerjaan?.status))
              const isReportRevised =
                isReporting &&
                (['revision_needed', 'revision'].includes(record.status_laporan) ||
                  ['revision_needed', 'revision'].includes(record.pekerjaan?.status))
              const isReportPending = isReporting && !isReportApproved && !isReportRevised

              const canReviewTask =
                ['admin', 'pimpinan'].includes(user?.role) &&
                isReporting &&
                isReportPending
              const canStartTask =
                isPekerjaan &&
                user?.role === 'karyawan' &&
                record.status === 'baru' &&
                Number(record.id_pic) === Number(user?.id_user)
              const isTaskCompleted = isPekerjaan && ['completed', 'approved'].includes(record.status)
              const isReportCompleted = isReportApproved
              const isReadOnlyRow = isTaskCompleted || isReportCompleted || (isPekerjaan && user?.role === 'karyawan')

              const statusCol = config.columns.find((c) => ['status', 'status_prospek', 'is_active', 'status_laporan'].includes(c.key))

              return (
                <div
                  key={record[config.primaryKey]}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs space-y-3"
                >
                  {/* Card Header: Judul / Nama Utama + Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {canDelete && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(record[config.primaryKey])}
                          onChange={() => handleToggleRow(record[config.primaryKey])}
                          className="mt-0.5 size-4 rounded-md border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
                          {config.label}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 truncate">
                          {record[config.displayField] || record.nama_perusahaan || record.judul || record.nama || `Data #${record[config.primaryKey]}`}
                        </h4>
                      </div>
                    </div>
                    {statusCol && (
                      <div className="shrink-0">
                        {renderCellValue(statusCol, record, handlePreviewImage)}
                      </div>
                    )}
                  </div>

                  {/* Card Body: Rincian Data Penting */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {config.columns
                      .filter((c) => !['status', 'status_prospek', 'is_active', 'status_laporan', config.displayField].includes(c.key))
                      .slice(0, 4)
                      .map((column) => (
                        <div key={column.key} className="space-y-0.5 min-w-0">
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 block uppercase truncate">
                            {column.label}
                          </span>
                          <div className="text-gray-800 dark:text-gray-200 font-medium truncate">
                            {renderCellValue(column, record, handlePreviewImage)}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Card Footer: Tombol Aksi Ramah Sentuhan Mobile */}
                  {hasActions && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {canStartTask && onStartTask && (
                        <button
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold bg-brand-600 active:bg-brand-700 text-white shadow-2xs cursor-pointer"
                          onClick={() => onStartTask(record)}
                        >
                          <span>Mulai Kerjakan</span>
                        </button>
                      )}
                      {canReviewTask && onApproveTask && (
                        <button
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold bg-emerald-600 active:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                          onClick={() => onApproveTask(record)}
                        >
                          <span>Setujui</span>
                        </button>
                      )}
                      {canReviewTask && onRejectTask && (
                        <button
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 cursor-pointer"
                          onClick={() => onRejectTask(record)}
                        >
                          <span>Revisi</span>
                        </button>
                      )}
                      {isCalonKlien && onViewLegalitas && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-xl text-xs font-semibold bg-blue-light-50 text-blue-light-700 border border-blue-light-200 dark:bg-blue-light-500/15 dark:text-blue-light-400 cursor-pointer"
                          onClick={() => onViewLegalitas(record)}
                        >
                          <span>Legalitas</span>
                        </button>
                      )}
                      {isKontrak && onViewContract && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 cursor-pointer"
                          onClick={() => onViewContract(record)}
                        >
                          <span>Cetak</span>
                        </button>
                      )}
                      {canEdit && (config.key !== 'calonKlien' || isLeadOwner) && (!['pekerjaan', 'kontrak', 'klien'].includes(config.key) || isTaskOperatorOwner || user?.role === 'karyawan') && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-xl text-xs font-semibold bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 cursor-pointer"
                          onClick={() => onEdit(record)}
                        >
                          <span>{isReadOnlyRow ? 'Detail' : 'Edit'}</span>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-xl text-xs font-semibold bg-white text-rose-600 border border-rose-200 dark:bg-gray-800 dark:text-rose-400 dark:border-rose-900/60 cursor-pointer"
                          onClick={() => onDelete(record)}
                        >
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 3. Kontrol Paginasi (Berlaku untuk Desktop & Mobile) */}
          {totalRecords > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 px-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
              <div>
                {isViewAll ? (
                  <>
                    Menampilkan seluruh <span className="font-bold text-gray-800 dark:text-gray-200">{totalRecords}</span> data (Semua)
                  </>
                ) : (
                  <>
                    Menampilkan <span className="font-bold text-gray-800 dark:text-gray-200">{(validCurrentPage - 1) * pageSize + 1}</span> –{' '}
                    <span className="font-bold text-gray-800 dark:text-gray-200">{Math.min(validCurrentPage * pageSize, totalRecords)}</span> dari{' '}
                    <span className="font-bold text-gray-800 dark:text-gray-200">{totalRecords}</span> data
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-[11px]">Tampilkan:</span>
                  <select
                    value={isViewAll ? 'all' : pageSize}
                    onChange={(e) => {
                      const val = e.target.value
                      setPageSize(val === 'all' ? 1000000 : Number(val))
                      setCurrentPage(1)
                    }}
                    className="py-1 px-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:outline-hidden focus:border-brand-500 cursor-pointer"
                  >
                    <option value={10}>10 baris</option>
                    <option value={25}>25 baris</option>
                    <option value={50}>50 baris</option>
                    <option value={100}>100 baris</option>
                    <option value="all">Semua ({totalRecords})</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center justify-center size-8 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs font-bold"
                  title="Halaman sebelumnya"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1
                  if (totalPages > 5) {
                    if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - validCurrentPage) > 1) {
                      if (pageNum === 2 && validCurrentPage > 3) return <span key={pageNum} className="px-1 text-gray-400">...</span>
                      if (pageNum === totalPages - 1 && validCurrentPage < totalPages - 2) return <span key={pageNum} className="px-1 text-gray-400">...</span>
                      return null
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`inline-flex items-center justify-center size-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        validCurrentPage === pageNum
                          ? 'bg-brand-500 text-white shadow-theme-xs shadow-brand-500/20'
                          : 'border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-2xs'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center justify-center size-8 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs font-bold"
                  title="Halaman berikutnya"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Pratinjau Visual Gambar */}
      {previewModal.open && (
        <ImagePreviewModal
          isOpen={previewModal.open}
          imageUrl={previewModal.url}
          fileName={previewModal.name}
          onClose={() => setPreviewModal({ open: false, url: '', name: '' })}
        />
      )}
    </div>
  )
}

export default ResourceTable
