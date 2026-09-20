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
import { useAuth } from '../auth/useAuth'
import ConvertLeadModal from './ConvertLeadModal'
import ResourceForm from './ResourceForm'
import ResourceTable from './ResourceTable'

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

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [resourceRecords, optionEntries] = await Promise.all([
        listResource(config.endpoint),
        Promise.all(
          optionConfigs.map(async (optionConfig) => [
            optionConfig.key,
            await listResource(optionConfig.endpoint),
          ]),
        ),
      ])

      setRecords(resourceRecords)
      setOptions(Object.fromEntries(optionEntries))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [config.endpoint, optionConfigs])

  useEffect(() => {
    let ignore = false

    async function fetchRecords() {
      try {
        const [resourceRecords, optionEntries] = await Promise.all([
          listResource(config.endpoint),
          Promise.all(
            optionConfigs.map(async (optionConfig) => [
              optionConfig.key,
              await listResource(optionConfig.endpoint),
            ]),
          ),
        ])

        if (!ignore) {
          setRecords(resourceRecords)
          setOptions(Object.fromEntries(optionEntries))
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message)
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
  }, [config.endpoint, optionConfigs])

  async function handleSubmit(payload) {
    setSaving(true)
    setError('')
    setSuccessMessage('')
    setValidationErrors({})

    try {
      if (editingRecord) {
        await updateResource(
          config.endpoint,
          config.primaryKey,
          editingRecord[config.primaryKey],
          payload,
        )
        setSuccessMessage(`Data ${config.label} berhasil diperbarui.`)
      } else {
        await createResource(config.endpoint, payload)
        setSuccessMessage(`Data ${config.label} berhasil ditambahkan.`)
      }

      setEditingRecord(null)
      await reload()
    } catch (requestError) {
      setError(requestError.message)
      setValidationErrors(requestError.errors || {})
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record) {
    const label = record[config.displayField] || `#${record[config.primaryKey]}`

    if (!confirm(`Hapus ${config.label} ${label}?`)) {
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      await deleteResource(config.endpoint, record[config.primaryKey])
      setSuccessMessage(`Data ${config.label} berhasil dihapus.`)
      await reload()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleSubmitTask(record) {
    if (!confirm(`Kirim pekerjaan "${record.judul}" untuk ditinjau oleh pimpinan?`)) {
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      await submitPekerjaan(record.id_pekerjaan, { progress_persen: 100 })
      setSuccessMessage(`Pekerjaan "${record.judul}" berhasil disubmit untuk direview.`)
      await reload()
    } catch (err) {
      setError(err.message || 'Gagal mengirim pekerjaan.')
    }
  }

  async function handleApproveTask(record) {
    const note = prompt('Catatan persetujuan (opsional):', 'Pekerjaan telah diverifikasi dan disetujui.')
    if (note === null) return

    setError('')
    setSuccessMessage('')

    try {
      await approvePekerjaan(record.id_pekerjaan, { catatan_review: note })
      setSuccessMessage(`Pekerjaan "${record.judul}" berhasil disetujui (Status: Selesai).`)
      await reload()
    } catch (err) {
      setError(err.message || 'Gagal menyetujui pekerjaan.')
    }
  }

  async function handleRejectTask(record) {
    const note = prompt('Catatan revisi untuk karyawan:', 'Harap perbaiki dan lengkapi bukti dokumen.')
    if (!note) return

    setError('')
    setSuccessMessage('')

    try {
      await rejectPekerjaan(record.id_pekerjaan, { catatan_review: note })
      setSuccessMessage(`Pekerjaan "${record.judul}" dikembalikan untuk revisi.`)
      await reload()
    } catch (err) {
      setError(err.message || 'Gagal meminta revisi pekerjaan.')
    }
  }

  async function handlePublishReport(record) {
    if (!confirm(`Publikasikan laporan ID #${record.id_reporting} ke klien?`)) {
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      await publishReportingClient(record.id_reporting)
      setSuccessMessage(`Laporan ID #${record.id_reporting} berhasil dipublikasikan ke klien.`)
      await reload()
    } catch (err) {
      setError(err.message || 'Gagal mempublikasikan laporan.')
    }
  }

  return (
    <section className="resource-panel">
      <div className="panel-copy">
        <p className="eyebrow">Modul Operasional</p>
        <h1>{config.label}</h1>
        <p>Kelola dan pantau data {config.label.toLowerCase()}.</p>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <ResourceForm
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
            reload()
          }}
        />
      )}
    </section>
  )
}

export default ResourceDashboard
