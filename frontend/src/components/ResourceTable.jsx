function ResourceTable({ config, records, loading, onEdit, onDelete }) {
  if (loading) {
    return <div className="empty-state">Memuat data {config.label}...</div>
  }

  if (!records.length) {
    return <div className="empty-state">Belum ada data {config.label}.</div>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {config.columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record[config.primaryKey]}>
              {config.columns.map((column) => (
                <td key={column.key}>{record[column.key] || '-'}</td>
              ))}
              <td>
                <div className="row-actions">
                  <button type="button" className="ghost-button" onClick={() => onEdit(record)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => onDelete(record)}
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ResourceTable
