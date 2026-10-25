<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\Layanan;
use App\Models\MasterPekerjaan;
use App\Models\Pekerjaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MasterDataAndBatchTaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_pimpinan_can_crud_layanan(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        Sanctum::actingAs($pimpinan);

        // 1. Create
        $response = $this->postJson('/api/layanan', [
            'nama_layanan' => 'Jasa Audit Internal',
            'kategori' => 'akuntansi_pajak',
            'deskripsi' => 'Layanan audit kepatuhan internal.',
            'is_active' => true,
        ]);
        $response->assertCreated()
            ->assertJsonPath('data.nama_layanan', 'Jasa Audit Internal');

        $id = $response->json('data.id_layanan');

        // 2. Read
        $this->getJson('/api/layanan')->assertOk();
        $this->getJson("/api/layanan/{$id}")
            ->assertOk()
            ->assertJsonPath('data.nama_layanan', 'Jasa Audit Internal');

        // 3. Update
        $this->putJson("/api/layanan/{$id}", [
            'nama_layanan' => 'Jasa Audit Internal & Forensik',
            'kategori' => 'akuntansi_pajak',
        ])->assertOk()
            ->assertJsonPath('data.nama_layanan', 'Jasa Audit Internal & Forensik');

        // 4. Delete
        $this->deleteJson("/api/layanan/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('layanan', ['id_layanan' => $id]);
    }

    public function test_operator_and_karyawan_cannot_mutate_layanan(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        $layanan = Layanan::create([
            'nama_layanan' => 'Jasa Pembukuan',
            'kategori' => 'akuntansi_pajak',
        ]);

        Sanctum::actingAs($operator);

        // Operator can view
        $this->getJson('/api/layanan')->assertOk();

        // Operator cannot create
        $this->postJson('/api/layanan', [
            'nama_layanan' => 'Layanan Ilegal',
            'kategori' => 'konsultasi',
        ])->assertForbidden();

        // Operator cannot update
        $this->putJson("/api/layanan/{$layanan->id_layanan}", [
            'nama_layanan' => 'Nama Diubah',
        ])->assertForbidden();

        // Operator cannot delete
        $this->deleteJson("/api/layanan/{$layanan->id_layanan}")->assertForbidden();
    }

    public function test_pimpinan_can_crud_master_pekerjaan(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $layanan = Layanan::create([
            'nama_layanan' => 'Jasa Perpajakan',
            'kategori' => 'akuntansi_pajak',
        ]);

        Sanctum::actingAs($pimpinan);

        // 1. Create
        $response = $this->postJson('/api/master-pekerjaan', [
            'id_layanan' => $layanan->id_layanan,
            'nama_pekerjaan' => 'Rekonsiliasi Faktur Pajak Masukan',
            'sifat_periode' => 'bulanan',
            'template_instruksi' => 'Cocokkan faktur dengan PO.',
            'estimasi_hari' => 5,
        ]);
        $response->assertCreated()
            ->assertJsonPath('data.nama_pekerjaan', 'Rekonsiliasi Faktur Pajak Masukan');

        $id = $response->json('data.id_master_pekerjaan');

        // 2. Read with filter
        $this->getJson("/api/master-pekerjaan?id_layanan={$layanan->id_layanan}")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // 3. Update
        $this->putJson("/api/master-pekerjaan/{$id}", [
            'nama_pekerjaan' => 'Rekonsiliasi Faktur Pajak Masukan & Keluaran',
            'sifat_periode' => 'bulanan',
        ])->assertOk()
            ->assertJsonPath('data.nama_pekerjaan', 'Rekonsiliasi Faktur Pajak Masukan & Keluaran');

        // 4. Delete
        $this->deleteJson("/api/master-pekerjaan/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('master_pekerjaan', ['id_master_pekerjaan' => $id]);
    }

    public function test_kontrak_syncs_layanan_ids(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $calonKlien = CalonKlien::factory()->deal()->create();
        $layanan1 = Layanan::create(['nama_layanan' => 'Layanan A', 'kategori' => 'akuntansi_pajak']);
        $layanan2 = Layanan::create(['nama_layanan' => 'Layanan B', 'kategori' => 'teknologi_informasi']);

        Sanctum::actingAs($pimpinan);

        $response = $this->postJson('/api/kontrak', [
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'no_kontrak' => 'KTR/TEST/001',
            'tgl_mulai' => now()->toDateString(),
            'tgl_selesai' => now()->addMonths(6)->toDateString(),
            'status' => 'draft',
            'layanan_ids' => [$layanan1->id_layanan, $layanan2->id_layanan],
        ]);

        $response->assertCreated();
        $idKontrak = $response->json('data.id_kontrak');

        $this->assertDatabaseHas('kontrak_layanan', [
            'id_kontrak' => $idKontrak,
            'id_layanan' => $layanan1->id_layanan,
        ]);
        $this->assertDatabaseHas('kontrak_layanan', [
            'id_kontrak' => $idKontrak,
            'id_layanan' => $layanan2->id_layanan,
        ]);

        // Test updating services (adding/removing)
        $this->putJson("/api/kontrak/{$idKontrak}", [
            'layanan_ids' => [$layanan1->id_layanan],
        ])->assertOk();

        $this->assertDatabaseHas('kontrak_layanan', [
            'id_kontrak' => $idKontrak,
            'id_layanan' => $layanan1->id_layanan,
        ]);
        $this->assertDatabaseMissing('kontrak_layanan', [
            'id_kontrak' => $idKontrak,
            'id_layanan' => $layanan2->id_layanan,
        ]);
    }

    public function test_calon_klien_deal_syncs_layanan_ids_to_contract_from_start(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        $layanan = Layanan::create(['nama_layanan' => 'Jasa Pembukuan', 'kategori' => 'akuntansi_pajak']);

        Sanctum::actingAs($operator);

        $response = $this->postJson('/api/calon-klien', [
            'nama_perusahaan' => 'PT Awal Sejahtera',
            'status_prospek' => 'deal',
            'kontak_person' => '081234567890',
            'layanan_ids' => [$layanan->id_layanan],
        ]);

        $response->assertCreated();
        $idCalonKlien = $response->json('data.id_calon_klien');

        $calonKlien = CalonKlien::find($idCalonKlien);
        $kontrak = $calonKlien->kontrak;
        $this->assertNotNull($kontrak);
        $this->assertDatabaseHas('kontrak_layanan', [
            'id_kontrak' => $kontrak->id_kontrak,
            'id_layanan' => $layanan->id_layanan,
        ]);
    }

    public function test_batch_task_assignment(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        $karyawan1 = User::factory()->create(['role' => 'karyawan']);
        $karyawan2 = User::factory()->create(['role' => 'karyawan']);

        $calonKlien = CalonKlien::factory()->deal()->create();
        $kontrak = Kontrak::factory()->create(['id_calon_klien' => $calonKlien->id_calon_klien]);
        $klien = Klien::create([
            'id_kontrak' => $kontrak->id_kontrak,
            'nama_perusahaan' => 'PT Mitra Sejahtera',
            'alamat' => 'Jl. Sudirman',
            'kontak' => '0812345678',
            'layanan' => 'Layanan Akuntansi',
        ]);

        $layanan = Layanan::create(['nama_layanan' => 'Jasa Pembukuan', 'kategori' => 'akuntansi_pajak']);
        $master1 = MasterPekerjaan::create([
            'id_layanan' => $layanan->id_layanan,
            'nama_pekerjaan' => 'Jurnal Transaksi Bulanan',
            'sifat_periode' => 'bulanan',
            'template_instruksi' => 'Instruksi jurnal.',
            'estimasi_hari' => 5,
        ]);
        $master2 = MasterPekerjaan::create([
            'id_layanan' => $layanan->id_layanan,
            'nama_pekerjaan' => 'Laporan Laba Rugi',
            'sifat_periode' => 'bulanan',
            'template_instruksi' => 'Instruksi laba rugi.',
            'estimasi_hari' => 7,
        ]);

        Sanctum::actingAs($operator);

        $response = $this->postJson('/api/pekerjaan/batch', [
            'id_klien' => $klien->id_klien,
            'id_layanan' => $layanan->id_layanan,
            'items' => [
                [
                    'id_master_pekerjaan' => $master1->id_master_pekerjaan,
                    'judul' => 'Jurnal Transaksi Bulanan - Oktober 2026',
                    'id_pic' => $karyawan1->id_user,
                    'deadline' => now()->addDays(5)->toDateString(),
                    'deskripsi' => 'Instruksi jurnal.',
                    'periode_bulan' => '2026-10',
                    'prioritas' => 'tinggi',
                ],
                [
                    'id_master_pekerjaan' => $master2->id_master_pekerjaan,
                    'judul' => 'Laporan Laba Rugi - Oktober 2026',
                    'id_pic' => $karyawan2->id_user,
                    'deadline' => now()->addDays(7)->toDateString(),
                    'deskripsi' => 'Instruksi laba rugi.',
                    'periode_bulan' => '2026-10',
                    'prioritas' => 'sedang',
                ],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonCount(2, 'data');

        $this->assertDatabaseHas('pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_layanan' => $layanan->id_layanan,
            'id_master_pekerjaan' => $master1->id_master_pekerjaan,
            'id_pic' => $karyawan1->id_user,
            'status' => 'baru',
            'periode_bulan' => '2026-10',
        ]);

        $this->assertDatabaseHas('pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_layanan' => $layanan->id_layanan,
            'id_master_pekerjaan' => $master2->id_master_pekerjaan,
            'id_pic' => $karyawan2->id_user,
            'status' => 'baru',
            'periode_bulan' => '2026-10',
        ]);
    }

    public function test_calon_klien_persists_layanan_ids_when_belum_deal_and_syncs_on_conversion(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        $layanan = Layanan::create(['nama_layanan' => 'Jasa Pembukuan & Pajak', 'kategori' => 'akuntansi_pajak']);

        Sanctum::actingAs($operator);

        // 1. Simpan saat status_prospek masih 'belum_deal'
        $response = $this->postJson('/api/calon-klien', [
            'nama_perusahaan' => 'PT Prospek Baru',
            'status_prospek' => 'belum_deal',
            'kontak_person' => '081234567890',
            'layanan_ids' => [$layanan->id_layanan],
        ]);

        $response->assertCreated();
        $idCalonKlien = $response->json('data.id_calon_klien');

        // Pastikan tersimpan dan terbaca di resource API
        $this->getJson("/api/calon-klien/{$idCalonKlien}")
            ->assertOk()
            ->assertJsonPath('data.layanan_ids', [$layanan->id_layanan]);

        // 2. Ubah status menjadi 'deal' sebelum konversi
        $calonKlien = CalonKlien::find($idCalonKlien);
        $calonKlien->update(['status_prospek' => 'deal']);

        // 3. Konversi prospek menjadi kontrak melalui modal konversi
        $convResponse = $this->postJson("/api/calon-klien/{$idCalonKlien}/convert", [
            'no_kontrak' => 'KTR/CONV/2026/001',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => now()->toDateString(),
            'tgl_selesai' => now()->addYear()->toDateString(),
            'alamat' => 'Jl. Bisnis No. 10',
            'layanan' => 'Jasa Pembukuan & Pajak',
            'layanan_ids' => [$layanan->id_layanan],
        ]);

        $convResponse->assertOk();

        $calonKlien = CalonKlien::find($idCalonKlien);
        $this->assertEquals('deal', $calonKlien->status_prospek);
        $this->assertNotNull($calonKlien->kontrak);
        $this->assertDatabaseHas('kontrak_layanan', [
            'id_kontrak' => $calonKlien->kontrak->id_kontrak,
            'id_layanan' => $layanan->id_layanan,
        ]);
    }

    public function test_layanan_filters_active_status(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        Sanctum::actingAs($pimpinan);

        Layanan::create(['nama_layanan' => 'Layanan Aktif', 'is_active' => true]);
        Layanan::create(['nama_layanan' => 'Layanan Nonaktif', 'is_active' => false]);

        $response = $this->getJson('/api/layanan?is_active=1');
        $response->assertOk();
        $items = $response->json('data');

        $this->assertNotEmpty($items);
        foreach ($items as $item) {
            $this->assertTrue((bool) $item['is_active']);
        }
    }

    public function test_batch_task_assignment_supports_file_attachments(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $calonKlien = CalonKlien::factory()->deal()->create();
        $kontrak = Kontrak::create([
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'no_kontrak' => 'KTR/TEST/DOC',
            'tgl_mulai' => now()->toDateString(),
            'tgl_selesai' => now()->addYear()->toDateString(),
            'status' => 'draft',
        ]);
        $klien = Klien::create([
            'id_kontrak' => $kontrak->id_kontrak,
            'nama_perusahaan' => 'PT File Test',
            'alamat' => 'Alamat Test',
            'kontak' => '08123456789',
            'layanan' => 'Layanan Dokumen',
        ]);
        $layanan = Layanan::create(['nama_layanan' => 'Layanan Dokumen', 'is_active' => true]);

        Sanctum::actingAs($operator);

        $fakePdf = \Illuminate\Http\UploadedFile::fake()->create('sop_panduan.pdf', 100, 'application/pdf');

        $response = $this->postJson('/api/pekerjaan/batch', [
            'id_klien' => $klien->id_klien,
            'id_layanan' => $layanan->id_layanan,
            'items' => [
                [
                    'judul' => 'Tugas dengan File Acuan',
                    'id_pic' => $karyawan->id_user,
                    'deadline' => now()->addDays(5)->toDateString(),
                    'lampiran_instruksi' => [$fakePdf],
                ],
            ],
        ]);

        $response->assertCreated();
        $idPekerjaan = $response->json('data.0.id_pekerjaan');

        $pekerjaan = Pekerjaan::find($idPekerjaan);
        $this->assertNotNull($pekerjaan->lampiran_instruksi);
        $this->assertStringContainsString('sop_panduan.pdf', $pekerjaan->lampiran_instruksi);
    }

    public function test_batch_task_assignment_rejects_past_periode_bulan(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $calonKlien = CalonKlien::factory()->deal()->create();
        $kontrak = Kontrak::create([
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'no_kontrak' => 'KTR/TEST/PAST',
            'tgl_mulai' => now()->toDateString(),
            'tgl_selesai' => now()->addYear()->toDateString(),
            'status' => 'draft',
        ]);
        $klien = Klien::create([
            'id_kontrak' => $kontrak->id_kontrak,
            'nama_perusahaan' => 'PT Past Month Test',
            'alamat' => 'Alamat Test',
            'kontak' => '08123456789',
            'layanan' => 'Layanan Dokumen',
        ]);

        Sanctum::actingAs($operator);

        $pastMonth = now()->subMonths(2)->format('Y-m');

        $response = $this->postJson('/api/pekerjaan/batch', [
            'id_klien' => $klien->id_klien,
            'items' => [
                [
                    'judul' => 'Tugas Bulan Lampau',
                    'id_pic' => $karyawan->id_user,
                    'deadline' => now()->addDays(5)->toDateString(),
                    'periode_bulan' => $pastMonth,
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.periode_bulan']);
    }

    public function test_update_pekerjaan_rejects_deadline_before_today_when_edited(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $klien = Klien::factory()->create();

        $task = Pekerjaan::create([
            'id_klien' => $klien->id_klien,
            'id_pic' => $karyawan->id_user,
            'judul' => 'Tugas Test Edit Deadline',
            'tgl_penugasan' => now()->subDays(10)->toDateString(),
            'deadline' => now()->addDays(5)->toDateString(),
            'status' => 'baru',
        ]);

        Sanctum::actingAs($admin);

        // 1. Coba update deadline ke tanggal lampau (misal 3 hari lalu) -> Harus ditolak (422)
        $pastDeadline = now()->subDays(3)->toDateString();
        $resFail = $this->putJson("/api/pekerjaan/{$task->id_pekerjaan}", [
            'deadline' => $pastDeadline,
        ]);

        $resFail->assertStatus(422)
            ->assertJsonValidationErrors(['deadline']);

        // 2. Update deadline ke hari ini atau masa depan -> Berhasil (200)
        $futureDeadline = now()->addDays(7)->toDateString();
        $resSuccess = $this->putJson("/api/pekerjaan/{$task->id_pekerjaan}", [
            'deadline' => $futureDeadline,
        ]);

        $resSuccess->assertOk();
        $this->assertEquals($futureDeadline, $task->fresh()->deadline->toDateString());

        // 3. Jika tugas aslinya sudah terlanjur lampau (overdue), dan hanya update deskripsi tanpa ubah deadline -> Tetap diizinkan
        $overdueTask = Pekerjaan::create([
            'id_klien' => $klien->id_klien,
            'id_pic' => $karyawan->id_user,
            'judul' => 'Tugas Terlanjur Overdue',
            'tgl_penugasan' => now()->subDays(10)->toDateString(),
            'deadline' => now()->subDays(2)->toDateString(),
            'status' => 'baru',
        ]);

        $resOverdueSafe = $this->putJson("/api/pekerjaan/{$overdueTask->id_pekerjaan}", [
            'deadline' => now()->subDays(2)->toDateString(),
            'deskripsi' => 'Hanya update catatan tanpa ubah deadline.',
        ]);

        $resOverdueSafe->assertOk();
    }
}
