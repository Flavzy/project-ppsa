<?php

namespace Database\Seeders;

use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\Pekerjaan;
use App\Models\PerformanceReview;
use App\Models\Reporting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ── Users ──
        $pimpinan = User::factory()->create([
            'nama' => 'Budi Santoso',
            'email' => 'pimpinan@example.com',
            'role' => 'pimpinan',
        ]);

        $admin = User::factory()->create([
            'nama' => 'Admin Utama',
            'email' => 'admin@example.com',
            'role' => 'pimpinan',
        ]);

        $operator = User::factory()->create([
            'nama' => 'Rudi Hartono',
            'email' => 'operator@example.com',
            'role' => 'operator',
        ]);
        $sales = $operator;

        $karyawan1 = User::factory()->create([
            'nama' => 'Andi Pratama',
            'email' => 'karyawan@example.com',
            'role' => 'karyawan',
        ]);

        $karyawan2 = User::factory()->create([
            'nama' => 'Siti Nurhaliza',
            'email' => 'siti@example.com',
            'role' => 'karyawan',
        ]);

        // ── Calon Klien (Leads) ──
        $leadDeal1 = CalonKlien::factory()->deal()->create([
            'id_user' => $sales->id_user,
            'nama_perusahaan' => 'PT Maju Bersama',
            'kontak' => '08123456001',
            'nilai_estimasi' => 150000000,
        ]);

        $leadDeal2 = CalonKlien::factory()->deal()->create([
            'id_user' => $sales->id_user,
            'nama_perusahaan' => 'CV Teknologi Nusantara',
            'kontak' => '08123456002',
            'nilai_estimasi' => 75000000,
        ]);

        CalonKlien::factory()->prospek()->count(3)->create([
            'id_user' => $sales->id_user,
        ]);

        CalonKlien::factory()->negotiation()->count(2)->create([
            'id_user' => $sales->id_user,
        ]);

        CalonKlien::factory()->lost()->create([
            'id_user' => $sales->id_user,
        ]);

        // ── Kontrak & Klien (from deal leads) ──
        $kontrak1 = Kontrak::factory()->active()->create([
            'id_calon_klien' => $leadDeal1->id_calon_klien,
            'no_kontrak' => 'KTR-2026-001',
            'nilai_proyek' => 150000000,
            'tgl_mulai' => '2026-08-01',
            'tgl_selesai' => '2026-12-31',
            'reviewed_by' => $pimpinan->id_user,
            'reviewed_at' => now(),
        ]);

        $klien1 = Klien::factory()->create([
            'id_kontrak' => $kontrak1->id_kontrak,
            'nama_perusahaan' => 'PT Maju Bersama',
            'layanan' => 'Digital Marketing',
        ]);

        $kontrak2 = Kontrak::factory()->active()->create([
            'id_calon_klien' => $leadDeal2->id_calon_klien,
            'no_kontrak' => 'KTR-2026-002',
            'nilai_proyek' => 75000000,
            'tgl_mulai' => '2026-09-01',
            'tgl_selesai' => '2027-02-28',
        ]);

        $klien2 = Klien::factory()->create([
            'id_kontrak' => $kontrak2->id_kontrak,
            'nama_perusahaan' => 'CV Teknologi Nusantara',
            'layanan' => 'IT Support',
        ]);

        // Third contract via separate lead
        $leadDeal3 = CalonKlien::factory()->deal()->create([
            'id_user' => $admin->id_user,
            'nama_perusahaan' => 'PT Karya Mandiri',
        ]);

        $kontrak3 = Kontrak::factory()->completed()->create([
            'id_calon_klien' => $leadDeal3->id_calon_klien,
            'no_kontrak' => 'KTR-2026-003',
            'tgl_mulai' => '2026-06-01',
            'tgl_selesai' => '2026-08-31',
        ]);

        $klien3 = Klien::factory()->create([
            'id_kontrak' => $kontrak3->id_kontrak,
            'nama_perusahaan' => 'PT Karya Mandiri',
            'layanan' => 'Konsultansi',
        ]);

        // ── Pekerjaan (Tasks) ──
        $taskCompleted1 = Pekerjaan::factory()->completed()->create([
            'id_klien' => $klien1->id_klien,
            'id_pic' => $karyawan1->id_user,
            'judul' => 'Audit Website Klien',
            'deadline' => '2026-09-15',
            'tgl_selesai' => '2026-09-14',
            'approved_by' => $pimpinan->id_user,
        ]);

        $taskCompleted2 = Pekerjaan::factory()->completed()->create([
            'id_klien' => $klien3->id_klien,
            'id_pic' => $karyawan2->id_user,
            'judul' => 'Laporan Konsultansi Final',
            'deadline' => '2026-08-30',
            'tgl_selesai' => '2026-08-28',
            'approved_by' => $pimpinan->id_user,
        ]);

        Pekerjaan::factory()->inProgress()->create([
            'id_klien' => $klien1->id_klien,
            'id_pic' => $karyawan1->id_user,
            'judul' => 'Kampanye Google Ads',
            'deadline' => '2026-10-01',
        ]);

        Pekerjaan::factory()->inProgress()->create([
            'id_klien' => $klien2->id_klien,
            'id_pic' => $karyawan2->id_user,
            'judul' => 'Setup Server Monitoring',
            'deadline' => '2026-10-15',
        ]);

        Pekerjaan::factory()->submitted()->create([
            'id_klien' => $klien1->id_klien,
            'id_pic' => $karyawan2->id_user,
            'judul' => 'Desain Landing Page',
            'deadline' => '2026-09-20',
        ]);

        Pekerjaan::factory()->overdue()->create([
            'id_klien' => $klien2->id_klien,
            'id_pic' => $karyawan1->id_user,
            'judul' => 'Migrasi Database Legacy',
            'deadline' => '2026-09-01',
        ]);

        Pekerjaan::factory()->create([
            'id_klien' => $klien1->id_klien,
            'id_pic' => $karyawan1->id_user,
            'judul' => 'SEO Optimization',
            'status' => 'baru',
            'progress_persen' => 0,
            'deadline' => '2026-11-01',
        ]);

        Pekerjaan::factory()->create([
            'id_klien' => $klien2->id_klien,
            'id_pic' => $karyawan2->id_user,
            'judul' => 'Instalasi Firewall',
            'status' => 'revision_needed',
            'review_status' => 'revision_needed',
            'progress_persen' => 70,
            'deadline' => '2026-10-10',
            'catatan_review' => 'Konfigurasi firewall perlu ditinjau ulang.',
        ]);

        // ── Reporting ──
        Reporting::factory()->count(2)->create([
            'id_pekerjaan' => $taskCompleted1->id_pekerjaan,
            'id_user' => $karyawan1->id_user,
        ]);

        Reporting::factory()->approved()->create([
            'id_pekerjaan' => $taskCompleted1->id_pekerjaan,
            'id_user' => $karyawan1->id_user,
            'catatan' => 'Laporan hasil audit website telah selesai dan disetujui.',
        ]);

        Reporting::factory()->create([
            'id_pekerjaan' => $taskCompleted2->id_pekerjaan,
            'id_user' => $karyawan2->id_user,
        ]);

        Reporting::factory()->approved()->create([
            'id_pekerjaan' => $taskCompleted2->id_pekerjaan,
            'id_user' => $karyawan2->id_user,
            'catatan' => 'Laporan konsultansi final telah disetujui.',
        ]);

        Reporting::factory()->approved()->create([
            'id_pekerjaan' => $taskCompleted2->id_pekerjaan,
            'id_user' => $karyawan2->id_user,
            'catatan' => 'Laporan tambahan yang disetujui.',
        ]);

        // ── Performance Reviews ──
        PerformanceReview::factory()->create([
            'id_pekerjaan' => $taskCompleted1->id_pekerjaan,
            'id_user' => $karyawan1->id_user,
            'reviewed_by' => $pimpinan->id_user,
            'speed_score' => 100,
            'quality_score' => 90,
            'final_score' => PerformanceReview::calculateFinalScore(100, 90),
            'revision_count' => 0,
            'catatan' => 'Pekerjaan selesai sebelum deadline dengan kualitas baik.',
        ]);

        PerformanceReview::factory()->create([
            'id_pekerjaan' => $taskCompleted2->id_pekerjaan,
            'id_user' => $karyawan2->id_user,
            'reviewed_by' => $pimpinan->id_user,
            'speed_score' => 100,
            'quality_score' => 85,
            'final_score' => PerformanceReview::calculateFinalScore(100, 85),
            'revision_count' => 1,
            'catatan' => 'Baik, ada revisi minor.',
        ]);
        // ── Master Data Layanan & Pekerjaan ──
        $this->call(MasterDataSeeder::class);
    }
}
