import { useEffect } from 'react'

export default function DetailLegalitasModal({ record, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    if (record) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [record, onClose])

  if (!record) return null

  const legalitasList = [
    {
      nama: 'NIB (Nomor Induk Berusaha)',
      nomor: record.nomor_nib,
      fileUrl: record.file_nib_url,
      fileName: record.file_nib,
    },
    {
      nama: 'NPWP Perusahaan',
      nomor: record.nomor_npwp,
      fileUrl: record.file_npwp_url,
      fileName: record.file_npwp,
    },
    {
      nama: 'Akta Pendirian',
      nomor: record.nomor_akta_pendirian,
      fileUrl: record.file_akta_pendirian_url,
      fileName: record.file_akta_pendirian,
    },
    {
      nama: 'SK Kemenkumham',
      nomor: record.nomor_sk_kemenkumham,
      fileUrl: record.file_sk_kemenkumham_url,
      fileName: record.file_sk_kemenkumham,
    },
    {
      nama: 'Izin Usaha',
      nomor: record.nomor_izin_usaha,
      fileUrl: record.file_izin_usaha_url,
      fileName: record.file_izin_usaha,
    },
  ]

  const totalFiles = legalitasList.filter((item) => Boolean(item.fileUrl)).length

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 h-full w-full bg-gray-900/50 backdrop-blur-[6px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 transition-all z-10 animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Dokumen Perusahaan
            </span>
            <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              {record.nama_perusahaan || 'Detail Calon Klien'}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Klien: <strong className="text-gray-700 dark:text-gray-200">{record.nama_klien || '-'}</strong> | Direktur: <strong className="text-gray-700 dark:text-gray-200">{record.nama_direktur || '-'}</strong>
            </p>
          </div>
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

        {/* Content body */}
        <div className="overflow-y-auto flex-1 my-4 space-y-4 pr-1">
          {/* Quick info card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Kontak Person</span>
              <p className="mt-0.5 text-sm font-medium text-gray-800 dark:text-gray-200">{record.kontak_person || record.kontak || '-'}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Kelengkapan Berkas</span>
              <p className="mt-0.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
                {totalFiles}/5 Dokumen Terunggah
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Alamat Perusahaan</span>
              <p className="mt-0.5 text-sm font-medium text-gray-700 dark:text-gray-300">{record.alamat_perusahaan || '-'}</p>
            </div>
          </div>

          {/* Legalitas Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Jenis Dokumen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nomor Dokumen
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Berkas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {legalitasList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {item.nama}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">
                      {item.nomor ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-300">
                          {item.nomor}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Belum dicatat</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.fileUrl ? (() => {
                        const fileName = decodeURIComponent(item.fileUrl.split('/').pop()) || 'Buka File'
                        return (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200/80 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer max-w-[220px]"
                            title={`Buka / Unduh ${fileName}`}
                          >
                            <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="truncate">{fileName}</span>
                          </a>
                        )
                      })() : (
                        <span className="text-xs text-gray-400">Tidak ada berkas</span>
                      )}
                    </td>
                  </tr>
                ))}
                {Boolean(record.file_dokumen_pendukung_urls?.length || record.file_dokumen_pendukung_url) && (
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      Dokumen Pendukung Tambahan
                      {record.file_dokumen_pendukung_urls && record.file_dokumen_pendukung_urls.length > 1 && (
                        <span className="ml-1.5 text-[11px] font-normal text-gray-500 dark:text-gray-400">
                          ({record.file_dokumen_pendukung_urls.length} Berkas)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">-</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {(record.file_dokumen_pendukung_urls && record.file_dokumen_pendukung_urls.length > 0
                          ? record.file_dokumen_pendukung_urls
                          : [{ name: 'Buka File', url: record.file_dokumen_pendukung_url }]
                        ).map((doc, idx) => {
                          const docName = doc.name || (doc.url ? decodeURIComponent(doc.url.split('/').pop()) : `Berkas ${idx + 1}`)
                          return (
                            <a
                              key={idx}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200/80 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer max-w-[220px]"
                              title={`Buka / Unduh ${docName}`}
                            >
                              <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span className="truncate">{docName}</span>
                            </a>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
