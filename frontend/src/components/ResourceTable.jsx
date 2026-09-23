import Badge from './ui/Badge'

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
      draft: 'light',
      in_progress: 'primary',
      review: 'warning',
      submitted: 'warning',
      revision: 'error',
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

    return (
      <Badge size="sm" color={badgeColors[value] || 'light'}>
        {value}
      </Badge>
    )
  }

  // Render role badges
  if (column.key === 'role') {
    const roleLabels = {
      admin: { label: 'Administrator', color: 'primary' },
      sales: { label: 'Sales / BD', color: 'success' },
      karyawan: { label: 'Karyawan / PIC', color: 'warning' },
      pimpinan: { label: 'Pimpinan', color: 'info' },
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
      <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center gap-3">
          <svg className="size-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Memuat data {config.label}...
          </p>
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
              const canConvertLead = isDealLead && !record.kontrak && ['admin', 'sales', 'pimpinan'].includes(user?.role)
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
