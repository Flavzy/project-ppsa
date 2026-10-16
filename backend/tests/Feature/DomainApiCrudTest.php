<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\Pekerjaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DomainApiCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_index_returns_ordered_users(): void
    {
        $budi = User::factory()->create(['nama' => 'Budi', 'email' => 'budi@example.com']);
        $andi = User::factory()->create(['nama' => 'Andi', 'email' => 'andi@example.com']);

        Sanctum::actingAs($budi);
        $response = $this->getJson('/api/users');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.nama', 'Andi');
    }

    public function test_calon_klien_crud_flow(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/calon-klien', [
            'id_user' => $user->id_user,
            'nama_perusahaan' => 'PT Maju',
            'kontak' => '08123456789',
            'status_prospek' => 'prospek',
            'tgl_followup' => now()->toDateString(),
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.nama_perusahaan', 'PT Maju');

        $id = $createResponse->json('data.id_calon_klien');

        $this->assertDatabaseHas('calon_klien', ['id_calon_klien' => $id]);

        $this->getJson("/api/calon-klien/{$id}")->assertOk()
            ->assertJsonPath('data.id_calon_klien', $id);

        $this->putJson("/api/calon-klien/{$id}", [
            'nama_perusahaan' => 'PT Maju Jaya',
        ])->assertOk()->assertJsonPath('data.nama_perusahaan', 'PT Maju Jaya');

        $this->deleteJson("/api/calon-klien/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('calon_klien', ['id_calon_klien' => $id]);
    }

    public function test_calon_klien_validation_rejects_missing_fields(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $response = $this->postJson('/api/calon-klien', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['nama_perusahaan']);
    }

    public function test_calon_klien_validation_enforces_numeric_and_max_16_digits_kontak_person(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        // Letters rejected
        $this->postJson('/api/calon-klien', [
            'nama_perusahaan' => 'PT Alpha',
            'kontak_person' => '08123abc456',
        ])->assertUnprocessable()->assertJsonValidationErrors(['kontak_person']);

        // More than 16 digits rejected
        $this->postJson('/api/calon-klien', [
            'nama_perusahaan' => 'PT Alpha',
            'kontak_person' => '012345678901234567', // 17 digits
        ])->assertUnprocessable()->assertJsonValidationErrors(['kontak_person']);

        // Valid 16 digits accepted
        $this->postJson('/api/calon-klien', [
            'nama_perusahaan' => 'PT Alpha Valid',
            'kontak_person' => '0812345678901234', // 16 digits
            'tgl_followup' => now()->toDateString(),
        ])->assertCreated()->assertJsonPath('data.kontak_person', '0812345678901234');
    }

    public function test_kontrak_crud_flow(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $calonKlien = CalonKlien::factory()->deal()->create();

        $createResponse = $this->postJson('/api/kontrak', [
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'no_kontrak' => 'KTR-001',
            'tgl_mulai' => now()->toDateString(),
            'tgl_selesai' => now()->addMonth()->toDateString(),
            'status' => 'aktif',
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.no_kontrak', 'KTR-001');

        $id = $createResponse->json('data.id_kontrak');

        $this->getJson("/api/kontrak/{$id}")->assertOk();
        $this->putJson("/api/kontrak/{$id}", ['status' => 'selesai'])->assertOk()
            ->assertJsonPath('data.status', 'selesai');
        $this->deleteJson("/api/kontrak/{$id}")->assertNoContent();
    }

    public function test_kontrak_validation_rejects_invalid_dates(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $calonKlien = CalonKlien::factory()->deal()->create();

        $response = $this->postJson('/api/kontrak', [
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'no_kontrak' => 'KTR-002',
            'tgl_mulai' => now()->addDays(10)->toDateString(),
            'tgl_selesai' => now()->addDays(5)->toDateString(),
            'status' => 'aktif',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors(['tgl_selesai']);
    }

    public function test_klien_crud_flow(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $kontrak = Kontrak::factory()->create();

        $createResponse = $this->postJson('/api/klien', [
            'id_kontrak' => $kontrak->id_kontrak,
            'nama_perusahaan' => 'PT Klien',
            'alamat' => 'Jl. Merdeka 1',
            'kontak' => '0813',
            'layanan' => 'Konsultansi',
        ]);

        $createResponse->assertCreated();
        $id = $createResponse->json('data.id_klien');
        $this->getJson("/api/klien/{$id}")->assertOk();
        $this->putJson("/api/klien/{$id}", ['layanan' => 'Audit'])->assertOk()
            ->assertJsonPath('data.layanan', 'Audit');
        $this->deleteJson("/api/klien/{$id}")->assertNoContent();
    }

    public function test_pekerjaan_crud_flow(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $klien = Klien::factory()->create();
        $pic = User::factory()->create();

        $createResponse = $this->postJson('/api/pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_pic' => $pic->id_user,
            'judul' => 'Pekerjaan A',
            'deadline' => now()->addMonth()->toDateString(),
            'status' => 'baru',
        ]);

        $createResponse->assertCreated();
        $id = $createResponse->json('data.id_pekerjaan');

        $this->getJson("/api/pekerjaan/{$id}")->assertOk();
        $this->putJson("/api/pekerjaan/{$id}", ['status' => 'selesai'])->assertOk();
        $this->deleteJson("/api/pekerjaan/{$id}")->assertNoContent();
    }

    public function test_reporting_crud_flow(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $pekerjaan = Pekerjaan::factory()->create();

        $createResponse = $this->postJson('/api/reporting', [
            'id_pekerjaan' => $pekerjaan->id_pekerjaan,
            'tgl_lapor' => now()->toDateString(),
            'dokumen_bukti' => 'bukti.pdf',
            'catatan' => 'Catatan awal',
        ]);

        $createResponse->assertCreated();
        $id = $createResponse->json('data.id_reporting');

        $this->getJson("/api/reporting/{$id}")->assertOk();
        $this->putJson("/api/reporting/{$id}", ['catatan' => 'Catatan revisi'])->assertOk();
        $this->deleteJson("/api/reporting/{$id}")->assertNoContent();
    }

    public function test_calon_klien_and_pekerjaan_support_multiple_files_upload(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $karyawan = User::factory()->create(['role' => 'karyawan']);

        // 1. Calon Klien with multiple supporting documents (4 files)
        $doc1 = \Illuminate\Http\UploadedFile::fake()->create('dokumen1.pdf', 100);
        $doc2 = \Illuminate\Http\UploadedFile::fake()->create('dokumen2.png', 150);
        $doc3 = \Illuminate\Http\UploadedFile::fake()->create('dokumen3.docx', 120);
        $doc4 = \Illuminate\Http\UploadedFile::fake()->create('dokumen4.xlsx', 130);

        $calonKlienRes = $this->post('/api/calon-klien', [
            'nama_perusahaan' => 'PT Multi Dokumen',
            'nama_klien' => 'Bpk. Hendra',
            'kontak_person' => '08123456789',
            'file_dokumen_pendukung' => [$doc1, $doc2, $doc3, $doc4],
        ], ['Accept' => 'application/json']);

        $calonKlienRes->assertCreated();
        $urls = $calonKlienRes->json('data.file_dokumen_pendukung_urls');
        $this->assertCount(4, $urls);
        $this->assertNotNull($calonKlienRes->json('data.file_dokumen_pendukung_url'));
        $idCalonKlien = $calonKlienRes->json('data.id_calon_klien');

        // Edit Calon Klien: retain 3 files, delete 1, add 1 new file
        $retainedCkPaths = [$urls[0]['path'], $urls[1]['path'], $urls[2]['path']];
        $deletedCkPath = $urls[3]['path'];
        $doc5 = \Illuminate\Http\UploadedFile::fake()->create('dokumen5_baru.pdf', 140);

        $updateCkRes = $this->post("/api/calon-klien/{$idCalonKlien}", [
            '_method' => 'PUT',
            'nama_perusahaan' => 'PT Multi Dokumen Updated',
            'file_dokumen_pendukung_existing' => $retainedCkPaths,
            'file_dokumen_pendukung_existing_present' => '1',
            'file_dokumen_pendukung' => [$doc5],
        ], ['Accept' => 'application/json']);

        $updateCkRes->assertOk();
        $updatedCkUrls = $updateCkRes->json('data.file_dokumen_pendukung_urls');
        $this->assertCount(4, $updatedCkUrls); // 3 retained + 1 new
        $ckNames = array_column($updatedCkUrls, 'name');
        $this->assertContains('dokumen5_baru.pdf', $ckNames);
        \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($deletedCkPath);

        // 2. Pekerjaan with multiple TOR / brief attachments (4 files)
        $klien = Klien::factory()->create();
        $tor1 = \Illuminate\Http\UploadedFile::fake()->create('brief_utama.pdf', 200);
        $tor2 = \Illuminate\Http\UploadedFile::fake()->create('panduan_desain.docx', 120);
        $tor3 = \Illuminate\Http\UploadedFile::fake()->create('wireframe.png', 180);
        $tor4 = \Illuminate\Http\UploadedFile::fake()->create('spesifikasi.pdf', 250);

        $pekerjaanRes = $this->post('/api/pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_pic' => $karyawan->id_user,
            'judul' => 'Proyek Desain Sistem',
            'deadline' => now()->addMonth()->toDateString(),
            'lampiran_instruksi' => [$tor1, $tor2, $tor3, $tor4],
        ], ['Accept' => 'application/json']);

        $pekerjaanRes->assertCreated();
        $torUrls = $pekerjaanRes->json('data.lampiran_instruksi_urls');
        $this->assertCount(4, $torUrls);
        $this->assertNotNull($pekerjaanRes->json('data.lampiran_instruksi_url'));
        $idPekerjaan = $pekerjaanRes->json('data.id_pekerjaan');

        // Verify original names are preserved
        $names = array_column($torUrls, 'name');
        $this->assertContains('brief_utama.pdf', $names);
        $this->assertContains('panduan_desain.docx', $names);

        // 3. Edit Pekerjaan: retain 2 existing files and upload 2 new files (e.g. tor5, tor6)
        $retainedPaths = [$torUrls[0]['path'], $torUrls[1]['path']];
        $deletedPath = $torUrls[2]['path'];
        $tor5 = \Illuminate\Http\UploadedFile::fake()->create('revisi_brief.pdf', 150);
        $tor6 = \Illuminate\Http\UploadedFile::fake()->create('dokumen_tambahan.docx', 110);

        $updateRes = $this->post("/api/pekerjaan/{$idPekerjaan}", [
            '_method' => 'PUT',
            'judul' => 'Proyek Desain Sistem Updated',
            'lampiran_instruksi_existing' => $retainedPaths,
            'lampiran_instruksi_existing_present' => '1',
            'lampiran_instruksi' => [$tor5, $tor6],
        ], ['Accept' => 'application/json']);

        $updateRes->assertOk();
        $updatedTorUrls = $updateRes->json('data.lampiran_instruksi_urls');
        $this->assertCount(4, $updatedTorUrls); // 2 retained + 2 new
        $updatedNames = array_column($updatedTorUrls, 'name');
        $this->assertContains('brief_utama.pdf', $updatedNames);
        $this->assertContains('revisi_brief.pdf', $updatedNames);
        \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($deletedPath);

        // 3. Reporting with multiple proof documents (3 files)
        $bukti1 = \Illuminate\Http\UploadedFile::fake()->create('laporan_akhir.pdf', 300);
        $bukti2 = \Illuminate\Http\UploadedFile::fake()->create('tangkapan_layar.png', 150);
        $bukti3 = \Illuminate\Http\UploadedFile::fake()->create('berkas_rekap.xlsx', 180);

        $reportingRes = $this->post('/api/reporting', [
            'id_pekerjaan' => $idPekerjaan,
            'id_user' => $karyawan->id_user,
            'tgl_lapor' => now()->toDateString(),
            'catatan' => 'Pengerjaan selesai dengan bukti lengkap',
            'dokumen_bukti' => [$bukti1, $bukti2, $bukti3],
        ], ['Accept' => 'application/json']);

        $reportingRes->assertCreated();
        $buktiUrls = $reportingRes->json('data.dokumen_bukti_urls');
        $this->assertCount(3, $buktiUrls);
        $this->assertNotNull($reportingRes->json('data.dokumen_bukti_url'));
        $buktiNames = array_column($buktiUrls, 'name');
        $this->assertContains('laporan_akhir.pdf', $buktiNames);
        $this->assertContains('tangkapan_layar.png', $buktiNames);
        $this->assertContains('berkas_rekap.xlsx', $buktiNames);
        $this->assertStringContainsString('laporan_akhir', $buktiUrls[0]['path']);

        // Verify pekerjaan.file_tugas_urls is also synchronized
        $pekerjaanUpdated = Pekerjaan::find($idPekerjaan);
        $this->assertCount(3, $pekerjaanUpdated->file_tugas_urls);
        $this->assertEquals('laporan_akhir.pdf', $pekerjaanUpdated->file_tugas_urls[0]['name']);

        // 4. Test upload with custom human-readable name like fherta_ganteng.pdf
        $customFile = \Illuminate\Http\UploadedFile::fake()->create('fherta_ganteng.pdf', 100);
        $ckWithCustomName = $this->post('/api/calon-klien', [
            'nama_perusahaan' => 'PT Nama Asli Test',
            'kontak_person' => '08123456789',
            'file_npwp' => $customFile,
        ], ['Accept' => 'application/json']);

        $ckWithCustomName->assertCreated();
        $this->assertStringContainsString('fherta_ganteng.pdf', $ckWithCustomName->json('data.file_npwp'));
        $this->assertStringContainsString('fherta_ganteng.pdf', $ckWithCustomName->json('data.file_npwp_url'));
    }
}
