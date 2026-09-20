function getInitialValue(field, record, currentUser, config) {
  if (record?.[field.name] !== undefined && record?.[field.name] !== null) {
    return record[field.name]
  }

  // Pre-fill user id for creator roles
  if (!record && field.name === 'id_user' && currentUser?.id_user) {
    return currentUser.id_user
  }

  // Pre-fill PIC for karyawan
  if (!record && config?.key === 'pekerjaan' && field.name === 'id_pic' && currentUser?.role === 'karyawan') {
    return currentUser.id_user
  }

  return ''
}

function ResourceForm({ config, record, options, saving, errors, onCancel, onSubmit, currentUser, canCreate = true, canEdit = true }) {
  // If editing but cannot edit, or adding but cannot create, don't show the form
  if (record && !canEdit) {
    return null
  }
  if (!record && !canCreate) {
    return (
      <div className="resource-form-readonly-notice">
        <p className="text-muted">
          Peran Anda ({currentUser?.role || 'Pengguna'}) memiliki akses hanya-baca untuk {config.label}. Pembuatan data baru dikelola oleh administrator/pimpinan.
        </p>
      </div>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const payload = {}

    config.fields.forEach((field) => {
      // If field is disabled, get default/record value
      const isFieldDisabled = record && config.key === 'pekerjaan' && field.name === 'id_pic' && currentUser?.role === 'karyawan'
      if (isFieldDisabled) {
        return
      }

      const value = formData.get(field.name)
      payload[field.name] = value === '' ? null : value
    })

    onSubmit(payload)
  }

  return (
    <form className="resource-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Form</p>
          <h2>{record ? `Edit ${config.label}` : `Tambah ${config.label}`}</h2>
        </div>
        {record && (
          <button type="button" className="ghost-button" onClick={onCancel}>
            Batal edit
          </button>
        )}
      </div>

      <div className="form-grid">
        {config.fields.map((field) => {
          const fieldError = errors?.[field.name]?.[0]
          const isPicDisabled = record && config.key === 'pekerjaan' && field.name === 'id_pic' && currentUser?.role === 'karyawan'
          const initialVal = getInitialValue(field, record, currentUser, config)

          return (
            <label key={field.name} className="field">
              <span>
                {field.label}
                {isPicDisabled && <em className="field-note"> (Terkunci untuk Karyawan)</em>}
              </span>
              {field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  defaultValue={initialVal ?? ''}
                  required={field.required}
                  rows="3"
                  disabled={isPicDisabled}
                />
              ) : field.type === 'select' ? (
                <select
                  name={field.name}
                  defaultValue={initialVal ?? ''}
                  required={field.required && !isPicDisabled}
                  disabled={isPicDisabled}
                >
                  <option value="">Pilih {field.label}</option>
                  {(() => {
                    const selectOptions = field.options || options[field.optionsResource] || []
                    const valKey = field.optionValue || 'value'
                    const lblKey = field.optionLabel || 'label'
                    const hasCurrent = selectOptions.some((opt) => {
                      const v = typeof opt === 'object' ? opt[valKey] : opt
                      return String(v) === String(initialVal)
                    })

                    return (
                      <>
                        {initialVal && !hasCurrent && (
                          <option value={initialVal}>{initialVal}</option>
                        )}
                        {selectOptions.map((opt) => {
                          const optVal = typeof opt === 'object' ? opt[valKey] : opt
                          const optLabel = typeof opt === 'object' ? (opt[lblKey] || opt[valKey] || opt) : opt
                          return (
                            <option key={optVal} value={optVal}>
                              {optLabel}
                            </option>
                          )
                        })}
                      </>
                    )
                  })()}
                </select>
              ) : (
                <input
                  name={field.name}
                  type={field.type}
                  defaultValue={initialVal ?? ''}
                  required={field.required}
                  disabled={isPicDisabled}
                />
              )}
              {fieldError && <small className="field-error">{fieldError}</small>}
            </label>
          )
        })}
      </div>

      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? 'Menyimpan...' : record ? 'Simpan perubahan' : 'Tambah data'}
      </button>
    </form>
  )
}

export default ResourceForm
