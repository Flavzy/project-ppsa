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
import ToastNotification from './ToastNotification'
import LoadingSpinner from './common/LoadingSpinner'
import { clearFormDraft } from '../utils/formDraft'

function ResourceDashboard({ config, resourceConfigs, supportResources, onNavigate }) {
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
  }, [config.fields, resourceConfigs, supportResources])

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
    if (config.key === 'pekerjaan' && ['operator', 'sales'].includes(user?.role) && editingRecord) {
      const opPicId = editingRecord.operator_pic_id ?? editingRecord.klien?.kontrak?.calon_klien?.id_user ?? editingRecord.klien?.kontrak?.calonKlien?.id_user
      if (opPicId != null && Number(opPicId) !== Number(user?.id_user)) {
        const errorMsg = 'Anda bukan Operator PIC untuk pekerjaan ini sehingga tidak berwenang mengubah data.'
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
      // Bersihkan draf form setelah konfirmasi selesai / simpan berhasil
      clearFormDraft(config.key, user?.id_user)
      setFormVersion((v) => v + 1)
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
      setApprovingRecord(null)
      await reload()
    } catch (err) {
      setError(err.message || 'Gagal menyetujui pekerjaan.')
      setToast({ open: true, message: err.message || 'Gagal menyetujui pekerjaan.', severity: 'error' })
    } finally {
      setApprovingLoading(false)
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
          setSuccessMessage(msg)
          setToast({ open: true, message: msg, severity: 'success' })
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          await reload()
        } catch (err) {
          setError(err.message || 'Gagal memulai pengerjaan tugas.')
          setToast({ open: true, message: err.message || 'Gagal memulai pengerjaan tugas.', severity: 'error' })
          setConfirmDialog((prev) => ({ ...prev, loading: false }))
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
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs transition-all active:scale-95 self-start sm:self-auto cursor-pointer disabled:opacity-50"
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
        <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/60 dark:bg-indigo-500/10 flex items-start sm:items-center gap-3.5 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
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

      {/* Form disembunyikan jika role tidak berhak membuat data baru (kecuali saat mode edit), serta untuk modul kontrak dan klien */}
      {(canCreate || editingRecord) && !((config.key === 'kontrak' || config.key === 'klien') && !editingRecord) && (
        <ResourceForm
          key={editingRecord ? editingRecord[config.primaryKey] : `${config.key}_v${formVersion}`}
          config={config}
          record={editingRecord}
          options={options}
          saving={saving}
          errors={validationErrors}
          currentUser={user}
          canCreate={['kontrak', 'klien'].includes(config.key) ? false : canCreate}
          canEdit={canEdit}
          onCancel={() => setEditingRecord(null)}
          onSubmit={handleSubmit}
        />
      )}

      <ResourceTable
        config={config}
        records={records}
        loading={loading}
        canCreate={['kontrak', 'klien'].includes(config.key) ? false : canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        user={user}
        onEdit={setEditingRecord}
        onDelete={handleDelete}
        onConvert={setConvertingLead}
        onViewLegalitas={setViewingLegalitas}
        onViewContract={setViewingContract}
        onApproveTask={config.key === 'reporting' ? handleApproveTask : undefined}
        onRejectTask={config.key === 'reporting' ? handleRejectTask : undefined}
        onStartTask={config.key === 'pekerjaan' ? handleStartTask : undefined}
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
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}

export default ResourceDashboard
