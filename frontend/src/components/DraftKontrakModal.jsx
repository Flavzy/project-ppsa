import { useMemo, useState } from 'react'

export default function DraftKontrakModal({ lead, contract, onClose, onSign }) {
  const [signingLoading, setSigningLoading] = useState(false)

  const activeContract = contract || lead?.kontrak
  const companyName = lead?.nama_perusahaan || activeContract?.klien?.nama_perusahaan || activeContract?.calon_klien?.nama_perusahaan || '-'
  const clientName = lead?.nama_klien || activeContract?.calon_klien?.nama_klien || '-'
  const directorName = lead?.nama_direktur || clientName || 'Direktur Utama'
  const address = lead?.alamat_perusahaan || activeContract?.klien?.alamat || activeContract?.calon_klien?.alamat_perusahaan || 'Alamat terlampir'
  const contact = lead?.kontak_person || lead?.kontak || activeContract?.klien?.kontak || activeContract?.calon_klien?.kontak_person || '-'

  const nib = lead?.nomor_nib || activeContract?.calon_klien?.nomor_nib || '-'
  const npwp = lead?.nomor_npwp || activeContract?.calon_klien?.nomor_npwp || '-'
  const akta = lead?.nomor_akta_pendirian || activeContract?.calon_klien?.nomor_akta_pendirian || '-'
  const sk = lead?.nomor_sk_kemenkumham || activeContract?.calon_klien?.nomor_sk_kemenkumham || '-'
  const izin = lead?.nomor_izin_usaha || activeContract?.calon_klien?.nomor_izin_usaha || '-'

  const contractNo = activeContract?.no_kontrak || 'KTR/PPSA/DRAFT'
  const projectScope = activeContract?.lingkup_kerja || 'Penyediaan Layanan Konsultansi dan Manajemen Sistem Informasi SIM-KK PPSA'
  const projectValue = activeContract?.nilai_proyek ? Number(activeContract.nilai_proyek).toLocaleString('id-ID') : '0'

  const { startDate, endDate, todayFormatted } = useMemo(() => {
    const now = new Date()
    return {
      startDate: activeContract?.tgl_mulai || now.toISOString().split('T')[0],
      endDate: activeContract?.tgl_selesai || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      todayFormatted: now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    }
  }, [activeContract?.tgl_mulai, activeContract?.tgl_selesai])

  const isSigned = activeContract?.status === 'aktif'
  const signedAt = activeContract?.ditandatangani_pada

  const handlePrint = () => {
    window.print()
  }

  const handleSignContract = async () => {
    if (!onSign || !activeContract) return
    setSigningLoading(true)
    try {
      await onSign(activeContract)
    } finally {
      setSigningLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 h-full w-full bg-gray-900/50 backdrop-blur-[6px] transition-opacity no-print"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 transition-all z-10 max-h-[94vh] flex flex-col animate-fade-in">
        {/* Top Header Actions (Hidden in Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Dokumen Perjanjian Resmi
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Surat Kontrak Kerja Sama
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isSigned
                ? 'bg-success-50 text-success-700 border border-success-200'
                : 'bg-warning-50 text-warning-700 border border-warning-200'
            }`}>
              {isSigned ? '✓ Status: Kontrak Aktif' : 'Status: Draft Kontrak (Siap TTD)'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Contract Body */}
        <div
          className="printable-contract"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            color: '#1e293b',
            fontFamily: "'Segoe UI', 'Times New Roman', serif",
            lineHeight: '1.6',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* KOP SURAT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', borderBottom: '3px double #0f172a', paddingBottom: '14px', marginBottom: '20px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.4rem',
                letterSpacing: '0.05em',
                flexShrink: 0,
              }}
            >
              PPSA
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                PUSAT PENGEMBANGAN SISTEM & APLIKASI (PPSA)
              </h2>
              <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                Layanan Terpadu Solusi Sistem Informasi, Tata Kelola & Konsultansi Manajemen
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Gedung Graha PPSA Lt. 5, Jl. Rasuna Said Kav. 24, Jakarta Selatan | Telp: (021) 522-8901 | Email: legal@ppsa.co.id
              </p>
            </div>
          </div>

          {/* DOKUMEN TITLE */}
          <div style={{ textAlign: 'center', margin: '20px 0 24px 0' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', textDecoration: 'underline', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
              SURAT PERJANJIAN KERJA SAMA
            </h3>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
              Nomor: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{contractNo}</span>
            </p>
          </div>

          {/* OPENING CLAUSE */}
          <p style={{ fontSize: '0.88rem', textAlign: 'justify', marginBottom: '16px' }}>
            Pada hari ini, tanggal <strong>{todayFormatted}</strong>, bertempat di Kantor PPSA Jakarta, kami yang bertanda tangan di bawah ini:
          </p>

          {/* PIHAK PERTAMA & KEDUA */}
          <div style={{ fontSize: '0.86rem', marginBottom: '20px', paddingLeft: '12px' }}>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>I. PIHAK PERTAMA (Penyedia Jasa):</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px', fontSize: '0.85rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '180px', verticalAlign: 'top', color: '#475569' }}>Nama Instansi</td>
                    <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                    <td><strong>SIM-KK PPSA (Pusat Pengembangan Sistem & Aplikasi)</strong></td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569' }}>Alamat Kantor</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td>Gedung Graha PPSA Lt. 5, Jl. Rasuna Said Kav. 24, Jakarta Selatan</td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569' }}>Kedudukan</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td>Penyedia Layanan Manajemen Sistem & Konsultansi Teknologi</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>II. PIHAK KEDUA (Klien):</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px', fontSize: '0.85rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '180px', verticalAlign: 'top', color: '#475569' }}>Nama Perusahaan</td>
                    <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                    <td><strong>{companyName}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569' }}>Diwakili Oleh</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td><strong>{directorName}</strong> (selaku Direktur / Penanggung Jawab)</td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569' }}>Alamat Perusahaan</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td>{address}</td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569' }}>Kontak Person</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td>{contact}</td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569' }}>Legalitas NIB</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td><code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px' }}>{nib}</code></td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569' }}>NPWP Perusahaan</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td><code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px' }}>{npwp}</code></td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569' }}>Akta & SK Kemenkumham</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td>Akta No. {akta} / SK: {sk}</td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569' }}>Izin Usaha</td>
                    <td style={{ verticalAlign: 'top' }}>:</td>
                    <td>{izin}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ fontSize: '0.86rem', textAlign: 'justify', marginBottom: '16px' }}>
            Kedua belah pihak sepakat mengikatkan diri dalam Perjanjian Kerja Sama dengan ketentuan dan syarat-syarat sebagai berikut:
          </p>

          {/* PASAL-PASAL */}
          <div style={{ fontSize: '0.85rem', marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '4px' }}>Pasal 1: RUANG LINGKUP PEKERJAAN</strong>
              <p style={{ margin: 0, textAlign: 'justify' }}>
                PIHAK PERTAMA bertindak sebagai pelaksana jasa teknis dan konsultansi yang berkewajiban merancang, membangun, mengimplementasikan, serta mengelola sistem informasi untuk PIHAK KEDUA, dengan spesifikasi lingkup kerja: <strong>{projectScope}</strong>.
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '4px' }}>Pasal 2: JANGKA WAKTU PERJANJIAN</strong>
              <p style={{ margin: 0, textAlign: 'justify' }}>
                Perjanjian ini berlaku efektif terhitung sejak tanggal <strong>{startDate}</strong> sampai dengan tanggal <strong>{endDate}</strong>, dan dapat diperpanjang atas kesepakatan tertulis kedua belah pihak.
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '4px' }}>Pasal 3: NILAI KONTRAK & PEMBAYARAN</strong>
              <p style={{ margin: 0, textAlign: 'justify' }}>
                Nilai total kesepakatan kerja sama yang disetujui para pihak adalah sebesar <strong>Rp {projectValue}</strong> (belum termasuk pajak dan biaya operasional tambahan jika disepakati terpisah).
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '4px' }}>Pasal 4: REGISTRASI KLIEN AKTIF OTOMATIS</strong>
              <p style={{ margin: 0, textAlign: 'justify' }}>
                Melalui perjanjian ini, PIHAK KEDUA secara otomatis dan resmi terdaftar dalam basis data sistem SIM-KK PPSA sebagai <strong>Klien Aktif</strong>, dan berhak mendapatkan hak akses modul pekerjaan, pemantauan timeline, dan laporan kinerja secara berkala.
              </p>
            </div>

            <div>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '4px' }}>Pasal 5: PENUTUP</strong>
              <p style={{ margin: 0, textAlign: 'justify' }}>
                Surat Perjanjian ini dibuat dalam 2 (dua) rangkap bermeterai cukup dan masing-masing memiliki kekuatan hukum yang sah dan mengikat kedua belah pihak sejak ditandatangani.
              </p>
            </div>
          </div>

          {/* SIGNATURE SECTION */}
          <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', textAlign: 'center', fontSize: '0.85rem' }}>
            <div>
              <p style={{ margin: '0 0 6px 0', fontWeight: 700 }}>PIHAK PERTAMA</p>
              <p style={{ margin: '0 0 50px 0', color: '#64748b' }}>SIM-KK PPSA</p>
              {isSigned ? (
                <div style={{ display: 'inline-block', border: '2px solid #16a34a', color: '#16a34a', padding: '4px 12px', borderRadius: '6px', fontWeight: 800, transform: 'rotate(-5deg)', margin: '0 auto 10px auto', fontSize: '0.8rem' }}>
                  ✓ TERTANDATANGANI SECARA RESMI<br />
                  <span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>PPSA DIGITAL VERIFIED</span>
                </div>
              ) : (
                <div style={{ height: '36px' }} />
              )}
              <p style={{ margin: '0', fontWeight: 700, textDecoration: 'underline' }}>
                Direktur Eksekutif PPSA
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>Pusat Pengembangan Sistem & Aplikasi</p>
            </div>

            <div>
              <p style={{ margin: '0 0 6px 0', fontWeight: 700 }}>PIHAK KEDUA</p>
              <p style={{ margin: '0 0 50px 0', color: '#64748b' }}>{companyName}</p>
              {isSigned ? (
                <div style={{ display: 'inline-block', border: '2px solid #16a34a', color: '#16a34a', padding: '4px 12px', borderRadius: '6px', fontWeight: 800, transform: 'rotate(4deg)', margin: '0 auto 10px auto', fontSize: '0.8rem' }}>
                  ✓ TERTANDATANGANI ({signedAt || startDate})<br />
                  <span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>METERAI DIGITAL 10000</span>
                </div>
              ) : (
                <div style={{ height: '36px' }} />
              )}
              <p style={{ margin: '0', fontWeight: 700, textDecoration: 'underline' }}>
                {directorName}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>Direktur / Penanggung Jawab</p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="no-print pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            {isSigned && (
              <span className="text-xs font-semibold text-success-600 dark:text-success-400 inline-flex items-center gap-1.5">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Kontrak telah aktif & terdaftar di modul Klien Aktif
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <span>🖨️</span> Cetak / Simpan PDF
            </button>

            {!isSigned && onSign && (
              <button
                type="button"
                onClick={handleSignContract}
                disabled={signingLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-sm font-semibold text-white shadow-theme-xs shadow-success-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>✍️</span> {signingLoading ? 'Memproses...' : 'Tandatangani Kontrak'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
