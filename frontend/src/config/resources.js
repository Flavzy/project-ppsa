export const resourceConfigs = [
  {
    key: 'calonKlien',
    label: 'Calon Klien',
    endpoint: 'calon-klien',
    primaryKey: 'id_calon_klien',
    displayField: 'nama_perusahaan',
    allowedRoles: ['admin', 'pimpinan', 'operator', 'sales'],
    canCreate: ['admin', 'pimpinan', 'operator', 'sales'],
    canEdit: ['admin', 'pimpinan', 'operator', 'sales'],
    canDelete: ['admin', 'pimpinan'],
    columns: [
      { key: 'nama_perusahaan', label: 'Nama Perusahaan' },
      { key: 'nama_klien', label: 'Nama Klien' },
      { key: 'nama_direktur', label: 'Nama Direktur' },
      { key: 'kontak_person', label: 'Kontak Person' },
      { key: 'id_user', label: 'Operator PIC' },
      { key: 'status_prospek', label: 'Status' },
      { key: 'legalitas_status', label: 'Legalitas' },
    ],
    fields: [
      // 1. Data Klien & Perusahaan
      { name: 'nama_klien', label: '1. Nama Klien', type: 'text', required: true, section: 'Informasi Profil Klien & Perusahaan' },
      { name: 'nama_perusahaan', label: '2. Nama Perusahaan', type: 'text', required: true, section: 'Informasi Profil Klien & Perusahaan' },
      { name: 'alamat_perusahaan', label: '3. Alamat Perusahaan', type: 'textarea', rows: 2, required: false, section: 'Informasi Profil Klien & Perusahaan' },
      { name: 'nama_direktur', label: '4. Nama Direktur', type: 'text', required: false, section: 'Informasi Profil Klien & Perusahaan' },
      { name: 'kontak_person', label: '5. Kontak Person (No. HP / WhatsApp / Telepon)', type: 'text', required: true, placeholder: 'No. HP / WhatsApp / Telepon (maks. 16 digit angka)', numericOnly: true, maxLength: 16, section: 'Informasi Profil Klien & Perusahaan' },
      { name: 'email', label: '6. Email Klien / Perusahaan', type: 'email', required: false, placeholder: 'contoh: kontak@perusahaan.com', section: 'Informasi Profil Klien & Perusahaan' },
      {
        name: 'id_user',
        label: 'Operator PIC',
        type: 'select',
        optionsResource: 'users',
        optionsFilter: (user) => ['operator', 'sales'].includes(user.role),
        optionValue: 'id_user',
        optionLabel: 'nama',
        required: true,
        section: 'Informasi Profil Klien & Perusahaan'
      },
      {
        name: 'status_prospek',
        label: 'Status Prospek',
        type: 'select',
        required: true,
        defaultValue: 'belum_deal',
        section: 'Informasi Profil Klien & Perusahaan',
        options: [
          { value: 'belum_deal', label: 'Belum Deal' },
          { value: 'deal', label: 'Deal' },
        ],
      },
      { name: 'tgl_followup', label: 'Tanggal Follow Up', type: 'date', defaultValue: () => new Date().toISOString().split('T')[0], section: 'Informasi Profil Klien & Perusahaan' },

      // 2. Legalitas Perusahaan (Nomor & Dokumen Pendukung)
      { name: 'nomor_nib', label: '1. NIB (Nomor Induk Berusaha)', type: 'text', placeholder: 'Masukkan nomor NIB', section: 'Legalitas Perusahaan & Dokumen Pendukung' },
      { name: 'file_nib', label: 'Upload Dokumen NIB', type: 'file', accept: '.pdf,image/*', section: 'Legalitas Perusahaan & Dokumen Pendukung' },

      { name: 'nomor_npwp', label: '2. NPWP Perusahaan', type: 'text', placeholder: 'Masukkan nomor NPWP', section: 'Legalitas Perusahaan & Dokumen Pendukung' },
      { name: 'file_npwp', label: 'Upload Dokumen NPWP', type: 'file', accept: '.pdf,image/*', section: 'Legalitas Perusahaan & Dokumen Pendukung' },

      { name: 'nomor_akta_pendirian', label: '3. Akta Pendirian', type: 'text', placeholder: 'Masukkan nomor Akta Pendirian', section: 'Legalitas Perusahaan & Dokumen Pendukung' },
      { name: 'file_akta_pendirian', label: 'Upload Dokumen Akta Pendirian', type: 'file', accept: '.pdf,image/*', section: 'Legalitas Perusahaan & Dokumen Pendukung' },

      { name: 'nomor_sk_kemenkumham', label: '4. SK Kemenkumham', type: 'text', placeholder: 'Masukkan nomor SK Kemenkumham', section: 'Legalitas Perusahaan & Dokumen Pendukung' },
      { name: 'file_sk_kemenkumham', label: 'Upload Dokumen SK Kemenkumham', type: 'file', accept: '.pdf,image/*', section: 'Legalitas Perusahaan & Dokumen Pendukung' },

      { name: 'nomor_izin_usaha', label: '5. Izin Usaha', type: 'text', placeholder: 'Masukkan nomor Izin Usaha', section: 'Legalitas Perusahaan & Dokumen Pendukung' },
      { name: 'file_izin_usaha', label: 'Upload Dokumen Izin Usaha', type: 'file', accept: '.pdf,image/*', section: 'Legalitas Perusahaan & Dokumen Pendukung' },

      { name: 'file_dokumen_pendukung', label: 'Upload Dokumen Pendukung Lainnya', type: 'file', multiple: true, accept: '.pdf,image/*,.zip,.rar,.doc,.docx,.xls,.xlsx', section: 'Legalitas Perusahaan & Dokumen Pendukung' },
    ],
  },
  {
    key: 'kontrak',
    label: 'Kontrak',
    endpoint: 'kontrak',
    primaryKey: 'id_kontrak',
    displayField: 'no_kontrak',
    allowedRoles: ['admin', 'pimpinan', 'operator', 'sales'],
    canCreate: ['admin', 'pimpinan', 'operator', 'sales'],
    canEdit: ['admin', 'pimpinan', 'operator', 'sales'],
    canDelete: ['admin', 'pimpinan'],
    columns: [
      { key: 'no_kontrak', label: 'No Kontrak' },
      { key: 'id_calon_klien', label: 'Nama Perusahaan' },
      { key: 'tgl_mulai', label: 'Mulai' },
      { key: 'tgl_selesai', label: 'Selesai' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      {
        name: 'id_calon_klien',
        label: 'Nama Perusahaan',
        type: 'select',
        optionsResource: 'calonKlien',
        optionsFilter: (client) => client.status_prospek === 'deal',
        optionValue: 'id_calon_klien',
        optionLabel: 'nama_perusahaan',
        required: true,
      },
      { name: 'no_kontrak', label: 'No Kontrak', type: 'text', required: true },
      { name: 'tgl_mulai', label: 'Tanggal Mulai', type: 'date', defaultValue: () => new Date().toISOString().split('T')[0], required: true },
      { name: 'tgl_selesai', label: 'Tanggal Selesai', type: 'date', required: true },
      {
        name: 'status',
        label: 'Status Kontrak',
        type: 'select',
        required: true,
        defaultValue: 'draft',
        options: [
          { value: 'draft', label: 'Draft (Menunggu Tanda Tangan)' },
          { value: 'aktif', label: 'Aktif (Berjalan)' },
          { value: 'selesai', label: 'Selesai' },
          { value: 'nonaktif', label: 'Nonaktif / Berakhir' },
          { value: 'batal', label: 'Dibatalkan' },
        ],
      },
    ],
  },
  {
    key: 'klien',
    label: 'Klien',
    endpoint: 'klien',
    primaryKey: 'id_klien',
    displayField: 'nama_perusahaan',
    allowedRoles: ['admin', 'pimpinan', 'operator', 'sales'],
    canCreate: ['admin', 'pimpinan', 'operator', 'sales'],
    canEdit: ['admin', 'pimpinan', 'operator', 'sales'],
    canDelete: ['admin', 'pimpinan'],
    columns: [
      { key: 'nama_perusahaan', label: 'Nama Perusahaan' },
      { key: 'alamat', label: 'Alamat' },
      { key: 'kontak', label: 'Kontak' },
      { key: 'layanan', label: 'Layanan' },
    ],
    fields: [
      { name: 'id_kontrak', label: 'Nomor Kontrak', type: 'select', optionsResource: 'kontrak', optionValue: 'id_kontrak', optionLabel: 'no_kontrak', required: true },
      { name: 'nama_perusahaan', label: 'Nama Perusahaan', type: 'text', required: true },
      { name: 'alamat', label: 'Alamat', type: 'textarea', required: true },
      { name: 'kontak', label: 'Kontak', type: 'text', required: true },
      { name: 'layanan', label: 'Layanan', type: 'text', required: true },
    ],
  },
  {
    key: 'pekerjaan',
    label: 'Kelola Pekerjaan',
    endpoint: 'pekerjaan',
    primaryKey: 'id_pekerjaan',
    displayField: 'judul',
    allowedRoles: ['admin', 'pimpinan', 'operator', 'karyawan'],
    canCreate: ['admin', 'pimpinan', 'operator'],
    canEdit: ['admin', 'pimpinan', 'operator', 'karyawan'],
    canDelete: ['admin', 'pimpinan'],
    columns: [
      { key: 'judul', label: 'Judul Pekerjaan' },
      { key: 'id_klien', label: 'Nama Perusahaan (Klien)' },
      { key: 'id_pic', label: 'Penanggung Jawab (PIC Karyawan)' },
      { key: 'tgl_penugasan', label: 'Tgl Memasukkan Tugas' },
      { key: 'deadline', label: 'Batas Waktu' },
      { key: 'status', label: 'Status' },
      { key: 'lampiran_instruksi', label: 'Dokumen Acuan (TOR)' },
      { key: 'file_tugas', label: 'Berkas Tugas Selesai' },
      { key: 'tgl_selesai', label: 'Tanggal Selesai' },
    ],
    fields: [
      { name: 'id_klien', label: 'Nama Perusahaan (Klien)', type: 'select', optionsResource: 'klien', optionValue: 'id_klien', optionLabel: 'nama_perusahaan', required: true },
      {
        name: 'id_pic',
        label: 'Penanggung Jawab (PIC Karyawan)',
        type: 'select',
        optionsResource: 'users',
        optionsFilter: (user) => user.role === 'karyawan',
        optionValue: 'id_user',
        optionLabel: 'nama',
        required: true,
      },
      { name: 'judul', label: 'Judul Pekerjaan / Layanan', type: 'text', required: true, placeholder: 'Contoh: Pengembangan Website Perusahaan' },
      {
        name: 'tgl_penugasan',
        label: 'Tanggal Memasukkan Tugas',
        type: 'date',
        required: true,
        defaultValue: new Date().toISOString().split('T')[0],
      },
      { name: 'deadline', label: 'Batas Waktu (Deadline)', type: 'date', required: true },
      {
        name: 'status',
        label: 'Status Pengerjaan',
        type: 'select',
        required: true,
        defaultValue: 'baru',
        options: [
          { value: 'baru', label: 'Baru (Menunggu Dikerjakan)' },
          { value: 'in_progress', label: 'Dalam Pengerjaan' },
          { value: 'submitted', label: 'Diajukan untuk Ditinjau' },
          { value: 'revision_needed', label: 'Perlu Revisi' },
          { value: 'completed', label: 'Selesai' },
        ],
      },
      {
        name: 'deskripsi',
        label: 'Rincian & Instruksi Pekerjaan',
        type: 'textarea',
        rows: 4,
        fullWidth: true,
        required: false,
        placeholder: 'Tuliskan instruksi penugasan, rincian pekerjaan, atau ruang lingkup yang harus diselesaikan karyawan...',
      },
      {
        name: 'lampiran_instruksi',
        label: 'Berkas Acuan / Dokumen Panduan (TOR / Brief)',
        type: 'file',
        multiple: true,
        accept: '.pdf,image/*,.zip,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
        required: false,
        fullWidth: true,
      },
    ],
  },
  {
    key: 'reporting',
    label: 'Reporting',
    endpoint: 'reporting',
    primaryKey: 'id_reporting',
    displayField: 'catatan',
    allowedRoles: ['admin', 'karyawan', 'pimpinan'],
    canCreate: ['admin', 'karyawan'],
    canEdit: ['admin', 'karyawan'],
    canDelete: ['admin'],
    columns: [
      { key: 'id_pekerjaan', label: 'Pekerjaan Terkait' },
      { key: 'id_user', label: 'Karyawan Pelapor' },
      { key: 'tgl_lapor', label: 'Tanggal Lapor' },
      { key: 'dokumen_bukti', label: 'Dokumen Bukti' },
      { key: 'catatan', label: 'Catatan Laporan' },
      { key: 'status_laporan', label: 'Status Peninjauan' },
    ],
    fields: [
      {
        name: 'id_pekerjaan',
        label: 'Judul Pekerjaan',
        type: 'select',
        optionsResource: 'pekerjaan',
        optionsFilter: (job) => ['baru', 'in_progress', 'revision_needed'].includes(job.status),
        optionValue: 'id_pekerjaan',
        optionLabel: 'judul',
        required: true,
      },
      {
        name: 'tgl_lapor',
        label: 'Tanggal Lapor',
        type: 'date',
        required: true,
        defaultValue: () => new Date().toISOString().split('T')[0],
      },
      {
        name: 'dokumen_bukti',
        label: 'Upload Dokumen Bukti (PDF, Gambar, Zip, Dokumen)',
        type: 'file',
        multiple: true,
        accept: '.pdf,image/*,.zip,.rar,.doc,.docx,.xls,.xlsx',
        required: false,
        fullWidth: true,
      },
      { name: 'catatan', label: 'Catatan & Rincian Laporan', type: 'textarea', rows: 3, required: true },
    ],
  },
  {
    key: 'kinerjaKaryawan',
    label: 'Kinerja Karyawan',
    endpoint: 'performance-reviews',
    primaryKey: 'id_performance_review',
    displayField: 'final_score',
    allowedRoles: ['admin', 'pimpinan', 'karyawan'],
    canCreate: ['admin', 'pimpinan'],
    canEdit: ['admin', 'pimpinan'],
    canDelete: ['admin', 'pimpinan'],
    columns: [
      { key: 'id_user', label: 'Nama Karyawan' },
      { key: 'id_pekerjaan', label: 'Judul Pekerjaan' },
      { key: 'speed_score', label: 'Skor Kecepatan' },
      { key: 'quality_score', label: 'Skor Kualitas' },
      { key: 'final_score', label: 'Skor Akhir' },
      { key: 'catatan', label: 'Catatan Review' },
    ],
    fields: [
      {
        name: 'id_pekerjaan',
        label: 'Judul Pekerjaan',
        type: 'select',
        optionsResource: 'pekerjaan',
        optionValue: 'id_pekerjaan',
        optionLabel: 'judul',
        formatOptionLabel: (job) => `${job.judul} (PIC: ${job.pic?.nama || 'Tanpa PIC'})`,
        optionsFilter: (job) => {
          // 1. Wajib memiliki PIC karyawan
          if (!job.id_pic) return false

          // 2. Hanya tugas yang sudah selesai dan sudah disetujui oleh pimpinan
          const statusLower = String(job.status || '').toLowerCase()
          const reviewStatusLower = String(job.review_status || '').toLowerCase()
          const isCompleted = ['completed', 'approved'].includes(statusLower)
          const isApproved = reviewStatusLower === 'approved'
          if (!isCompleted || !isApproved) return false

          // 3. Tugas yang sudah dinilai kinerjanya JANGAN dimunculkan lagi
          const hasReview = Boolean(
            job.has_performance_review === true ||
            job.performance_review?.id_performance_review ||
            job.performance_review ||
            job.performanceReview
          )
          if (hasReview) return false

          return true
        },
        required: true,
      },
      { name: 'quality_score', label: 'Skor Kualitas (0-100)', type: 'number', required: true, min: 0, max: 100 },
      { name: 'revision_count', label: 'Jumlah Revisi', type: 'number', min: 0, defaultValue: 0 },
      { name: 'catatan', label: 'Catatan Evaluasi', type: 'textarea', rows: 3 },
    ],
  },
  {
    key: 'users',
    label: 'Manajemen Pengguna & Akun',
    endpoint: 'users',
    primaryKey: 'id_user',
    displayField: 'nama',
    allowedRoles: ['admin', 'pimpinan'],
    canCreate: ['admin', 'pimpinan'],
    canEdit: ['admin', 'pimpinan'],
    canDelete: ['admin', 'pimpinan'],
    columns: [
      { key: 'nama', label: 'Nama Pengguna' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role / Peran' },
    ],
    fields: [
      { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama Pengguna (contoh: Budi Santoso)' },
      { name: 'email', label: 'Alamat Email Login', type: 'email', required: true, placeholder: 'pengguna@example.com' },
      { name: 'password', label: 'Password Login', type: 'password', required: true, placeholder: 'Minimal 6 karakter' },
      {
        name: 'role',
        label: 'Peran Akun (Role)',
        type: 'select',
        required: true,
        defaultValue: 'operator',
        options: [
          { value: 'pimpinan', label: 'Pimpinan (Admin Utama)' },
          { value: 'operator', label: 'Operator' },
          { value: 'karyawan', label: 'Karyawan' },
        ],
      },
    ],
  },
]

export const supportResources = []

