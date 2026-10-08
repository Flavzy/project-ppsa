import { useState } from 'react'
import LoadingSpinner from './common/LoadingSpinner'

function getInitialValue(field, record, currentUser, config) {
  if (field.type === 'password' || field.name === 'password') {
    return ''
  }

  if (record?.[field.name] !== undefined && record?.[field.name] !== null) {
    return record[field.name]
  }

  if (!record && field.defaultValue !== undefined) {
    return typeof field.defaultValue === 'function' ? field.defaultValue() : field.defaultValue
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

function isFieldLockedForUser(field, record, config, currentUser) {
  if (config?.key === 'pekerjaan') {
    // 1. Saat penugasan baru (Operator): status selalu otomatis 'baru'
    if (!record && field.name === 'status') {
      return true
    }
    // 2. Saat edit pekerjaan:
    // Karyawan: PIC, tgl_penugasan, deadline, id_klien terkunci. Status DIIZINKAN (diubah oleh karyawan).
    if (record && currentUser?.role === 'karyawan') {
      return ['id_pic', 'tgl_penugasan', 'deadline', 'id_klien'].includes(field.name)
    }
    // Pimpinan & Operator: Status TERKUNCI (hanya karyawan / tombol persetujuan pimpinan)
    if (record && currentUser?.role !== 'karyawan') {
      return field.name === 'status'
    }
  }
  return false
}

function ResourceForm({
  config,
  record,
  options,
  saving,
  errors,
  onCancel,
  onSubmit,
  currentUser,
  canCreate = true,
  canEdit = true,
}) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [tglPenugasanVal, setTglPenugasanVal] = useState(
    record?.tgl_penugasan || todayStr
  )

  // If editing but cannot edit, or adding but cannot create, don't show the form
  if (record && !canEdit) {
    return null
  }
  if (!record && !canCreate) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
        Peran Anda ({currentUser?.role || 'Pengguna'}) memiliki akses hanya-baca untuk {config.label}. Pembuatan data baru dikelola oleh pimpinan / admin utama.
      </div>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()

    const hasFileField = config.fields.some((f) => f.type === 'file')

    if (hasFileField) {
      const formData = new FormData()

      config.fields.forEach((field) => {
        if (isFieldLockedForUser(field, record, config, currentUser)) {
          if (!record && config?.key === 'pekerjaan' && field.name === 'status') {
            formData.append(field.name, 'baru')
          }
          return
        }

        if (field.type === 'file') {
          const inputEl = event.currentTarget.querySelector(`[name="${field.name}"]`)
          if (inputEl && inputEl.files && inputEl.files[0]) {
            formData.append(field.name, inputEl.files[0])
          }
        } else {
          const inputEl = event.currentTarget.querySelector(`[name="${field.name}"]`)
          if (inputEl) {
            const val = inputEl.value
            formData.append(field.name, val)
          }
        }
      })

      onSubmit(formData)
    } else {
      const formElData = new FormData(event.currentTarget)
      const payload = {}

      config.fields.forEach((field) => {
        if (isFieldLockedForUser(field, record, config, currentUser)) {
          if (!record && config?.key === 'pekerjaan' && field.name === 'status') {
            payload[field.name] = 'baru'
          }
          return
        }

        const value = formElData.get(field.name)
        payload[field.name] = value === '' ? null : value
      })

      onSubmit(payload)
    }
  }

  // Group fields by section if section is specified
  const sections = []
  config.fields.forEach((field) => {
    const sectionName = field.section || 'Informasi Utama'
    let group = sections.find((s) => s.title === sectionName)
    if (!group) {
      group = { title: sectionName, fields: [] }
      sections.push(group)
    }
    group.fields.push(field)
  })

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-gray-100 dark:border-gray-800 gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Form Formulir
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {record ? `Edit Data ${config.label}` : `Tambah ${config.label} Baru`}
          </h2>
        </div>
        {record && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors self-start sm:self-auto cursor-pointer"
          >
            Batal Ubah
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {sections.map((section, sIndex) => (
          <div key={section.title} className="space-y-4">
            {sections.length > 1 && (
              <div className="pt-2 pb-1 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {sIndex + 1}. {section.title}
                </h3>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => {
                const fieldError = errors?.[field.name]?.[0]
                const isFieldDisabled = isFieldLockedForUser(field, record, config, currentUser)
                const initialVal = getInitialValue(field, record, currentUser, config)
                const existingFileUrl = record?.[`${field.name}_url`]
                const isFullWidth = field.type === 'textarea' || field.fullWidth

                return (
                  <div
                    key={field.name}
                    className={isFullWidth ? 'md:col-span-2' : ''}
                  >
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      {field.label}
                      {field.required && !isFieldDisabled && <span className="text-error-500 ml-1">*</span>}
                      {isFieldDisabled && (
                        <span className="text-xs font-normal text-amber-600 dark:text-amber-400 lowercase ml-1">
                          {field.name === 'tgl_penugasan' || field.name === 'deadline'
                            ? '(hanya wewenang operator)'
                            : field.name === 'status' && !record
                            ? '(otomatis baru saat penugasan)'
                            : field.name === 'status' && currentUser?.role !== 'karyawan'
                            ? '(hanya wewenang karyawan / tombol persetujuan pimpinan)'
                            : '(terkunci)'}
                        </span>
                      )}
                      {!isFieldDisabled && config?.key === 'pekerjaan' && field.name === 'status' && currentUser?.role === 'karyawan' && (
                        <span className="text-xs font-normal text-brand-600 dark:text-brand-400 lowercase ml-1">
                          (wewenang karyawan)
                        </span>
                      )}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        defaultValue={initialVal ?? ''}
                        required={field.required && !isFieldDisabled}
                        rows={field.rows || 3}
                        disabled={isFieldDisabled}
                        placeholder={field.placeholder || ''}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        name={field.name}
                        defaultValue={initialVal ?? ''}
                        required={field.required && !isFieldDisabled}
                        disabled={isFieldDisabled}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Pilih {field.label}</option>
                        {(() => {
                          let selectOptions = field.options || options[field.optionsResource] || []
                          if (field.optionsFilter && typeof field.optionsFilter === 'function') {
                            selectOptions = selectOptions.filter(field.optionsFilter)
                          }
                          if (config.key === 'pekerjaan' && field.name === 'id_pic') {
                            selectOptions = selectOptions.filter((opt) => opt.role === 'karyawan')
                          }
                          if (config.key === 'pekerjaan' && field.name === 'status') {
                            selectOptions = selectOptions.filter((opt) => {
                              const v = typeof opt === 'object' ? opt.value : opt
                              return !['completed', 'revision_needed'].includes(v)
                            })
                          }

                          const statusLabelFallback = {
                            baru: 'Baru (Menunggu Dikerjakan)',
                            in_progress: 'Dalam Pengerjaan',
                            submitted: 'Diajukan untuk Ditinjau',
                            revision_needed: 'Perlu Revisi (Status Saat Ini)',
                            completed: 'Selesai (Status Saat Ini)',
                          }

                          const valKey = field.optionValue || 'value'
                          const lblKey = field.optionLabel || 'label'
                          const hasCurrent = selectOptions.some((opt) => {
                            const v = typeof opt === 'object' ? opt[valKey] : opt
                            return String(v) === String(initialVal)
                          })

                          return (
                            <>
                              {initialVal && !hasCurrent && (
                                <option value={initialVal}>
                                  {statusLabelFallback[initialVal] || initialVal}
                                </option>
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
                    ) : field.type === 'file' ? (
                      <div className="space-y-1.5">
                        <input
                          name={field.name}
                          type="file"
                          accept={field.accept}
                          disabled={isFieldDisabled}
                          className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100 dark:file:bg-brand-500/15 dark:file:text-brand-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        {existingFileUrl && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>Berkas terunggah:</span>
                            <a
                              href={existingFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                            >
                              Lihat Dokumen
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (() => {
                      const isTglPenugasan = config.key === 'pekerjaan' && field.name === 'tgl_penugasan'
                      const isDeadline = config.key === 'pekerjaan' && field.name === 'deadline'
                      let minDateAttr = undefined
                      if (isTglPenugasan && !record) {
                        minDateAttr = todayStr
                      } else if (isDeadline) {
                        minDateAttr = tglPenugasanVal || todayStr
                      }

                      return (
                        <input
                          name={field.name}
                          type={field.type}
                          defaultValue={initialVal ?? ''}
                          min={minDateAttr}
                          onChange={isTglPenugasan ? (e) => setTglPenugasanVal(e.target.value) : undefined}
                          required={record && (field.name === 'password' || field.type === 'password') ? false : (field.required && !isFieldDisabled)}
                          disabled={isFieldDisabled}
                          placeholder={
                            record && (field.name === 'password' || field.type === 'password')
                              ? 'Kosongkan jika tidak ingin mengubah password'
                              : (field.placeholder || '')
                          }
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      )
                    })()}
                    {fieldError && (
                      <p className="mt-1 text-xs text-error-600 dark:text-error-400 font-medium">
                        {fieldError}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          {record && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 font-semibold text-sm text-white shadow-theme-xs shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <LoadingSpinner size="xs" text="" />
                <span>Menyimpan...</span>
              </>
            ) : record ? (
              'Simpan Perubahan'
            ) : (
              'Tambah Data'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ResourceForm
