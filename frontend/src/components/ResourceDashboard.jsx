import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approvePekerjaan,
  createResource,
  deleteResource,
  listResource,
  rejectPekerjaan,
  startPekerjaan,
  submitPekerjaan,
  updateResource,
} from '../api/resources'
import { getCachedApiData, invalidateApiCache } from '../api/client'
import { useAuth } from '../auth/useAuth'
import ConfirmModal from './ConfirmModal'
import ConvertLeadModal from './ConvertLeadModal'
import DetailLegalitasModal from './DetailLegalitasModal'
import DraftKontrakModal from './DraftKontrakModal'
import ApproveTaskModal from './ApproveTaskModal'
import PromptModal from './PromptModal'
import ResourceForm from './ResourceForm'
import ResourceTable from './ResourceTable'
import BatchTaskAssignmentCard from './BatchTaskAssignmentCard'
import ToastNotification from './ToastNotification'
import LoadingSpinner from './common/LoadingSpinner'
import { clearFormDraft } from '../utils/formDraft'

function ResourceDashboard({
  config,
  resourceConfigs,
  supportResources,
  onNavigate,
  initialNavParams,
  onClearNavParams,
}) {
  const { user } = useAuth()
  const cachedRecords = getCachedApiData(config.endpoint)
  const [records, setRecords] = useState(() => (Array.isArray(cachedRecords) ? cachedRecords : []))
  const [options, setOptions] = useState({})
  const [editingRecord, setEditingRecord] = useState(null)
  const [loading, setLoading] = useState(() => !Array.isArray(cachedRecords))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [convertingLead, setConvertingLead] = useState(null)
  const [viewingLegalitas, setViewingLegalitas] = useState(null)
  const [viewingContract, setViewingContract] = useState(null)
  const [formVersion, setFormVersion] = useState(0)
  const [taskMode, setTaskMode] = useState('batch') // 'batch' (dari template layanan) | 'custom' (manual)
  const [isFormOpen, setIsFormOpen] = useState(() => {
    if (config.key === 'pekerjaan') {
      if (initialNavParams) return true
      try {
        const stored = sessionStorage.getItem('target_batch_assignment')
        if (stored) return true
      } catch {}
    }
    return false
  })

  // Custom modal dialogs to replace browser confirm/prompt
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    type: 'warning',
    action: null,
    loading: false,
  })

  const [promptDialog, setPromptDialog] = useState({
    open: false,
    title: '',
    message: '',
    defaultValue: '',
    placeholder: '',
    confirmText: 'Simpan',
    attachmentUrl: null,
    attachmentLabel: '',
    notePreview: '',
    action: null,
    loading: false,
  })

  const [approvingRecord, setApprovingRecord] = useState(null)
  const [approvingLoading, setApprovingLoading] = useState(false)

  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const handleCloseToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }))
  }, [])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => {
      setSuccessMessage('')
    }, 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const canCreate = config.canCreate ? config.canCreate.includes(user?.role) : true
  const canEdit = config.canEdit ? config.canEdit.includes(user?.role) : true
  const canDelete = config.canDelete ? config.canDelete.includes(user?.role) : true

  const optionConfigs = useMemo(() => {
    const relationKeys = config.fields
      .filter((field) => field.optionsResource)
      .map((field) => field.optionsResource)
    const allResources = [...resourceConfigs, ...supportResources]

    const extraKeys = config.key === 'pekerjaan' ? ['layanan', 'kontrak', 'klien', 'users', 'masterPekerjaan'] : []
    const combinedKeys = Array.from(new Set([...relationKeys, ...extraKeys]))

    return combinedKeys
      .map((key) => allResources.find((resource) => resource.key === key))
      .filter(Boolean)
  }, [config.fields, config.key, resourceConfigs, supportResources])

  const karyawanEmployees = useMemo(
    () => (options.users || []).filter((u) => u.role === 'karyawan'),
    [options.users]
  )

  const activeServices = useMemo(
    () => (options.layanan || []).filter((l) => Boolean(l.is_active)),
    [options.layanan]
  )

  const loadOptionsSafely = useCallback(async () => {
    const entries = await Promise.all(
      optionConfigs.map(async (optionConfig) => {
        try {
          const res = await listResource(optionConfig.endpoint)
          return [optionConfig.key, res]
        } catch {
          return [optionConfig.key, []]
        }
      }),
    )
    return Object.fromEntries(entries)
  }, [optionConfigs])

  const reload = useCallback(async () => {
    invalidateApiCache()
    setLoading(true)
    setError('')
    let fetchErr = null
    try {
      const [resourceRecords, optionMap] = await Promise.all([
        listResource(config.endpoint),
        loadOptionsSafely(),
      ])

      setRecords(resourceRecords)
      setOptions(optionMap)
      return resourceRecords
    } catch (requestError) {
      fetchErr = requestError
    } finally {
      setLoading(false)
    }
    if (fetchErr) {
      setError(fetchErr.message)
      setToast({ open: true, message: fetchErr.message, severity: 'error' })
    }
    return []
  }, [config.endpoint, loadOptionsSafely])

  useEffect(() => {
    let ignore = false
    const cached = getCachedApiData(config.endpoint)
    if (Array.isArray(cached) && cached.length > 0) {
      setRecords(cached)
    } else {
      setRecords([])
    }
    setLoading(true)

    async function fetchRecords() {
      let fetchErr = null
      try {
        const [resourceRecords, optionMap] = await Promise.all([
          listResource(config.endpoint),
          loadOptionsSafely(),
        ])

        if (!ignore) {
          setRecords(resourceRecords)
          setOptions(optionMap)
        }
      } catch (requestError) {
        if (!ignore) {
          fetchErr = requestError
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
      if (!ignore && fetchErr) {
        setError(fetchErr.message)
        setToast({ open: true, message: fetchErr.message, severity: 'error' })
      }
    }

      fetchRecords()

      return () => {
        ignore = true
      }
    }, [config.endpoint, config.key])

  useEffect(() => {
    if (config.key === 'pekerjaan') {
      if (initialNavParams) {
        setIsFormOpen(true)
        setTaskMode('batch')
        setEditingRecord(null)
        return
      }
      try {
        const stored = sessionStorage.getItem('target_batch_assignment')
        if (stored) {
          setIsFormOpen(true)
          setTaskMode('batch')
          setEditingRecord(null)
          return
        }
      } catch {}
    }
    setIsFormOpen(false)
    setEditingRecord(null)
  }, [config.key, initialNavParams])

  async function handleSubmit(payload) {
    if (['pekerjaan', 'kontrak', 'klien'].includes(config.key) && ['operator', 'sales'].includes(user?.role) && editingRecord) {
      const opPicId =
        editingRecord.operator_pic_id ??
        editingRecord.calon_klien?.id_user ??
        editingRecord.calonKlien?.id_user ??
        editingRecord.kontrak?.calon_klien?.id_user ??
        editingRecord.kontrak?.calonKlien?.id_user ??
        editingRecord.klien?.kontrak?.calon_klien?.id_user ??
        editingRecord.klien?.kontrak?.calonKlien?.id_user
      if (opPicId != null && Number(opPicId) !== Number(user?.id_user)) {
        const errorMsg = 'Anda bukan Operator PIC untuk data ini sehingga tidak berwenang mengubah data.'
        setError(errorMsg)
        setToast({ open: true, message: errorMsg, severity: 'error' })
        return
      }
    }

    setSaving(true)
    setError('')
    setSuccessMessage('')
    setValidationErrors({})

    try {
      let successMsg = ''
      let createdRecord = null
      if (editingRecord) {
        await updateResource(
          config.endpoint,
          config.primaryKey,
          editingRecord[config.primaryKey],
          payload,
        )
        successMsg = `Data ${config.label} berhasil diperbarui.`
      } else {
        const res = await createResource(config.endpoint, payload)
        createdRecord = res?.data || res
        successMsg = `Data ${config.label} berhasil ditambahkan.`
      }

      // Bersihkan draf form dan muat ulang data terlebih dahulu sampai data baru benar-benar muncul di tabel
      clearFormDraft(config.key, user?.id_user)
      invalidateApiCache()
      const freshRecords = await reload()
      setEditingRecord(null)
      setIsFormOpen(false)
      setFormVersion((v) => v + 1)
      setSaving(false)

      const targetLead = config.key === 'calonKlien' && createdRecord
        ? (Array.isArray(freshRecords) ? freshRecords.find((r) => Number(r.id_calon_klien) === Number(createdRecord.id_calon_klien)) : null) || createdRecord
        : null

      const isTargetLeadDeal = targetLead && String(targetLead.status_prospek || '').toLowerCase() === 'deal'
      const hasTargetLeadActiveContract = Boolean(
        targetLead?.kontrak && targetLead.kontrak.status && targetLead.kontrak.status !== 'draft'
      )
      const canConvertTargetLead =
        isTargetLeadDeal &&
        !hasTargetLeadActiveContract &&
        ['admin', 'pimpinan', 'operator', 'sales'].includes(user?.role)

      // Munculkan notifikasi saat data baru/perubahan sudah ada di tabel dan sinkronkan lonceng
      setToast({
        open: true,
        message: successMsg,
        severity: 'success',
        action: canConvertTargetLead
          ? {
              label: 'Konversi ke Kontrak',
              onClick: () => setConvertingLead(targetLead),
            }
          : null,
      })
      window.dispatchEvent(new CustomEvent('simkk:data-mutated'))
    } catch (requestError) {
      setSaving(false)
      setValidationErrors(requestError.errors || {})
      setError(requestError.message)
      setToast({ open: true, message: requestError.message, severity: 'error' })
    }
  }

  function handleDelete(record) {
    const label = record[config.displayField] || `#${record[config.primaryKey]}`

    setConfirmDialog({
      open: true,
      title: `Hapus ${config.label}`,
      message: `Apakah Anda yakin ingin menghapus data ${config.label} "${label}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus',
      type: 'danger',
      action: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }))
        setError('')
        setSuccessMessage('')

        try {
          await deleteResource(config.endpoint, record[config.primaryKey])
          const msg = `Data ${config.label} berhasil dihapus.`
          invalidateApiCache()
          await reload()
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'info' })
          window.dispatchEvent(new CustomEvent('simkk:data-mutated'))
        } catch (requestError) {
          setConfirmDialog((prev) => ({ ...prev, loading: false }))
          setError(requestError.message)
          setToast({ open: true, message: requestError.message, severity: 'error' })
        }
      },
    })
  }

  function handleBulkDelete(ids, onComplete) {
    if (!ids || !ids.length) return

    setConfirmDialog({
      open: true,
      title: `Hapus ${ids.length} Data ${config.label}`,
      message: `Apakah Anda yakin ingin menghapus ${ids.length} data ${config.label} terpilih sekaligus? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: `Ya, Hapus (${ids.length})`,
      type: 'danger',
      action: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }))
        setError('')
        setSuccessMessage('')

        try {
          await Promise.all(ids.map((id) => deleteResource(config.endpoint, id)))
          const msg = `Berhasil menghapus ${ids.length} data ${config.label}.`
          onComplete?.()
          invalidateApiCache()
          await reload()
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'info' })
          window.dispatchEvent(new CustomEvent('simkk:data-mutated'))
        } catch (requestError) {
          setConfirmDialog((prev) => ({ ...prev, loading: false }))
          setError(requestError.message)
          setToast({ open: true, message: requestError.message, severity: 'error' })
        }
      },
    })
  }

  function handleApproveTask(record) {
    setApprovingRecord(record)
  }

  async function handleConfirmApproveTask(payload) {
    if (!approvingRecord) return
    const isReporting = config.key === 'reporting'
    const targetPekerjaanId = isReporting
      ? (approvingRecord.id_pekerjaan || approvingRecord.pekerjaan?.id_pekerjaan)
      : approvingRecord.id_pekerjaan
    const jobTitle = isReporting
      ? (approvingRecord.pekerjaan?.judul || `Pekerjaan #${targetPekerjaanId}`)
      : approvingRecord.judul

    setApprovingLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      await approvePekerjaan(targetPekerjaanId, payload)
      const hasRating = payload.quality_score !== null && payload.quality_score !== undefined
      const msg = `Pekerjaan "${jobTitle}" berhasil disetujui (Status: Selesai)${
        hasRating ? ' dan nilai kinerja karyawan telah dicatat' : ''
      }.`
      invalidateApiCache()
      await reload()
      setApprovingRecord(null)
      setApprovingLoading(false)
      setSuccessMessage(msg)
      setToast({
        open: true,
        message: msg,
        severity: 'success',
        action: hasRating && onNavigate
          ? {
              label: 'Buka Menu Kinerja Karyawan',
              onClick: () => onNavigate('kinerjaKaryawan'),
            }
          : null,
      })
      window.dispatchEvent(new CustomEvent('simkk:data-mutated'))
    } catch (err) {
      setApprovingLoading(false)
      setError(err.message || 'Gagal menyetujui pekerjaan.')
      setToast({ open: true, message: err.message || 'Gagal menyetujui pekerjaan.', severity: 'error' })
    }
  }

  function handleRejectTask(record) {
    const isReporting = config.key === 'reporting'
    const targetPekerjaanId = isReporting ? (record.id_pekerjaan || record.pekerjaan?.id_pekerjaan) : record.id_pekerjaan
    const jobTitle = isReporting ? (record.pekerjaan?.judul || `Pekerjaan #${targetPekerjaanId}`) : record.judul
    const fileUrl = isReporting
      ? (record.dokumen_bukti_url || record.pekerjaan?.file_tugas_url)
      : (record.file_tugas_url || record.latest_reporting?.dokumen_bukti_url)
    const fileUrls = isReporting
      ? (record.dokumen_bukti_urls?.length ? record.dokumen_bukti_urls : (record.pekerjaan?.file_tugas_urls?.length ? record.pekerjaan.file_tugas_urls : []))
      : (record.file_tugas_urls?.length ? record.file_tugas_urls : (record.latest_reporting?.dokumen_bukti_urls?.length ? record.latest_reporting.dokumen_bukti_urls : []))
    const notePreview = isReporting
      ? (record.catatan || record.pekerjaan?.catatan_karyawan)
      : record.catatan_karyawan

    setPromptDialog({
      open: true,
      title: 'Minta Revisi Pekerjaan',
      message: `Tuliskan catatan perbaikan untuk karyawan atas pekerjaan "${jobTitle}":`,
      defaultValue: 'Harap perbaiki dan lengkapi bukti dokumen.',
      placeholder: 'Tuliskan instruksi perbaikan...',
      confirmText: 'Kirim Permintaan Revisi',
      attachmentUrl: fileUrl,
      attachmentUrls: fileUrls,
      attachmentLabel: 'Buka / Unduh Berkas Tugas Karyawan',
      notePreview: notePreview,
      action: async (note) => {
        setPromptDialog((prev) => ({ ...prev, loading: true }))
        setError('')
        setSuccessMessage('')

        try {
          await rejectPekerjaan(targetPekerjaanId, { catatan_review: note })
          const msg = `Pekerjaan "${jobTitle}" dikembalikan kepada karyawan untuk revisi.`
          invalidateApiCache()
          await reload()
          setPromptDialog((prev) => ({ ...prev, open: false, loading: false }))
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'warning' })
          window.dispatchEvent(new CustomEvent('simkk:data-mutated'))
        } catch (err) {
          setPromptDialog((prev) => ({ ...prev, loading: false }))
          setError(err.message || 'Gagal meminta revisi pekerjaan.')
          setToast({ open: true, message: err.message || 'Gagal meminta revisi pekerjaan.', severity: 'error' })
        }
      },
    })
  }

  async function handleSignContract(contract) {
    const today = new Date().toISOString().split('T')[0]
    try {
      await updateResource('kontrak', 'id_kontrak', contract.id_kontrak, {
        status: 'aktif',
        ditandatangani_pada: today,
      })
      const msg = `Kontrak ${contract.no_kontrak} berhasil ditandatangani dan berstatus Aktif!`
      setViewingContract((prev) =>
        prev
          ? {
              ...prev,
              status: 'aktif',
              ditandatangani_pada: today,
              kontrak: prev.kontrak
                ? { ...prev.kontrak, status: 'aktif', ditandatangani_pada: today }
                : undefined,
            }
          : null,
      )
      invalidateApiCache()
      await reload()
      setSuccessMessage(msg)
      setToast({ open: true, message: msg, severity: 'success' })
      window.dispatchEvent(new CustomEvent('simkk:data-mutated'))
    } catch (err) {
      setError(err.message || 'Gagal menandatangani kontrak.')
      setToast({ open: true, message: err.message || 'Gagal menandatangani kontrak.', severity: 'error' })
      throw err
    }
  }

  async function handleStartTask(record) {
    setConfirmDialog({
      open: true,
      title: 'Mulai Kerjakan Tugas',
      message: `Apakah Anda ingin menandai tugas "${record.judul}" sebagai sedang dikerjakan? Status akan berubah menjadi "Dalam Pengerjaan".`,
      confirmText: 'Ya, Mulai Kerjakan',
      type: 'info',
      action: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }))
        setError('')
        setSuccessMessage('')

        try {
          await startPekerjaan(record.id_pekerjaan)
          const msg = `Tugas "${record.judul}" berhasil dimulai (Status: Dalam Pengerjaan).`
          invalidateApiCache()
          await reload()
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'success' })
          window.dispatchEvent(new CustomEvent('simkk:data-mutated'))
        } catch (err) {
          setConfirmDialog((prev) => ({ ...prev, loading: false }))
          setError(err.message || 'Gagal memulai pengerjaan tugas.')
          setToast({ open: true, message: err.message || 'Gagal memulai pengerjaan tugas.', severity: 'error' })
        }
      },
    })
  }

  const isDirectCreateAllowed = canCreate && !['kontrak', 'klien'].includes(config.key)
  const shouldShowForm = Boolean(editingRecord) || (isDirectCreateAllowed && isFormOpen)

  const handleRequestReload = () => {
    setConfirmDialog({
      open: true,
      title: 'Segarkan Data dari Server?',
      message: `Apakah Anda ingin menyinkronkan ulang data ${config.label} langsung dari server? Seluruh data pada tabel akan diperbarui ke versi terkini.`,
      confirmText: 'Ya, Segarkan',
      type: 'info',
      action: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }))
        try {
          await reload()
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          setToast({
            open: true,
            message: `Data ${config.label} berhasil disinkronkan dari server.`,
            severity: 'success',
          })
        } catch {
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {config.key === 'pekerjaan' && user?.role === 'karyawan'
              ? 'Tugas & Penugasan'
              : config.key === 'kinerjaKaryawan' && user?.role === 'karyawan'
              ? 'Evaluasi & Penilaian Pribadi'
              : config.key === 'kinerjaKaryawan' && user?.role === 'pimpinan'
              ? 'Evaluasi & Penilaian Karyawan'
              : 'Modul Operasional'}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mt-1">
            {config.key === 'pekerjaan' && user?.role === 'karyawan'
              ? 'Pekerjaan Saya'
              : config.key === 'kinerjaKaryawan' && user?.role === 'karyawan'
              ? 'Kinerja Saya'
              : config.label}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {config.key === 'pekerjaan' && user?.role === 'karyawan'
              ? 'Daftar penugasan dan pekerjaan yang ditugaskan secara khusus kepada Anda.'
              : config.key === 'reporting' && user?.role === 'pimpinan'
              ? 'Pantau riwayat laporan progres dan periksa berkas penyerahan tugas dari seluruh karyawan.'
              : config.key === 'kinerjaKaryawan' && user?.role === 'karyawan'
              ? 'Pantau riwayat evaluasi, skor kecepatan, kualitas kerja, dan catatan penilaian kinerja Anda dari pimpinan.'
              : config.key === 'kinerjaKaryawan' && user?.role === 'pimpinan'
              ? 'Kelola, evaluasi, dan pantau penilaian kinerja seluruh karyawan secara komprehensif.'
              : `Kelola dan pantau data ${config.label.toLowerCase()} secara komprehensif.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Tombol Tambah Data Baru (Hanya saat melihat daftar tabel) */}
          {!shouldShowForm && isDirectCreateAllowed && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-theme-xs shadow-brand-500/20 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>
                {config.key === 'calonKlien'
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
                  : `Tambah ${config.label} Baru`}
              </span>
            </button>
          )}

          {/* Tombol Refresh Data dengan Dialog Konfirmasi (Hanya saat melihat daftar tabel) */}
          {!shouldShowForm && (
            <button
              type="button"
              onClick={handleRequestReload}
              disabled={loading}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Sinkronkan ulang data dari server"
            >
              {loading ? (
                <LoadingSpinner size="xs" text="" />
              ) : (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span>{loading ? 'Menyegarkan...' : 'Refresh Data'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-error-200 bg-error-50 text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Callout Panduan Alur untuk Modul Kontrak */}
      {config.key === 'kontrak' && !editingRecord && (
        <div className="p-4 rounded-2xl border border-brand-200 bg-brand-50/70 dark:border-brand-900/60 dark:bg-brand-500/10 flex items-start sm:items-center gap-3.5 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">Alur Penerbitan Kontrak Baru</h5>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Untuk menerbitkan kontrak baru, silakan lakukan melalui tombol <strong>Konversi</strong> pada menu <strong>Calon Klien</strong> yang sudah berstatus <strong>Deal</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Callout Panduan Alur untuk Modul Klien */}
      {config.key === 'klien' && !editingRecord && (
        <div className="p-4 rounded-2xl border border-blue-light-200 bg-blue-light-50/70 dark:border-blue-light-900/60 dark:bg-blue-light-500/10 flex items-start sm:items-center gap-3.5 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-light-100 text-blue-light-600 dark:bg-blue-light-500/20 dark:text-blue-light-400">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">Informasi Data Klien</h5>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Data Klien otomatis terdaftar saat <strong>Calon Klien</strong> berstatus <strong>Deal</strong> dikonversi menjadi Kontrak resmi. Menu ini digunakan untuk meninjau dan memperbarui informasi klien aktif.
            </p>
          </div>
        </div>
      )}

      {/* Callout Panduan untuk Modul Pekerjaan bagi Pimpinan / Admin */}
      {config.key === 'pekerjaan' && ['admin', 'pimpinan'].includes(user?.role) && !editingRecord && (
        <div className="p-4 rounded-2xl border border-brand-200 bg-brand-50/70 dark:border-brand-900/60 dark:bg-brand-500/10 flex items-start sm:items-center gap-3.5 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">Pusat Pengelolaan Tugas & Penugasan</h5>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Gunakan menu ini untuk membuat tugas, menetapkan PIC karyawan, mengatur batas waktu, serta mengedit atau menghapus pekerjaan. Untuk memeriksa berkas laporan dan memberikan persetujuan atau revisi tugas, silakan buka menu <strong>Reporting</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Callout Panduan untuk Modul Reporting bagi Pimpinan / Admin */}
      {config.key === 'reporting' && ['admin', 'pimpinan'].includes(user?.role) && (
        <div className="p-4 rounded-2xl border border-blue-light-200 bg-blue-light-50/70 dark:border-blue-light-900/60 dark:bg-blue-light-500/10 flex items-start sm:items-center gap-3.5 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-light-100 text-blue-light-600 dark:bg-blue-light-500/20 dark:text-blue-light-400">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">Pusat Peninjauan & Persetujuan Laporan Karyawan</h5>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Periksa berkas bukti tugas yang dikumpulkan karyawan dan ambil keputusan langsung di sini. Klik tombol <strong>Setujui</strong> untuk menyelesaikan pekerjaan secara resmi atau <strong>Revisi</strong> jika tugas memerlukan perbaikan.
            </p>
          </div>
        </div>
      )}

      {/* Khusus Modul Pekerjaan saat Mode Penugasan Baru: Tab Penugasan Batch vs Custom */}
      {config.key === 'pekerjaan' && shouldShowForm && !editingRecord && canCreate && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/60 max-w-xl">
          <button
            type="button"
            onClick={() => setTaskMode('batch')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              taskMode === 'batch'
                ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Penugasan dari Layanan (Batch)</span>
          </button>

          <button
            type="button"
            onClick={() => setTaskMode('custom')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              taskMode === 'custom'
                ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Pekerjaan Kustom / Manual</span>
          </button>
        </div>
      )}

      {/* Render Batch Task Card jika pekerjaan & mode batch */}
      {config.key === 'pekerjaan' && shouldShowForm && !editingRecord && canCreate && taskMode === 'batch' && (
        <BatchTaskAssignmentCard
          initialTarget={initialNavParams}
          clients={options.klien || []}
          contracts={options.kontrak || []}
          services={activeServices}
          employees={karyawanEmployees}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingRecord(null)
            onClearNavParams?.()
            try { sessionStorage.removeItem('target_batch_assignment') } catch {}
          }}
          onSuccess={async (msg) => {
            setIsFormOpen(false)
            onClearNavParams?.()
            try { sessionStorage.removeItem('target_batch_assignment') } catch {}
            // Muat ulang data ke tabel terlebih dahulu sampai data baru benar-benar muncul
            invalidateApiCache()
            await reload()
            // Setelah data baru sudah ada di tabel, baru munculkan notifikasi & perbarui lonceng
            setToast({ open: true, message: msg, severity: 'success' })
            window.dispatchEvent(new CustomEvent('simkk:data-mutated'))
          }}
        />
      )}

      {/* Form ditampilkan saat mode tambah baru dibuka atau sedang mengedit data */}
      {shouldShowForm &&
        !((config.key === 'kontrak' || config.key === 'klien') && !editingRecord) &&
        !(config.key === 'pekerjaan' && !editingRecord && taskMode === 'batch') && (
        <ResourceForm
          key={editingRecord ? editingRecord[config.primaryKey] : `${config.key}_v${formVersion}`}
          config={config}
          record={editingRecord}
          existingRecords={records}
          options={options}
          saving={saving}
          errors={validationErrors}
          currentUser={user}
          canCreate={['kontrak', 'klien'].includes(config.key) ? false : canCreate}
          canEdit={canEdit}
          onCancel={() => {
            setEditingRecord(null)
            setIsFormOpen(false)
          }}
          onSubmit={handleSubmit}
        />
      )}

      {/* Daftar Tabel Data: Disembunyikan saat formulir tambah/edit sedang terbuka (Focus Mode) dengan tetap mempertahankan filter & halaman */}
      <div className={shouldShowForm ? 'hidden' : 'block'}>
        <ResourceTable
          config={config}
          records={records}
          loading={loading}
          canCreate={['kontrak', 'klien'].includes(config.key) ? false : canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          user={user}
          onOpenCreate={() => setIsFormOpen(true)}
          onEdit={(rec) => {
            setEditingRecord(rec)
            setIsFormOpen(true)
          }}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onConvert={setConvertingLead}
          onViewLegalitas={setViewingLegalitas}
          onViewContract={setViewingContract}
          onApproveTask={config.key === 'reporting' ? handleApproveTask : undefined}
          onRejectTask={config.key === 'reporting' ? handleRejectTask : undefined}
          onStartTask={config.key === 'pekerjaan' ? handleStartTask : undefined}
        />
      </div>

      {convertingLead && (
        <ConvertLeadModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onSuccess={async (msg) => {
            invalidateApiCache()
            await reload()
            setConvertingLead(null)
            setSuccessMessage(msg)
            setToast({ open: true, message: msg, severity: 'success' })
            window.dispatchEvent(new CustomEvent('simkk:data-mutated'))
          }}
        />
      )}

      {viewingLegalitas && (
        <DetailLegalitasModal
          record={viewingLegalitas}
          onClose={() => setViewingLegalitas(null)}
        />
      )}

      {viewingContract && (
        <DraftKontrakModal
          lead={config.key === 'calonKlien' ? viewingContract : viewingContract.calon_klien}
          contract={config.key === 'kontrak' ? viewingContract : viewingContract.kontrak}
          onClose={() => setViewingContract(null)}
        />
      )}

      {/* Modal Shortcut Penilaian Cepat saat Setujui Pekerjaan */}
      <ApproveTaskModal
        open={Boolean(approvingRecord)}
        record={approvingRecord}
        loading={approvingLoading}
        onConfirm={handleConfirmApproveTask}
        onClose={() => setApprovingRecord(null)}
      />

      {/* Modern Confirmation Modal */}
      <ConfirmModal
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        type={confirmDialog.type}
        loading={confirmDialog.loading}
        onConfirm={confirmDialog.action}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />

      {/* Modern Prompt Modal */}
      <PromptModal
        open={promptDialog.open}
        title={promptDialog.title}
        message={promptDialog.message}
        defaultValue={promptDialog.defaultValue}
        placeholder={promptDialog.placeholder}
        confirmText={promptDialog.confirmText}
        loading={promptDialog.loading}
        attachmentUrl={promptDialog.attachmentUrl}
        attachmentUrls={promptDialog.attachmentUrls}
        attachmentLabel={promptDialog.attachmentLabel}
        notePreview={promptDialog.notePreview}
        onConfirm={(val) => promptDialog.action && promptDialog.action(val)}
        onClose={() => setPromptDialog((prev) => ({ ...prev, open: false }))}
      />

      {/* Floating In-App Toast Notification */}
      <ToastNotification
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        action={toast.action}
        onClose={handleCloseToast}
      />
    </div>
  )
}

export default ResourceDashboard
