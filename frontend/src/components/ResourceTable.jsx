import Badge from './ui/Badge'
import LoadingSpinner from './common/LoadingSpinner'
import DeadlineBadge from './common/DeadlineBadge'

function renderCellValue(column, record) {
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
        <span className="mr-1">👤</span> {picName || 'Karyawan'}
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
        <span className="mr-1">👤</span> {operatorName || 'Operator'}
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
      const fileName = urls[0].name || (urls[0].url ? decodeURIComponent(urls[0].url.split('/').pop()) : 'Dokumen Acuan')
      return (
        <a
          href={urls[0].url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 dark:hover:bg-teal-500/25 text-xs font-semibold border border-teal-200/80 dark:border-teal-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer max-w-[260px]"
          title={`Buka / Unduh ${fileName}`}
        >
          <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="truncate">{fileName}</span>
        </a>
      )
    }

    return (
      <div className="flex flex-col gap-1.5 items-start py-1">
        {urls.map((file, idx) => {
          const fileName = file.name || (file.url ? decodeURIComponent(file.url.split('/').pop()) : `TOR ${idx + 1}`)
          return (
            <a
              key={idx}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 dark:hover:bg-teal-500/25 text-[11px] font-semibold border border-teal-200/80 dark:border-teal-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer max-w-[260px]"
              title={`Buka / Unduh ${fileName}`}
            >
              <svg className="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{fileName}</span>
            </a>
          )
        })}
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
      const fileName = urls[0].name || (urls[0].url ? decodeURIComponent(urls[0].url.split('/').pop()) : 'Berkas Tugas')
      return (
        <a
          href={urls[0].url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer max-w-[260px]"
          title={`Buka / Unduh ${fileName}`}
        >
          <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="truncate">{fileName}</span>
        </a>
      )
    }

    return (
      <div className="flex flex-col gap-1.5 items-start py-1">
        {urls.map((file, idx) => {
          const fileName = file.name || (file.url ? decodeURIComponent(file.url.split('/').pop()) : `Berkas ${idx + 1}`)
          return (
            <a
              key={idx}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer max-w-[260px]"
              title={`Buka / Unduh ${fileName}`}
            >
              <svg className="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="truncate">{fileName}</span>
            </a>
          )
        })}
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
        {record.deskripsi && (
          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 truncate" title={record.deskripsi}>
            {record.deskripsi}
          </span>
        )}
      </div>
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
      const fileName = urls[0].name || (urls[0].url ? decodeURIComponent(urls[0].url.split('/').pop()) : 'Dokumen Bukti')
      return (
        <a
          href={urls[0].url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer max-w-[260px]"
          title={`Buka / Unduh ${fileName}`}
        >
          <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="truncate">{fileName}</span>
        </a>
      )
    }

    return (
      <div className="flex flex-col gap-1.5 items-start py-1">
        {urls.map((file, idx) => {
          const fileName = file.name || (file.url ? decodeURIComponent(file.url.split('/').pop()) : `Berkas ${idx + 1}`)
          return (
            <a
              key={idx}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer max-w-[260px]"
              title={`Buka / Unduh ${fileName}`}
            >
              <svg className="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="truncate">{fileName}</span>
            </a>
          )
        })}
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
            ✉️ {record.email}
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
            ✓ Disetujui
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
            ✓ Deal
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
              ⚠️ Telat {diffDays} hr
            </Badge>
          )
        } else {
          finishBadge = (
            <Badge size="sm" color="success" className="font-semibold text-[11px]">
              ✓ Tepat Waktu
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
}) {
  const isCreateAllowed = typeof canCreate === 'boolean'
    ? canCreate
    : (config.canCreate ? config.canCreate.includes(user?.role) : true)

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
              ? `Data untuk modul ${config.label} saat ini belum tersedia. Tambahkan data baru menggunakan form di atas.`
              : `Data untuk modul ${config.label} saat ini belum tersedia.`}
          </p>
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
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
          <thead className="bg-gray-50/75 dark:bg-gray-800/60">
            <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {config.columns.map((column) => (
                <th key={column.key} className="py-3.5 px-4">
                  {column.label}
                </th>
              ))}
              {hasActions && (
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  {hasWorkflowActions ? 'Aksi & Alur Kerja' : 'Aksi'}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {records.map((record) => {
              const isDealLead = config.key === 'calonKlien' && record.status_prospek === 'deal'
              const isLeadOwner = !['operator', 'sales'].includes(user?.role) || Number(record.id_user) === Number(user?.id_user)
              const canConvertLead = isDealLead && !record.kontrak && ['admin', 'pimpinan', 'operator', 'sales'].includes(user?.role) && isLeadOwner
              const isCalonKlien = config.key === 'calonKlien'
              const isKontrak = config.key === 'kontrak'
              const operatorPicId = record.operator_pic_id ?? record.klien?.kontrak?.calon_klien?.id_user ?? record.klien?.kontrak?.calonKlien?.id_user
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
                  className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                >
                  {config.columns.map((column) => (
                    <td key={column.key} className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {renderCellValue(column, record)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-2 flex-nowrap">
                        {/* Calon Klien: View Legalitas Modal */}
                        {isCalonKlien && onViewLegalitas && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-blue-light-50 hover:bg-blue-light-100 text-blue-light-700 border border-blue-light-200 dark:bg-blue-light-500/15 dark:text-blue-light-400 dark:border-blue-light-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                            onClick={() => onViewLegalitas(record)}
                            title="Lihat nomor legalitas & berkas pendukung"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Legalitas</span>
                          </button>
                        )}

                        {/* View/Print Contract Document (Hanya di Menu Kontrak) */}
                        {isKontrak && onViewContract && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                            onClick={() => onViewContract(record)}
                            title="Buka surat perjanjian kontrak untuk dicetak"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Cetak Kontrak</span>
                          </button>
                        )}

                        {/* Workflow: Lead Conversion */}
                        {canConvertLead && onConvert && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                            onClick={() => onConvert(record)}
                            title="Konversi lead ini menjadi Kontrak dan Klien"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Konversi</span>
                          </button>
                        )}

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
                            <span>Mulai Kerjakan</span>
                          </button>
                        )}

                        {/* Workflow: Approve / Reject Task (Hanya di Menu Reporting) */}
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

                        {/* Keterangan Status di Kolom Aksi saat sudah Disetujui / Dikembalikan (Khusus Menu Reporting) */}
                        {isReporting && isReportApproved && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/60 shadow-2xs whitespace-nowrap">
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Tugas sudah selesai</span>
                          </span>
                        )}
                        {isReporting && isReportRevised && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/60 shadow-2xs whitespace-nowrap">
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>Tugas dikembalikan</span>
                          </span>
                        )}

                        {/* Keterangan Bukan PIC untuk Operator yang tidak memegang pekerjaan ini */}
                        {isPekerjaan && ['operator', 'sales'].includes(user?.role) && !isTaskOperatorOwner && (
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 shadow-2xs whitespace-nowrap"
                            title="Bukan wewenang Anda (Hanya Operator PIC terkait yang berwenang mengedit pekerjaan ini)"
                          >
                            <svg className="size-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Bukan PIC</span>
                          </span>
                        )}

                        {/* Standard CRUD Edit / Detail */}
                        {canEdit && (config.key !== 'calonKlien' || isLeadOwner) && (config.key !== 'pekerjaan' || isTaskOperatorOwner || user?.role === 'karyawan') && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
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
                              <>
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Detail</span>
                              </>
                            ) : (
                              <>
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Edit</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Standard CRUD Delete */}
                        {canDelete && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 dark:bg-gray-800 dark:text-rose-400 dark:border-rose-900/60 dark:hover:bg-rose-500/10 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                            onClick={() => onDelete(record)}
                            title="Hapus data ini"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Hapus</span>
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
  )
}

export default ResourceTable
