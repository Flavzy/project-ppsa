/**
 * Utility untuk menyimpan, membaca, dan membersihkan draf input form antar navigasi menu.
 * Berlaku di semua role (Pimpinan, Operator, Karyawan) dan semua modul/resource.
 */

export function getDraftStorageKey(configKey, userId) {
  return `ppsa_draft_${userId || 'guest'}_${configKey}`
}

export function loadFormDraft(configKey, userId) {
  try {
    const raw = localStorage.getItem(getDraftStorageKey(configKey, userId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch (err) {
    console.warn('Gagal membaca draf form:', err)
    return null
  }
}

export function saveFormDraft(configKey, userId, values) {
  try {
    if (!values || Object.keys(values).length === 0) {
      localStorage.removeItem(getDraftStorageKey(configKey, userId))
      return
    }

    const serializable = {}
    Object.entries(values).forEach(([k, v]) => {
      // Abaikan objek File / Blob karena tidak dapat diserialisasi ke JSON
      if (!(v instanceof File) && !(v instanceof Blob)) {
        serializable[k] = v
      }
    })

    localStorage.setItem(getDraftStorageKey(configKey, userId), JSON.stringify(serializable))
  } catch (err) {
    console.warn('Gagal menyimpan draf form:', err)
  }
}

export function clearFormDraft(configKey, userId) {
  try {
    localStorage.removeItem(getDraftStorageKey(configKey, userId))
  } catch (err) {
    console.warn('Gagal membersihkan draf form:', err)
  }
}
