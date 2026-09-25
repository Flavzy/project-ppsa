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
            'tgl_followup' => '2026-09-20',
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

    public function test_kontrak_crud_flow(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $calonKlien = CalonKlien::factory()->create();

        $createResponse = $this->postJson('/api/kontrak', [
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'no_kontrak' => 'KTR-001',
            'tgl_mulai' => '2026-09-01',
            'tgl_selesai' => '2026-09-30',
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
        $calonKlien = CalonKlien::factory()->create();

        $response = $this->postJson('/api/kontrak', [
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'no_kontrak' => 'KTR-002',
            'tgl_mulai' => '2026-09-10',
            'tgl_selesai' => '2026-09-01',
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
            'deadline' => '2026-09-25',
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
            'tgl_lapor' => '2026-09-14',
            'dokumen_bukti' => 'bukti.pdf',
            'catatan' => 'Catatan awal',
        ]);

        $createResponse->assertCreated();
        $id = $createResponse->json('data.id_reporting');

        $this->getJson("/api/reporting/{$id}")->assertOk();
        $this->putJson("/api/reporting/{$id}", ['catatan' => 'Catatan revisi'])->assertOk();
        $this->deleteJson("/api/reporting/{$id}")->assertNoContent();
    }
}
