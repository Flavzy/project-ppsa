import { useEffect, useMemo, useState } from 'react'
import { createResource, deleteResource, listResource, updateResource } from '../api/resources'
import ResourceForm from './ResourceForm'
import ResourceTable from './ResourceTable'

function ResourceDashboard({ config, resourceConfigs, supportResources }) {
  const [records, setRecords] = useState([])
  const [options, setOptions] = useState({})
  const [editingRecord, setEditingRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const optionConfigs = useMemo(() => {
    const relationKeys = config.fields
      .filter((field) => field.optionsResource)
      .map((field) => field.optionsResource)
    const allResources = [...resourceConfigs, ...supportResources]

    return relationKeys
      .map((key) => allResources.find((resource) => resource.key === key))
      .filter(Boolean)
  }, [config.fields, resourceConfigs, supportResources])

  async function loadData() {
    setLoading(true)
    setError('')

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
  }

  useEffect(() => {
    setEditingRecord(null)
    setValidationErrors({})
    loadData()
  }, [config.key])

  async function handleSubmit(payload) {
    setSaving(true)
    setError('')
    setValidationErrors({})

    try {
      if (editingRecord) {
        await updateResource(
          config.endpoint,
          config.primaryKey,
          editingRecord[config.primaryKey],
          payload,
        )
      } else {
        await createResource(config.endpoint, payload)
      }

      setEditingRecord(null)
      await loadData()
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

    try {
      await deleteResource(config.endpoint, record[config.primaryKey])
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="resource-panel">
      <div className="panel-copy">
        <p className="eyebrow">Resource aktif</p>
        <h1>{config.label}</h1>
        <p>Kelola data {config.label.toLowerCase()} melalui API Laravel.</p>
      </div>

      {error && <div className="alert">{error}</div>}

      <ResourceForm
        config={config}
        record={editingRecord}
        options={options}
        saving={saving}
        errors={validationErrors}
        onCancel={() => setEditingRecord(null)}
        onSubmit={handleSubmit}
      />

      <ResourceTable
        config={config}
        records={records}
        loading={loading}
        onEdit={setEditingRecord}
        onDelete={handleDelete}
      />
    </section>
  )
}

export default ResourceDashboard
