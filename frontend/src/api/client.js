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

const FIELD_LABEL_MAP = {
  nama_perusahaan: 'Nama Perusahaan',
  nama_klien: 'Nama Klien',
  nama_direktur: 'Nama Direktur',
  alamat_perusahaan: 'Alamat Perusahaan',
  kontak_person: 'Kontak Person',
  kontak: 'Kontak',
  email: 'Email',
  id_user: 'Operator PIC',
  status_prospek: 'Status Prospek',
  layanan_ids: 'Layanan',
  no_kontrak: 'Nomor Kontrak',
  nilai_proyek: 'Nilai Kontrak',
  tgl_mulai: 'Tanggal Mulai',
  tgl_selesai: 'Tanggal Selesai',
  status: 'Status',
  id_calon_klien: 'Calon Klien',
  id_kontrak: 'Kontrak',
  id_klien: 'Klien',
  id_pekerjaan: 'Pekerjaan',
  id_pic: 'PIC Karyawan',
  judul: 'Judul Pekerjaan',
  deadline: 'Batas Waktu (Deadline)',
  periode_bulan: 'Bulan Pengerjaan',
  deskripsi: 'Instruksi / SOP Pekerjaan',
  dokumen_bukti: 'Dokumen Bukti Laporan',
  catatan: 'Catatan',
  tgl_lapor: 'Tanggal Lapor',
  quality_score: 'Skor Kualitas',
  revision_count: 'Jumlah Revisi',
  nama: 'Nama Lengkap',
  password: 'Password',
  role: 'Role',
  nama_layanan: 'Nama Layanan',
  nama_pekerjaan: 'Nama Pekerjaan',
  sifat_periode: 'Sifat Periode',
  estimasi_hari: 'Estimasi Hari',
  template_instruksi: 'Template Instruksi',
}

export function localizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return msg
  let translated = msg
  translated = translated.replace(/^The (.+?) field is required\.?$/i, (match, field) => {
    const cleanKey = field.trim().toLowerCase().replace(/\s+/g, '_')
    const label = FIELD_LABEL_MAP[cleanKey] || (field.charAt(0).toUpperCase() + field.slice(1))
    return `${label} wajib diisi.`
  })
  translated = translated.replace(/^The (.+?) has already been taken\.?$/i, (match, field) => {
    const cleanKey = field.trim().toLowerCase().replace(/\s+/g, '_')
    const label = FIELD_LABEL_MAP[cleanKey] || (field.charAt(0).toUpperCase() + field.slice(1))
    return `${label} sudah terdaftar.`
  })
  translated = translated.replace(/^The (.+?) must be a string\.?$/i, (match, field) => {
    const cleanKey = field.trim().toLowerCase().replace(/\s+/g, '_')
    const label = FIELD_LABEL_MAP[cleanKey] || (field.charAt(0).toUpperCase() + field.slice(1))
    return `${label} harus berupa teks.`
  })
  translated = translated.replace(/^The (.+?) must be an? (integer|number|numeric)\.?$/i, (match, field) => {
    const cleanKey = field.trim().toLowerCase().replace(/\s+/g, '_')
    const label = FIELD_LABEL_MAP[cleanKey] || (field.charAt(0).toUpperCase() + field.slice(1))
    return `${label} harus berupa angka.`
  })
  return translated
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

    const rawMessage = payload.message || (
      response.status === 403
        ? 'Anda tidak memiliki akses untuk melakukan aksi ini.'
        : response.status === 401
          ? 'Session tidak valid atau telah berakhir.'
          : 'Request gagal diproses.'
    )
    const message = localizeErrorMessage(rawMessage)

    const rawErrors = payload.errors || {}
    const localizedErrors = {}
    for (const key of Object.keys(rawErrors)) {
      localizedErrors[key] = Array.isArray(rawErrors[key])
        ? rawErrors[key].map(localizeErrorMessage)
        : rawErrors[key]
    }

    const error = new Error(message)
    error.status = response.status
    error.errors = localizedErrors
    if (payload.retry_after !== undefined) {
      error.retryAfter = Number(payload.retry_after)
    }
    if (payload.lockout_stage !== undefined) {
      error.lockoutStage = Number(payload.lockout_stage)
    }
    if (payload.remaining_attempts !== undefined) {
      error.remainingAttempts = Number(payload.remaining_attempts)
    }
    if (payload.failed_attempts !== undefined) {
      error.failedAttempts = Number(payload.failed_attempts)
    }
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
    body: JSON.stringify({ email, username: email, password }),
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
