function getInitialValue(field, record) {
  return record?.[field.name] ?? ''
}

function ResourceForm({ config, record, options, saving, errors, onCancel, onSubmit }) {
  function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const payload = {}

    config.fields.forEach((field) => {
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

          return (
            <label key={field.name} className="field">
              <span>{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  defaultValue={getInitialValue(field, record) ?? ''}
                  required={field.required}
                  rows="3"
                />
              ) : field.type === 'select' ? (
                <select
                  name={field.name}
                  defaultValue={getInitialValue(field, record) ?? ''}
                  required={field.required}
                >
                  <option value="">Pilih {field.label}</option>
                  {(options[field.optionsResource] || []).map((option) => (
                    <option key={option[field.optionValue]} value={option[field.optionValue]}>
                      {option[field.optionLabel] || `#${option[field.optionValue]}`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  type={field.type}
                  defaultValue={getInitialValue(field, record) ?? ''}
                  required={field.required}
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
