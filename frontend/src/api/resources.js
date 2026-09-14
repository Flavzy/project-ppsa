import { apiRequest } from './client'

export function listResource(endpoint) {
  return apiRequest(endpoint)
}

export function createResource(endpoint, payload) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateResource(endpoint, primaryKey, id, payload) {
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
