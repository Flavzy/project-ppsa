import { apiRequest } from './client'

export function listResource(endpoint) {
  return apiRequest(endpoint)
}

export function createResource(endpoint, payload) {
  const isFormData = payload instanceof FormData
  return apiRequest(endpoint, {
    method: 'POST',
    body: isFormData ? payload : JSON.stringify(payload),
  })
}

export function updateResource(endpoint, primaryKey, id, payload) {
  const isFormData = payload instanceof FormData
  if (isFormData) {
    payload.append('_method', 'PUT')
    return apiRequest(`${endpoint}/${id}`, {
      method: 'POST',
      body: payload,
    }).then((record) => ({ ...record, [primaryKey]: record[primaryKey] ?? id }))
  }

  return apiRequest(`${endpoint}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }).then((record) => ({ ...record, [primaryKey]: record[primaryKey] ?? id }))
}

export function deleteResource(endpoint, id) {
  return apiRequest(`${endpoint}/${id}`, {
    method: 'DELETE',
  })
}

export function convertLead(idCalonKlien, payload) {
  return apiRequest(`calon-klien/${idCalonKlien}/convert`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function batchCreatePekerjaan(payload) {
  const isFormData = payload instanceof FormData
  return apiRequest('pekerjaan/batch', {
    method: 'POST',
    body: isFormData ? payload : JSON.stringify(payload),
  })
}

export function startPekerjaan(idPekerjaan) {
  return apiRequest(`pekerjaan/${idPekerjaan}/start`, {
    method: 'POST',
  })
}

export function submitPekerjaan(idPekerjaan, payload = { progress_persen: 100 }) {
  const isFormData = payload instanceof FormData
  return apiRequest(`pekerjaan/${idPekerjaan}/submit`, {
    method: 'POST',
    body: isFormData ? payload : JSON.stringify(payload),
  })
}

export function approvePekerjaan(idPekerjaan, payload = {}) {
  return apiRequest(`pekerjaan/${idPekerjaan}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function rejectPekerjaan(idPekerjaan, payload = {}) {
  return apiRequest(`pekerjaan/${idPekerjaan}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function publishReportingClient(idReporting) {
  return apiRequest(`reporting/${idReporting}/publish-client`, {
    method: 'POST',
  })
}

export function getDashboardSummary() {
  return apiRequest('dashboard-summary')
}
