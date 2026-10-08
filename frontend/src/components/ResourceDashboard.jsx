import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approvePekerjaan,
  createResource,
  deleteResource,
  listResource,
  publishReportingClient,
  rejectPekerjaan,
  submitPekerjaan,
  updateResource,
} from '../api/resources'
import { invalidateApiCache } from '../api/client'
import { useAuth } from '../auth/useAuth'
import ConfirmModal from './ConfirmModal'
import ConvertLeadModal from './ConvertLeadModal'
import DetailLegalitasModal from './DetailLegalitasModal'
import DraftKontrakModal from './DraftKontrakModal'
import PromptModal from './PromptModal'
import ResourceForm from './ResourceForm'
import ResourceTable from './ResourceTable'
import ToastNotification from './ToastNotification'
import LoadingSpinner from './common/LoadingSpinner'

function ResourceDashboard({ config, resourceConfigs, supportResources }) {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [options, setOptions] = useState({})
  const [editingRecord, setEditingRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [convertingLead, setConvertingLead] = useState(null)
  const [viewingLegalitas, setViewingLegalitas] = useState(null)
  const [viewingContract, setViewingContract] = useState(null)

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
    action: null,
    loading: false,
  })

  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const canCreate = config.canCreate ? config.canCreate.includes(user?.role) : true
  const canEdit = config.canEdit ? config.canEdit.includes(user?.role) : true
  const canDelete = config.canDelete ? config.canDelete.includes(user?.role) : true

  const optionConfigs = useMemo(() => {
    const relationKeys = config.fields
      .filter((field) => field.optionsResource)
      .map((field) => field.optionsResource)
    const allResources = [...resourceConfigs, ...supportResources]

    return relationKeys
      .map((key) => allResources.find((resource) => resource.key === key))
      .filter(Boolean)
      .filter((resource) => !resource.allowedRoles || resource.allowedRoles.includes(user?.role))
  }, [config.fields, resourceConfigs, supportResources, user?.role])

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
    try {
      const [resourceRecords, optionMap] = await Promise.all([
        listResource(config.endpoint),
        loadOptionsSafely(),
      ])

      setRecords(resourceRecords)
      setOptions(optionMap)
    } catch (requestError) {
      setError(requestError.message)
      setToast({ open: true, message: requestError.message, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [config.endpoint, loadOptionsSafely])

  useEffect(() => {
    let ignore = false

    async function fetchRecords() {
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
          setError(requestError.message)
          setToast({ open: true, message: requestError.message, severity: 'error' })
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchRecords()

    return () => {
      ignore = true
    }
  }, [config.endpoint, loadOptionsSafely])

  async function handleSubmit(payload) {
    setSaving(true)
    setError('')
    setSuccessMessage('')
    setValidationErrors({})

    try {
      let successMsg = ''
      if (editingRecord) {
        await updateResource(
          config.endpoint,
          config.primaryKey,
          editingRecord[config.primaryKey],
          payload,
        )
        successMsg = `Data ${config.label} berhasil diperbarui.`
      } else {
        await createResource(config.endpoint, payload)
        successMsg = `Data ${config.label} berhasil ditambahkan.`
      }

      setSuccessMessage(successMsg)
      setToast({ open: true, message: successMsg, severity: 'success' })
      setEditingRecord(null)
      await reload()
    } catch (requestError) {
      setError(requestError.message)
      setToast({ open: true, message: requestError.message, severity: 'error' })
      setValidationErrors(requestError.errors || {})
    } finally {
      setSaving(false)
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
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'info' })
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          await reload()
        } catch (requestError) {
          setError(requestError.message)
          setToast({ open: true, message: requestError.message, severity: 'error' })
          setConfirmDialog((prev) => ({ ...prev, loading: false }))
        }
      },
    })
  }

  function handleSubmitTask(record) {
    setConfirmDialog({
      open: true,
      title: 'Pengajuan Tugas Selesai',
      message: `Kirim pekerjaan "${record.judul}" untuk ditinjau dan divalidasi oleh pimpinan?`,
      confirmText: 'Kirim Pekerjaan',
      type: 'info',
      action: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }))
        setError('')
        setSuccessMessage('')

        try {
          await submitPekerjaan(record.id_pekerjaan, { progress_persen: 100 })
          const msg = `Pekerjaan "${record.judul}" berhasil diajukan untuk direview.`
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'success' })
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          await reload()
        } catch (err) {
          setError(err.message || 'Gagal mengirim pekerjaan.')
          setToast({ open: true, message: err.message || 'Gagal mengirim pekerjaan.', severity: 'error' })
          setConfirmDialog((prev) => ({ ...prev, loading: false }))
        }
      },
    })
  }

  function handleApproveTask(record) {
    setPromptDialog({
      open: true,
      title: 'Setujui Pekerjaan',
      message: `Berikan catatan persetujuan untuk pekerjaan "${record.judul}":`,
      defaultValue: 'Pekerjaan telah diverifikasi dan disetujui.',
      placeholder: 'Tuliskan catatan persetujuan...',
      confirmText: 'Setujui Pekerjaan',
      action: async (note) => {
        setPromptDialog((prev) => ({ ...prev, loading: true }))
        setError('')
        setSuccessMessage('')

        try {
          await approvePekerjaan(record.id_pekerjaan, { catatan_review: note })
          const msg = `Pekerjaan "${record.judul}" berhasil disetujui (Status: Selesai).`
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'success' })
          setPromptDialog((prev) => ({ ...prev, open: false, loading: false }))
          await reload()
        } catch (err) {
          setError(err.message || 'Gagal menyetujui pekerjaan.')
          setToast({ open: true, message: err.message || 'Gagal menyetujui pekerjaan.', severity: 'error' })
          setPromptDialog((prev) => ({ ...prev, loading: false }))
        }
      },
    })
  }

  function handleRejectTask(record) {
    setPromptDialog({
      open: true,
      title: 'Minta Revisi Pekerjaan',
      message: `Tuliskan catatan perbaikan untuk karyawan atas pekerjaan "${record.judul}":`,
      defaultValue: 'Harap perbaiki dan lengkapi bukti dokumen.',
      placeholder: 'Tuliskan instruksi perbaikan...',
      confirmText: 'Kirim Permintaan Revisi',
      action: async (note) => {
        setPromptDialog((prev) => ({ ...prev, loading: true }))
        setError('')
        setSuccessMessage('')

        try {
          await rejectPekerjaan(record.id_pekerjaan, { catatan_review: note })
          const msg = `Pekerjaan "${record.judul}" dikembalikan kepada karyawan untuk revisi.`
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'warning' })
          setPromptDialog((prev) => ({ ...prev, open: false, loading: false }))
          await reload()
        } catch (err) {
          setError(err.message || 'Gagal meminta revisi pekerjaan.')
          setToast({ open: true, message: err.message || 'Gagal meminta revisi pekerjaan.', severity: 'error' })
          setPromptDialog((prev) => ({ ...prev, loading: false }))
        }
      },
    })
  }

  function handlePublishReport(record) {
    setConfirmDialog({
      open: true,
      title: 'Publikasikan Laporan Klien',
      message: `Publikasikan laporan ID #${record.id_reporting} ke klien? Klien akan dapat melihat laporan ini secara langsung.`,
      confirmText: 'Ya, Publikasikan',
      type: 'info',
      action: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }))
        setError('')
        setSuccessMessage('')

        try {
          await publishReportingClient(record.id_reporting)
          const msg = `Laporan ID #${record.id_reporting} berhasil dipublikasikan ke klien.`
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'success' })
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          await reload()
        } catch (err) {
          setError(err.message || 'Gagal mempublikasikan laporan.')
          setToast({ open: true, message: err.message || 'Gagal mempublikasikan laporan.', severity: 'error' })
          setConfirmDialog((prev) => ({ ...prev, loading: false }))
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
      setSuccessMessage(msg)
      setToast({ open: true, message: msg, severity: 'success' })
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
      await reload()
    } catch (err) {
      setError(err.message || 'Gagal menandatangani kontrak.')
      setToast({ open: true, message: err.message || 'Gagal menandatangani kontrak.', severity: 'error' })
      throw err
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {config.key === 'pekerjaan' && user?.role === 'karyawan' ? 'Tugas & Penugasan' : 'Modul Operasional'}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mt-1">
            {config.key === 'pekerjaan' && user?.role === 'karyawan' ? 'Pekerjaan Saya' : config.label}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {config.key === 'pekerjaan' && user?.role === 'karyawan'
              ? 'Daftar penugasan dan pekerjaan yang ditugaskan secara khusus kepada Anda.'
              : `Kelola dan pantau data ${config.label.toLowerCase()} secara komprehensif.`}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs self-start sm:self-auto cursor-pointer disabled:opacity-50"
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
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-error-200 bg-error-50 text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400 text-sm font-medium">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl border border-success-200 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-500/10 dark:text-success-400 text-sm font-medium">
          {successMessage}
        </div>
      )}

      <ResourceForm
        key={editingRecord ? editingRecord[config.primaryKey] : 'new'}
        config={config}
        record={editingRecord}
        options={options}
        saving={saving}
        errors={validationErrors}
        currentUser={user}
        canCreate={canCreate}
        canEdit={canEdit}
        onCancel={() => setEditingRecord(null)}
        onSubmit={handleSubmit}
      />

      <ResourceTable
        config={config}
        records={records}
        loading={loading}
        canEdit={canEdit}
        canDelete={canDelete}
        user={user}
        onEdit={setEditingRecord}
        onDelete={handleDelete}
        onConvert={setConvertingLead}
        onViewLegalitas={setViewingLegalitas}
        onViewContract={setViewingContract}
        onSubmitTask={handleSubmitTask}
        onApproveTask={handleApproveTask}
        onRejectTask={handleRejectTask}
        onPublishReport={handlePublishReport}
      />

      {convertingLead && (
        <ConvertLeadModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onSuccess={(msg) => {
            setSuccessMessage(msg)
            setToast({ open: true, message: msg, severity: 'success' })
            reload()
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
          onSign={handleSignContract}
        />
      )}

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
        onConfirm={(val) => promptDialog.action && promptDialog.action(val)}
        onClose={() => setPromptDialog((prev) => ({ ...prev, open: false }))}
      />

      {/* Floating In-App Toast Notification */}
      <ToastNotification
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}

export default ResourceDashboard
