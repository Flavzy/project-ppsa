import { useState } from 'react'
import { convertLead } from '../api/resources'

export default function ConvertLeadModal({ lead, onClose, onSuccess }) {
  const [noKontrak, setNoKontrak] = useState(() => `KTR-${lead.id_calon_klien}-${Date.now().toString().slice(-4)}`)
  const [jenisDokumen, setJenisDokumen] = useState('kontrak')
  const [tglMulai, setTglMulai] = useState(() => new Date().toISOString().split('T')[0])
  const [tglSelesai, setTglSelesai] = useState(() => {
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)
    return nextMonth.toISOString().split('T')[0]
  })
  const [alamat, setAlamat] = useState('Gedung Bisnis Center, Jakarta')
  const [layanan, setLayanan] = useState('Implementasi & Konsultansi Sistem')
  const [nilaiProyek, setNilaiProyek] = useState(() => lead.nilai_estimasi || '')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

      onSuccess(`Calon klien "${lead.nama_perusahaan}" berhasil dikonversi menjadi Kontrak & Klien aktif!`)
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal mengonversi calon klien.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Konversi Lead ke Kontrak & Klien</h3>
          <p className="modal-subtitle">
            Mengonversi prospek deal <strong>{lead.nama_perusahaan}</strong> menjadi klien dan kontrak resmi.
          </p>
        </div>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleConvert} className="modal-form">
          <label className="field">
            <span>Nomor Kontrak</span>
            <input
              type="text"
              value={noKontrak}
              onChange={(e) => setNoKontrak(e.target.value)}
              required
              disabled={submitting}
            />
          </label>

          <label className="field">
            <span>Jenis Dokumen</span>
            <select
              value={jenisDokumen}
              onChange={(e) => setJenisDokumen(e.target.value)}
              required
              disabled={submitting}
            >
              <option value="kontrak">Kontrak</option>
              <option value="spk">SPK (Surat Perintah Kerja)</option>
              <option value="adendum">Adendum</option>
            </select>
          </label>

          <div className="form-row">
            <label className="field">
              <span>Tanggal Mulai</span>
              <input
                type="date"
                value={tglMulai}
                onChange={(e) => setTglMulai(e.target.value)}
                required
                disabled={submitting}
              />
            </label>

            <label className="field">
              <span>Tanggal Selesai</span>
              <input
                type="date"
                value={tglSelesai}
                onChange={(e) => setTglSelesai(e.target.value)}
                required
                disabled={submitting}
              />
            </label>
          </div>

          <label className="field">
            <span>Alamat Klien</span>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              required
              rows={2}
              disabled={submitting}
            />
          </label>

          <label className="field">
            <span>Layanan</span>
            <input
              type="text"
              value={layanan}
              onChange={(e) => setLayanan(e.target.value)}
              required
              disabled={submitting}
            />
          </label>

          <label className="field">
            <span>Nilai Proyek (Rp)</span>
            <input
              type="number"
              value={nilaiProyek}
              onChange={(e) => setNilaiProyek(e.target.value)}
              placeholder="50000000"
              disabled={submitting}
            />
          </label>

          <div className="form-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? 'Mengonversi...' : 'Konversi Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
