import { useEffect, useMemo } from 'react'
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

  useEffect(() => {
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
      document.body.classList.remove('contract-modal-open')
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
      const existingFrame = document.getElementById('contract-hidden-print-frame')
      if (existingFrame) existingFrame.remove()
    }
  }, [onClose])

  const handlePrint = () => {
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
        <title>Surat Perjanjian Kontrak - ${contractNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 25mm 20mm 25mm 30mm;
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
            font-size: 9.8pt;
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
          table {
            border-collapse: collapse;
            width: 100%;
          }
          td {
            padding: 2px 0;
            vertical-align: top;
          }
          p {
            margin: 0 0 5px 0;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
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
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-3 border-b border-gray-100 dark:border-gray-800">
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
              {isSigned ? '✓ Status: Kontrak Aktif' : 'Status: Draft Kontrak'}
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
          className="printable-contract"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 28px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            color: '#0f172a',
            fontFamily: "'Times New Roman', Times, serif",
            lineHeight: '1.38',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
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
                PUSAT PENGEMBANGAN SISTEM & APLIKASI (PPSA)
              </h2>
              <p style={{ margin: '2px 0', fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
                Layanan Terpadu Solusi Sistem Informasi, Tata Kelola & Konsultansi Manajemen
              </p>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>
                Gedung Graha PPSA Lt. 5, Jl. Rasuna Said Kav. 24, Jakarta Selatan | Telp: (021) 522-8901 | Email: legal@ppsa.co.id
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
            Pada hari ini, tanggal <strong>{todayFormatted}</strong>, bertempat di Kantor PPSA Jakarta, kami yang bertanda tangan di bawah ini:
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
                    <td style={{ padding: '2px 0' }}><strong>SIM-KK PPSA (Pusat Pengembangan Sistem & Aplikasi)</strong></td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Alamat Kantor</td>
                    <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                    <td style={{ padding: '2px 0' }}>Gedung Graha PPSA Lt. 5, Jl. Rasuna Said Kav. 24, Jakarta Selatan</td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Kedudukan</td>
                    <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                    <td style={{ padding: '2px 0' }}>Penyedia Layanan Manajemen Sistem & Konsultansi Teknologi</td>
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
                    <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Legalitas NIB & NPWP</td>
                    <td style={{ verticalAlign: 'top', padding: '2px 0' }}>:</td>
                    <td style={{ padding: '2px 0' }}>
                      NIB: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{nib}</span> &nbsp;|&nbsp; 
                      NPWP: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{npwp}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: 'top', color: '#475569', padding: '2px 0' }}>Akta, SK & Izin</td>
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

          {/* PASAL-PASAL */}
          <div style={{ fontSize: '0.86rem', marginBottom: '14px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 1: RUANG LINGKUP PEKERJAAN</strong>
              <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                PIHAK PERTAMA bertindak sebagai pelaksana jasa teknis dan konsultansi yang berkewajiban merancang, membangun, mengimplementasikan, serta mengelola sistem informasi untuk PIHAK KEDUA, dengan spesifikasi lingkup kerja: <strong>{projectScope}</strong>.
              </p>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 2: JANGKA WAKTU PERJANJIAN</strong>
              <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                Perjanjian ini berlaku efektif terhitung sejak tanggal <strong>{startDate}</strong> sampai dengan tanggal <strong>{endDate}</strong>, dan dapat diperpanjang atas kesepakatan tertulis kedua belah pihak.
              </p>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 3: NILAI KONTRAK & PEMBAYARAN</strong>
              <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                Nilai total kesepakatan kerja sama yang disetujui para pihak adalah sebesar <strong>Rp {projectValue}</strong> (belum termasuk pajak dan biaya operasional tambahan jika disepakati terpisah).
              </p>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 4: REGISTRASI KLIEN AKTIF OTOMATIS</strong>
              <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                Melalui perjanjian ini, PIHAK KEDUA secara otomatis dan resmi terdaftar dalam basis data sistem SIM-KK PPSA sebagai <strong>Klien Aktif</strong>, dan berhak mendapatkan hak akses modul pekerjaan, pemantauan timeline, dan laporan kinerja secara berkala.
              </p>
            </div>

            <div>
              <strong style={{ display: 'block', textAlign: 'center', marginBottom: '2px', fontSize: '0.88rem' }}>Pasal 5: PENUTUP</strong>
              <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.42' }}>
                Surat Perjanjian ini dibuat dalam 2 (dua) rangkap bermeterai cukup dan masing-masing memiliki kekuatan hukum yang sah dan mengikat kedua belah pihak sejak ditandatangani.
              </p>
            </div>
          </div>

          {/* SIGNATURE SECTION */}
          <div className="avoid-break" style={{ marginTop: '22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', textAlign: 'center', fontSize: '0.88rem' }}>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 700 }}>PIHAK PERTAMA</p>
              <p style={{ margin: '0 0 6px 0', color: '#64748b' }}>SIM-KK PPSA</p>
              <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', border: '1px dashed #cbd5e1', padding: '6px 14px', borderRadius: '4px' }}>
                  (Tanda Tangan & Cap Lembaga)
                </span>
              </div>
              <p style={{ margin: '0', fontWeight: 700, textDecoration: 'underline', fontSize: '0.88rem' }}>
                Direktur Eksekutif PPSA
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>Pusat Pengembangan Sistem & Aplikasi</p>
            </div>

            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 700 }}>PIHAK KEDUA</p>
              <p style={{ margin: '0 0 6px 0', color: '#64748b' }}>{companyName}</p>
              <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', border: '1px dashed #cbd5e1', padding: '6px 14px', borderRadius: '4px' }}>
                  (Meterai Rp 10.000 & Tanda Tangan)
                </span>
              </div>
              <p style={{ margin: '0', fontWeight: 700, textDecoration: 'underline', fontSize: '0.88rem' }}>
                {directorName}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>Direktur / Penanggung Jawab</p>
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
              <span>🖨️</span> Cetak / Simpan PDF
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
