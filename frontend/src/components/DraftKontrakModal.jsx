import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

export default function DraftKontrakModal({ lead, contract, onClose }) {
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

  const contractNo = activeContract?.no_kontrak || 'KTR/ASCON/DRAFT'
  const projectScope = activeContract?.lingkup_kerja || 'Penyediaan Layanan Konsultansi dan Manajemen Sistem Informasi SIM-KK'
  const projectValue = activeContract?.nilai_proyek ? Number(activeContract.nilai_proyek).toLocaleString('id-ID') : '0'
  const rawCompanyName = lead?.nama_perusahaan || activeContract?.klien?.nama_perusahaan || activeContract?.calon_klien?.nama_perusahaan
  const cleanCompanyName = rawCompanyName && rawCompanyName !== '-'
    ? rawCompanyName.trim().replace(/[\\/:*?"<>|]+/g, '_')
    : (directorName && directorName !== '-' ? directorName.trim().replace(/[\\/:*?"<>|]+/g, '_') : 'Klien')
  const printDocTitle = `SIM-KK_${cleanCompanyName}`

  const { startDate, endDate, todayFormatted } = useMemo(() => {
    const now = new Date()
    return {
      startDate: activeContract?.tgl_mulai || now.toISOString().split('T')[0],
      endDate: activeContract?.tgl_selesai || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      todayFormatted: now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    }
  }, [activeContract?.tgl_mulai, activeContract?.tgl_selesai])

  const isSigned = activeContract?.status === 'aktif'
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isMobileReadMode, setIsMobileReadMode] = useState(false)

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 160))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 70))
  const handleResetZoom = () => setZoomLevel(100)

  useEffect(() => {
    const originalTitle = document.title
    document.title = printDocTitle

    document.body.classList.add('contract-modal-open')
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.title = originalTitle
      document.body.classList.remove('contract-modal-open')
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
      const existingFrame = document.getElementById('contract-hidden-print-frame')
      if (existingFrame) existingFrame.remove()
    }
  }, [onClose, printDocTitle])

  const handlePrint = () => {
    document.title = printDocTitle
    const contractEl = document.getElementById('printable-contract-document')
    if (!contractEl) {
      window.print()
      return
    }

    const existingFrame = document.getElementById('contract-hidden-print-frame')
    if (existingFrame) existingFrame.remove()

    const printFrame = document.createElement('iframe')
    printFrame.id = 'contract-hidden-print-frame'
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'
    printFrame.style.visibility = 'hidden'
    document.body.appendChild(printFrame)

    const frameDoc = printFrame.contentWindow.document
    frameDoc.open()
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${printDocTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 20mm 20mm 25mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #0f172a;
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            line-height: 1.42;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .contract-print-page {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
            overflow: visible;
          }
          .contract-page {
            width: 100%;
            box-sizing: border-box;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          .contract-page-2 {
            page-break-before: always !important;
            break-before: page !important;
          }
          .page-divider-badge, .no-print {
            display: none !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          td {
            padding: 2.5px 0;
            vertical-align: top;
          }
          p {
            margin: 0 0 6px 0;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
        </style>
      </head>
      <body>
        <div class="contract-print-page">
          ${contractEl.innerHTML}
        </div>
      </body>
      </html>
    `)
    frameDoc.close()

    setTimeout(() => {
      printFrame.contentWindow.focus()
      printFrame.contentWindow.print()
    }, 250)
  }

  const modalContent = (
    <div className="contract-modal-wrapper fixed inset-0 z-99999 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 h-full w-full bg-gray-900/50 backdrop-blur-[6px] transition-opacity no-print"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="contract-modal-dialog relative w-full max-w-4xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 transition-all z-10 max-h-[94vh] flex flex-col animate-fade-in">
        {/* Top Header Actions (Hidden in Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Dokumen Perjanjian Resmi
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Surat Kontrak Kerja Sama
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Zoom Controls & Mobile Read Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 70}
                className="size-7 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-40 transition-colors cursor-pointer"
                title="Perkecil Teks (-)"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-xs text-gray-700 dark:text-gray-200 hover:text-brand-600 font-semibold cursor-pointer"
                title="Reset Ukuran (100%)"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 160}
                className="size-7 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-40 transition-colors cursor-pointer"
                title="Perbesar Teks (+)"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileReadMode(!isMobileReadMode)}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isMobileReadMode
                  ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Tampilan Teks Mengalir (Mobile Read Mode)"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{isMobileReadMode ? 'Standar' : 'Mode Baca'}</span>
            </button>

            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              isSigned
                ? 'bg-success-50 text-success-700 border border-success-200'
                : 'bg-warning-50 text-warning-700 border border-warning-200'
            }`}>
              {isSigned ? 'Aktif' : 'Draft'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Tutup Modal"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Contract Body */}
        <div
          id="printable-contract-document"
          className={`printable-contract ${isMobileReadMode ? 'mobile-read-mode' : ''}`}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobileReadMode ? '12px 8px' : '16px',
            backgroundColor: '#f1f5f9',
            borderRadius: '12px',
            color: '#0f172a',
            fontFamily: isMobileReadMode ? 'system-ui, -apple-system, sans-serif' : "'Times New Roman', Times, serif",
            lineHeight: isMobileReadMode ? '1.6' : '1.4',
            zoom: `${zoomLevel}%`,
          }}
        >
          {/* ==================== HALAMAN 1 ==================== */}
          <div
            className="contract-page contract-page-1"
            style={{
              backgroundColor: '#ffffff',
              padding: '28px 32px 24px 32px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              marginBottom: '16px',
            }}
          >
            {/* KOP SURAT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '2.5px double #0f172a', paddingBottom: '10px', marginBottom: '12px' }}>
              <img
                src="/images/logo/loading-logo.png"
                alt="Logo SIM-KK"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '1.14rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  PT ASCON INOVASI DATA
                </h2>
                <p style={{ margin: '2px 0', fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
                  Layanan Terpadu Solusi Sistem Informasi, Tata Kelola &amp; Konsultansi Manajemen
                </p>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>
                  Jl. Hibrida XV No.15b, Sido Mulyo, Kec. Gading Cemp., Kota Bengkulu, Bengkulu 38229 | Telp: +62 821-7934-4263 | Email: admin@asconinovasidata.co.id
                </p>
              </div>
            </div>

            {/* DOKUMEN TITLE */}
            <div style={{ textAlign: 'center', margin: '10px 0 12px 0' }}>
              <h3 style={{ margin: 0, fontSize: '1.16rem', textDecoration: 'underline', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                SURAT PERJANJIAN KERJA SAMA
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>
                Nomor: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{contractNo}</span>
              </p>
            </div>

            {/* OPENING CLAUSE */}
            <p style={{ fontSize: '0.88rem', textAlign: 'justify', marginBottom: '10px', lineHeight: '1.45' }}>
              Pada hari ini, tanggal <strong>{todayFormatted}</strong>, bertempat di Kantor PT Ascon Inovasi Data, kami yang bertanda tangan di bawah ini:
            </p>

            {/* PIHAK PERTAMA & KEDUA */}
            <div style={{ fontSize: '0.86rem', marginBottom: '12px', paddingLeft: '4px' }}>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginBottom: '2px' }}>I. PIHAK PERTAMA (Penyedia Jasa):</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2px', fontSize: '0.86rem', lineHeight: '1.4' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '155px', verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Nama Instansi</td>
                      <td style={{ width: '12px', verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ padding: '2px 0' }}><strong>PT Ascon Inovasi Data</strong></td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Alamat Kantor</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ padding: '2px 0' }}>Jl. Hibrida XV No.15b, Sido Mulyo, Kec. Gading Cemp., Kota Bengkulu, Bengkulu 38229</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Kedudukan</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ padding: '2px 0' }}>Penyedia Layanan Manajemen Sistem &amp; Konsultansi Teknologi</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginBottom: '2px' }}>II. PIHAK KEDUA (Klien):</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2px', fontSize: '0.86rem', lineHeight: '1.4' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '155px', verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Nama Perusahaan</td>
                      <td style={{ width: '12px', verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ padding: '2px 0' }}><strong>{companyName}</strong></td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Diwakili Oleh</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ padding: '2px 0' }}><strong>{directorName}</strong> (selaku Direktur / Penanggung Jawab)</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Alamat Perusahaan</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ padding: '2px 0' }}>{address}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Kontak Person</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ padding: '2px 0' }}>{contact}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Legalitas NIB &amp; NPWP</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ padding: '2px 0' }}>
                        NIB: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{nib}</span> &nbsp;|&nbsp; 
                        NPWP: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{npwp}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Akta, SK &amp; Izin</td>
                      <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                      <td style={{ padding: '2px 0' }}>Akta No. {akta} / SK: {sk} &nbsp;|&nbsp; Izin: {izin}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', textAlign: 'justify', margin: '8px 0 10px 0', lineHeight: '1.45' }}>
              Kedua belah pihak sepakat mengikatkan diri dalam Perjanjian Kerja Sama dengan ketentuan dan syarat-syarat sebagai berikut:
            </p>

            {/* PASAL 1 & 2 */}
            <div style={{ fontSize: '0.86rem', marginBottom: '16px' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 1: RUANG LINGKUP PEKERJAAN &amp; PAKET LAYANAN</strong>
                <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                  PIHAK PERTAMA bertindak sebagai pelaksana jasa teknis dan konsultansi yang berkewajiban merancang, membangun, mengimplementasikan, serta mengelola pekerjaan untuk PIHAK KEDUA, dengan rincian lingkup kerja: <strong>{projectScope}</strong>.
                </p>
                {activeContract?.layanan && activeContract.layanan.length > 0 && (
                  <div style={{ marginTop: '5px', fontSize: '0.84rem' }}>
                    <span>Daftar Paket Layanan Resmi yang Disepakati:</span>
                    <ul style={{ margin: '3px 0 0 18px', padding: 0, listStyleType: 'disc' }}>
                      {activeContract.layanan.map((l) => (
                        <li key={l.id_layanan} style={{ marginBottom: '2px' }}>
                          <strong>{l.nama_layanan}</strong> {l.deskripsi ? `— ${l.deskripsi}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 2: JANGKA WAKTU PERJANJIAN</strong>
                <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                  Perjanjian ini berlaku efektif terhitung sejak tanggal <strong>{startDate}</strong> sampai dengan tanggal <strong>{endDate}</strong>, dan dapat diperpanjang atas kesepakatan tertulis kedua belah pihak.
                </p>
              </div>
            </div>

            {/* FOOTER HALAMAN 1 */}
            <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic' }}>
              <span>Surat Perjanjian Kerja Sama — PT Ascon Inovasi Data &amp; {companyName}</span>
              <span>Halaman 1 dari 2</span>
            </div>
          </div>

          {/* PEMISAH HALAMAN CETAK (HANYA DITAMPILKAN DI PREVIEW LAYAR) */}
          <div className="page-divider-badge no-print" style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ height: '1px', backgroundColor: '#cbd5e1', flex: 1 }} />
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569', backgroundColor: '#e2e8f0', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              📄 Batas Halaman Cetak (Awal Halaman 2)
            </span>
            <div style={{ height: '1px', backgroundColor: '#cbd5e1', flex: 1 }} />
          </div>

          {/* ==================== HALAMAN 2 ==================== */}
          <div
            className="contract-page contract-page-2"
            style={{
              backgroundColor: '#ffffff',
              padding: '28px 32px 24px 32px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* MINI HEADER HALAMAN 2 */}
            <div style={{ paddingBottom: '8px', marginBottom: '14px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
              <span>Lanjutan Surat Perjanjian Kerja Sama No: <strong style={{ color: '#0f172a' }}>{contractNo}</strong></span>
              <span>PT Ascon Inovasi Data &amp; {companyName}</span>
            </div>

            {/* PASAL 3, 4, 5, 6 */}
            <div style={{ fontSize: '0.86rem', marginBottom: '14px' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 3: NILAI KONTRAK &amp; KETENTUAN PEMBAYARAN</strong>
                <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                  1. Nilai total kesepakatan kerja sama yang disetujui para pihak adalah sebesar <strong>Rp {projectValue}</strong> (belum termasuk Pajak Pertambahan Nilai dan biaya operasional teknis tambahan yang disepakati terpisah).
                </p>
                <p style={{ margin: '4px 0 0 0', textAlign: 'justify', lineHeight: '1.42' }}>
                  2. Pembayaran dilakukan melalui transfer perbankan ke rekening resmi <strong>PT Ascon Inovasi Data</strong> sesuai kesepakatan termin atau dokumen tagihan resmi (invoice) yang diterbitkan oleh PIHAK PERTAMA.
                </p>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 4: HAK, KEWAJIBAN &amp; KERAHASIAAN INFORMASI</strong>
                <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                  1. Melalui perjanjian ini, PIHAK KEDUA secara otomatis dan resmi terdaftar dalam basis data sistem SIM-KK sebagai <strong>Klien Aktif</strong>, serta berhak mendapatkan hak akses modul pekerjaan, pemantauan timeline, dan laporan kinerja secara berkala.
                </p>
                <p style={{ margin: '4px 0 0 0', textAlign: 'justify', lineHeight: '1.42' }}>
                  2. Kedua belah pihak berkewajiban menjaga kerahasiaan seluruh data operasional, dokumen teknis, dan informasi rahasia yang diperoleh selama pelaksanaan kerja sama (<em>Non-Disclosure Commitment</em>).
                </p>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 5: PENYELESAIAN PERSELISIHAN &amp; FORCE MAJEURE</strong>
                <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                  1. Apabila terjadi perbedaan penafsiran atau perselisihan dalam pelaksanaan perjanjian ini, para pihak sepakat untuk menyelesaikannya secara musyawarah untuk mufakat.
                </p>
                <p style={{ margin: '4px 0 0 0', textAlign: 'justify', lineHeight: '1.42' }}>
                  2. Hal-hal yang timbul di luar kemampuan para pihak (keadaan kahar / <em>force majeure</em>) seperti bencana alam, huru-hara, atau regulasi pemerintah yang berdampak langsung akan diselesaikan secara musyawarah mufakat.
                </p>
              </div>

              <div>
                <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 6: KETENTUAN PENUTUP</strong>
                <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                  Surat Perjanjian ini dibuat dalam 2 (dua) rangkap asli bermeterai cukup dan masing-masing pihak memegang 1 (satu) rangkap yang memiliki kekuatan hukum pembuktian yang sama dan sah sejak tanggal ditandatangani oleh kedua belah pihak.
                </p>
              </div>
            </div>

            {/* PENGESAHAN DOKUMEN & TANDA TANGAN */}
            <div className="avoid-break" style={{ marginTop: '20px' }}>
              <p style={{ textAlign: 'right', fontSize: '0.84rem', margin: '0 0 10px 0', color: '#334155' }}>
                Bengkulu, {todayFormatted}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', textAlign: 'center', fontSize: '0.88rem' }}>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontWeight: 700 }}>PIHAK PERTAMA</p>
                  <p style={{ margin: '0 0 6px 0', color: '#64748b' }}>PT Ascon Inovasi Data</p>
                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', border: '1px dashed #cbd5e1', padding: '6px 14px', borderRadius: '4px' }}>
                      (Tanda Tangan &amp; Cap Perusahaan)
                    </span>
                  </div>
                  <p style={{ margin: '0', fontWeight: 700, textDecoration: 'underline', fontSize: '0.88rem' }}>
                    Direktur PT Ascon Inovasi Data
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>PT Ascon Inovasi Data</p>
                </div>

                <div>
                  <p style={{ margin: '0 0 2px 0', fontWeight: 700 }}>PIHAK KEDUA</p>
                  <p style={{ margin: '0 0 6px 0', color: '#64748b' }}>{companyName}</p>
                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', border: '1px dashed #cbd5e1', padding: '6px 14px', borderRadius: '4px' }}>
                      (Meterai Rp 10.000 &amp; Tanda Tangan)
                    </span>
                  </div>
                  <p style={{ margin: '0', fontWeight: 700, textDecoration: 'underline', fontSize: '0.88rem' }}>
                    {directorName}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>Direktur / Penanggung Jawab</p>
                </div>
              </div>
            </div>

            {/* FOOTER HALAMAN 2 */}
            <div style={{ marginTop: '22px', paddingTop: '10px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic' }}>
              <span>Surat Perjanjian Kerja Sama — PT Ascon Inovasi Data &amp; {companyName}</span>
              <span>Halaman 2 dari 2</span>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="no-print pt-3.5 mt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Dokumen siap dicetak untuk proses penandatanganan basah / legalisasi fisik (Format Kertas A4).
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-sm font-semibold text-white shadow-theme-xs shadow-brand-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
