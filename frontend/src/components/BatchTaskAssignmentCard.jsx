import { useEffect, useMemo, useRef, useState } from 'react'
import { batchCreatePekerjaan, listResource } from '../api/resources'
import LoadingSpinner from './common/LoadingSpinner'
import MonthInputField from './common/MonthInputField'

export default function BatchTaskAssignmentCard({
  initialTarget,
  clients = [],
  contracts = [],
  services = [],
  employees = [],
  onSuccess,
  onCancel,
}) {
  const targetAssignment = useMemo(() => {
    if (initialTarget) return initialTarget
    try {
      const stored = sessionStorage.getItem('target_batch_assignment')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return null
  }, [initialTarget])

  const [selectedKlienId, setSelectedKlienId] = useState(() => {
    return targetAssignment?.id_klien ? String(targetAssignment.id_klien) : ''
  })
  const [selectedLayananId, setSelectedLayananId] = useState(() => {
    return targetAssignment?.id_layanan ? String(targetAssignment.id_layanan) : ''
  })
  const targetMasterJobId = useMemo(() => {
    return targetAssignment?.id_master_pekerjaan ? Number(targetAssignment.id_master_pekerjaan) : null
  }, [targetAssignment])
  const targetJobIds = useMemo(() => {
    if (Array.isArray(targetAssignment?.target_job_ids) && targetAssignment.target_job_ids.length > 0) {
      return targetAssignment.target_job_ids.map(Number)
    }
    return null
  }, [targetAssignment])

  useEffect(() => {
    if (targetAssignment?.id_klien) {
      setSelectedKlienId(String(targetAssignment.id_klien))
    }
    if (targetAssignment?.id_layanan) {
      setSelectedLayananId(String(targetAssignment.id_layanan))
    }
  }, [targetAssignment])

  const [masterJobs, setMasterJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [jobItems, setJobItems] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [expandedSop, setExpandedSop] = useState({})

  // Bulan periode default (Format YYYY-MM, contoh: 2026-10)
  const currentMonthStr = useMemo(() => {
    if (targetAssignment?.periode_bulan) {
      return targetAssignment.periode_bulan
    }
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }, [targetAssignment])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Cari objek Klien yang dipilih
  const currentKlien = useMemo(() => {
    if (!selectedKlienId) return null
    return clients.find((k) => String(k.id_klien) === String(selectedKlienId)) || null
  }, [clients, selectedKlienId])

  // Cari kontrak terkait klien tersebut
  const currentKontrak = useMemo(() => {
    if (!currentKlien) return null
    if (currentKlien.kontrak) return currentKlien.kontrak
    return contracts.find((c) => String(c.id_kontrak) === String(currentKlien.id_kontrak)) || null
  }, [currentKlien, contracts])

  // Hanya tampilkan klien yang kontraknya berstatus 'aktif' untuk penugasan baru
  const activeClients = useMemo(() => {
    return (clients || []).filter((k) => {
      // Pertahankan klien jika merupakan target otomatis dari pengingat dasbor
      if (targetAssignment?.id_klien && String(k.id_klien) === String(targetAssignment.id_klien)) {
        return true
      }
      const contractStatus = k.kontrak?.status ||
        (contracts || []).find((c) => String(c.id_kontrak) === String(k.id_kontrak))?.status
      return contractStatus === 'aktif'
    })
  }, [clients, contracts, targetAssignment])

  // Filter Layanan:
  // Jika kontrak memiliki daftar layanan (layanan_ids atau kontrak.layanan),
  // maka hanya tampilkan layanan yang ada dalam kontrak tersebut!
  const availableServices = useMemo(() => {
    if (!currentKontrak && !currentKlien) return services

    const contractLayananIds = currentKontrak?.layanan_ids ||
      currentKlien?.layanan_ids ||
      (Array.isArray(currentKontrak?.layanan) ? currentKontrak.layanan.map((l) => l.id_layanan) : [])

    if (contractLayananIds.length > 0) {
      const filtered = services.filter((s) => contractLayananIds.includes(s.id_layanan))
      return filtered.length > 0 ? filtered : services
    }

    return services
  }, [currentKontrak, currentKlien, services])

  const loadedLayananIdRef = useRef(null)
  const templateCacheRef = useRef({})

  // Reset / sesuaikan Layanan saat Klien berganti
  useEffect(() => {
    if (!selectedKlienId) {
      setSelectedLayananId('')
      setJobItems([])
      loadedLayananIdRef.current = null
      return
    }

    if (availableServices.length > 0) {
      // Prioritaskan targetAssignment.id_layanan jika cocok dengan availableServices
      if (targetAssignment?.id_layanan) {
        const matchesTarget = availableServices.some((s) => String(s.id_layanan) === String(targetAssignment.id_layanan))
        if (matchesTarget) {
          setSelectedLayananId(String(targetAssignment.id_layanan))
          return
        }
      }

      // Jika layanan yang sedang dipilih tidak ada di availableServices klien ini, pilih yang pertama
      const exists = selectedLayananId && availableServices.some((s) => String(s.id_layanan) === String(selectedLayananId))
      if (!exists) {
        setSelectedLayananId(String(availableServices[0].id_layanan))
      }
    }
  }, [selectedKlienId, availableServices, selectedLayananId, targetAssignment])

  // Saat selectedLayananId berganti, muat template pekerjaan dari Layanan tersebut
  useEffect(() => {
    if (!selectedLayananId) {
      setMasterJobs([])
      setJobItems([])
      loadedLayananIdRef.current = null
      return
    }

    // Jika layanan ini SUDAH selesai dimuat dan template masih ada di state, jangan trigger loading lagi!
    if (loadedLayananIdRef.current === selectedLayananId && jobItems.length > 0) {
      return
    }

    // Cek cache memori lokal terlebih dahulu untuk menghindari loading ulang yang tidak perlu
    if (templateCacheRef.current[selectedLayananId]) {
      const cachedList = templateCacheRef.current[selectedLayananId]
      setMasterJobs(cachedList)
      const defaultPicId = employees.length > 0 ? String(employees[0].id_user) : ''
      const items = cachedList.map((job) => {
        const daysToAdd = job.estimasi_hari || 7
        const deadlineDate = new Date()
        deadlineDate.setDate(deadlineDate.getDate() + daysToAdd)
        let isTarget = true
        if (targetJobIds) {
          isTarget = targetJobIds.includes(Number(job.id_master_pekerjaan))
        } else if (targetMasterJobId) {
          isTarget = Number(job.id_master_pekerjaan) === targetMasterJobId || (targetAssignment?.nama_pekerjaan && job.nama_pekerjaan === targetAssignment.nama_pekerjaan)
        } else {
          isTarget = job.sifat_periode === 'bulanan'
        }

        return {
          selected: isTarget,
          id_master_pekerjaan: job.id_master_pekerjaan,
          nama_pekerjaan_asli: job.nama_pekerjaan,
          judul: job.nama_pekerjaan,
          id_pic: defaultPicId,
          deadline: deadlineDate.toISOString().split('T')[0],
          sifat_periode: job.sifat_periode,
          periode_bulan: job.sifat_periode === 'bulanan' ? currentMonthStr : '',
          template_instruksi: job.template_instruksi || '',
          files: [],
        }
      })
      setJobItems(items)
      loadedLayananIdRef.current = selectedLayananId
      setLoadingJobs(false)
      return
    }

    let isMounted = true
    setLoadingJobs(true)
    setErrorMessage('')

    listResource(`master-pekerjaan?id_layanan=${selectedLayananId}&is_active=1`)
      .then((res) => {
        if (!isMounted) return
        const list = Array.isArray(res) ? res : []
        templateCacheRef.current[selectedLayananId] = list
        setMasterJobs(list)

        // Inisialisasi item penugasan
        const defaultPicId = employees.length > 0 ? String(employees[0].id_user) : ''
        const items = list.map((job) => {
          const daysToAdd = job.estimasi_hari || 7
          const deadlineDate = new Date()
          deadlineDate.setDate(deadlineDate.getDate() + daysToAdd)
          const deadlineStr = deadlineDate.toISOString().split('T')[0]
          let isTarget = true
          if (targetJobIds) {
            isTarget = targetJobIds.includes(Number(job.id_master_pekerjaan))
          } else if (targetMasterJobId) {
            isTarget = Number(job.id_master_pekerjaan) === targetMasterJobId || (targetAssignment?.nama_pekerjaan && job.nama_pekerjaan === targetAssignment.nama_pekerjaan)
          } else {
            isTarget = job.sifat_periode === 'bulanan'
          }

          return {
            selected: isTarget,
            id_master_pekerjaan: job.id_master_pekerjaan,
            nama_pekerjaan_asli: job.nama_pekerjaan,
            judul: job.nama_pekerjaan,
            id_pic: defaultPicId,
            deadline: deadlineStr,
            sifat_periode: job.sifat_periode,
            periode_bulan: job.sifat_periode === 'bulanan' ? currentMonthStr : '',
            template_instruksi: job.template_instruksi || '',
            files: [],
          }
        })

        setJobItems(items)
        loadedLayananIdRef.current = selectedLayananId
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message || 'Gagal memuat template pekerjaan dari layanan ini.')
        }
      })
      .finally(() => {
        if (isMounted) setLoadingJobs(false)
      })

    return () => { isMounted = false }
  }, [selectedLayananId, currentMonthStr])

  // Sinkronkan default PIC jika data employees tiba belakangan tanpa menimpa pilihan pengguna
  useEffect(() => {
    if (employees.length > 0) {
      setJobItems((prev) =>
        prev.map((item) => (item.id_pic ? item : { ...item, id_pic: String(employees[0].id_user) }))
      )
    }
  }, [employees])

  const toggleSelectAll = (checked) => {
    setJobItems((prev) => prev.map((item) => ({ ...item, selected: checked })))
  }

  const updateItem = (index, field, value) => {
    setJobItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleFilesAdd = (index, newFiles) => {
    if (!newFiles || newFiles.length === 0) return
    const fileArray = Array.from(newFiles)
    setJobItems((prev) => {
      const next = [...prev]
      const currentFiles = Array.isArray(next[index].files) ? next[index].files : []
      next[index] = { ...next[index], files: [...currentFiles, ...fileArray] }
      return next
    })
  }

  const handleFileRemove = (itemIndex, fileIndex) => {
    setJobItems((prev) => {
      const next = [...prev]
      const currentFiles = Array.isArray(next[itemIndex].files) ? next[itemIndex].files : []
      next[itemIndex] = {
        ...next[itemIndex],
        files: currentFiles.filter((_, idx) => idx !== fileIndex),
      }
      return next
    })
  }

  const toggleSop = (id) => {
    setExpandedSop((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectedCount = jobItems.filter((item) => item.selected).length

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')

    if (!selectedKlienId) {
      setErrorMessage('Silakan pilih Perusahaan Klien terlebih dahulu.')
      return
    }

    const contractStatus = currentKontrak?.status ||
      (contracts || []).find((c) => String(c.id_kontrak) === String(currentKlien?.id_kontrak))?.status
    if (contractStatus && contractStatus !== 'aktif') {
      setErrorMessage('Penugasan tidak dapat diproses karena kontrak klien ini sedang nonaktif atau telah dibatalkan.')
      return
    }

    const activeItems = jobItems.filter((item) => item.selected)
    if (activeItems.length === 0) {
      setErrorMessage('Pilih minimal satu pekerjaan yang akan ditugaskan.')
      return
    }

    // Validasi PIC & Deadline
    for (let i = 0; i < activeItems.length; i++) {
      const item = activeItems[i]
      if (!item.id_pic) {
        setErrorMessage(`Pekerjaan "${item.judul}" belum memiliki Penanggung Jawab (PIC). Silakan pilih karyawan pelaksana.`)
        return
      }
      if (!item.deadline) {
        setErrorMessage(`Pekerjaan "${item.judul}" belum memiliki Batas Waktu (Deadline).`)
        return
      }
      if (item.deadline < todayStr) {
        setErrorMessage(`Batas Waktu untuk pekerjaan "${item.judul}" tidak boleh sebelum hari ini.`)
        return
      }
      if (item.periode_bulan && item.periode_bulan < currentMonthStr) {
        setErrorMessage(`Bulan pengerjaan untuk pekerjaan "${item.judul}" tidak boleh sebelum bulan ini (${currentMonthStr}).`)
        return
      }
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('id_klien', selectedKlienId)
      if (selectedLayananId) {
        formData.append('id_layanan', selectedLayananId)
      }

      activeItems.forEach((item, index) => {
        if (item.id_master_pekerjaan) {
          formData.append(`items[${index}][id_master_pekerjaan]`, item.id_master_pekerjaan)
        }
        formData.append(`items[${index}][judul]`, item.judul)
        formData.append(`items[${index}][id_pic]`, item.id_pic)
        formData.append(`items[${index}][deadline]`, item.deadline)
        if (item.template_instruksi) {
          formData.append(`items[${index}][deskripsi]`, item.template_instruksi)
        }
        if (item.periode_bulan) {
          formData.append(`items[${index}][periode_bulan]`, item.periode_bulan)
        }
        formData.append(`items[${index}][prioritas]`, 'sedang')

        if (Array.isArray(item.files)) {
          item.files.forEach((file) => {
            formData.append(`items[${index}][lampiran_instruksi][]`, file)
          })
        }
      })

      await batchCreatePekerjaan(formData)
      if (typeof onSuccess === 'function') {
        onSuccess(`${activeItems.length} pekerjaan berhasil ditugaskan sekaligus kepada karyawan!`)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menugaskan pekerjaan secara batch.')
    } finally {
      setSubmitting(false)
    }
  }

  const getPeriodeBadge = (sifat) => {
    switch (sifat) {
      case 'bulanan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <span className="size-1.5 rounded-full bg-blue-500" />
            Bulanan
          </span>
        )
      case 'tahunan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <span className="size-1.5 rounded-full bg-purple-500" />
            Tahunan
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Sekali Selesai
          </span>
        )
    }
  }

  return (
    <div className="rounded-3xl border border-brand-200 dark:border-brand-900/60 bg-gradient-to-b from-brand-50/30 via-white to-white dark:from-brand-950/20 dark:via-gray-900 dark:to-gray-900 p-5 sm:p-7 shadow-xs">
      {/* Header Penugasan Batch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-xs">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              Penugasan Batch dari Paket Layanan
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Tugaskan seluruh rangkaian pekerjaan standar dari layanan kontrak ke masing-masing PIC karyawan sekaligus dalam 1 klik.
            </p>
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-100/70 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold self-start sm:self-auto">
            <span>{selectedCount} Pekerjaan Terpilih</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-4 p-4 rounded-2xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-800 text-xs font-medium text-error-700 dark:text-error-400 flex items-start gap-2.5">
          <svg className="size-4.5 shrink-0 text-error-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {targetAssignment && (
        <div className="mt-4 p-3.5 rounded-2xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 flex items-center gap-3 text-xs text-brand-900 dark:text-brand-200">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-xs shadow-xs">
            ✓
          </div>
          <div className="flex-1">
            <span className="font-bold">Penugasan dari Pengingat Dasbor:</span> Klien, Layanan, dan Periode Bulan (<strong>{currentMonthStr}</strong>) telah otomatis terisi. Silakan tentukan staf pelaksana (PIC) lalu klik buat penugasan.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-6">
        {/* Cascade Step 1 & Step 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 shadow-2xs">
          {/* Step 1: Pilih Klien & Kontrak */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              1. Pilih Perusahaan Klien <span className="text-error-500">*</span>
            </label>
            <select
              value={selectedKlienId}
              onChange={(e) => setSelectedKlienId(e.target.value)}
              required
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors"
            >
              <option value="" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                {activeClients.length === 0 ? '-- Tidak ada klien dengan kontrak aktif --' : '-- Pilih Perusahaan Klien --'}
              </option>
              {activeClients.map((k) => (
                <option key={k.id_klien} value={k.id_klien} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                  {k.nama_perusahaan} {k.kontrak?.no_kontrak ? `(${k.kontrak.no_kontrak})` : ''}
                </option>
              ))}
            </select>
            {currentKontrak && (
              <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">No. Kontrak:</span>
                <span className="font-mono text-brand-600 dark:text-brand-400">{currentKontrak.no_kontrak}</span>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <span>Status: <strong className="capitalize">{currentKontrak.status}</strong></span>
              </div>
            )}
          </div>

          {/* Step 2: Pilih Layanan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              2. Pilih Paket Layanan <span className="text-error-500">*</span>
            </label>
            <select
              value={selectedLayananId}
              onChange={(e) => setSelectedLayananId(e.target.value)}
              required
              disabled={submitting || !selectedKlienId || availableServices.length === 0}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 transition-colors disabled:opacity-50"
            >
              {availableServices.length === 0 ? (
                <option value="" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Tidak ada paket layanan terkait</option>
              ) : (
                availableServices.map((s) => (
                  <option key={s.id_layanan} value={s.id_layanan} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                    {s.nama_layanan}
                  </option>
                ))
              )}
            </select>
            {currentKontrak && (
              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                {currentKontrak.layanan_ids?.length > 0
                  ? 'Menampilkan layanan resmi yang tercakup dalam kontrak ini.'
                  : 'Menampilkan seluruh katalog layanan aktif.'}
              </p>
            )}
          </div>
        </div>

        {/* Step 3: Daftar Pekerjaan Standar */}
        {selectedLayananId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Daftar Pekerjaan Standar Layanan
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {jobItems.length} Item
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => toggleSelectAll(true)}
                  className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                >
                  Pilih Semua
                </button>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <button
                  type="button"
                  onClick={() => toggleSelectAll(false)}
                  className="font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
                >
                  Batalkan Semua
                </button>
              </div>
            </div>

            {loadingJobs ? (
              <div className="py-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <LoadingSpinner size="md" text="Memuat template pekerjaan..." />
              </div>
            ) : jobItems.length === 0 ? (
              <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-500">
                Belum ada template pekerjaan terdaftar untuk layanan ini. Pimpinan dapat menambahkannya di menu <strong>Data Master &rarr; Master Pekerjaan</strong>.
              </div>
            ) : (
              <div className="space-y-3">
                {jobItems.map((item, idx) => {
                  const isChecked = item.selected
                  const isSopOpen = expandedSop[item.id_master_pekerjaan]

                  return (
                    <div
                      key={item.id_master_pekerjaan || idx}
                      className={`rounded-2xl border transition-all ${
                        isChecked
                          ? 'border-brand-300 bg-white dark:bg-gray-800/90 dark:border-brand-500/40 shadow-xs'
                          : 'border-gray-200 bg-gray-50/60 dark:bg-gray-900/40 dark:border-gray-800 opacity-60'
                      }`}
                    >
                      <div className="p-4 sm:p-5">
                        {/* Header Item: Checkbox, Judul, Sifat Periode */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800/70">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              id={`chk_job_${idx}`}
                              checked={isChecked}
                              onChange={(e) => {
                                e.stopPropagation()
                                updateItem(idx, 'selected', e.target.checked)
                              }}
                              className="size-5 rounded text-brand-600 focus:ring-brand-500 mt-1 cursor-pointer accent-brand-600"
                            />
                            <div className="min-w-0 flex-1">
                              <input
                                type="text"
                                value={item.judul}
                                onChange={(e) => updateItem(idx, 'judul', e.target.value)}
                                disabled={!isChecked || submitting}
                                placeholder="Judul Pekerjaan"
                                className="w-full text-sm font-bold text-gray-900 dark:text-white bg-transparent border-0 border-b border-transparent focus:border-brand-500 focus:ring-0 p-0 focus:outline-hidden disabled:opacity-50"
                              />
                              <div className="flex items-center gap-2 mt-0.5">
                                <label
                                  htmlFor={`chk_job_${idx}`}
                                  className="text-[11px] text-gray-400 cursor-pointer select-none"
                                >
                                  Template: {item.nama_pekerjaan_asli} &bull;{' '}
                                  <span className={isChecked ? 'text-success-600 dark:text-success-400 font-semibold' : 'text-gray-400'}>
                                    {isChecked ? 'Terpilih untuk ditugaskan' : 'Dilewati (Tidak ditugaskan)'}
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto pl-8 sm:pl-0">
                            {getPeriodeBadge(item.sifat_periode)}
                            {item.template_instruksi && (
                              <button
                                type="button"
                                onClick={() => toggleSop(item.id_master_pekerjaan)}
                                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 underline cursor-pointer"
                              >
                                {isSopOpen ? 'Tutup SOP' : 'Lihat SOP'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* SOP Accordion Preview */}
                        {isSopOpen && item.template_instruksi && (
                          <div className="my-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line font-mono leading-relaxed">
                            <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                              SOP &amp; Instruksi Acuan:
                            </span>
                            {item.template_instruksi}
                          </div>
                        )}

                        {/* Input Row: PIC Karyawan, Deadline, Periode Bulan, Berkas Acuan */}
                        {isChecked && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
                            {/* PIC Karyawan */}
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                PIC Karyawan <span className="text-error-500">*</span>
                              </label>
                              <select
                                value={String(item.id_pic || '')}
                                onChange={(e) => updateItem(idx, 'id_pic', e.target.value)}
                                required={isChecked}
                                disabled={submitting}
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                              >
                                <option value="" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">-- Pilih Karyawan --</option>
                                {employees.map((emp) => (
                                  <option key={emp.id_user} value={String(emp.id_user)} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                                    {emp.nama}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Batas Waktu / Deadline */}
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                Batas Waktu (Deadline) <span className="text-error-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={item.deadline}
                                min={todayStr}
                                onChange={(e) => updateItem(idx, 'deadline', e.target.value)}
                                required={isChecked}
                                disabled={submitting}
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                              />
                            </div>

                            {/* Periode Bulan (Khusus pekerjaan Bulanan) */}
                            {item.sifat_periode === 'bulanan' && (
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                  Bulan Pengerjaan
                                </label>
                                <MonthInputField
                                  name={`item_${idx}_periode_bulan`}
                                  value={item.periode_bulan}
                                  min={currentMonthStr}
                                  onChange={(val) => updateItem(idx, 'periode_bulan', val)}
                                  disabled={submitting}
                                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 pr-9 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                                />
                              </div>
                            )}

                            {/* Upload Berkas Acuan / TOR (Multiple Files) - Menggantikan Prioritas */}
                            <div className={item.sifat_periode === 'bulanan' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                Berkas Acuan / TOR (Bisa Banyak)
                              </label>
                              <label
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (!submitting && e.dataTransfer?.files?.length) {
                                    handleFilesAdd(idx, e.dataTransfer.files)
                                  }
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/60 dark:bg-gray-900/60 cursor-pointer transition-colors text-xs text-gray-600 dark:text-gray-300"
                              >
                                <svg className="size-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="truncate">
                                  {item.files?.length > 0 ? `+ Tambah (${item.files.length} file)` : 'Pilih Berkas Acuan...'}
                                </span>
                                <input
                                  type="file"
                                  multiple
                                  accept=".pdf,image/*,.zip,.rar,.doc,.docx,.xls,.xlsx"
                                  disabled={submitting}
                                  onChange={(e) => {
                                    handleFilesAdd(idx, e.target.files)
                                    e.target.value = ''
                                  }}
                                  className="hidden"
                                />
                              </label>

                              {/* Daftar File yang Dipilih */}
                              {item.files?.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {item.files.map((file, fIdx) => (
                                    <span
                                      key={fIdx}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-brand-50 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-800 text-[11px] text-brand-800 dark:text-brand-300 max-w-[200px]"
                                    >
                                      <span className="truncate">{file.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleFileRemove(idx, fIdx)}
                                        disabled={submitting}
                                        className="text-gray-400 hover:text-error-500 font-bold ml-0.5 cursor-pointer"
                                        title="Hapus berkas"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedLayananId && jobItems.length > 0
              ? 'Pastikan PIC karyawan dan batas waktu telah sesuai sebelum menekan tombol penugasan.'
              : 'Pilih klien dan paket layanan di atas untuk menampilkan daftar penugasan batch.'}
          </p>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center h-11 px-5 rounded-2xl border border-gray-300 dark:border-gray-700 font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>
            )}
            {selectedLayananId && jobItems.length > 0 && (
              <button
                type="submit"
                disabled={submitting || selectedCount === 0}
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="xs" text="" />
                    <span>Memproses Penugasan Sekaligus...</span>
                  </>
                ) : (
                  <>
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tugaskan {selectedCount} Pekerjaan Sekaligus</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
