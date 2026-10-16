const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api'
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

// In-memory cache for fast GET responses & in-flight deduplication
const requestCache = new Map()
const CACHE_TTL_MS = 20000 // 20 seconds TTL

export function invalidateApiCache() {
  requestCache.clear()
}

export function getCachedApiData(path) {
  const cleanPath = path.replace(/^\//, '')
  const token = getToken()
  const cacheKey = `GET:${cleanPath}:${token || 'anon'}`
  const cached = requestCache.get(cacheKey)
  if (cached && cached.data !== undefined && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }
  return null
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
  const method = (options.method || 'GET').toUpperCase()
  const isLoginRequest = cleanPath.includes('auth/login')

  // Cache key based on path + auth token
  const token = getToken()
  const cacheKey = `${method}:${cleanPath}:${token || 'anon'}`

  // For GET requests, check cache and in-flight deduplication
  if (method === 'GET' && !options.skipCache) {
    const cached = requestCache.get(cacheKey)
    if (cached) {
      const now = Date.now()
      if (cached.data !== undefined && now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data
      }
      if (cached.promise) {
        return cached.promise
      }
    }
  }

  // Any mutation (POST, PUT, PATCH, DELETE) invalidates cached GET queries
  if (method !== 'GET') {
    requestCache.clear()
  }

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token && !options.skipAuth) {
    headers.Authorization = `Bearer ${token}`
  }

  const executeFetch = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/${cleanPath}`, {
        ...options,
        headers,
      })
      const result = await parseResponse(response, isLoginRequest)

      if (method === 'GET' && !options.skipCache) {
        requestCache.set(cacheKey, {
          timestamp: Date.now(),
          data: result,
        })
      }

      return result
    } catch (err) {
      if (method === 'GET') {
        requestCache.delete(cacheKey)
      }
      throw err
    }
  }

  if (method === 'GET' && !options.skipCache) {
    const promise = executeFetch()
    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      promise,
    })
    return promise
  }

  return executeFetch()
}

export function loginApi(email, password) {
  return apiRequest('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
}

export function getMeApi(options = {}) {
  return apiRequest('auth/me', options)
}

export function logoutApi() {
  requestCache.clear()
  return apiRequest('auth/logout', {
    method: 'POST',
  })
}
