const DEFAULT_API_BASE_URL = 'http://localhost:8000/api'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')

async function parseResponse(response) {
  if (response.status === 204) {
    return null
  }

  const payload = await response.json()

  if (!response.ok) {
    const message = payload.message || 'Request gagal diproses.'
    const error = new Error(message)
    error.status = response.status
    error.errors = payload.errors || {}
    throw error
  }

  return payload.data ?? payload
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/${path.replace(/^\//, '')}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  return parseResponse(response)
}
