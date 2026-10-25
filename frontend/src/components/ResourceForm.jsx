import { useEffect, useRef, useMemo, useState } from 'react'
import LoadingSpinner from './common/LoadingSpinner'
import MonthInputField from './common/MonthInputField'
import ConfirmModal from './ConfirmModal'
import { loadFormDraft, saveFormDraft, clearFormDraft } from '../utils/formDraft'

function getInitialValue(field, record, currentUser, config) {
  if (field.type === 'password' || field.name === 'password') {
    return ''
  }

  if (field.type === 'checkbox_group') {
    if (record?.[field.name] && Array.isArray(record[field.name])) {
      return record[field.name].map(Number)
    }
    if (record?.layanan && Array.isArray(record.layanan)) {
      return record.layanan.map((l) => Number(l.id_layanan))
    }
    return []
  }

  if (record?.[field.name] !== undefined && record?.[field.name] !== null) {
    if (field.type === 'number' && (typeof record[field.name] === 'string' || typeof record[field.name] === 'number')) {
      const num = Number(record[field.name])
      return isNaN(num) ? '' : num
    }
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
    // 2. Jika tugas sudah disetujui / berstatus selesai: SELURUH field terkunci permanen untuk semua role
    if (record && ['completed', 'approved'].includes(record.status)) {
      return true
    }
    // 3. Saat pekerjaan dibuka oleh Karyawan:
    // Seluruh field (judul, status, pic, tgl_penugasan, deadline, id_klien, id_layanan, periode_bulan, deskripsi, lampiran_instruksi) terkunci (read-only)
    // Penyelesaian tugas dilakukan melalui pelaporan di menu Reporting
    if (record && currentUser?.role === 'karyawan') {
      return ['judul', 'status', 'id_pic', 'tgl_penugasan', 'deadline', 'id_klien', 'id_layanan', 'periode_bulan', 'deskripsi', 'lampiran_instruksi'].includes(field.name)
    }
    // 4. Jika role operator/sales dan BUKAN operator PIC pekerjaan ini: SELURUH field terkunci permanen
    if (record && ['operator', 'sales'].includes(currentUser?.role)) {
      const operatorPicId = record?.operator_pic_id ?? record?.klien?.kontrak?.calon_klien?.id_user ?? record?.klien?.kontrak?.calonKlien?.id_user
      if (operatorPicId != null && Number(operatorPicId) !== Number(currentUser?.id_user)) {
        return true
      }
    }
    // Pimpinan & Operator: Status TERKUNCI (perubahan status selesai melalui evaluasi/persetujuan di Reporting)
    if (record && currentUser?.role !== 'karyawan') {
      return field.name === 'status'
    }
  }

  if (config?.key === 'calonKlien' && field.name === 'id_user' && ['operator', 'sales'].includes(currentUser?.role)) {
    return true
  }

  if (config?.key === 'reporting') {
    // Jika laporan tugas sudah disetujui / selesai: SELURUH field terkunci permanen
    if (record && (['approved', 'completed'].includes(record.status_laporan) || record.pekerjaan?.status === 'completed')) {
      return true
    }
  }

  return false
}

export function isImageFile(fileNameOrUrl) {
  if (!fileNameOrUrl) return false
  if (typeof fileNameOrUrl === 'object' && fileNameOrUrl.type) {
    return fileNameOrUrl.type.startsWith('image/')
  }
  const clean = String(fileNameOrUrl).split('?')[0].toLowerCase()
  return (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.svg')
  )
}

export function ImagePreviewModal({ isOpen, imageUrl, fileName, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-5 shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <div className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 shrink-0">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {fileName || 'Pratinjau Gambar'}
            </h4>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
            >
              Buka Tab Baru ↗
            </a>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 dark:bg-gray-800 dark:hover:bg-rose-900/40 dark:text-gray-400 dark:hover:text-rose-300 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-2 rounded-2xl bg-gray-50 dark:bg-gray-950/50">
          <img
            src={imageUrl}
            alt={fileName || 'Pratinjau'}
            className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-xs"
          />
        </div>
      </div>
    </div>
  )
}

function FileInputField({
  name,
  accept,
  disabled,
  fieldLabel,
  existingFileUrl,
  existingFileUrls,
  record,
  onFileChange,
  multiple = false,
}) {
  const inputRef = useRef(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewModal, setPreviewModal] = useState({ open: false, url: '', name: '' })

  const normalizedExisting = useMemo(() => {
    if (existingFileUrls && existingFileUrls.length > 0) {
      return existingFileUrls
    }
    if (existingFileUrl) {
      const extractedName = decodeURIComponent(existingFileUrl.split('/').pop()) || `Buka / Unduh ${fieldLabel}`
      return [{ name: extractedName, url: existingFileUrl, path: existingFileUrl }]
    }
    return []
  }, [existingFileUrls, existingFileUrl, fieldLabel])

  const [retainedExisting, setRetainedExisting] = useState(normalizedExisting)

  useEffect(() => {
    setSelectedFiles([])
    setRetainedExisting(normalizedExisting)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onFileChange?.(name, {
      newFiles: [],
      retainedExisting: normalizedExisting,
      isChanged: false,
    })
  }, [normalizedExisting, record])

  const newFilePreviews = useMemo(() => {
    return selectedFiles.map((file) => {
      const isImg = isImageFile(file)
      return {
        file,
        isImg,
        url: isImg ? URL.createObjectURL(file) : null,
      }
    })
  }, [selectedFiles])

  useEffect(() => {
    return () => {
      newFilePreviews.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url)
      })
    }
  }, [newFilePreviews])

  const emitChange = (newFiles, retained) => {
    const isChanged = multiple
      ? (newFiles.length > 0 || (record && retained.length !== normalizedExisting.length))
      : (newFiles.length > 0)

    onFileChange?.(name, {
      newFiles,
      retainedExisting: retained,
      isChanged,
    })
  }

  const handleFileChange = (e) => {
    const fresh = e.target.files ? Array.from(e.target.files) : []
    if (!fresh.length) return

    if (multiple) {
      setSelectedFiles((prev) => {
        const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`))
        const uniqueFresh = fresh.filter((f) => !existingKeys.has(`${f.name}-${f.size}`))
        const updated = [...prev, ...uniqueFresh]
        emitChange(updated, retainedExisting)
        return updated
      })
    } else {
      const chosen = [fresh[0]]
      setSelectedFiles(chosen)
      emitChange(chosen, retainedExisting)
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemoveSingleNew = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updated)
    emitChange(updated, retainedExisting)
  }

  const handleClearAllNew = () => {
    setSelectedFiles([])
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    emitChange([], retainedExisting)
  }

  const handleRemoveExisting = (index) => {
    const updated = retainedExisting.filter((_, i) => i !== index)
    setRetainedExisting(updated)
    emitChange(selectedFiles, updated)
  }

  const handleRestoreExisting = () => {
    setRetainedExisting(normalizedExisting)
    emitChange(selectedFiles, normalizedExisting)
  }

  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    const dt = e.dataTransfer
    const fresh = dt.files ? Array.from(dt.files) : []
    if (!fresh.length) return

    if (multiple) {
      setSelectedFiles((prev) => {
        const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`))
        const uniqueFresh = fresh.filter((f) => !existingKeys.has(`${f.name}-${f.size}`))
        const updated = [...prev, ...uniqueFresh]
        emitChange(updated, retainedExisting)
        return updated
      })
    } else {
      const chosen = [fresh[0]]
      setSelectedFiles(chosen)
      emitChange(chosen, retainedExisting)
    }
  }

  const hasExisting = normalizedExisting.length > 0
  const deletedCount = normalizedExisting.length - retainedExisting.length

  return (
    <div className="space-y-2.5">
      {!disabled && (
        <div className="space-y-2.5">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
            tabIndex={-1}
          />

          {/* Area Unggah Berkas Interaktif (Drag & Drop + Klik) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-500/15 ring-4 ring-brand-500/10 scale-[1.005]'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800/70'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 group-hover:scale-105 transition-transform">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <span className="text-brand-600 dark:text-brand-400 underline">Klik untuk memilih berkas</span> atau seret & jatuhkan berkas ke sini
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {accept ? `Format didukung: ${accept.replace(/\./g, ' ').toUpperCase()}` : 'Mendukung format PDF, dokumen acuan, dan gambar'} {multiple ? '(Bisa banyak berkas sekaligus)' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Status Berkas yang Dipilih */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 select-none">
              {selectedFiles.length === 0
                ? 'Belum ada berkas baru dipilih'
                : multiple
                ? `${selectedFiles.length} berkas baru siap diunggah`
                : `${selectedFiles[0].name} (${(selectedFiles[0].size / 1024).toFixed(0)} KB)`}
            </span>
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllNew}
                className="inline-flex items-center gap-1 text-gray-400 hover:text-error-600 dark:hover:text-error-400 text-xs py-0.5 px-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Batalkan seluruh pilihan berkas baru"
              >
                <span>✕ Batalkan Semua</span>
              </button>
            )}
          </div>

          {/* Pratinjau Berkas Baru Tunggal (Single File Preview) */}
          {!multiple && newFilePreviews.length === 1 && (
            <div className="pt-1">
              {newFilePreviews[0].isImg ? (
                <div className="flex items-center gap-3 p-2 rounded-2xl bg-brand-50/70 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-800 shadow-2xs max-w-full sm:max-w-md">
                  <button
                    type="button"
                    onClick={() => setPreviewModal({ open: true, url: newFilePreviews[0].url, name: newFilePreviews[0].file.name })}
                    className="relative group shrink-0 size-11 rounded-xl overflow-hidden border border-brand-300 dark:border-brand-700 cursor-pointer shadow-2xs"
                    title="Klik untuk memperbesar pratinjau gambar"
                  >
                    <img src={newFilePreviews[0].url} alt={newFilePreviews[0].file.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      🔍
                    </div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-brand-900 dark:text-brand-100 block truncate">
                      {newFilePreviews[0].file.name}
                    </span>
                    <span className="text-[10px] text-brand-600 dark:text-brand-400">
                      {(newFilePreviews[0].file.size / 1024).toFixed(0)} KB • Pratinjau gambar siap diunggah
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAllNew}
                    className="text-brand-500 hover:text-rose-600 dark:text-brand-400 dark:hover:text-rose-400 p-1.5 cursor-pointer font-bold hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors shrink-0"
                    title="Batalkan pilihan berkas"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* List badge file baru yang dipilih (khusus multiple) - dilengkapi pratinjau visual thumbnail */}
          {multiple && newFilePreviews.length > 0 && (
            <div className="flex flex-col gap-1.5 items-start pt-1">
              {newFilePreviews.map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-xl text-xs bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-2xs max-w-full sm:max-w-lg"
                >
                  {item.isImg ? (
                    <button
                      type="button"
                      onClick={() => setPreviewModal({ open: true, url: item.url, name: item.file.name })}
                      className="relative group shrink-0 size-9 rounded-lg overflow-hidden border border-brand-300 dark:border-brand-700 cursor-pointer shadow-2xs"
                      title="Klik untuk memperbesar pratinjau gambar"
                    >
                      <img src={item.url} alt={item.file.name} className="size-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px]">
                        🔍
                      </div>
                    </button>
                  ) : (
                    <svg className="size-4 text-brand-500 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span className="truncate max-w-[220px] sm:max-w-xs font-medium">{item.file.name}</span>
                  <span className="text-[11px] text-gray-400 font-normal shrink-0">
                    ({(item.file.size / 1024).toFixed(0)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSingleNew(idx)}
                    className="text-gray-400 hover:text-rose-600 ml-1 cursor-pointer font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-full size-4 inline-flex items-center justify-center transition-colors shrink-0"
                    title={`Hapus ${item.file.name} dari daftar pilihan`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tampilan berkas yang sudah tersimpan di server */}
      {hasExisting ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Berkas Terlampir Saat Ini ({retainedExisting.length} Berkas):
            </span>
            {deletedCount > 0 && !disabled && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                  {deletedCount} berkas ditandai untuk dihapus
                </span>
                <button
                  type="button"
                  onClick={handleRestoreExisting}
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-semibold underline cursor-pointer"
                >
                  <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Pulihkan Semua</span>
                </button>
              </div>
            )}
          </div>
          {retainedExisting.length > 0 ? (
            <div className="flex flex-col gap-1.5 items-start">
              {retainedExisting.map((item, idx) => {
                const isImg = isImageFile(item.url || item.path || item.name)

                if (isImg) {
                  return (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-800 shadow-2xs max-w-full sm:max-w-lg"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewModal({ open: true, url: item.url, name: item.name })}
                        className="relative group shrink-0 size-10 rounded-xl overflow-hidden border border-teal-300 dark:border-teal-700 cursor-pointer shadow-2xs"
                        title="Klik untuk memperbesar pratinjau gambar"
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="size-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          🔍
                        </div>
                      </button>
                      <div className="min-w-0 flex-1">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-teal-800 dark:text-teal-200 hover:underline font-semibold text-xs truncate max-w-[220px] sm:max-w-xs"
                          title={`Buka / Unduh ${item.name}`}
                        >
                          <span>{item.name || `Berkas ${idx + 1}`}</span>
                        </a>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 block">
                          Pratinjau gambar tersedia • Klik untuk memperbesar
                        </span>
                      </div>
                      {!disabled && record && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExisting(idx)}
                          className="text-teal-500 hover:text-rose-600 dark:text-teal-400 dark:hover:text-rose-400 ml-1 cursor-pointer font-bold hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full size-5 inline-flex items-center justify-center transition-colors shrink-0"
                          title={`Hapus berkas ini (${item.name})`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                }

                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-800 shadow-2xs max-w-full sm:max-w-lg"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-300 hover:underline font-semibold text-xs"
                      title={`Buka / Unduh ${item.name}`}
                    >
                      <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate max-w-[260px] sm:max-w-xs">{item.name || `Berkas ${idx + 1}`}</span>
                    </a>
                    {!disabled && record && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExisting(idx)}
                        className="text-teal-500 hover:text-rose-600 dark:text-teal-400 dark:hover:text-rose-400 ml-1 cursor-pointer font-bold hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full size-4 inline-flex items-center justify-center transition-colors shrink-0"
                        title={`Hapus berkas ini (${item.name})`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <span className="text-gray-400 text-xs italic block">
              Semua berkas lama telah dihapus. Klik &quot;Simpan Perubahan&quot; untuk mengonfirmasi.
            </span>
          )}
        </div>
      ) : disabled ? (
        <span className="text-gray-400 text-xs italic">Tidak ada berkas yang dilampirkan</span>
      ) : null}

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

function ResourceForm({
  config,
  record,
  existingRecords = [],
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

  // Inisialisasi nilai form: Jika membuat data baru (!record), periksa draf yang tersimpan otomatis
  const [values, setValues] = useState(() => {
    const initialMap = {}
    const draft = !record ? loadFormDraft(config.key, currentUser?.id_user) : null

    config.fields.forEach((field) => {
      if (!record && draft && draft[field.name] !== undefined) {
        // Jangan muat draf lama untuk select field yang memiliki optionsFilter (hindari memuat ID tugas yang belum selesai / tidak sah)
        if (field.type === 'select' && field.optionsFilter) {
          initialMap[field.name] = ''
        } else {
          initialMap[field.name] = draft[field.name]
        }
      } else {
        initialMap[field.name] = getInitialValue(field, record, currentUser, config)
      }
    })

    if (config?.key === 'pekerjaan' && record?.id_master_pekerjaan) {
      initialMap.id_master_pekerjaan = record.id_master_pekerjaan
    }

    return initialMap
  })

  // Pelacakan status berkas/file yang dipilih secara lokal untuk deteksi perubahan
  const [fileStates, setFileStates] = useState({})
  const [clientErrors, setClientErrors] = useState({})

  function handleFileChangeState(name, fileData) {
    setFileStates((prev) => ({
      ...prev,
      [name]: fileData,
    }))
  }

  // Sinkronisasi tgl penugasan untuk batas minimal deadline
  const tglPenugasanVal = values.tgl_penugasan || record?.tgl_penugasan || todayStr

  // Tangani perubahan nilai input dan otomatis simpan ke draf jika mode tambah baru
  function handleFieldChange(fieldName, val) {
    if (config?.key === 'pekerjaan' && fieldName === 'deadline') {
      const recordDeadlineStr = record?.deadline ? String(record.deadline).split('T')[0] : null
      if (val && val !== recordDeadlineStr && val < todayStr) {
        setClientErrors((prev) => ({
          ...prev,
          deadline: ['Batas waktu (deadline) tidak boleh sebelum hari ini.'],
        }))
      } else {
        setClientErrors((prev) => {
          if (!prev.deadline) return prev
          const copy = { ...prev }
          delete copy.deadline
          return copy
        })
      }
    }

    setValues((prev) => {
      const next = { ...prev, [fieldName]: val }
      if (config?.key === 'pekerjaan' && fieldName === 'id_klien') {
        const newKlien = (options?.klien || []).find((k) => String(k.id_klien) === String(val))
        const newKontrak = newKlien?.kontrak || (options?.kontrak || []).find((c) => String(c.id_kontrak) === String(newKlien?.id_kontrak))
        const contractLayananIds = newKontrak?.layanan_ids ||
          (Array.isArray(newKontrak?.layanan) ? newKontrak.layanan.map((l) => l.id_layanan) : [])
        if (contractLayananIds.length > 0 && prev.id_layanan && !contractLayananIds.includes(Number(prev.id_layanan))) {
          next.id_layanan = ''
        }
      }
      if (!record) {
        saveFormDraft(config.key, currentUser?.id_user, next)
      }
      return next
    })
  }

  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Tombol untuk mereset / menghapus draf kembali ke awal
  function handleClearDraft() {
    clearFormDraft(config.key, currentUser?.id_user)
    const resetMap = {}
    config.fields.forEach((field) => {
      resetMap[field.name] = getInitialValue(field, null, currentUser, config)
    })
    setValues(resetMap)
  }

  // Sinkronisasi opsi select: Jika mode tambah baru (!record) dan opsi yang ada di values tidak lagi valid menurut optionsFilter, reset ke ''
  useEffect(() => {
    if (!record && options && Object.keys(options).length > 0) {
      config.fields.forEach((field) => {
        if (field.type === 'select' && field.optionsFilter && values[field.name]) {
          if (config?.key === 'calonKlien' && field.name === 'id_user' && ['operator', 'sales'].includes(currentUser?.role)) {
            return
          }
          const raw = field.options || options[field.optionsResource] || []
          const valKey = field.optionValue || 'value'
          const valid = raw.filter(field.optionsFilter)
          const isStillValid = valid.some((opt) => String(typeof opt === 'object' ? opt[valKey] : opt) === String(values[field.name]))
          if (!isStillValid) {
            handleFieldChange(field.name, '')
          }
        }
      })
    }
  }, [options, record, config])

  // Indikator apakah draf tersimpan aktif
  const hasDraft = useMemo(() => {
    if (record) return false
    const draft = loadFormDraft(config.key, currentUser?.id_user)
    if (!draft) return false
    return Object.keys(draft).some((k) => {
      const field = config.fields.find((f) => f.name === k)
      if (!field) return false
      const defVal = getInitialValue(field, null, currentUser, config)
      return draft[k] !== defVal && draft[k] !== '' && draft[k] !== undefined
    })
  }, [config, currentUser?.id_user, record])

  // Deteksi apakah ada perubahan data (dirty check) saat mode edit
  const isDirty = useMemo(() => {
    // Mode tambah baru selalu diizinkan untuk submit
    if (!record) return true

    // Cek jika ada berkas/file baru yang dipilih pengguna atau berkas tersimpan yang diubah/dihapus
    const hasFileChanges = Object.values(fileStates).some((fs) => Boolean(fs?.isChanged))
    if (hasFileChanges) return true

    // Bandingkan setiap field dengan nilai asli dari record
    return config.fields.some((field) => {
      // Abaikan field yang terkunci/read-only untuk pengguna saat ini
      if (isFieldLockedForUser(field, record, config, currentUser)) {
        return false
      }

      // Field password: hanya dianggap dirty jika diisi sesuatu oleh user
      if (field.type === 'password' || field.name === 'password') {
        const pwdVal = values[field.name]
        return typeof pwdVal === 'string' && pwdVal.length > 0
      }

      // Field berkas ditangani secara terpisah oleh fileStates
      if (field.type === 'file') {
        return false
      }

      const origRaw = record[field.name]
      const currentRaw = values[field.name]

      if (field.type === 'checkbox_group') {
        const origArr = Array.isArray(origRaw)
          ? origRaw.map(Number).sort((a, b) => a - b)
          : (record?.layanan ? record.layanan.map((l) => Number(l.id_layanan)).sort((a, b) => a - b) : [])
        const currArr = Array.isArray(currentRaw) ? currentRaw.map(Number).sort((a, b) => a - b) : []
        return JSON.stringify(origArr) !== JSON.stringify(currArr)
      }

      if (field.type === 'number') {
        const numOrig = origRaw !== undefined && origRaw !== null && origRaw !== '' ? Number(origRaw) : null
        const numCurrent = currentRaw !== undefined && currentRaw !== null && currentRaw !== '' ? Number(currentRaw) : null
        return numOrig !== numCurrent
      }

      const origVal = String(origRaw !== undefined && origRaw !== null ? origRaw : '').trim()
      const currentVal = String(currentRaw !== undefined && currentRaw !== null ? currentRaw : '').trim()

      return origVal !== currentVal
    })
  }, [record, fileStates, config, currentUser, values])

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

    // Validasi client-side: Deadline pekerjaan tidak boleh sebelum hari ini jika diubah atau ditambah baru
    if (config?.key === 'pekerjaan' && values.deadline) {
      const recordDeadlineStr = record?.deadline ? String(record.deadline).split('T')[0] : null
      if (values.deadline !== recordDeadlineStr && values.deadline < todayStr) {
        setClientErrors((prev) => ({
          ...prev,
          deadline: ['Batas waktu (deadline) tidak boleh sebelum hari ini.'],
        }))
        return
      }
    }

    // Jika mode edit dan tidak ada perubahan sama sekali, cegah penyimpanan
    if (record && !isDirty) {
      return
    }

    const hasFileField = config.fields.some((f) => f.type === 'file')

    if (hasFileField) {
      const formData = new FormData()

      config.fields.forEach((field) => {
        if (isFieldLockedForUser(field, record, config, currentUser)) {
          if (!record && config?.key === 'pekerjaan' && field.name === 'status') {
            formData.append(field.name, 'baru')
          }
          if (config?.key === 'calonKlien' && field.name === 'id_user') {
            formData.append('id_user', currentUser?.id_user || record?.id_user || values.id_user)
          }
          return
        }

        if (field.type === 'file') {
          const fs = fileStates[field.name]
          if (field.multiple) {
            // Berkas baru yang diunggah
            if (fs?.newFiles && fs.newFiles.length > 0) {
              fs.newFiles.forEach((file) => {
                formData.append(`${field.name}[]`, file)
              })
            }

            // Saat mode edit, kirim penanda dan daftar berkas lama yang dipertahankan
            if (record && fs) {
              formData.append(`${field.name}_existing_present`, '1')
              if (fs.retainedExisting && fs.retainedExisting.length > 0) {
                fs.retainedExisting.forEach((item) => {
                  const path = item.path || item.url
                  if (path) {
                    formData.append(`${field.name}_existing[]`, path)
                  }
                })
              }
            }
          } else {
            // Berkas tunggal
            if (fs?.newFiles && fs.newFiles.length > 0) {
              formData.append(field.name, fs.newFiles[0])
            }
          }
        } else if (field.type === 'checkbox_group') {
          const arr = Array.isArray(values[field.name]) ? values[field.name] : []
          arr.forEach((item) => {
            formData.append(`${field.name}[]`, item)
          })
        } else {
          const val = values[field.name] !== undefined ? values[field.name] : ''
          formData.append(field.name, val)
        }
      })

      if (config?.key === 'pekerjaan' && values.id_master_pekerjaan) {
        formData.append('id_master_pekerjaan', values.id_master_pekerjaan)
      }

      onSubmit(formData)
    } else {
      const payload = {}

      config.fields.forEach((field) => {
        if (isFieldLockedForUser(field, record, config, currentUser)) {
          if (!record && config?.key === 'pekerjaan' && field.name === 'status') {
            payload[field.name] = 'baru'
          }
          if (config?.key === 'calonKlien' && field.name === 'id_user') {
            payload['id_user'] = currentUser?.id_user || record?.id_user || values.id_user
          }
          return
        }

        if (field.type === 'checkbox_group') {
          payload[field.name] = Array.isArray(values[field.name]) ? values[field.name] : []
          return
        }

        const val = values[field.name] !== undefined ? values[field.name] : ''
        if (record && (field.name === 'password' || field.type === 'password') && (!val || String(val).trim() === '')) {
          return
        }
        payload[field.name] = val === '' ? null : val
      })

      if (config?.key === 'pekerjaan' && values.id_master_pekerjaan) {
        payload['id_master_pekerjaan'] = values.id_master_pekerjaan
      }

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

  // State untuk sub-navigasi tab formulir (khusus form bertingkat / panjang seperti Calon Klien)
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)

  useEffect(() => {
    setActiveSectionIndex(0)
  }, [config?.key, record])

  // Otomatis arahkan tab ke bagian yang memiliki error validasi saat submit
  useEffect(() => {
    const errorKeys = Object.keys(clientErrors || {}).concat(Object.keys(errors || {}))
    if (errorKeys.length > 0 && sections.length > 1) {
      const targetIdx = sections.findIndex((s) => s.fields.some((f) => errorKeys.includes(f.name)))
      if (targetIdx !== -1 && activeSectionIndex !== -1 && activeSectionIndex !== targetIdx) {
        setActiveSectionIndex(targetIdx)
      }
    }
  }, [clientErrors, errors, sections, activeSectionIndex])

  const isTaskCompleted = config?.key === 'pekerjaan' && record && ['completed', 'approved'].includes(record.status)
  const isReportCompleted = config?.key === 'reporting' && record && (['approved', 'completed'].includes(record.status_laporan) || record.pekerjaan?.status === 'completed')
  const isKaryawanDetailTask = config?.key === 'pekerjaan' && record && currentUser?.role === 'karyawan'
  const isNonPicOperatorTask = config?.key === 'pekerjaan' && record && ['operator', 'sales'].includes(currentUser?.role) && (() => {
    const opPicId = record?.operator_pic_id ?? record?.klien?.kontrak?.calon_klien?.id_user ?? record?.klien?.kontrak?.calonKlien?.id_user
    return opPicId != null && Number(opPicId) !== Number(currentUser?.id_user)
  })()
  const isReadOnlyDetail = isTaskCompleted || isReportCompleted || isKaryawanDetailTask || isNonPicOperatorTask

  const headerBadge = isTaskCompleted
    ? 'Tugas Selesai'
    : isReportCompleted
    ? 'Laporan Disetujui'
    : isKaryawanDetailTask
    ? 'Tinjau Penugasan'
    : isNonPicOperatorTask
    ? 'Bukan PIC'
    : 'Form Formulir'

  const headerTitle = isTaskCompleted
    ? 'Detail Pekerjaan (Sudah Disetujui)'
    : isReportCompleted
    ? 'Detail Laporan (Sudah Disetujui)'
    : isKaryawanDetailTask
    ? 'Detail Informasi Pekerjaan'
    : isNonPicOperatorTask
    ? 'Detail Pekerjaan (Bukan Operator PIC)'
    : record
    ? `Edit Data ${config.label}`
    : config.key === 'calonKlien'
    ? 'Tambah Calon Klien'
    : config.key === 'pekerjaan'
    ? 'Buat Penugasan Baru'
    : config.key === 'users'
    ? 'Tambah Pengguna Baru'
    : config.key === 'reporting'
    ? 'Buat Laporan Baru'
    : config.key === 'masterPekerjaan'
    ? 'Tambah Template Pekerjaan'
    : config.key === 'kinerjaKaryawan'
    ? 'Beri Penilaian Kinerja'
    : config.key === 'layanan'
    ? 'Tambah Layanan Baru'
    : `Tambah ${config.label} Baru`

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-gray-100 dark:border-gray-800 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {headerBadge}
            </span>
            {hasDraft && !record && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                <span>Draf aktif</span>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="ml-1 text-xs text-amber-800 dark:text-amber-300 underline hover:font-bold cursor-pointer"
                  title="Hapus draf dan kosongkan isian form"
                >
                  Reset
                </button>
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {headerTitle}
          </h2>
        </div>

      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
        {/* Input semu tersembunyi untuk mencegah autofill paksa dari browser password manager */}
        <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" aria-hidden="true" />
        {/* Navigasi Sub-Bagian / Tab Formulir (Mencegah Vertical Scroll Fatigue) */}
        {sections.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 mb-6">
            {sections.map((sec, sIdx) => {
              const isActive = activeSectionIndex === sIdx
              const hasSecError = sec.fields.some((f) => clientErrors?.[f.name] || errors?.[f.name])
              return (
                <button
                  key={sec.title}
                  type="button"
                  onClick={() => setActiveSectionIndex(sIdx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer outline-hidden focus:outline-hidden focus:ring-0 transition-colors duration-200 border ${
                    isActive
                      ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-xs border-gray-200/80 dark:border-gray-700/80'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-750/50'
                  }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300'
                        : 'bg-gray-200/60 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {sIdx + 1}
                  </span>
                  <span>{sec.title}</span>
                  {hasSecError && (
                    <span
                      className="size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-900"
                      title="Terdapat isian yang perlu diperiksa pada bagian ini"
                    />
                  )}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setActiveSectionIndex(activeSectionIndex === -1 ? 0 : -1)}
              className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-medium outline-hidden focus:outline-hidden focus:ring-0 transition-colors duration-200 cursor-pointer ${
                activeSectionIndex === -1
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {activeSectionIndex === -1 ? '✓ Mode Semua Bagian' : 'Tampilkan Semua Bagian'}
            </button>
          </div>
        )}

        {sections
          .map((section, sIndex) => ({ section, sIndex }))
          .filter(({ sIndex }) => activeSectionIndex === -1 || activeSectionIndex === sIndex)
          .map(({ section, sIndex }) => (
            <div key={section.title} className="space-y-4">
              {sections.length > 1 && (
                <div className="pt-2 pb-1 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {sIndex + 1}. {section.title}
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Bagian {sIndex + 1} dari {sections.length}
                  </span>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => {
                const fieldError = clientErrors?.[field.name]?.[0] || errors?.[field.name]?.[0]
                const isFieldDisabled = isFieldLockedForUser(field, record, config, currentUser)
                const initialVal = values[field.name] !== undefined ? values[field.name] : getInitialValue(field, record, currentUser, config)
                const rawFieldVal = record?.[field.name]
                const isJsonArrayStr = typeof rawFieldVal === 'string' && rawFieldVal.trim().startsWith('[')
                const existingFileUrl = record?.[`${field.name}_url`] || (rawFieldVal && typeof rawFieldVal === 'string' && !isJsonArrayStr ? (rawFieldVal.startsWith('http') ? rawFieldVal : `/storage/${rawFieldVal}`) : null)
                const isFullWidth = field.type === 'textarea' || field.type === 'checkbox_group' || field.fullWidth

                return (
                  <div
                    key={field.name}
                    className={isFullWidth ? 'md:col-span-2' : ''}
                  >
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      {field.label}
                      {field.required && !isFieldDisabled && <span className="text-error-500 ml-1">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        value={values[field.name] ?? ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.required && !isFieldDisabled}
                        rows={field.rows || 3}
                        disabled={isFieldDisabled}
                        placeholder={field.placeholder || ''}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    ) : field.type === 'select' ? (() => {
                      // Khusus Calon Klien: Jika user ber-role Operator/Sales, kunci field Operator PIC ke namanya sendiri tanpa dropdown
                      if (config.key === 'calonKlien' && field.name === 'id_user' && ['operator', 'sales'].includes(currentUser?.role)) {
                        const operatorDisplayName = record?.user?.nama || currentUser?.nama || 'Operator'
                        return (
                          <div>
                            <div className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/60 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 shadow-2xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 text-xs font-bold">
                                  {operatorDisplayName.charAt(0).toUpperCase()}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white truncate">
                                  {operatorDisplayName}
                                </span>
                                <span className="inline-flex shrink-0 items-center rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                                  Operator PIC (Akun Anda)
                                </span>
                              </div>
                              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0 ml-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Terkunci
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                              Data calon klien otomatis ditugaskan ke akun Operator Anda.
                            </p>
                          </div>
                        )
                      }

                      const rawOptions = field.options || options[field.optionsResource] || []
                      const valKey = field.optionValue || 'value'
                      const lblKey = field.optionLabel || 'label'

                      let selectOptions = rawOptions
                      if (field.optionsFilter && typeof field.optionsFilter === 'function') {
                        selectOptions = selectOptions.filter((opt) => {
                          // Hanya pertahankan opsi yang ada saat mode EDIT record yang sudah tersimpan di database
                          if (record && initialVal !== undefined && initialVal !== null && initialVal !== '') {
                            const optVal = typeof opt === 'object' ? opt[valKey] : opt
                            if (String(optVal) === String(initialVal)) {
                              return true
                            }
                          }
                          return field.optionsFilter(opt)
                        })
                      }

                      if (config.key === 'pekerjaan' && field.name === 'id_pic') {
                        selectOptions = selectOptions.filter((opt) => {
                          if (initialVal && String(opt[valKey]) === String(initialVal)) return true
                          return opt.role === 'karyawan'
                        })
                      }

                      if (config.key === 'pekerjaan' && field.name === 'id_layanan') {
                        selectOptions = selectOptions.filter((opt) => {
                          if (record && initialVal && String(opt[valKey]) === String(initialVal)) return true
                          return Boolean(opt.is_active)
                        })

                        const selectedKlienId = values.id_klien || record?.id_klien
                        if (selectedKlienId && options?.klien) {
                          const matchedKlien = options.klien.find((k) => String(k.id_klien) === String(selectedKlienId))
                          const matchedKontrak = matchedKlien?.kontrak || (options?.kontrak || []).find((c) => String(c.id_kontrak) === String(matchedKlien?.id_kontrak))
                          if (matchedKontrak) {
                            const contractLayananIds = matchedKontrak.layanan_ids ||
                              (Array.isArray(matchedKontrak.layanan) ? matchedKontrak.layanan.map((l) => l.id_layanan) : [])
                            if (contractLayananIds.length > 0) {
                              selectOptions = selectOptions.filter((opt) => {
                                if (record && initialVal && String(opt[valKey]) === String(initialVal)) return true
                                return contractLayananIds.includes(opt.id_layanan)
                              })
                            }
                          }
                        }
                      }

                      const statusLabelFallback = {
                        baru: 'Baru (Menunggu Dikerjakan)',
                        in_progress: 'Dalam Pengerjaan',
                        submitted: 'Diajukan untuk Ditinjau',
                        revision_needed: 'Perlu Revisi',
                        completed: 'Selesai',
                        deal: 'Deal',
                        belum_deal: 'Belum Deal',
                      }

                      const hasCurrent = selectOptions.some((opt) => {
                        const v = typeof opt === 'object' ? opt[valKey] : opt
                        return String(v) === String(initialVal)
                      })

                      // Temukan nama yang ramah manusia, jangan pernah menampilkan angka ID mentah
                      let fallbackHumanName = null
                      if (record && initialVal !== undefined && initialVal !== null && initialVal !== '') {
                        const matchedRaw = rawOptions.find((opt) => {
                          const v = typeof opt === 'object' ? opt[valKey] : opt
                          return String(v) === String(initialVal)
                        })
                        if (matchedRaw) {
                          fallbackHumanName = typeof matchedRaw === 'object' ? (matchedRaw[lblKey] || matchedRaw[valKey]) : matchedRaw
                        }
                        if (!fallbackHumanName) {
                          if (field.name === 'id_calon_klien') {
                            fallbackHumanName = record?.calon_klien?.nama_perusahaan || record?.klien?.nama_perusahaan
                          } else if (field.name === 'id_klien') {
                            fallbackHumanName = record?.klien?.nama_perusahaan || record?.calon_klien?.nama_perusahaan
                          } else if (field.name === 'id_kontrak') {
                            fallbackHumanName = record?.kontrak?.no_kontrak
                          } else if (field.name === 'id_pic') {
                            fallbackHumanName = record?.pic?.nama
                          } else if (field.name === 'id_user') {
                            fallbackHumanName = record?.user?.nama
                          } else if (field.name === 'id_pekerjaan') {
                            fallbackHumanName = record?.pekerjaan?.judul
                          } else if (field.name === 'id_layanan') {
                            fallbackHumanName = record?.layanan?.nama_layanan
                          } else if (field.name === 'judul') {
                            fallbackHumanName = record?.judul
                          } else if (statusLabelFallback[initialVal]) {
                            fallbackHumanName = statusLabelFallback[initialVal]
                          }
                        }
                      }

                      return (
                        <div>
                          <select
                            name={field.name}
                            value={values[field.name] ?? ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={field.required && !isFieldDisabled}
                            disabled={isFieldDisabled}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="">
                              {selectOptions.length === 0 && config.key === 'kinerjaKaryawan' && field.name === 'id_pekerjaan'
                                ? '-- Tidak ada tugas selesai & disetujui yang menunggu penilaian --'
                                : `Pilih ${field.label}`}
                            </option>
                            {record && initialVal && !hasCurrent && (
                              <option value={initialVal}>
                                {fallbackHumanName || `${field.label}`}
                              </option>
                            )}
                            {selectOptions.map((opt) => {
                              const optVal = typeof opt === 'object' ? opt[valKey] : opt
                              const optLabel = typeof field.formatOptionLabel === 'function'
                                ? field.formatOptionLabel(opt)
                                : (typeof opt === 'object' ? (opt[lblKey] || opt[valKey] || opt) : opt)
                              return (
                                <option key={optVal} value={optVal} disabled={Boolean(opt.__disabled)}>
                                  {opt.__displayLabel || optLabel}
                                </option>
                              )
                            })}
                          </select>
                          {config.key === 'kinerjaKaryawan' && field.name === 'id_pekerjaan' && selectOptions.length === 0 && (
                            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold text-gray-600 dark:text-gray-300">Catatan:</span> Penilaian hanya untuk tugas yang telah selesai &amp; disetujui pimpinan.
                            </p>
                          )}
                        </div>
                      )
                    })() : field.type === 'checkbox_group' ? (() => {
                      const rawOptions = options[field.optionsResource] || []
                      const relationOptions = typeof field.optionsFilter === 'function'
                        ? rawOptions.filter(field.optionsFilter)
                        : rawOptions
                      const valKey = field.optionValue || 'id'
                      const lblKey = field.optionLabel || 'name'
                      const currentSelected = Array.isArray(values[field.name])
                        ? values[field.name]
                        : (Array.isArray(initialVal) ? initialVal : [])

                      const toggleOption = (id) => {
                        if (isFieldDisabled) return
                        const numId = Number(id)
                        const exists = currentSelected.some((x) => Number(x) === numId)
                        const next = exists
                          ? currentSelected.filter((x) => Number(x) !== numId)
                          : [...currentSelected, numId]
                        setValues((prev) => ({ ...prev, [field.name]: next }))
                      }

                      return (
                        <div className="space-y-2">
                          {field.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {field.description}
                            </p>
                          )}
                          {relationOptions.length === 0 ? (
                            <div className="p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-xs text-gray-500 text-center bg-gray-50/50 dark:bg-gray-800/30">
                              Belum ada data {field.label.toLowerCase()} yang aktif.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {relationOptions.map((opt) => {
                                const optVal = Number(typeof opt === 'object' ? opt[valKey] : opt)
                                const optLabel = typeof opt === 'object' ? (opt[lblKey] || optVal) : opt
                                const optDesc = typeof opt === 'object' ? opt.deskripsi : null
                                const isChecked = currentSelected.some((x) => Number(x) === optVal)

                                return (
                                  <label
                                    key={optVal}
                                    onClick={() => toggleOption(optVal)}
                                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                                      isChecked
                                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-500/15 dark:border-brand-500 text-gray-900 dark:text-white shadow-xs ring-1 ring-brand-500/20'
                                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-300'
                                    } ${isFieldDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isFieldDisabled}
                                      onChange={() => {}}
                                      className="size-4.5 rounded text-brand-600 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 mt-0.5 cursor-pointer"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold leading-snug">
                                        {optLabel}
                                      </p>
                                      {optDesc && (
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                          {optDesc}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })() : field.type === 'file' ? (
                      <FileInputField
                        key={`${field.name}-${record ? record[config.primaryKey] : 'new'}`}
                        name={field.name}
                        accept={field.accept}
                        multiple={field.multiple}
                        disabled={isFieldDisabled}
                        fieldLabel={field.label}
                        existingFileUrl={existingFileUrl}
                        existingFileUrls={
                          record?.[`${field.name}_urls`] ||
                          (field.name === 'lampiran_instruksi'
                            ? record?.lampiran_instruksi_urls
                            : field.name === 'file_dokumen_pendukung'
                            ? record?.file_dokumen_pendukung_urls
                            : field.name === 'dokumen_bukti'
                            ? record?.dokumen_bukti_urls
                            : undefined)
                        }
                        record={record}
                        onFileChange={handleFileChangeState}
                      />
                    ) : field.type === 'month' ? (
                      <MonthInputField
                        key={`${field.name}-${record ? record[config.primaryKey] : 'new'}`}
                        name={field.name}
                        value={values[field.name] ?? (initialVal ?? '')}
                        onChange={(newVal) => handleFieldChange(field.name, newVal)}
                        disabled={isFieldDisabled}
                        required={field.required && !isFieldDisabled}
                        min={(() => {
                          const now = new Date()
                          const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                          const recordMonth = record?.[field.name]
                          return recordMonth && recordMonth < currentMonthStr ? recordMonth : currentMonthStr
                        })()}
                      />
                    ) : (() => {
                      const isCreationDate = ['tgl_penugasan', 'tgl_lapor', 'tgl_followup', 'tgl_mulai'].includes(field.name)
                      const isTglPenugasan = field.name === 'tgl_penugasan'
                      const isDeadline = field.name === 'deadline'
                      const isTglSelesai = field.name === 'tgl_selesai'
                      const isKontakCalonKlien = config.key === 'calonKlien' && (field.name === 'kontak_person' || field.name === 'kontak')
                      const isNumericOnly = Boolean(field.numericOnly || isKontakCalonKlien)
                      const maxCharLength = isKontakCalonKlien ? 16 : (field.maxLength || undefined)

                      let minDateAttr = undefined
                      let maxDateAttr = undefined
                      let calculatedVal = initialVal

                      if (isCreationDate) {
                        // Seluruh tanggal buat / entry (penugasan, lapor, followup, mulai) hanya bisa tanggal hari ini
                        minDateAttr = todayStr
                        maxDateAttr = todayStr
                        if (!record || !initialVal) {
                          calculatedVal = todayStr
                        }
                      } else if (isDeadline) {
                        const recordDeadlineStr = record?.deadline ? String(record.deadline).split('T')[0] : null
                        const isOriginalDeadlinePast = recordDeadlineStr && recordDeadlineStr < todayStr
                        // Jika deadline lama aslinya sudah lewat dan user belum mengubahnya,
                        // izinkan nilai aslinya agar form tidak terblokir saat edit field lain.
                        // Tetapi jika record baru, deadline asli >= todayStr, atau user memilih tanggal baru,
                        // batas minimal kalender wajib todayStr.
                        if (isOriginalDeadlinePast && values.deadline === recordDeadlineStr) {
                          minDateAttr = recordDeadlineStr
                        } else {
                          minDateAttr = todayStr
                        }
                      } else if (isTglSelesai) {
                        minDateAttr = todayStr
                      } else if (field.type === 'month') {
                        const now = new Date()
                        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                        const recordMonth = record?.[field.name]
                        minDateAttr = recordMonth && recordMonth < currentMonthStr ? recordMonth : currentMonthStr
                      }

                      let displayVal = values[field.name] ?? (calculatedVal ?? '')
                      if (isNumericOnly && typeof displayVal === 'string') {
                        displayVal = displayVal.replace(/\D/g, '')
                        if (maxCharLength && displayVal.length > maxCharLength) {
                          displayVal = displayVal.slice(0, maxCharLength)
                        }
                      }

                      return (
                        <input
                          key={record && (field.name === 'password' || field.type === 'password') ? `pwd_edit_${record[config.primaryKey]}` : field.name}
                          name={field.name}
                          type={field.type}
                          inputMode={isNumericOnly ? 'numeric' : undefined}
                          pattern={isNumericOnly ? '[0-9]*' : undefined}
                          maxLength={maxCharLength}
                          value={displayVal}
                          min={minDateAttr || (field.min !== undefined ? field.min : undefined)}
                          max={maxDateAttr || (field.max !== undefined ? field.max : undefined)}
                          step={field.step || (field.type === 'number' ? 'any' : undefined)}
                          autoComplete={
                            field.name === 'password' || field.type === 'password'
                              ? 'new-password'
                              : 'off'
                          }
                          onKeyDown={(e) => {
                            if (isNumericOnly) {
                              const allowedKeys = [
                                'Backspace',
                                'Delete',
                                'Tab',
                                'Escape',
                                'Enter',
                                'ArrowLeft',
                                'ArrowRight',
                                'ArrowUp',
                                'ArrowDown',
                                'Home',
                                'End',
                              ]
                              if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
                                return
                              }
                              if (!/^[0-9]$/.test(e.key)) {
                                e.preventDefault()
                              }
                            }
                          }}
                          onPaste={(e) => {
                            if (isNumericOnly) {
                              e.preventDefault()
                              const clipboardText = (e.clipboardData || window.clipboardData)?.getData('text') || ''
                              const filteredDigits = clipboardText.replace(/\D/g, '')
                              const currentVal = String(values[field.name] ?? (calculatedVal ?? ''))
                              const inputEl = e.target
                              const start = inputEl.selectionStart ?? currentVal.length
                              const end = inputEl.selectionEnd ?? currentVal.length
                              let combined = currentVal.slice(0, start) + filteredDigits + currentVal.slice(end)
                              if (maxCharLength && combined.length > maxCharLength) {
                                combined = combined.slice(0, maxCharLength)
                              }
                              handleFieldChange(field.name, combined)
                            }
                          }}
                          onChange={(e) => {
                            let nextVal = e.target.value
                            if (isNumericOnly) {
                              nextVal = nextVal.replace(/\D/g, '')
                              if (maxCharLength && nextVal.length > maxCharLength) {
                                nextVal = nextVal.slice(0, maxCharLength)
                              }
                            }
                            handleFieldChange(field.name, nextVal)
                            if (isTglPenugasan) {
                              setTglPenugasanVal(nextVal)
                            }
                          }}
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

        {/* Info Berkas Penyerahan Tugas (Jika Pekerjaan telah disubmit/selesai) */}
        {config.key === 'pekerjaan' && record && (record.file_tugas_url || record.file_tugas_urls?.length || record.latest_reporting?.dokumen_bukti_url || record.latest_reporting?.dokumen_bukti_urls?.length || record.catatan_karyawan) && (
          <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-800/40 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300">
              Berkas & Hasil Penyerahan Tugas Karyawan
            </h4>
            {record.catatan_karyawan && (
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Catatan Karyawan:</span> {record.catatan_karyawan}
              </p>
            )}
            {(() => {
              const taskFiles = record.file_tugas_urls && record.file_tugas_urls.length > 0
                ? record.file_tugas_urls
                : (record.latest_reporting?.dokumen_bukti_urls && record.latest_reporting.dokumen_bukti_urls.length > 0
                    ? record.latest_reporting.dokumen_bukti_urls
                    : (record.file_tugas_url || record.latest_reporting?.dokumen_bukti_url
                        ? [{ name: decodeURIComponent((record.file_tugas_url || record.latest_reporting?.dokumen_bukti_url).split('/').pop()) || 'Buka File Tugas Selesai', url: record.file_tugas_url || record.latest_reporting?.dokumen_bukti_url }]
                        : []))

              if (taskFiles.length === 0) return null

              return (
                <div className="pt-1 flex flex-col gap-1.5 items-start">
                  {taskFiles.map((tf, idx) => (
                    <a
                      key={idx}
                      href={tf.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      title={`Buka / Unduh ${tf.name || `File Tugas ${idx + 1}`}`}
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span>{tf.name && tf.name !== 'Buka / Unduh File Tugas Selesai' ? (tf.name.length > 28 ? tf.name.slice(0, 25) + '...' : tf.name) : 'Buka / Unduh File Tugas Selesai'}</span>
                    </a>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {isReadOnlyDetail ? (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isTaskCompleted || isReportCompleted ? (
                <>
                  <strong>Pekerjaan ini telah disetujui dan berstatus Selesai.</strong> Seluruh data telah dikunci secara permanen agar tidak merusak hasil pekerjaan yang telah tuntas.
                </>
              ) : isNonPicOperatorTask ? (
                <>
                  <strong>Bukan wewenang Anda.</strong> Hanya Operator PIC terkait yang berwenang mengedit pekerjaan ini.
                </>
              ) : (
                <>
                  Instruksi tugas dan status bersifat tetap. Untuk menyerahkan berkas & hasil kerja yang telah selesai, buat laporan pada menu <strong>Reporting</strong>.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 font-semibold text-sm text-white shadow-theme-xs shadow-brand-500/20 transition-all active:scale-95 cursor-pointer self-end sm:self-auto"
            >
              Tutup Detail
            </button>
          </div>
        ) : (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center h-10 px-5 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={saving || (record && !isDirty)}
              title={
                record && !isDirty
                  ? 'Tidak ada perubahan data untuk disimpan'
                  : (record ? 'Simpan Perubahan' : 'Tambah Data')
              }
              className={`inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-theme-xs ${
                record && !isDirty
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-brand-500/20 cursor-pointer disabled:opacity-50'
              }`}
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
        )}
      </form>

      {/* Konfirmasi Hapus Draf Formulir */}
      {showResetConfirm && (
        <ConfirmModal
          open={showResetConfirm}
          title="Hapus Draf Formulir?"
          message={`Apakah Anda yakin ingin menghapus seluruh draf isian formulir ${config.label} ini? Seluruh data yang telah diketik akan dikosongkan kembali.`}
          confirmText="Ya, Kosongkan"
          type="warning"
          onConfirm={() => {
            handleClearDraft()
            setShowResetConfirm(false)
          }}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}

export default ResourceForm
