import { useState, useEffect, useRef } from 'react'

/**
 * MonthInputField
 * Komponen input bulan & tahun terstandardisasi dengan format angka MM/YYYY (contoh: 10/2026).
 * Nilai value internal yang disimpan dan dikirimkan tetap berformat ISO YYYY-MM (contoh: 2026-10).
 */
export default function MonthInputField({
  name,
  value = '',
  onChange,
  disabled = false,
  required = false,
  min = '',
  placeholder = 'mm/yyyy',
  className = '',
}) {
  const hiddenInputRef = useRef(null)

  // Format internal "YYYY-MM" (contoh: "2026-10") menjadi tampilan teks "MM/YYYY" (contoh: "10/2026")
  const formatToDisplay = (val) => {
    if (!val || typeof val !== 'string') return ''
    const parts = val.split('-')
    if (parts.length === 2 && parts[0].length === 4) {
      return `${parts[1]}/${parts[0]}`
    }
    return val
  }

  const [textVal, setTextVal] = useState(() => formatToDisplay(value))

  // Sinkronisasi jika nilai value dari parent berubah (misal saat form direset atau data diedit)
  useEffect(() => {
    setTextVal(formatToDisplay(value))
  }, [value])

  const handleTextChange = (e) => {
    const raw = e.target.value
    // Hanya izinkan angka dan slash
    const filtered = raw.replace(/[^\d/]/g, '')
    const digits = filtered.replace(/\D/g, '').slice(0, 6)

    let formatted = ''
    if (digits.length === 0) {
      formatted = ''
    } else if (digits.length === 1) {
      if (parseInt(digits, 10) > 1) {
        formatted = `0${digits}/`
      } else {
        formatted = digits
      }
    } else if (digits.length === 2) {
      let m = parseInt(digits, 10)
      if (m === 0) m = 1
      if (m > 12) m = 12
      formatted = `${String(m).padStart(2, '0')}/`
    } else {
      let m = parseInt(digits.slice(0, 2), 10)
      if (m === 0) m = 1
      if (m > 12) m = 12
      const y = digits.slice(2)
      formatted = `${String(m).padStart(2, '0')}/${y}`
    }

    setTextVal(formatted)

    if (digits.length === 6) {
      const m = formatted.slice(0, 2)
      const y = formatted.slice(3)
      const isoVal = `${y}-${m}`
      onChange(isoVal)
    } else if (digits.length === 0) {
      onChange('')
    }
  }

  const handleBlur = () => {
    if (textVal && textVal.length < 7) {
      // Jika input belum lengkap MM/YYYY saat blur, kembalikan ke nilai tersimpan yang valid
      setTextVal(formatToDisplay(value))
    }
  }

  const handlePickerChange = (e) => {
    const pickerVal = e.target.value // "YYYY-MM"
    onChange(pickerVal)
    setTextVal(formatToDisplay(pickerVal))
  }

  const openPicker = () => {
    if (disabled) return
    if (hiddenInputRef.current) {
      try {
        if (typeof hiddenInputRef.current.showPicker === 'function') {
          hiddenInputRef.current.showPicker()
        } else {
          hiddenInputRef.current.focus()
        }
      } catch {
        hiddenInputRef.current.focus()
      }
    }
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        name={name}
        value={textVal}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={7}
        disabled={disabled}
        required={required}
        autoComplete="off"
        className={
          className ||
          "w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 pr-10 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        }
      />
      {/* Visual calendar icon matching Deadline input (grid of 6 squares) */}
      <div
        aria-hidden="true"
        className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400 flex items-center justify-center"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
          <rect x="7" y="12" width="2" height="2" rx="0.5" />
          <rect x="11" y="12" width="2" height="2" rx="0.5" />
          <rect x="15" y="12" width="2" height="2" rx="0.5" />
          <rect x="7" y="16" width="2" height="2" rx="0.5" />
          <rect x="11" y="16" width="2" height="2" rx="0.5" />
          <rect x="15" y="16" width="2" height="2" rx="0.5" />
        </svg>
      </div>

      {/* Transparent native month input overlay right over the calendar icon for instant click-to-pick */}
      <input
        ref={hiddenInputRef}
        type="month"
        tabIndex={disabled ? -1 : 0}
        aria-label="Pilih Bulan & Tahun"
        value={value || ''}
        min={min || undefined}
        onChange={handlePickerChange}
        onClick={openPicker}
        disabled={disabled}
        title="Pilih Bulan & Tahun"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
      />
    </div>
  )
}
