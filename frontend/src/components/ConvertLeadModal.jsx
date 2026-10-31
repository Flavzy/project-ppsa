import { useEffect, useState } from 'react'
import ConfirmModal from './ConfirmModal'
import LoadingSpinner from './common/LoadingSpinner'
import { convertLead, listResource } from '../api/resources'

export default function ConvertLeadModal({ lead, onClose, onSuccess }) {
  const draftKey = `ppsa_draft_convert_${lead?.id_calon_klien}`
  const savedDraft = (() => {
    try {
      const raw = localStorage.getItem(`ppsa_draft_convert_${lead?.id_calon_klien}`)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })()

  const defaultNoKontrak = lead?.kontrak?.no_kontrak
    || `KTR-${new Date().getFullYear()}-${String(lead?.id_calon_klien || 1).padStart(3, '0')}`

  const [noKontrak, setNoKontrak] = useState(() => {
    // Jika ada draf yang sudah valid sesuai format lama KTR-YYYY-XXX, pakai draf tersebut.
    // Jika draf berupa format acak lama (KTR-id-timestamp), buang dan gunakan nomor standar.
    if (savedDraft?.noKontrak && !/^KTR-\d+-\d{4}$/.test(savedDraft.noKontrak)) {
      return savedDraft.noKontrak
    }
    return defaultNoKontrak
  })
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
  const [layananList, setLayananList] = useState([])
  const [selectedLayananIds, setSelectedLayananIds] = useState(() => {
    if (savedDraft?.selectedLayananIds && savedDraft.selectedLayananIds.length > 0) {
      return savedDraft.selectedLayananIds
    }
    if (Array.isArray(lead?.layanan_ids) && lead.layanan_ids.length > 0) {
      return lead.layanan_ids.map(Number)
    }
    return []
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showConvertConfirm, setShowConvertConfirm] = useState(false)

  // Ambil daftar master layanan aktif & hitung nomor kontrak berurutan berikutnya
  useEffect(() => {
    let isMounted = true
    listResource('layanan')
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) ? data.filter((l) => Boolean(l.is_active)) : []
        setLayananList(list)
        if (selectedLayananIds.length === 0 && list.length > 0 && !savedDraft?.selectedLayananIds) {
          if (Array.isArray(lead?.layanan_ids) && lead.layanan_ids.length > 0) {
            setSelectedLayananIds(lead.layanan_ids.map(Number))
          } else {
            const activeIds = list.filter((l) => l.is_active).map((l) => l.id_layanan)
            if (activeIds.length > 0) {
              setSelectedLayananIds(activeIds.slice(0, 2))
            }
          }
        }
      })
      .catch(() => {})

    listResource('kontrak')
      .then((kontrakList) => {
        if (!isMounted) return
        if (!lead?.kontrak?.no_kontrak) {
          const year = new Date().getFullYear()
          let maxSeq = 0
          if (Array.isArray(kontrakList)) {
            kontrakList.forEach((k) => {
              const match = String(k.no_kontrak || '').match(new RegExp(`^KTR-${year}-(\\d+)$`))
              if (match) {
                const seq = parseInt(match[1], 10)
                if (seq > maxSeq) maxSeq = seq
              }
            })
          }
          const nextNo = `KTR-${year}-${String(maxSeq + 1).padStart(3, '0')}`
          setNoKontrak((prev) => {
            if (!prev || prev === defaultNoKontrak || /^KTR-\d+-\d{4}$/.test(prev)) {
              return nextNo
            }
            return prev
          })
        }
      })
      .catch(() => {})

    return () => { isMounted = false }
  }, [lead, defaultNoKontrak])

  // Simpan draf konversi otomatis ke localStorage
  useEffect(() => {
    if (!lead) return
    const draft = { noKontrak, jenisDokumen, tglMulai, tglSelesai, alamat, layanan, nilaiProyek, selectedLayananIds }
    try {
      localStorage.setItem(`ppsa_draft_convert_${lead.id_calon_klien}`, JSON.stringify(draft))
    } catch {}
  }, [lead, noKontrak, jenisDokumen, tglMulai, tglSelesai, alamat, layanan, nilaiProyek, selectedLayananIds])

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

  function handleConvert(e) {
    e.preventDefault()
    setError('')
    if (!noKontrak || !noKontrak.trim()) {
      setError('Nomor kontrak wajib diisi.')
      return
    }
    setShowConvertConfirm(true)
  }

  async function executeConvert() {
    setShowConvertConfirm(false)
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
        layanan_ids: selectedLayananIds,
      })

      // Bersihkan draf konversi saat berhasil
      try {
        localStorage.removeItem(`ppsa_draft_convert_${lead.id_calon_klien}`)
      } catch {}

      await onSuccess?.(`Calon klien "${lead.nama_perusahaan}" berhasil dikonversi menjadi Kontrak & Klien aktif!`)
      onClose?.()
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
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
            >
              <option value="kontrak" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Kontrak</option>
              <option value="spk" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">SPK (Surat Perintah Kerja)</option>
              <option value="adendum" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Adendum</option>
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

          {/* Pemilihan Master Layanan yang Dicakup */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Paket Layanan yang Disepakati
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Centang layanan yang dipesan oleh klien untuk menghubungkan paket pekerjaan secara otomatis.
            </p>
            {layananList.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Memuat katalog layanan...</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 pr-2">
                {layananList.map((item) => {
                  const isChecked = selectedLayananIds.includes(item.id_layanan)
                  return (
                    <label
                      key={item.id_layanan}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-500/15 dark:border-brand-500 font-semibold text-gray-900 dark:text-white ring-1 ring-brand-500/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={submitting}
                        onChange={() => {
                          const next = isChecked
                            ? selectedLayananIds.filter((id) => id !== item.id_layanan)
                            : [...selectedLayananIds, item.id_layanan]
                          setSelectedLayananIds(next)
                          // Jika pengguna belum mengubah teks layanan secara custom, bantu update ringkasannya
                          const names = layananList.filter((l) => next.includes(l.id_layanan)).map((l) => l.nama_layanan)
                          if (names.length > 0) {
                            setLayanan(names.join(', '))
                          }
                        }}
                        className="size-4 rounded text-brand-600 focus:ring-brand-500 mt-0.5 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block">{item.nama_layanan}</span>
                        {item.deskripsi && (
                          <span className="block text-[11px] text-gray-500 dark:text-gray-400 font-normal line-clamp-1 mt-0.5">
                            {item.deskripsi}
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Ringkasan Ruang Lingkup Layanan <span className="text-error-500">*</span>
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
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 dark:text-gray-500 pointer-events-none select-none">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={nilaiProyek ? Number(String(nilaiProyek).replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const rawDigits = e.target.value.replace(/\D/g, '')
                  setNilaiProyek(rawDigits)
                }}
                placeholder="0"
                disabled={submitting}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent pl-12 pr-4 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
              />
            </div>
            {nilaiProyek && Number(String(nilaiProyek).replace(/\D/g, '')) > 0 && (
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Terbilang: Rp {Number(String(nilaiProyek).replace(/\D/g, '')).toLocaleString('id-ID')}
              </p>
            )}
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

      {/* Konfirmasi Konversi Lead ke Kontrak */}
      {showConvertConfirm && (
        <ConfirmModal
          open={showConvertConfirm}
          title="Konfirmasi Konversi ke Kontrak?"
          message={`Apakah Anda yakin ingin mengonversi calon klien "${lead.nama_perusahaan}" menjadi Kontrak resmi dan Klien aktif dengan No. Kontrak ${noKontrak}?`}
          confirmText="Ya, Konversi Sekarang"
          type="info"
          loading={submitting}
          onConfirm={executeConvert}
          onClose={() => setShowConvertConfirm(false)}
        />
      )}
    </div>
  )
}
