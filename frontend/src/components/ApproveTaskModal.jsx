import { useEffect, useState } from 'react'
import LoadingSpinner from './common/LoadingSpinner'

export default function ApproveTaskModal({
  open,
  record,
  onClose,
  onConfirm,
  loading = false,
}) {
  const [approvalNote, setApprovalNote] = useState('Pekerjaan telah diperiksa dan disetujui sesuai spesifikasi.')
  const [includeRating, setIncludeRating] = useState(true)
  const [qualityScore, setQualityScore] = useState(90)
  const [evalNote, setEvalNote] = useState('')

  // Reset fields when opened with a new record
  useEffect(() => {
    if (open) {
      setApprovalNote('Pekerjaan telah diperiksa dan disetujui sesuai spesifikasi.')
      setIncludeRating(true)
      setQualityScore(90)
      setEvalNote('')
    }
  }, [open, record])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose?.()
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, loading, onClose])

  if (!open || !record) return null

  // Extract relevant task information from record
  const isReporting = !record.judul && record.pekerjaan
  const jobTitle = isReporting ? (record.pekerjaan?.judul || `Pekerjaan #${record.id_pekerjaan}`) : (record.judul || `Pekerjaan #${record.id_pekerjaan}`)
  const employeeName = record.user?.nama || record.pic?.nama || record.pekerjaan?.pic?.nama || 'Karyawan PIC'
  const deadline = isReporting ? record.pekerjaan?.deadline : record.deadline
  const extractFallbackName = (url) => url ? decodeURIComponent(url.split('/').pop()) : 'Berkas Tugas'
  const taskFiles = isReporting
    ? (record.dokumen_bukti_urls?.length ? record.dokumen_bukti_urls : (record.pekerjaan?.file_tugas_urls?.length ? record.pekerjaan.file_tugas_urls : (record.dokumen_bukti_url || record.pekerjaan?.file_tugas_url ? [{ name: extractFallbackName(record.dokumen_bukti_url || record.pekerjaan?.file_tugas_url), url: record.dokumen_bukti_url || record.pekerjaan?.file_tugas_url }] : [])))
    : (record.file_tugas_urls?.length ? record.file_tugas_urls : (record.latest_reporting?.dokumen_bukti_urls?.length ? record.latest_reporting.dokumen_bukti_urls : (record.file_tugas_url || record.latest_reporting?.dokumen_bukti_url ? [{ name: extractFallbackName(record.file_tugas_url || record.latest_reporting?.dokumen_bukti_url), url: record.file_tugas_url || record.latest_reporting?.dokumen_bukti_url }] : [])))
  const fileUrl = taskFiles.length > 0 ? taskFiles[0].url : null
  const employeeNote = isReporting ? (record.catatan || record.pekerjaan?.catatan_karyawan) : (record.catatan_karyawan || record.latest_reporting?.catatan)

  // Calculate speed score preview based on deadline vs today
  let speedScorePreview = 100
  if (deadline) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)

    if (!isNaN(deadlineDate.getTime())) {
      if (today < deadlineDate) {
        speedScorePreview = 100 // Tepat waktu / lebih awal
      } else if (today.getTime() === deadlineDate.getTime()) {
        speedScorePreview = 85 // Tepat hari H
      } else {
        const diffTime = Math.abs(today - deadlineDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        speedScorePreview = Math.max(40, 85 - diffDays * 10)
      }
    }
  }

  // Final score preview
  const qs = Number(qualityScore) || 0
  const finalScorePreview = Math.round(((speedScorePreview * 0.4) + (qs * 0.6)) * 100) / 100

  // Grade badge helper
  const getGradeInfo = (score) => {
    if (score >= 90) return { label: 'A (Sangat Baik)', color: 'text-success-600 bg-success-50 dark:bg-success-500/15 border-success-200' }
    if (score >= 80) return { label: 'B (Baik)', color: 'text-brand-600 bg-brand-50 dark:bg-brand-500/15 border-brand-200' }
    if (score >= 70) return { label: 'C (Cukup)', color: 'text-warning-600 bg-warning-50 dark:bg-warning-500/15 border-warning-200' }
    return { label: 'D (Kurang)', color: 'text-error-600 bg-error-50 dark:bg-error-500/15 border-error-200' }
  }

  const gradeInfo = getGradeInfo(qualityScore)

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm?.({
      catatan_review: approvalNote,
      quality_score: includeRating ? Number(qualityScore) : null,
      catatan_evaluasi: includeRating ? (evalNote.trim() || approvalNote) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 h-full w-full bg-gray-900/50 backdrop-blur-[6px] transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 transition-all z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/15">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Setujui Pekerjaan & Evaluasi Kinerja
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Verifikasi hasil tugas, berikan persetujuan, dan catat skor evaluasi performa karyawan langsung dalam satu langkah.
              </p>
            </div>
          </div>

          {/* Task Info Summary */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-gray-400">Judul Pekerjaan</span>
                <h4 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                  {jobTitle}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  PIC: {employeeName}
                </span>
                {deadline && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    Batas: {deadline}
                  </span>
                )}
              </div>
            </div>

            {employeeNote && (
              <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 text-xs">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Catatan dari Karyawan: </span>
                <span className="text-gray-700 dark:text-gray-300 italic">"{employeeNote}"</span>
              </div>
            )}

            {taskFiles.length > 0 && (
              <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  Berkas Hasil Pengerjaan ({taskFiles.length}):
                </span>
                <div className="flex flex-col gap-1.5 items-start sm:items-end">
                  {taskFiles.map((tf, idx) => (
                    <a
                      key={idx}
                      href={tf.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 text-xs font-semibold border border-brand-200/80 dark:border-brand-800/60 shadow-2xs transition-all active:scale-95 max-w-[280px]"
                      title={`Buka / Unduh ${tf.name || `Berkas ${idx + 1}`}`}
                    >
                      <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="truncate">{tf.name || `Berkas Tugas ${idx + 1}`}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Catatan Persetujuan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Catatan Persetujuan (Review Notes) <span className="text-error-500">*</span>
            </label>
            <textarea
              rows={2}
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Tuliskan catatan persetujuan untuk karyawan..."
              disabled={loading}
              className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 p-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-brand-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-all disabled:opacity-50"
              required
            />
          </div>

          {/* Shortcut Penilaian Cepat */}
          <div className="rounded-2xl border border-brand-200/90 dark:border-brand-800/60 bg-brand-50/30 dark:bg-brand-950/20 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeRating}
                  onChange={(e) => setIncludeRating(e.target.checked)}
                  disabled={loading}
                  className="size-4.5 rounded-md border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Beri Nilai Kinerja Karyawan Sekaligus
                </span>
              </label>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">
                Shortcut Cepat
              </span>
            </div>

            {includeRating && (
              <div className="space-y-4 pt-2 border-t border-brand-100 dark:border-brand-900/50">
                {/* Skor Kualitas Slider & Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Skor Kualitas Hasil Kerja (0 - 100):
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border ${gradeInfo.color}`}>
                        {gradeInfo.label}
                      </span>
                      <span className="text-lg font-black text-brand-600 dark:text-brand-400">
                        {qualityScore}
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={qualityScore}
                    onChange={(e) => setQualityScore(Number(e.target.value))}
                    disabled={loading}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:bg-gray-700"
                  />

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-2xs text-gray-400 mr-1">Pilihan Cepat:</span>
                    {[
                      { label: '80 (Baik)', val: 80 },
                      { label: '85 (Sangat Baik)', val: 85 },
                      { label: '90 (Unggul)', val: 90 },
                      { label: '95 (Istimewa)', val: 95 },
                      { label: '100 (Sempurna)', val: 100 },
                    ].map((btn) => (
                      <button
                        key={btn.val}
                        type="button"
                        onClick={() => setQualityScore(btn.val)}
                        disabled={loading}
                        className={`text-2xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                          qualityScore === btn.val
                            ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Calculation Pill */}
                <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-brand-200/60 dark:border-brand-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-gray-400 block text-2xs">Skor Kecepatan (40%)</span>
                      <span className="font-bold text-gray-700 dark:text-gray-200">
                        {speedScorePreview} / 100
                      </span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">+</span>
                    <div>
                      <span className="text-gray-400 block text-2xs">Skor Kualitas (60%)</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {qualityScore} / 100
                      </span>
                    </div>
                  </div>
                  <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
                    <span className="text-gray-400 block text-2xs">Estimasi Nilai Akhir Evaluasi</span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {finalScorePreview} <span className="text-xs font-normal text-gray-400">/ 100</span>
                    </span>
                  </div>
                </div>

                {/* Catatan Evaluasi Kinerja (Opsional) */}
                <div>
                  <label className="block text-2xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Catatan Khusus Evaluasi Kinerja (Opsional, kosongkan jika sama dengan catatan review):
                  </label>
                  <input
                    type="text"
                    value={evalNote}
                    onChange={(e) => setEvalNote(e.target.value)}
                    placeholder="Contoh: Sangat teliti, kode rapi dan dokumentasi lengkap."
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-brand-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-5 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-success-600 hover:bg-success-700 active:bg-success-800 font-semibold text-sm text-white transition-all active:scale-95 shadow-theme-xs shadow-success-600/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="xs" text="" />
                  <span>Memproses Persetujuan...</span>
                </>
              ) : (
                <>
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{includeRating ? 'Setujui & Simpan Nilai Kinerja' : 'Setujui Pekerjaan Selesai'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
