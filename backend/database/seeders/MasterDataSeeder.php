<?php

namespace Database\Seeders;

use App\Models\Kontrak;
use App\Models\Layanan;
use App\Models\MasterPekerjaan;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            [
                'nama_layanan' => 'Jasa Pembukuan (Akuntansi)',
                'kategori' => 'akuntansi_pajak',
                'deskripsi' => 'Layanan pembukuan komprehensif, pencatatan transaksi harian, rekonsiliasi bank, dan penyusunan laporan keuangan periodik.',
                'pekerjaan' => [
                    [
                        'nama_pekerjaan' => 'Pencatatan Transaksi & Jurnal Bulanan',
                        'sifat_periode' => 'bulanan',
                        'estimasi_hari' => 5,
                        'template_instruksi' => "1. Kumpulkan seluruh bukti mutasi rekening koran dan nota transaksi.\n2. Verifikasi keabsahan bukti pengeluaran dan penerimaan kas.\n3. Input jurnal harian ke sistem akuntansi sesuai Chart of Accounts (COA).\n4. Lakukan rekonsiliasi bank dan pastikan selisih saldo nihil.",
                    ],
                    [
                        'nama_pekerjaan' => 'Penyusunan Laporan Keuangan Bulanan',
                        'sifat_periode' => 'bulanan',
                        'estimasi_hari' => 7,
                        'template_instruksi' => "1. Tarik neraca saldo (Trial Balance) setelah seluruh jurnal disesuaikan.\n2. Buat Laporan Laba Rugi komprehensif bulan berjalan.\n3. Buat Laporan Posisi Keuangan (Neraca) dan Perubahan Ekuitas.\n4. Susun ringkasan analisis arus kas dan serahkan ke Pimpinan untuk peninjauan.",
                    ],
                    [
                        'nama_pekerjaan' => 'Stock Opname & Verifikasi Aset Fisik',
                        'sifat_periode' => 'bulanan',
                        'estimasi_hari' => 3,
                        'template_instruksi' => "1. Lakukan penghitungan fisik persediaan barang di gudang atau lokasi klien.\n2. Bandingkan hasil fisik dengan kartu stok di sistem.\n3. Buat berita acara hasil stock opname dan catat jurnal penyesuaian jika ada selisih.",
                    ],
                    [
                        'nama_pekerjaan' => 'Penyusunan Laporan Keuangan Tahunan (Audit Ready)',
                        'sifat_periode' => 'tahunan',
                        'estimasi_hari' => 14,
                        'template_instruksi' => "1. Lakukan penutupan buku tahunan (Closing Journal Entry).\n2. Hitung amortisasi, depresiasi aset tetap, dan penyesuaian akhir tahun.\n3. Susun catatan atas laporan keuangan (CALK).\n4. Siapkan berkas kertas kerja pendukung untuk pemeriksaan auditor independen.",
                    ],
                ],
            ],
            [
                'nama_layanan' => 'Jasa Perpajakan (Tax Compliance & Planning)',
                'kategori' => 'akuntansi_pajak',
                'deskripsi' => 'Layanan kepatuhan perpajakan perusahaan, perhitungan pajak masa, pembuatan e-Bupot, rekonsiliasi e-Faktur, dan pelaporan SPT Tahunan Badan.',
                'pekerjaan' => [
                    [
                        'nama_pekerjaan' => 'Perhitungan & Pelaporan SPT Masa PPh 21/26',
                        'sifat_periode' => 'bulanan',
                        'estimasi_hari' => 5,
                        'template_instruksi' => "1. Hitung PPh Pasal 21 atas gaji, tunjangan, dan bonus karyawan sesuai regulasi TER terbaru.\n2. Terbitkan bukti potong PPh 21 melalui aplikasi e-Bupot 21/26.\n3. Buat kode billing pembayaran pajak dan konfirmasi pembayaran ke klien.\n4. Laporkan SPT Masa PPh 21/26 via DJP Online sebelum batas tanggal 20.",
                    ],
                    [
                        'nama_pekerjaan' => 'Perhitungan & Pelaporan SPT Masa PPh Unifikasi',
                        'sifat_periode' => 'bulanan',
                        'estimasi_hari' => 5,
                        'template_instruksi' => "1. Identifikasi tagihan/invoice pihak ketiga terkait PPh 23, PPh 22, atau PPh Final Pasal 4(2).\n2. Terbitkan bukti potong unifikasi pada portal DJP Online.\n3. Buat ID Billing untuk setoran pajak terutang.\n4. Submit SPT Masa PPh Unifikasi dan simpan Bukti Penerimaan Elektronik (BPE).",
                    ],
                    [
                        'nama_pekerjaan' => 'Rekonsiliasi Faktur Pajak & Pelaporan SPT Masa PPN',
                        'sifat_periode' => 'bulanan',
                        'estimasi_hari' => 6,
                        'template_instruksi' => "1. Tarik dan cocokkan Faktur Pajak Keluaran dengan register penjualan.\n2. Validasi Faktur Pajak Masukan yang dapat dikreditkan.\n3. Upload dan buat SPT Masa PPN 1111 di aplikasi e-Faktur Web.\n4. Selesaikan pembayaran PPN kurang bayar (jika ada) dan lapor sebelum akhir bulan berikutnya.",
                    ],
                    [
                        'nama_pekerjaan' => 'Penyusunan & Pelaporan SPT Tahunan Badan (1771)',
                        'sifat_periode' => 'tahunan',
                        'estimasi_hari' => 20,
                        'template_instruksi' => "1. Siapkan Laporan Keuangan Audited tahun buku terkait.\n2. Lakukan rekonsiliasi fiskal positif dan negatif (koreksi beda tetap & beda waktu).\n3. Isi formulir induk 1771 beserta seluruh lampiran khusus (daftar penyusutan, dividen, dll).\n4. Unggah file CSV/e-Form di DJP Online dan serahkan tanda terima resmi ke klien.",
                    ],
                ],
            ],
            [
                'nama_layanan' => 'Konsultasi Keuangan & Bisnis',
                'kategori' => 'konsultasi',
                'deskripsi' => 'Analisis kesehatan keuangan bisnis, review kepatuhan pajak, perancangan sistem pengendalian internal, dan penyusunan anggaran (budgeting).',
                'pekerjaan' => [
                    [
                        'nama_pekerjaan' => 'Analisis Rasio Keuangan & Arus Kas',
                        'sifat_periode' => 'bulanan',
                        'estimasi_hari' => 5,
                        'template_instruksi' => "1. Ekstrak data laporan keuangan terbaru.\n2. Hitung rasio likuiditas (Current Ratio), profitabilitas (NPM, ROA), dan solvabilitas (DER).\n3. Analisis pergerakan Cash Flow Operasional, Investasi, dan Pendanaan.\n4. Susun ringkasan eksekutif dan rekomendasi efisiensi modal kerja.",
                    ],
                    [
                        'nama_pekerjaan' => 'Review Kepatuhan & Efisiensi Pajak (Tax Health Check)',
                        'sifat_periode' => 'sekali_selesai',
                        'estimasi_hari' => 10,
                        'template_instruksi' => "1. Periksa riwayat pelaporan SPT Masa dan SPT Tahunan 3 tahun terakhir.\n2. Identifikasi potensi risiko pemeriksaan atau surat permintaan penjelasan (SP2DK).\n3. Berikan rekomendasi skema perencanaan pajak yang legal dan efisien (Tax Planning).",
                    ],
                    [
                        'nama_pekerjaan' => 'Penyusunan Rencana Anggaran Biaya & Budgeting',
                        'sifat_periode' => 'tahunan',
                        'estimasi_hari' => 10,
                        'template_instruksi' => "1. Kumpulkan proyeksi target penjualan dan rencana belanja operasional tiap departemen.\n2. Susun Master Budget tahunan terperinci per bulan.\n3. Tetapkan batas toleransi deviasi (variance threshold) untuk evaluasi bulanan.",
                    ],
                ],
            ],
            [
                'nama_layanan' => 'Pengembangan Sistem & Web ERP',
                'kategori' => 'teknologi_informasi',
                'deskripsi' => 'Pengembangan solusi perangkat lunak khusus, aplikasi web enterprise, sistem informasi manajemen, integrasi database, dan otomatisasi alur kerja bisnis.',
                'pekerjaan' => [
                    [
                        'nama_pekerjaan' => 'Analisis Kebutuhan Sistem & Desain Arsitektur',
                        'sifat_periode' => 'sekali_selesai',
                        'estimasi_hari' => 7,
                        'template_instruksi' => "1. Adakan sesi wawancara mendalam bersama perwakilan stakeholder klien.\n2. Susun dokumen spesifikasi kebutuhan sistem (SRS) dan alur proses bisnis (flowchart).\n3. Rancang Entity Relationship Diagram (ERD) dan wireframe antarmuka pengguna.",
                    ],
                    [
                        'nama_pekerjaan' => 'Pengembangan Modul & Integrasi Database',
                        'sifat_periode' => 'sekali_selesai',
                        'estimasi_hari' => 21,
                        'template_instruksi' => "1. Bangun arsitektur basis data, migrasi skema tabel, dan relasi foreign key.\n2. Kembangkan modul inti backend API dan antarmuka dashboard responsif.\n3. Lakukan pengujian unit testing dan integrasi antar modul fitur.",
                    ],
                    [
                        'nama_pekerjaan' => 'User Acceptance Testing (UAT) & Pelatihan Klien',
                        'sifat_periode' => 'sekali_selesai',
                        'estimasi_hari' => 7,
                        'template_instruksi' => "1. Siapkan lingkungan staging untuk pengujian langsung oleh tim klien.\n2. Catat dan tindaklanjuti feedback atau penyesuaian skenario kerja.\n3. Laksanakan sesi pelatihan operator dan serahkan panduan manual penggunaan sistem.",
                    ],
                ],
            ],
            [
                'nama_layanan' => 'Maintenance & Support Server/IT',
                'kategori' => 'teknologi_informasi',
                'deskripsi' => 'Pemeliharaan infrastruktur server, monitoring performa aplikasi, audit keamanan berkala, pencadangan database rutin, dan bantuan teknis insiden.',
                'pekerjaan' => [
                    [
                        'nama_pekerjaan' => 'Pemeliharaan Rutin Server & Backup Database',
                        'sifat_periode' => 'bulanan',
                        'estimasi_hari' => 2,
                        'template_instruksi' => "1. Periksa metrik performa server (CPU load, memory RAM usage, disk storage).\n2. Terapkan pembaruan patch keamanan sistem operasi server.\n3. Lakukan pencadangan (backup) otomatis database dan verifikasi integritas restore file.",
                    ],
                    [
                        'nama_pekerjaan' => 'Audit Keamanan & Penanganan Bug/Insiden',
                        'sifat_periode' => 'bulanan',
                        'estimasi_hari' => 3,
                        'template_instruksi' => "1. Analisis log akses server untuk mendeteksi potensi anomali atau upaya akses ilegal.\n2. Identifikasi dan perbaiki bug fungsional yang dilaporkan pengguna.\n3. Siapkan laporan bulanan uptime server dan waktu respon penanganan insiden.",
                    ],
                ],
            ],
        ];

        $createdLayananIds = [];

        foreach ($services as $serviceData) {
            $pekerjaanList = $serviceData['pekerjaan'];
            unset($serviceData['pekerjaan']);

            $layanan = Layanan::firstOrCreate(
                ['nama_layanan' => $serviceData['nama_layanan']],
                $serviceData
            );

            $createdLayananIds[] = $layanan->id_layanan;

            foreach ($pekerjaanList as $job) {
                MasterPekerjaan::firstOrCreate(
                    [
                        'id_layanan' => $layanan->id_layanan,
                        'nama_pekerjaan' => $job['nama_pekerjaan'],
                    ],
                    $job
                );
            }
        }

        // Hubungkan kontrak yang sudah ada ke Layanan relevan jika belum ada relasinya
        $allKontrak = Kontrak::all();
        foreach ($allKontrak as $kontrak) {
            if ($kontrak->layanan()->count() === 0) {
                // Berikan minimal layanan Akuntansi & Pajak atau sesuai lingkup
                $assignedIds = array_slice($createdLayananIds, 0, 2);
                $kontrak->layanan()->sync($assignedIds);
            }
        }
    }
}
