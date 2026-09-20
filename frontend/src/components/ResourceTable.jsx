function renderCellValue(column, record) {
  const value = record[column.key]
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  // Render stylized status badges
  if (['status', 'status_prospek', 'review_status', 'prioritas'].includes(column.key)) {
    return <span className={`badge badge-${value}`}>{value}</span>
  }

  // Render score highlights
  if (['final_score', 'speed_score', 'quality_score'].includes(column.key)) {
    return <strong>{value}</strong>
  }

  return String(value)
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
  onSubmitTask,
  onApproveTask,
  onRejectTask,
  onPublishReport,
}) {
  if (loading) {
    return <div className="empty-state">Memuat data {config.label}...</div>
  }

  if (!records.length) {
    return <div className="empty-state">Belum ada data {config.label}.</div>
  }

  const hasActions = true

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {config.columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {hasActions && <th>Aksi & Alur Kerja</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const isDealLead = config.key === 'calonKlien' && record.status_prospek === 'deal'
            const canConvertLead = isDealLead && ['admin', 'sales', 'pimpinan'].includes(user?.role)

            const isPekerjaan = config.key === 'pekerjaan'
            const isPIC = isPekerjaan && Number(record.id_pic) === Number(user?.id_user)
            const canSubmitTask = isPekerjaan && (isPIC || ['admin', 'pimpinan'].includes(user?.role)) && !['completed', 'submitted'].includes(record.status)
            const canReviewTask = isPekerjaan && ['admin', 'pimpinan'].includes(user?.role) && record.status === 'submitted'

            const isReporting = config.key === 'reporting'
            const canPublish = isReporting && ['admin', 'pimpinan'].includes(user?.role) && !record.is_visible_to_client

            return (
              <tr key={record[config.primaryKey]}>
                {config.columns.map((column) => (
                  <td key={column.key}>{renderCellValue(column, record)}</td>
                ))}
                <td>
                  <div className="row-actions">
                    {/* Workflow: Lead Conversion */}
                    {canConvertLead && onConvert && (
                      <button
                        type="button"
                        className="action-button convert-btn"
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
                        className="action-button submit-btn"
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
                        className="action-button approve-btn"
                        onClick={() => onApproveTask(record)}
                        title="Setujui pekerjaan ini"
                      >
                        Setujui
                      </button>
                    )}
                    {canReviewTask && onRejectTask && (
                      <button
                        type="button"
                        className="action-button reject-btn"
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
                        className="action-button publish-btn"
                        onClick={() => onPublishReport(record)}
                        title="Publikasikan laporan ini ke klien"
                      >
                        Publish
                      </button>
                    )}

                    {/* Standard CRUD Edit */}
                    {canEdit && (
                      <button type="button" className="ghost-button" onClick={() => onEdit(record)}>
                        Edit
                      </button>
                    )}

                    {/* Standard CRUD Delete */}
                    {canDelete && (
                      <button
                        type="button"
                        className="danger-button"
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
  )
}

export default ResourceTable
