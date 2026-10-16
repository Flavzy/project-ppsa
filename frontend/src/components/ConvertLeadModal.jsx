import { useEffect, useState } from 'react'
import LoadingSpinner from './common/LoadingSpinner'
import { convertLead } from '../api/resources'

export default function ConvertLeadModal({ lead, onClose, onSuccess }) {
  const draftKey = `ppsa_draft_convert_${lead?.id_calon_klien}`
  const savedDraft = (() => {
    try {
      const raw = localStorage.getItem(`ppsa_draft_convert_${lead?.id_calon_klien}`)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })()

  const [noKontrak, setNoKontrak] = useState(() => savedDraft?.noKontrak || `KTR-${lead?.id_calon_klien}-${Date.now().toString().slice(-4)}`)
  const [jenisDokumen, setJenisDokumen] = useState(() => savedDraft?.jenisDokumen || 'kontrak')
  const [tglMulai, setTglMulai] = useState(() => savedDraft?.tglMulai || new Date().toISOString().split('T')[0])
  const [tglSelesai, setTglSelesai] = useState(() => {
    if (savedDraft?.tglSelesai) return savedDraft.tglSelesai
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)
    return nextMonth.toISOString().split('T')[0]
  })
  const [alamat, setAlamat] = useState(() => savedDraft?.alamat || lead?.alamat_perusahaan || 'Gedung Bisnis Center, Jakarta')
  const [layanan, setLayanan] = useState(() => savedDraft?.layanan || 'Implementasi & Konsultansi Sistem')
  const [nilaiProyek, setNilaiProyek] = useState(() => (savedDraft?.nilaiProyek !== undefined ? savedDraft.nilaiProyek : (lead?.nilai_estimasi || '')))

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Simpan draf konversi otomatis ke localStorage
  useEffect(() => {
    if (!lead) return
    const draft = { noKontrak, jenisDokumen, tglMulai, tglSelesai, alamat, layanan, nilaiProyek }
    try {
      localStorage.setItem(`ppsa_draft_convert_${lead.id_calon_klien}`, JSON.stringify(draft))
    } catch {}
  }, [lead, noKontrak, jenisDokumen, tglMulai, tglSelesai, alamat, layanan, nilaiProyek])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.()
    }
    if (lead) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lead, submitting, onClose])

  if (!lead) return null

  async function handleConvert(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await convertLead(lead.id_calon_klien, {
        no_kontrak: noKontrak,
        jenis_dokumen: jenisDokumen,
        tgl_mulai: tglMulai,
        tgl_selesai: tglSelesai,
        alamat: alamat,
        layanan: layanan,
        nilai_proyek: nilaiProyek ? Number(nilaiProyek) : undefined,
      })

      // Bersihkan draf konversi saat berhasil
      try {
        localStorage.removeItem(`ppsa_draft_convert_${lead.id_calon_klien}`)
      } catch {}

      onSuccess(`Calon klien "${lead.nama_perusahaan}" berhasil dikonversi menjadi Kontrak & Klien aktif!`)
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal mengonversi calon klien.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 h-full w-full bg-gray-900/50 backdrop-blur-[6px] transition-opacity"
        onClick={submitting ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 transition-all z-10 animate-fade-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-success-600 dark:text-success-400">
              Konversi Prospek Deal
            </span>
            <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              Konversi Lead ke Kontrak & Klien
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Perusahaan: <strong className="text-gray-700 dark:text-gray-200">{lead.nama_perusahaan}</strong>
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-800 text-xs text-error-700 dark:text-error-400">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleConvert} className="overflow-y-auto flex-1 my-4 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Nomor Kontrak <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={noKontrak}
              onChange={(e) => setNoKontrak(e.target.value)}
              required
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Jenis Dokumen <span className="text-error-500">*</span>
            </label>
            <select
              value={jenisDokumen}
              onChange={(e) => setJenisDokumen(e.target.value)}
              required
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
            >
              <option value="kontrak">Kontrak</option>
              <option value="spk">SPK (Surat Perintah Kerja)</option>
              <option value="adendum">Adendum</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Tanggal Mulai (Hanya Hari Ini) <span className="text-error-500">*</span>
              </label>
              <input
                type="date"
                value={tglMulai}
                min={new Date().toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setTglMulai(e.target.value)}
                required
                disabled={submitting}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Tanggal Selesai <span className="text-error-500">*</span>
              </label>
              <input
                type="date"
                value={tglSelesai}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setTglSelesai(e.target.value)}
                required
                disabled={submitting}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Alamat Kantor Klien <span className="text-error-500">*</span>
            </label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              required
              rows={2}
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Ruang Lingkup Layanan <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={layanan}
              onChange={(e) => setLayanan(e.target.value)}
              required
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Nilai Proyek (Rp)
            </label>
            <input
              type="number"
              value={nilaiProyek}
              onChange={(e) => setNilaiProyek(e.target.value)}
              placeholder="Contoh: 50000000"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 font-semibold text-sm text-white shadow-theme-xs shadow-brand-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="xs" text="" />
                  <span>Mengonversi...</span>
                </>
              ) : (
                'Konversi Sekarang'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
