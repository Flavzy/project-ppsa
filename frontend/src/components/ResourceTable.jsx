import Badge from './ui/Badge'
import LoadingSpinner from './common/LoadingSpinner'

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

  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">-</span>
  }

  // Render Klien (Klien Penyewa Jasa)
  if (column.key === 'id_klien') {
    const clientName = record.klien?.nama_perusahaan
    return (
      <div className="flex flex-col">
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {clientName || `Klien #${value}`}
        </span>
        {clientName && (
          <span className="text-xs text-gray-400">ID: {value}</span>
        )}
      </div>
    )
  }

  // Render PIC (Penanggung Jawab Karyawan)
  if (column.key === 'id_pic') {
    const picName = record.pic?.nama
    return (
      <Badge size="sm" color="info">
        <span className="mr-1">👤</span> {picName || `Karyawan #${value}`}
      </Badge>
    )
  }

  // Render Pekerjaan (Judul Pekerjaan)
  if (column.key === 'id_pekerjaan') {
    const jobTitle = record.pekerjaan?.judul
    return (
      <div className="flex flex-col">
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {jobTitle || `Pekerjaan #${value}`}
        </span>
        {jobTitle && (
          <span className="text-xs text-gray-400">ID Tugas: {value}</span>
        )}
      </div>
    )
  }

  // Render Dokumen Bukti (Download / View link)
  if (column.key === 'dokumen_bukti') {
    const fileUrl = record.dokumen_bukti_url || (value ? (value.startsWith('http') ? value : `/storage/${value}`) : null)
    if (!fileUrl) {
      return <span className="text-gray-400 text-xs italic">-</span>
    }
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 text-xs font-semibold transition-colors"
      >
        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <span>Lihat Berkas</span>
      </a>
    )
  }

  // Render stylized status badges
  if (['status', 'status_prospek', 'review_status', 'prioritas'].includes(column.key)) {
    if (column.key === 'status_prospek' && value === 'deal') {
      return (
        <Badge size="sm" color="success">
          ✓ Deal (Klien Aktif)
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

  // Render score highlights
  if (['final_score', 'speed_score', 'quality_score'].includes(column.key)) {
    return <strong className="text-brand-600 dark:text-brand-400 font-bold">{value}</strong>
  }

  return <span className="text-gray-800 dark:text-gray-200">{String(value)}</span>
}

function ResourceTable({
  config,
  records,
  loading,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  user,
  onConvert,
  onViewLegalitas,
  onViewContract,
  onSubmitTask,
  onApproveTask,
  onRejectTask,
  onPublishReport,
}) {
  if (loading) {
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
            Data untuk modul {config.label} saat ini belum tersedia. Tambahkan data baru menggunakan form di atas.
          </p>
        </div>
      </div>
    )
  }

  const hasActions = true

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
              {hasActions && <th className="py-3.5 px-4 text-right">Aksi & Alur Kerja</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {records.map((record) => {
              const isDealLead = config.key === 'calonKlien' && record.status_prospek === 'deal'
              const canConvertLead = isDealLead && !record.kontrak && ['admin', 'pimpinan', 'operator', 'sales'].includes(user?.role)
              const isCalonKlien = config.key === 'calonKlien'
              const isKontrak = config.key === 'kontrak'

              const isPekerjaan = config.key === 'pekerjaan'
              const isPIC = isPekerjaan && Number(record.id_pic) === Number(user?.id_user)
              const canSubmitTask = isPekerjaan && (isPIC || ['admin', 'pimpinan'].includes(user?.role)) && !['completed', 'submitted'].includes(record.status)
              const canReviewTask = isPekerjaan && ['admin', 'pimpinan'].includes(user?.role) && record.status === 'submitted'

              const isReporting = config.key === 'reporting'
              const canPublish = isReporting && ['admin', 'pimpinan'].includes(user?.role) && !record.is_visible_to_client

              return (
                <tr
                  key={record[config.primaryKey]}
                  className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                >
                  {config.columns.map((column) => (
                    <td key={column.key} className="py-3.5 px-4 whitespace-nowrap">
                      {renderCellValue(column, record)}
                    </td>
                  ))}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Calon Klien: View Legalitas Modal */}
                      {isCalonKlien && onViewLegalitas && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-light-50 text-blue-light-600 hover:bg-blue-light-100 dark:bg-blue-light-500/15 dark:text-blue-light-400 transition-colors cursor-pointer"
                          onClick={() => onViewLegalitas(record)}
                          title="Lihat nomor legalitas & berkas pendukung"
                        >
                          Legalitas
                        </button>
                      )}

                      {/* View/Print Contract Document */}
                      {((isCalonKlien && isDealLead) || isKontrak) && onViewContract && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400 transition-colors cursor-pointer"
                          onClick={() => onViewContract(record)}
                          title="Buka surat perjanjian kontrak kerja sama"
                        >
                          {(record.kontrak?.status === 'aktif' || record.status === 'aktif') ? '✓ Kontrak Aktif' : 'Surat Kontrak'}
                        </button>
                      )}

                      {/* Workflow: Lead Conversion */}
                      {canConvertLead && onConvert && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 transition-colors cursor-pointer"
                          onClick={() => onConvert(record)}
                          title="Konversi lead ini menjadi Kontrak dan Klien"
                        >
                          Konversi
                        </button>
                      )}

                      {/* Workflow: Submit Task */}
                      {canSubmitTask && onSubmitTask && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/15 dark:text-orange-400 transition-colors cursor-pointer"
                          onClick={() => onSubmitTask(record)}
                          title="Kirim hasil pekerjaan untuk direview pimpinan"
                        >
                          Submit
                        </button>
                      )}

                      {/* Workflow: Approve / Reject Task */}
                      {canReviewTask && onApproveTask && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success-600 hover:bg-success-700 text-white shadow-xs transition-colors cursor-pointer"
                          onClick={() => onApproveTask(record)}
                          title="Setujui pekerjaan ini"
                        >
                          Setujui
                        </button>
                      )}
                      {canReviewTask && onRejectTask && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 transition-colors cursor-pointer"
                          onClick={() => onRejectTask(record)}
                          title="Minta revisi atas pekerjaan ini"
                        >
                          Revisi
                        </button>
                      )}

                      {/* Workflow: Publish Reporting */}
                      {canPublish && onPublishReport && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-light-600 hover:bg-blue-light-700 text-white shadow-xs transition-colors cursor-pointer"
                          onClick={() => onPublishReport(record)}
                          title="Publikasikan laporan ini ke klien"
                        >
                          Publish
                        </button>
                      )}

                      {/* Standard CRUD Edit */}
                      {canEdit && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => onEdit(record)}
                        >
                          Edit
                        </button>
                      )}

                      {/* Standard CRUD Delete */}
                      {canDelete && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors cursor-pointer"
                          onClick={() => onDelete(record)}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
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
