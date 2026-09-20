const DEFAULT_API_BASE_URL = 'http://localhost:8000/api'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')
const TOKEN_KEY = 'simkk_token'

let onUnauthorizedCallback = null

export function setUnauthorizedHandler(handler) {
  onUnauthorizedCallback = handler
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function parseResponse(response, isLoginRequest) {
  if (response.status === 204) {
    return null
  }

  let payload = {}
  try {
    payload = await response.json()
  } catch {
    payload = {}
  }

  if (!response.ok) {
    if (response.status === 401 && !isLoginRequest) {
      removeToken()
      if (typeof onUnauthorizedCallback === 'function') {
        onUnauthorizedCallback()
      }
    }

    const message = payload.message || (
      response.status === 403
        ? 'Anda tidak memiliki akses untuk melakukan aksi ini.'
        : response.status === 401
          ? 'Session tidak valid atau telah berakhir.'
          : 'Request gagal diproses.'
    )

    const error = new Error(message)
    error.status = response.status
    error.errors = payload.errors || {}
    throw error
  }

  return payload.data ?? payload
}

export async function apiRequest(path, options = {}) {
  const cleanPath = path.replace(/^\//, '')
  const isLoginRequest = cleanPath.includes('auth/login')

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getToken()
  if (token && !options.skipAuth) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/${cleanPath}`, {
    ...options,
    headers,
  })

  return parseResponse(response, isLoginRequest)
}

export function loginApi(email, password) {
  return apiRequest('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
}

export function getMeApi() {
  return apiRequest('auth/me')
}

export function logoutApi() {
  return apiRequest('auth/logout', {
    method: 'POST',
  })
}
