import { useState, useMemo, useEffect, useRef } from 'react'
import Badge from './ui/Badge'
import LoadingSpinner from './common/LoadingSpinner'
import DeadlineBadge from './common/DeadlineBadge'
import { isImageFile, ImagePreviewModal } from './ResourceForm'
import ConfirmModal from './ConfirmModal'

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

  // Render Pekerjaan (Judul Pekerjaan & Perusahaan Klien)
  if (column.key === 'id_pekerjaan') {
    const jobTitle = record.pekerjaan?.judul || '-'
    const clientName = record.pekerjaan?.klien?.nama_perusahaan || record.pekerjaan?.nama_perusahaan || record.klien?.nama_perusahaan
    return (
      <div className="flex flex-col py-0.5">
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {jobTitle}
        </span>
        {clientName && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            <svg className="size-3 text-gray-400 dark:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="truncate max-w-[240px]" title={clientName}>{clientName}</span>
          </span>
        )}
      </div>
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

  if (column.key === 'nilai_proyek') {
    if (!value && value !== 0) return <span className="text-gray-400 text-xs italic">-</span>
    return <span className="font-semibold text-gray-900 dark:text-gray-100">Rp {Number(value).toLocaleString('id-ID')}</span>
  }

  if (['no_kontrak', 'kontak_pic', 'email_pic', 'telepon', 'email'].includes(column.key)) {
    if (!value) return <span className="text-gray-400 text-xs italic">-</span>
    return (
      <CopyableText
        text={value}
        displayValue={
          column.key === 'no_kontrak' ? (
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{String(value)}</span>
          ) : (
            String(value)
          )
        }
      />
    )
  }

  return <span className="text-gray-800 dark:text-gray-200">{String(value)}</span>
}

function getExportValue(column, record) {
  const val = record[column.key]

  if (column.key === 'id_klien') {
    return record.klien?.nama_perusahaan || record.nama_perusahaan || val || '-'
  }
  if (column.key === 'id_pic') {
    return record.pic?.nama || record.pic_nama || record.nama_pic || val || '-'
  }
  if (column.key === 'id_layanan') {
    return record.layanan?.nama_layanan || record.nama_layanan || val || '-'
  }
  if (column.key === 'id_pekerjaan') {
    const jobTitle = record.pekerjaan?.judul || record.judul || val || '-'
    const clientName = record.pekerjaan?.klien?.nama_perusahaan || record.pekerjaan?.nama_perusahaan
    return clientName ? `${jobTitle} (${clientName})` : String(jobTitle)
  }
  if (['status', 'status_prospek', 'status_laporan'].includes(column.key)) {
    const statusLabels = {
      baru: 'Baru',
      in_progress: 'Dalam Pengerjaan',
      submitted: 'Diajukan',
      revision_needed: 'Perlu Revisi',
      completed: 'Selesai',
      deal: 'Deal',
      lost: 'Lost / Batal',
      draft: 'Draft',
      review: 'Ditinjau',
      revision: 'Revisi',
      approved: 'Disetujui',
      aktif: 'Aktif',
      nonaktif: 'Nonaktif',
      selesai: 'Selesai',
    }
    return statusLabels[String(val).toLowerCase()] || String(val || '-')
  }
  if (column.key === 'nilai_proyek' || column.key === 'nilai_kontrak') {
    return val ? `Rp ${Number(val).toLocaleString('id-ID')}` : 'Rp 0'
  }
  if (val === null || val === undefined) {
    return '-'
  }
  if (typeof val === 'object') {
    return val.nama || val.nama_perusahaan || val.name || JSON.stringify(val)
  }
  return String(val)
}

function CopyableText({ text, displayValue, className = '' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    if (!text) return
    try {
      navigator.clipboard.writeText(String(text))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <span className={`inline-flex items-center gap-1.5 group/copy ${className}`}>
      <span>{displayValue || text}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover/copy:opacity-100 focus:opacity-100 transition-opacity p-0.5 rounded text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer"
        title={copied ? 'Tersalin ke clipboard!' : 'Salin cepat'}
        aria-label="Salin cepat"
      >
        {copied ? (
          <svg className="size-3.5 text-emerald-600 dark:text-emerald-400 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </span>
  )
}

function ActionIcon({ type, className = 'size-3.5' }) {
  switch (type) {
    case 'pencil':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    case 'eye':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    case 'play':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'check':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'refresh':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    case 'document':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'printer':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      )
    case 'trash':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    case 'convert':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    default:
      return null
  }
}

function resolveRowActions({
  record,
  config,
  user,
  canEdit,
  canDelete,
  onStartTask,
  onApproveTask,
  onRejectTask,
  onConvert,
  onViewLegalitas,
  onViewContract,
  onEdit,
  onDelete,
}) {
  const isLeadOwner = !['operator', 'sales'].includes(user?.role) || Number(record.id_user) === Number(user?.id_user)
  const isCalonKlien = config.key === 'calonKlien'
  const isKontrak = config.key === 'kontrak'
  const isReporting = config.key === 'reporting'
  const isPekerjaan = config.key === 'pekerjaan'

  const operatorPicId =
    record.operator_pic_id ??
    record.calon_klien?.id_user ??
    record.calonKlien?.id_user ??
    record.kontrak?.calon_klien?.id_user ??
    record.kontrak?.calonKlien?.id_user ??
    record.klien?.kontrak?.calon_klien?.id_user ??
    record.klien?.kontrak?.calonKlien?.id_user
  const isTaskOperatorOwner =
    !['operator', 'sales'].includes(user?.role) ||
    (operatorPicId != null && Number(operatorPicId) === Number(user?.id_user))

  const isReportApproved =
    isReporting &&
    (['approved', 'completed'].includes(record.status_laporan) ||
      ['approved', 'completed'].includes(record.pekerjaan?.status))
  const isReportRevised =
    isReporting &&
    (['revision_needed', 'revision'].includes(record.status_laporan) ||
      ['revision_needed', 'revision'].includes(record.pekerjaan?.status))
  const isReportPending = isReporting && !isReportApproved && !isReportRevised

  const canReviewTask = ['admin', 'pimpinan'].includes(user?.role) && isReporting && isReportPending
  const canStartTask =
    isPekerjaan &&
    user?.role === 'karyawan' &&
    record.status === 'baru' &&
    Number(record.id_pic) === Number(user?.id_user)

  const isTaskCompleted = isPekerjaan && ['completed', 'approved'].includes(record.status)
  const isReportCompleted = isReportApproved
  const isReadOnlyRow = isTaskCompleted || isReportCompleted || (isPekerjaan && user?.role === 'karyawan')

  const canEditRow =
    canEdit &&
    (config.key !== 'calonKlien' || isLeadOwner) &&
    (!['pekerjaan', 'kontrak', 'klien'].includes(config.key) || isTaskOperatorOwner || user?.role === 'karyawan')

  // Status badges (indikator status non-interaktif)
  const statusBadge = isReporting && isReportApproved
    ? { type: 'approved', label: '✓ Selesai', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/60' }
    : isReporting && isReportRevised
    ? { type: 'revised', label: '↺ Revisi', className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/60' }
    : (['pekerjaan', 'kontrak', 'klien'].includes(config.key) && ['operator', 'sales'].includes(user?.role) && !isTaskOperatorOwner)
    ? { type: 'not_pic', label: 'Bukan PIC', title: 'Bukan wewenang Anda (Hanya Operator PIC terkait yang berwenang mengedit data ini)' }
    : null

  const allActions = []

  // 1. Workflow: Start Task (Karyawan)
  if (canStartTask && onStartTask) {
    allActions.push({
      key: 'start',
      label: 'Mulai',
      fullLabel: 'Mulai Kerjakan',
      variant: 'primary',
      icon: 'play',
      onClick: () => onStartTask(record),
      title: 'Mulai kerjakan tugas ini (Status berubah menjadi Dalam Pengerjaan)',
    })
  }

  // 2. Workflow: Approve Task (Pimpinan)
  if (canReviewTask && onApproveTask) {
    allActions.push({
      key: 'approve',
      label: 'Setujui',
      fullLabel: 'Setujui Laporan',
      variant: 'success',
      icon: 'check',
      onClick: () => onApproveTask(record),
      title: 'Setujui laporan tugas ini',
    })
  }

  // 3. Workflow: Lead Conversion (Calon Klien -> Kontrak & Klien)
  // Calon klien berstatus 'deal' yang belum memiliki kontrak aktif berhak memiliki tombol Konversi
  const isDealLead = isCalonKlien && String(record.status_prospek || '').toLowerCase() === 'deal'
  const hasActiveContract = Boolean(
    record.kontrak && record.kontrak.status && record.kontrak.status !== 'draft'
  )
  const canConvertLead =
    isDealLead &&
    isLeadOwner &&
    !hasActiveContract &&
    ['admin', 'sales', 'operator', 'pimpinan'].includes(user?.role)

  if (canConvertLead && onConvert) {
    allActions.push({
      key: 'convert',
      label: 'Konversi',
      fullLabel: 'Konversi Jadi Kontrak & Klien',
      variant: 'primary',
      icon: 'convert',
      color: 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10',
      onClick: () => onConvert(record),
      title: 'Konversi calon klien ini menjadi Kontrak dan Klien aktif',
    })
  }

  // 4. Edit / Detail Action
  if (canEditRow) {
    allActions.push({
      key: 'edit',
      label: isReadOnlyRow ? 'Detail' : 'Edit',
      fullLabel: isReadOnlyRow ? 'Lihat Detail Data' : 'Edit Data',
      variant: isReadOnlyRow ? 'neutral-ghost' : 'neutral',
      icon: isReadOnlyRow ? 'eye' : 'pencil',
      onClick: () => onEdit(record),
      title: isTaskCompleted
        ? 'Pekerjaan telah disetujui & selesai (Lihat Detail)'
        : isReportCompleted
        ? 'Laporan telah disetujui (Lihat Detail)'
        : isPekerjaan && user?.role === 'karyawan'
        ? 'Lihat detail instruksi pekerjaan'
        : 'Edit data',
    })
  }

  // 5. Calon Klien: View Legalitas
  if (isCalonKlien && onViewLegalitas) {
    allActions.push({
      key: 'legalitas',
      label: 'Legalitas',
      fullLabel: 'Lihat Legalitas',
      variant: 'info',
      icon: 'document',
      color: 'text-blue-light-700 dark:text-blue-light-400 hover:bg-blue-light-50 dark:hover:bg-blue-light-500/15',
      onClick: () => onViewLegalitas(record),
      title: 'Lihat nomor legalitas & berkas pendukung',
    })
  }

  // 6. Kontrak: Cetak Dokumen
  if (isKontrak && onViewContract) {
    allActions.push({
      key: 'print',
      label: 'Cetak',
      fullLabel: 'Cetak Surat Kontrak',
      variant: 'teal',
      icon: 'printer',
      color: 'text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/15',
      onClick: () => onViewContract(record),
      title: 'Buka surat perjanjian kontrak untuk dicetak',
    })
  }

  // 7. Workflow: Reject Task (Pimpinan)
  if (canReviewTask && onRejectTask) {
    allActions.push({
      key: 'reject',
      label: 'Minta Revisi',
      fullLabel: 'Minta Revisi',
      variant: 'warning-subtle',
      icon: 'refresh',
      color: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10',
      onClick: () => onRejectTask(record),
      title: 'Minta revisi atas laporan tugas ini',
    })
  }

  // 8. Delete action
  if (canDelete) {
    allActions.push({
      key: 'delete',
      label: 'Hapus',
      fullLabel: 'Hapus Data',
      variant: 'danger',
      icon: 'trash',
      color: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-t border-gray-100 dark:border-gray-700/60',
      onClick: () => onDelete(record),
      title: 'Hapus data ini',
    })
  }

  // Logika Pemisahan Tombol Aksi:
  // - Jika total aksi <= 2 (misal Edit & Hapus, atau Konversi & Edit), tampilkan keduanya berdampingan secara langsung.
  // - Jika total aksi > 2:
  //   Jika terdapat aksi Konversi dan aksi Edit, tampilkan keduanya (Konversi & Edit) di luar agar calon klien deal dapat diedit & dikonversi langsung.
  //   Sisa aksi lainnya (Legalitas, Hapus) dimasukkan ke dalam menu dropdown '...'.
  let visibleActions = []
  let secondaryActions = []

  if (allActions.length <= 2) {
    visibleActions = allActions
    secondaryActions = []
  } else {
    const hasConvert = allActions.some((a) => a.key === 'convert')
    const hasEdit = allActions.some((a) => a.key === 'edit')
    if (hasConvert && hasEdit) {
      visibleActions = allActions.filter((a) => a.key === 'convert' || a.key === 'edit')
      secondaryActions = allActions.filter((a) => a.key !== 'convert' && a.key !== 'edit')
    } else {
      visibleActions = [allActions[0]]
      secondaryActions = allActions.slice(1)
    }
  }

  return { visibleActions, secondaryActions, statusBadge }
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

  const isPekerjaan = config.key === 'pekerjaan'
  const isReporting = config.key === 'reporting'
  const hasWorkflowActions = Boolean(
    (config.key === 'calonKlien' && (onViewLegalitas || onConvert)) ||
    (config.key === 'kontrak' && onViewContract) ||
    (isReporting && ['admin', 'pimpinan'].includes(user?.role) && Boolean(onApproveTask || onRejectTask)) ||
    (isPekerjaan && user?.role === 'karyawan' && Boolean(onStartTask))
  )

  const hasActions = Boolean(canEdit || canDelete || hasWorkflowActions)

  // Hak Akses dan Pembatasan Fitur Ekspor Excel / CSV Sesuai Tata Kelola Data
  const isExportAllowed = useMemo(() => {
    // 1. Sembunyikan pada modul master statis dan modul akun/keamanan sensitif
    const disallowedModules = ['layanan', 'masterPekerjaan', 'users']
    if (disallowedModules.includes(config.key)) return false

    // 2. Pembatasan Hak Akses (Role-Based Security):
    // Karyawan hanya boleh mengekspor rekap tugas pekerjaan miliknya dan rekap nilai kinerja
    if (user?.role === 'karyawan') {
      return ['pekerjaan', 'kinerjaKaryawan'].includes(config.key)
    }

    // 3. Admin, Pimpinan, Operator, Sales dapat mengekspor rekap modul operasional dan evaluasi
    return ['calonKlien', 'kontrak', 'klien', 'pekerjaan', 'reporting', 'kinerjaKaryawan'].includes(config.key)
  }, [config.key, user?.role])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [datePreset, setDatePreset] = useState('all') // 'all' | 'today' | 'this_week' | 'this_month'
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [selectedIds, setSelectedIds] = useState([])
  const [previewModal, setPreviewModal] = useState({ open: false, url: '', name: '' })
  const [density, setDensity] = useState(() => {
    try {
      return localStorage.getItem('simkk_table_density') || 'normal'
    } catch {
      return 'normal'
    }
  })

  const handleDensityChange = (newDensity) => {
    setDensity(newDensity)
    try {
      localStorage.setItem('simkk_table_density', newDensity)
    } catch {}
  }

  const handlePreviewImage = (url, name) => {
    setPreviewModal({ open: true, url, name })
  }

  // Teks petunjuk (placeholder) pencarian khusus per modul agar ringkas, rapi, dan tepat sasaran
  const searchPlaceholder = useMemo(() => {
    switch (config.key) {
      case 'kontrak':
        return 'Cari data kontrak...'
      case 'users':
        return 'Cari pengguna...'
      case 'pekerjaan':
        return 'Cari tugas / pekerjaan...'
      case 'reporting':
        return 'Cari laporan tugas...'
      case 'layanan':
        return 'Cari layanan...'
      case 'masterPekerjaan':
        return 'Cari template pekerjaan...'
      case 'kinerjaKaryawan':
        return 'Cari evaluasi kinerja...'
      case 'calonKlien':
        return 'Cari calon klien...'
      case 'klien':
        return 'Cari klien...'
      default:
        return `Cari ${config.label.toLowerCase()}...`
    }
  }, [config.key, config.label])

  // Reset filter, paginasi, sortir, dan seleksi massal saat modul berganti
  useEffect(() => {
    setStatusFilter('all')
    setDatePreset('all')
    setIsMobileFilterDrawerOpen(false)
    setIsPageSizeOpen(false)
    setShowExportConfirm(false)
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
        { key: 'pimpinan', label: 'Pimpinan (Admin Utama)', matches: ['pimpinan', 'admin'] },
        { key: 'operator', label: 'Operator', matches: ['operator', 'sales'] },
        { key: 'karyawan', label: 'Karyawan', matches: ['karyawan'] },
      ]
      return [
        { key: 'all', label: 'Semua Role', count: records.length },
        ...roles.map((r) => ({
          key: r.key,
          label: r.label,
          count: records.filter((u) => r.matches.includes(String(u.role || '').toLowerCase())).length,
        })),
      ]
    }

    return []
  }, [records, config.key])

  // Filter Data Berdasarkan Pencarian, Status / Kategori Dropdown & Preset Tanggal
  const filteredRecords = useMemo(() => {
    let result = records || []

    // 1. Filter Preset Tanggal Cepat ([Semua], [Hari Ini], [Minggu Ini], [Bulan Ini])
    if (datePreset !== 'all') {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const currentYearMonth = todayStr.substring(0, 7) // 'YYYY-MM'

      result = result.filter((rec) => {
        const rawDate = rec.tgl_penugasan || rec.tgl_mulai || rec.tgl_lapor || rec.created_at || rec.tanggal || rec.deadline || rec.tgl_selesai
        if (!rawDate) return true // Jika data tidak memiliki informasi tanggal, pertahankan
        const dateStr = String(rawDate).split('T')[0]

        if (datePreset === 'today') {
          return dateStr === todayStr
        }
        if (datePreset === 'this_week') {
          return dateStr >= sevenDaysAgo && dateStr <= todayStr
        }
        if (datePreset === 'this_month') {
          return dateStr.startsWith(currentYearMonth)
        }
        return true
      })
    }

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
        const roleMap = {
          pimpinan: ['pimpinan', 'admin'],
          operator: ['operator', 'sales'],
          karyawan: ['karyawan'],
        }
        const validRoles = roleMap[statusFilter] || [statusFilter]
        result = result.filter((rec) => validRoles.includes(String(rec.role || '').toLowerCase()))
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
  }, [records, statusFilter, datePreset, searchQuery, config])

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

  // Fitur Ekspor Cepat ke Excel / CSV dengan Konfirmasi
  const [showExportConfirm, setShowExportConfirm] = useState(false)

  const handleOpenExportConfirm = () => {
    if (!isExportAllowed || !filteredRecords || !filteredRecords.length) return
    setShowExportConfirm(true)
  }

  const handleExecuteExportCsv = () => {
    setShowExportConfirm(false)
    if (!isExportAllowed || !filteredRecords || !filteredRecords.length) return

    const exportCols = config.columns.filter(
      (c) => !['lampiran_instruksi', 'file_tugas', 'foto', 'avatar'].includes(c.key)
    )

    const headers = exportCols.map((c) => `"${(c.label || c.key).replace(/"/g, '""')}"`)

    const rows = filteredRecords.map((record) => {
      return exportCols
        .map((col) => {
          const val = getExportValue(col, record)
          const cleanVal = String(val).replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, ' ')
          return `"${cleanVal}"`
        })
        .join(';')
    })

    const csvContent = '\uFEFFsep=;\r\n' + headers.join(';') + '\r\n' + rows.join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10)
    const cleanLabel = (config.label || 'Data').replace(/[^a-zA-Z0-9]/g, '_')
    link.setAttribute('href', url)
    link.setAttribute('download', `Rekap_${cleanLabel}_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Logika Menu Dropdown Tiga Titik (...) Aksi Tabel
  const [activeDropdownId, setActiveDropdownId] = useState(null)
  const actionMenuRef = useRef(null)
  const searchInputRef = useRef(null)

  // Menu Dropdown Pilihan Jumlah Baris Paginasi (Tampilkan: 10, 25, 50, 100, Semua)
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false)
  const pageSizeMenuRef = useRef(null)

  // Pintasan Keyboard Laptop/Desktop: '/' untuk fokus kotak cari, 'Escape' untuk tutup menu/filter/batal cari
  useEffect(() => {
    function handleKeyDown(e) {
      // Jika pengguna menekan '/', fokuskan ke search input jika sedang tidak mengetik di form/input lain
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) &&
        !document.activeElement?.isContentEditable
      ) {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
        }
        return
      }

      // Jika menekan Escape, tutup dropdown aktif, filter drawer, atau menu ukuran baris
      if (e.key === 'Escape') {
        if (activeDropdownId) {
          setActiveDropdownId(null)
          return
        }
        if (isPageSizeOpen) {
          setIsPageSizeOpen(false)
          return
        }
        if (isMobileFilterDrawerOpen) {
          setIsMobileFilterDrawerOpen(false)
          return
        }
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDropdownId, isMobileFilterDrawerOpen, isPageSizeOpen])

  useEffect(() => {
    function handlePointerDown(e) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActiveDropdownId(null)
      }
      if (pageSizeMenuRef.current && !pageSizeMenuRef.current.contains(e.target)) {
        setIsPageSizeOpen(false)
      }
    }
    if (activeDropdownId !== null || isPageSizeOpen) {
      document.addEventListener('pointerdown', handlePointerDown)
      return () => document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [activeDropdownId, isPageSizeOpen])

  useEffect(() => {
    setActiveDropdownId(null)
    setIsPageSizeOpen(false)
  }, [currentPage, pageSize, statusFilter, searchQuery])

  if (loading && (!records || records.length === 0)) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Skeleton Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="h-9 w-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-9 w-36 rounded-xl bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>

        {/* Skeleton Desktop Table */}
        <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            <thead className="bg-gray-50/95 dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700">
              <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {canDelete && (
                  <th className="py-3.5 px-3 w-10 text-center">
                    <div className="size-4 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
                  </th>
                )}
                {config.columns.map((col, idx) => (
                  <th key={idx} className="py-3.5 px-4 text-xs">
                    <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  </th>
                ))}
                {hasActions && (
                  <th className="py-3.5 px-4 text-xs text-center min-w-[120px]">
                    <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                  {canDelete && (
                    <td className="py-3.5 px-3 text-center">
                      <div className="size-4 rounded bg-gray-200 dark:bg-gray-800 mx-auto" />
                    </td>
                  )}
                  {config.columns.map((col, cIdx) => (
                    <td key={cIdx} className="py-3.5 px-4">
                      <div
                        className="h-4 rounded-md bg-gray-200 dark:bg-gray-800"
                        style={{ width: `${50 + ((idx + cIdx) % 4) * 15}%` }}
                      />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-7 w-20 rounded-lg bg-gray-200 dark:bg-gray-800 mx-auto" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Skeleton Mobile Cards */}
        <div className="md:hidden space-y-3 animate-pulse">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs space-y-3">
              <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <div className="h-2.5 w-14 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="space-y-1">
                  <div className="h-2.5 w-14 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <div className="h-8 w-16 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="h-8 w-16 rounded-xl bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
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

  return (
    <div className="space-y-4">
      {/* 1. Mobile Toolbar (1-Baris Ramping di Layar Ponsel < sm) */}
      <div className="flex sm:hidden items-center gap-2">
        <div className="relative flex-1">
          <svg className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:border-brand-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold p-0.5 rounded-full cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileFilterDrawerOpen(true)}
          className={`relative inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 ${
            statusFilter !== 'all' || datePreset !== 'all'
              ? 'bg-brand-500 text-white border-brand-500 shadow-brand-500/20'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
          }`}
          title="Buka Filter Data"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filter</span>
          {(statusFilter !== 'all' || datePreset !== 'all') && (
            <span className="size-2 rounded-full bg-white dark:bg-brand-200 animate-pulse" />
          )}
        </button>

        {/* Tombol Ekspor Excel Cepat (Mobile) */}
        {isExportAllowed && (
          <button
            type="button"
            onClick={handleOpenExportConfirm}
            disabled={!filteredRecords.length}
            className="inline-flex items-center justify-center size-9 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
            title={`Unduh ${filteredRecords.length} rekap data ${config.label} ke Excel (.csv)`}
            aria-label="Ekspor Excel"
          >
            <svg className="size-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* 2. Desktop Toolbar (Layar sm ke atas) */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Kolom Pencarian Cepat */}
          <div className="relative flex-1 max-w-xs">
            <svg className="size-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={searchPlaceholder}
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
                title="Hapus pencarian (atau tekan tombol Esc)"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown Filter Rentang Waktu (Desktop / Laptop) */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-2xs cursor-pointer appearance-none"
              title="Filter Berdasarkan Rentang Waktu"
            >
              <option value="all" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Semua Waktu</option>
              <option value="today" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Hari Ini</option>
              <option value="this_week" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Minggu Ini</option>
              <option value="this_month" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Bulan Ini</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dropdown Filter Kategori / Status & Pengatur Kepadatan Baris Tabel */}
        <div className="flex flex-wrap items-center gap-2">
          {statusFilterOptions.length > 0 && (
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
                  <option key={opt.key} value={opt.key} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
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
          )}


          {/* Tombol Ekspor Rekap Data Cepat ke Excel / CSV */}
          {isExportAllowed && (
            <button
              type="button"
              onClick={handleOpenExportConfirm}
              disabled={!filteredRecords.length}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title={`Unduh ${filteredRecords.length} data rekap ${config.label} ke file Excel (.csv)`}
            >
              <svg className="size-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Ekspor Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Mobile Bottom Sheet Filter Drawer (Muncul dari Bawah di Layar Ponsel) */}
      {isMobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-99999 flex items-end justify-center sm:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterDrawerOpen(false)}
          />
          <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-gray-900 p-5 shadow-2xl border-t border-gray-200 dark:border-gray-800 z-10 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Filter Data {config.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterDrawerOpen(false)}
                className="size-8 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter Rentang Tanggal Preset */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Rentang Waktu
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'Semua Waktu' },
                  { id: 'today', label: 'Hari Ini' },
                  { id: 'this_week', label: 'Minggu Ini' },
                  { id: 'this_month', label: 'Bulan Ini' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setDatePreset(chip.id)
                      setCurrentPage(1)
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      datePreset === chip.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 ring-1 ring-brand-500/20'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Status / Kategori */}
            {statusFilterOptions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Status &amp; Kategori
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {statusFilterOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.key)
                        setCurrentPage(1)
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        statusFilter === opt.key
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 ring-1 ring-brand-500/20'
                          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="text-[11px] opacity-75">({opt.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tombol Ekspor Rekap Data di Mobile Drawer */}
            {isExportAllowed && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileFilterDrawerOpen(false)
                    handleOpenExportConfirm()
                  }}
                  disabled={!filteredRecords.length}
                  className="w-full py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-40"
                >
                  <svg className="size-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Unduh Rekap Data ({filteredRecords.length} data ke Excel)</span>
                </button>
              </div>
            )}

            {/* Actions Footer */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all')
                  setDatePreset('all')
                  setCurrentPage(1)
                  setIsMobileFilterDrawerOpen(false)
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center cursor-pointer"
              >
                Reset Filter
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold text-center shadow-xs cursor-pointer"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State jika hasil pencarian / filter tidak ditemukan */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 sm:p-12 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center gap-2">
            {/* Ilustrasi Grafis Bernuansa Oranye (Warm Orange Empty State Illustration) */}
            <div className="relative mb-2 flex items-center justify-center">
              <div className="absolute size-24 rounded-full bg-brand-500/15 dark:bg-brand-500/20 blur-xl pointer-events-none" />
              <svg className="relative w-36 h-28" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Bayangan Dasar (Ground Shadow) */}
                <ellipse cx="80" cy="108" rx="54" ry="6" className="fill-gray-200/70 dark:fill-gray-800/80" />
                
                {/* Kartu Lembar Dokumen (Base Document Sheet) */}
                <rect x="36" y="24" width="60" height="74" rx="12" className="fill-white dark:fill-gray-800 stroke-gray-200 dark:stroke-gray-700" strokeWidth="2" />
                
                {/* Lipatan Sudut Kertas Dokumen */}
                <path d="M82 24 L96 38 L82 38 Z" className="fill-brand-100 dark:fill-brand-950/70 stroke-gray-200 dark:stroke-gray-700" strokeWidth="1.5" />
                
                {/* Garis-Garis Dokumen Simbolik */}
                <rect x="46" y="44" width="32" height="4" rx="2" className="fill-gray-200 dark:fill-gray-700" />
                <rect x="46" y="54" width="40" height="4" rx="2" className="fill-gray-200 dark:fill-gray-700" />
                <rect x="46" y="64" width="26" height="4" rx="2" className="fill-gray-200 dark:fill-gray-700" />
                <rect x="46" y="74" width="18" height="4" rx="2" className="fill-brand-400/60 dark:fill-brand-500/50" />

                {/* Kaca Pembesar Oranye Bernuansa Modern (Stylized Orange Magnifying Glass) */}
                <g transform="translate(62, 34)">
                  <circle cx="32" cy="32" r="25" fill="url(#orangeGlassGrad)" fillOpacity="0.8" />
                  <circle cx="32" cy="32" r="25" stroke="url(#orangeBorderGrad)" strokeWidth="3.5" />
                  <path d="M20 21 A 17 17 0 0 1 42 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.85" />
                  <circle cx="32" cy="32" r="13" className="stroke-brand-300 dark:stroke-brand-400" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                  <circle cx="32" cy="32" r="4.5" fill="#f97316" />
                  {/* Gagang Kaca Pembesar */}
                  <path d="M50 50 L66 66" stroke="#ea580c" strokeWidth="5.5" strokeLinecap="round" />
                  <path d="M50 50 L66 66" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" />
                </g>

                {/* Elemen Partikel & Kilau Oranye (Warm Orange Sparkles) */}
                <circle cx="26" cy="40" r="3" fill="#f97316" />
                <circle cx="134" cy="48" r="2.5" fill="#fb923c" />
                <circle cx="126" cy="82" r="3" fill="#fdba74" />
                
                <path d="M128 26 L130 32 L136 34 L130 36 L128 42 L126 36 L120 34 L126 32 Z" fill="#f97316" opacity="0.9" />
                <path d="M28 78 L29.5 82 L33.5 83.5 L29.5 85 L28 89 L26.5 85 L22.5 83.5 L26.5 82 Z" fill="#fb923c" opacity="0.8" />

                {/* Definisi Gradien Warna Oranye Khas SIM-KK */}
                <defs>
                  <linearGradient id="orangeGlassGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffedd5" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#fed7aa" stopOpacity="0.45" />
                  </linearGradient>
                  <linearGradient id="orangeBorderGrad" x1="8" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fb923c" />
                    <stop offset="1" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
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

          {/* 1. Tampilan Desktop Table (Layar md ke atas) dengan Sticky Header & Sticky Kolom */}
          <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto min-h-[260px] max-h-[70vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                <thead className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs border-b border-gray-200 dark:border-gray-700 shadow-2xs">
                  <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {canDelete && (
                      <th className={`sticky left-0 z-30 bg-gray-50/95 dark:bg-gray-800/95 ${density === 'compact' ? 'py-2 px-2.5 w-9' : 'py-3.5 px-3 w-10'} text-center shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]`}>
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
                    {config.columns.map((column, colIdx) => {
                      const isSorted = sortConfig.key === column.key
                      const isFirstCol = colIdx === 0
                      const stickyLeftClass = isFirstCol
                        ? (canDelete
                            ? 'sticky left-10 z-30 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]'
                            : 'sticky left-0 z-30 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]')
                        : ''
                      return (
                        <th
                          key={column.key}
                          onClick={() => handleSort(column.key)}
                          className={`${density === 'compact' ? 'py-2 px-3 text-xs' : 'py-3.5 px-4 text-xs'} ${stickyLeftClass} cursor-pointer select-none group transition-all duration-150 ${
                            isSorted
                              ? 'bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold'
                              : 'hover:bg-brand-50/60 dark:hover:bg-brand-950/30 hover:text-brand-600 dark:hover:text-brand-400 bg-gray-50/95 dark:bg-gray-800/95'
                          }`}
                          title={`Urutkan berdasarkan ${column.label}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{column.label}</span>
                            <span className="flex items-center shrink-0">
                              {isSorted ? (
                                <span className="text-brand-600 dark:text-brand-400 font-extrabold text-xs">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              ) : (
                                <span className="text-gray-400/50 group-hover:text-brand-500 font-bold text-xs transition-colors">
                                  ↕
                                </span>
                              )}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                    {hasActions && (
                      <th className={`sticky right-0 z-30 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.06)] border-l border-gray-200/70 dark:border-gray-700/70 ${density === 'compact' ? 'py-2 px-3 text-xs' : 'py-3.5 px-4 text-xs'} text-center whitespace-nowrap min-w-[120px]`}>
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    Array.from({ length: Math.min(pageSize, 5) }).map((_, sIdx) => (
                      <tr key={`skeleton-${sIdx}`} className="animate-pulse border-b border-gray-100 dark:border-gray-800">
                        {canDelete && (
                          <td className="py-3 px-3 text-center">
                            <div className="size-4 rounded bg-gray-200 dark:bg-gray-800 mx-auto" />
                          </td>
                        )}
                        {config.columns.map((col, cIdx) => (
                          <td key={`skeleton-col-${cIdx}`} className="py-3 px-4">
                            <div
                              className="h-3.5 rounded bg-gray-200 dark:bg-gray-800"
                              style={{ width: `${50 + ((sIdx + cIdx) % 3) * 20}%` }}
                            />
                          </td>
                        ))}
                        {hasActions && (
                          <td className="py-3 px-4 text-center">
                            <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800 mx-auto" />
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    paginatedRecords.map((record, rowIndex) => {
                    const rowKey = record[config.primaryKey]
                    const rowDesktopDropdownId = `desktop-${rowKey}`
                    const { visibleActions, secondaryActions, statusBadge } = resolveRowActions({
                      record,
                      config,
                      user,
                      canEdit,
                      canDelete,
                      onStartTask,
                      onApproveTask,
                      onRejectTask,
                      onConvert,
                      onViewLegalitas,
                      onViewContract,
                      onEdit,
                      onDelete,
                    })

                    return (
                      <tr
                        key={rowKey}
                        className={`group/row transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40 ${
                          activeDropdownId === rowDesktopDropdownId ? 'relative z-50' : ''
                        } ${
                          selectedIds.includes(rowKey)
                            ? 'bg-brand-50/50 dark:bg-brand-500/15'
                            : ''
                        }`}
                      >
                        {canDelete && (
                          <td
                            className={`sticky left-0 z-10 ${
                              selectedIds.includes(rowKey)
                                ? 'bg-brand-50/95 dark:bg-brand-900/50'
                                : 'bg-white/95 dark:bg-gray-900/95 group-hover/row:bg-gray-50 dark:group-hover/row:bg-gray-800'
                            } backdrop-blur-xs shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] ${density === 'compact' ? 'py-2 px-2.5 w-9' : 'py-3.5 px-3 w-10'} text-center align-middle`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(rowKey)}
                              onChange={() => handleToggleRow(rowKey)}
                              className="size-4 rounded-md border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            />
                          </td>
                        )}
                        {config.columns.map((column, colIdx) => {
                          const isFirstCol = colIdx === 0
                          const stickyLeftClass = isFirstCol
                            ? (canDelete
                                ? `sticky left-10 z-10 ${
                                    selectedIds.includes(rowKey)
                                      ? 'bg-brand-50/95 dark:bg-brand-900/50'
                                      : 'bg-white/95 dark:bg-gray-900/95 group-hover/row:bg-gray-50 dark:group-hover/row:bg-gray-800'
                                  } backdrop-blur-xs shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]`
                                : `sticky left-0 z-10 ${
                                    selectedIds.includes(rowKey)
                                      ? 'bg-brand-50/95 dark:bg-brand-900/50'
                                      : 'bg-white/95 dark:bg-gray-900/95 group-hover/row:bg-gray-50 dark:group-hover/row:bg-gray-800'
                                  } backdrop-blur-xs shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]`)
                            : ''
                          return (
                            <td key={column.key} className={`${density === 'compact' ? 'py-2 px-3 text-xs' : 'py-3.5 px-4 text-sm'} ${stickyLeftClass} align-middle whitespace-nowrap`}>
                              {renderCellValue(column, record, handlePreviewImage)}
                            </td>
                          )
                        })}
                        {hasActions && (
                          <td
                            className={`sticky right-0 ${
                              activeDropdownId === rowDesktopDropdownId ? 'z-50' : 'z-10'
                            } ${
                              selectedIds.includes(rowKey)
                                ? 'bg-brand-50/95 dark:bg-brand-900/50'
                                : 'bg-white/95 dark:bg-gray-900/95 group-hover/row:bg-gray-50 dark:group-hover/row:bg-gray-800'
                            } backdrop-blur-xs shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.06)] border-l border-gray-100/80 dark:border-gray-800/80 ${density === 'compact' ? 'py-1.5 px-3' : 'py-3.5 px-4'} align-middle text-center whitespace-nowrap`}
                          >
                            <div className="inline-flex items-center justify-center gap-1.5 flex-nowrap">
                              {/* Indikator Status Khusus */}
                              {statusBadge && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border shadow-2xs whitespace-nowrap ${
                                    statusBadge.className || 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                  }`}
                                  title={statusBadge.title}
                                >
                                  {statusBadge.label}
                                </span>
                              )}

                              {/* Tombol Aksi Langsung - Hanya Logo/Ikon Saja (Bersampingan jika <= 2 aksi) */}
                              {visibleActions.map((act) => (
                                <button
                                  key={act.key}
                                  type="button"
                                  onClick={act.onClick}
                                  className={`inline-flex items-center justify-center size-8 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 ${
                                    act.variant === 'primary'
                                      ? 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white'
                                      : act.variant === 'success'
                                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                                      : act.variant === 'danger'
                                      ? 'bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 dark:bg-gray-800 dark:text-rose-400 dark:border-rose-900/60 dark:hover:bg-rose-500/10'
                                      : act.variant === 'info'
                                      ? 'bg-blue-light-50 hover:bg-blue-light-100 text-blue-light-700 border border-blue-light-200 dark:bg-blue-light-500/15 dark:text-blue-light-400 dark:border-blue-light-800/60'
                                      : act.variant === 'teal'
                                      ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-800/60'
                                      : act.variant === 'neutral-ghost'
                                      ? 'bg-gray-50 hover:bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                      : act.variant === 'warning-subtle'
                                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-800/60'
                                      : 'bg-white hover:bg-brand-50 text-gray-700 hover:text-brand-600 border border-gray-300 hover:border-brand-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 dark:hover:border-brand-500/40'
                                  }`}
                                  title={act.fullLabel || act.label || act.title}
                                  aria-label={act.fullLabel || act.label}
                                >
                                  <ActionIcon type={act.icon} className="size-4" />
                                </button>
                              ))}

                              {/* Dropdown Menu Tiga Titik (...) untuk Aksi Pendukung jika ada lebih dari 2 aksi */}
                              {secondaryActions.length > 0 && (
                                <div
                                  className="relative inline-block text-left"
                                  ref={activeDropdownId === rowDesktopDropdownId ? actionMenuRef : null}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setActiveDropdownId(activeDropdownId === rowDesktopDropdownId ? null : rowDesktopDropdownId)
                                    }}
                                    className={`inline-flex items-center justify-center size-8 rounded-lg border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                                      activeDropdownId === rowDesktopDropdownId
                                        ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 dark:border-brand-500'
                                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                                    title="Aksi Lainnya"
                                    aria-label="Aksi Lainnya"
                                  >
                                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                  </button>

                                  {activeDropdownId === rowDesktopDropdownId && (
                                    <div
                                      className={`absolute right-0 ${
                                        rowIndex >= paginatedRecords.length - 2 && paginatedRecords.length > 2
                                          ? 'bottom-full mb-1.5'
                                          : 'top-full mt-1.5'
                                      } w-48 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl z-50 py-1.5 animate-fade-in divide-y divide-gray-100 dark:divide-gray-700/60`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {secondaryActions.map((act) => (
                                        <button
                                          key={act.key}
                                          type="button"
                                          onClick={() => {
                                            act.onClick()
                                            setActiveDropdownId(null)
                                          }}
                                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-left transition-colors cursor-pointer ${
                                            act.color || 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750'
                                          }`}
                                          title={act.title}
                                        >
                                          <ActionIcon type={act.icon} className="size-4 shrink-0" />
                                          <span className="truncate">{act.fullLabel || act.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  }))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Tampilan Mobile Card List (Format Kartu Vertikal Ringkas di Layar < md Ponsel) */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, sIdx) => (
                <div key={`mob-skeleton-${sIdx}`} className="animate-pulse rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                  </div>
                  <div className="h-8 w-28 rounded bg-gray-200 dark:bg-gray-800 ml-auto" />
                </div>
              ))
            ) : (
              paginatedRecords.map((record) => {
                const rowKey = record[config.primaryKey]
                const rowMobileDropdownId = `mobile-${rowKey}`
                const statusCol = config.columns.find((c) => ['status', 'status_prospek', 'is_active', 'status_laporan'].includes(c.key))
                const { visibleActions, secondaryActions, statusBadge } = resolveRowActions({
                  record,
                  config,
                  user,
                  canEdit,
                  canDelete,
                  onStartTask,
                  onApproveTask,
                  onRejectTask,
                  onConvert,
                  onViewLegalitas,
                  onViewContract,
                  onEdit,
                  onDelete,
                })

                return (
                  <div
                    key={rowKey}
                    onClick={() => {
                      if (onEdit) onEdit(record)
                    }}
                    className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs space-y-3 cursor-pointer transition-all active:scale-[0.99] hover:border-brand-400 dark:hover:border-brand-700/60 hover:shadow-sm ${
                      activeDropdownId === rowMobileDropdownId ? 'relative z-30' : ''
                    }`}
                  >
                    {/* Card Header: Judul / Nama Utama + Status Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {canDelete && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(rowKey)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => handleToggleRow(rowKey)}
                            className="mt-0.5 size-4 rounded-md border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {record[config.displayField] || record.nama_perusahaan || record.judul || record.nama || `Data #${rowKey}`}
                          </h4>
                        </div>
                      </div>
                      {statusCol && (
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {renderCellValue(statusCol, record, handlePreviewImage)}
                        </div>
                      )}
                    </div>

                    {/* Card Body: Rincian Data Penting (2-Kolom Ringkas) */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs items-start">
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

                    {/* Bilah Progres Visual (Mini Progress Bar) Khusus Modul Pekerjaan */}
                    {config.key === 'pekerjaan' && (() => {
                      const statusVal = String(record.status || '').toLowerCase()
                      const progressMap = {
                        baru: { percent: 10, label: '0%', text: 'Belum Dimulai', color: 'bg-gray-300 dark:bg-gray-700' },
                        in_progress: { percent: 50, label: '50%', text: 'Sedang Dikerjakan', color: 'bg-brand-500' },
                        submitted: { percent: 85, label: '85%', text: 'Menunggu Review', color: 'bg-amber-500' },
                        revision_needed: { percent: 35, label: '35%', text: 'Perlu Revisi', color: 'bg-rose-500' },
                        completed: { percent: 100, label: '100%', text: 'Selesai', color: 'bg-emerald-500' },
                      }
                      const prog = progressMap[statusVal] || { percent: 10, label: '0%', text: statusVal || 'Baru', color: 'bg-brand-500' }
                      return (
                        <div className="pt-2 pb-0.5 space-y-1.5 border-t border-gray-100 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">Progres Tugas:</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{prog.text}</span>
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">{prog.label}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${prog.color} transition-all duration-300`}
                              style={{ width: `${prog.percent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })()}

                    {/* Card Footer: Tombol Aksi Langsung + Menu Tiga Titik (...) Aksi Lainnya */}
                    {hasActions && (
                      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-100 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                        <div className="min-w-0 flex-1">
                          {statusBadge && (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
                                statusBadge.className || 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                              }`}
                              title={statusBadge.title}
                            >
                              {statusBadge.label}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                          {/* Tombol Aksi Langsung pada Kartu Mobile - Disertai Teks Singkat Ramah Sentuhan */}
                          {visibleActions.map((act) => (
                            <button
                              key={act.key}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                act.onClick()
                              }}
                              className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl shadow-2xs text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 ${
                                act.variant === 'primary'
                                  ? 'bg-brand-600 active:bg-brand-700 text-white'
                                  : act.variant === 'success'
                                  ? 'bg-emerald-600 active:bg-emerald-700 text-white'
                                  : act.variant === 'danger'
                                  ? 'bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 dark:bg-gray-800 dark:text-rose-400 dark:border-rose-900/60'
                                  : act.variant === 'info'
                                  ? 'bg-blue-light-50 text-blue-light-700 border border-blue-light-200 dark:bg-blue-light-500/15 dark:text-blue-light-400 dark:border-blue-light-800/60'
                                  : act.variant === 'teal'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-800/60'
                                  : act.variant === 'warning-subtle'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-800/60'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-750'
                              }`}
                              title={act.fullLabel || act.label || act.title}
                              aria-label={act.fullLabel || act.label}
                            >
                              <ActionIcon type={act.icon} className="size-3.5 shrink-0" />
                              <span>{act.label}</span>
                            </button>
                          ))}

                        {secondaryActions.length > 0 && (
                          <div
                            className="relative"
                            ref={activeDropdownId === rowMobileDropdownId ? actionMenuRef : null}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveDropdownId(activeDropdownId === rowMobileDropdownId ? null : rowMobileDropdownId)
                              }}
                              className={`inline-flex items-center justify-center size-10 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                                activeDropdownId === rowMobileDropdownId
                                  ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 dark:border-brand-500'
                                  : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                              }`}
                              title="Aksi Lainnya"
                              aria-label="Aksi Lainnya"
                            >
                              <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>

                            {activeDropdownId === rowMobileDropdownId && (
                              <div
                                className="absolute right-0 bottom-full mb-1.5 w-48 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-50 py-1 animate-fade-in divide-y divide-gray-100 dark:divide-gray-700/60"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {secondaryActions.map((act) => (
                                  <button
                                    key={act.key}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      act.onClick()
                                      setActiveDropdownId(null)
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-left transition-colors cursor-pointer ${
                                      act.color || 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                                    title={act.title}
                                  >
                                    <ActionIcon type={act.icon} className="size-3.5 shrink-0" />
                                    <span className="truncate">{act.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            }))}
          </div>

          {/* 3. Kontrol Paginasi (Berlaku untuk Desktop & Mobile) */}
          {totalRecords > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-3 sm:pb-0 px-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
              <div className="text-gray-600 dark:text-gray-300">
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

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                {/* Pemilih Jumlah Baris (Tampilkan: 10, 25, 50, 100, Semua) dengan Font Selaras di Semua Layar Mobile */}
                <div className="relative" ref={pageSizeMenuRef}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">Tampilkan:</span>
                    <button
                      type="button"
                      onClick={() => setIsPageSizeOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] sm:text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-2xs cursor-pointer focus:outline-hidden focus:border-brand-500"
                      aria-label="Pilih jumlah baris data yang ditampilkan"
                      aria-expanded={isPageSizeOpen}
                      aria-haspopup="listbox"
                    >
                      <span>{isViewAll ? `Semua (${totalRecords})` : `${pageSize} baris`}</span>
                      <svg className={`size-3 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isPageSizeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Dropdown Menu Ukuran Baris (Membuka ke Atas agar Selaras & Tidak Terpotong Navigasi Ponsel Bawah) */}
                  {isPageSizeOpen && (
                    <div
                      role="listbox"
                      className="absolute bottom-full mb-1.5 left-0 sm:left-auto sm:right-0 w-36 sm:w-40 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-850 p-1 shadow-xl z-50 animate-fade-in text-gray-800 dark:text-gray-200"
                    >
                      {[
                        { value: 10, label: '10 baris' },
                        { value: 25, label: '25 baris' },
                        { value: 50, label: '50 baris' },
                        { value: 100, label: '100 baris' },
                        { value: 'all', label: `Semua (${totalRecords})` },
                      ].map((opt) => {
                        const isSelected = (opt.value === 'all' && isViewAll) || (!isViewAll && pageSize === opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setPageSize(opt.value === 'all' ? 1000000 : Number(opt.value))
                              setCurrentPage(1)
                              setIsPageSizeOpen(false)
                            }}
                            className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer text-left ${
                              isSelected
                                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 font-bold'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && (
                              <svg className="size-3 text-brand-600 dark:text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Mobile Simple Thumb-Friendly Pagination (sm:hidden) */}
                <div className="flex sm:hidden items-center gap-1.5">
                  <button
                    type="button"
                    disabled={validCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center justify-center size-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs font-bold text-base active:scale-95"
                    title="Halaman sebelumnya"
                  >
                    ‹
                  </button>
                  <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 font-semibold text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap">
                    {validCurrentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={validCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center justify-center size-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs font-bold text-base active:scale-95"
                    title="Halaman berikutnya"
                  >
                    ›
                  </button>
                </div>

                {/* Desktop Full Numbered Pagination (hidden sm:flex) */}
                <div className="hidden sm:flex items-center gap-1.5">
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

      {/* Modal Konfirmasi Ekspor Data ke Excel */}
      <ConfirmModal
        open={showExportConfirm}
        title="Konfirmasi Ekspor Data ke Excel"
        message={`Apakah Anda yakin ingin mengunduh ${filteredRecords.length} data rekap ${config.label} ke dalam file spreadsheet Excel (.csv)?`}
        confirmText="Ya, Unduh File Excel"
        cancelText="Batal"
        type="info"
        onConfirm={handleExecuteExportCsv}
        onClose={() => setShowExportConfirm(false)}
      />
    </div>
  )
}

export default ResourceTable
