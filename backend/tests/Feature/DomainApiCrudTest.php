<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\Pekerjaan;
use App\Models\TemplateDeadline;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainApiCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_index_returns_ordered_users(): void
    {
        User::factory()->create(['nama' => 'Budi', 'email' => 'budi@example.com']);
        User::factory()->create(['nama' => 'Andi', 'email' => 'andi@example.com']);

        $response = $this->getJson('/api/users');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.nama', 'Andi');
    }

    public function test_calon_klien_crud_flow(): void
    {
        $user = User::factory()->create();

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
        $response = $this->postJson('/api/calon-klien', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['id_user', 'nama_perusahaan', 'kontak', 'status_prospek']);
    }

    public function test_kontrak_crud_flow(): void
    {
        $calonKlien = CalonKlien::create([
            'id_user' => User::factory()->create()->id_user,
            'nama_perusahaan' => 'PT Alpha',
            'kontak' => '0811',
            'status_prospek' => 'prospek',
        ]);

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
        $calonKlien = CalonKlien::create([
            'id_user' => User::factory()->create()->id_user,
            'nama_perusahaan' => 'PT Beta',
            'kontak' => '0812',
            'status_prospek' => 'prospek',
        ]);

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
        $kontrak = $this->createKontrak('KTR-010');

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

    public function test_template_deadline_crud_flow(): void
    {
        $createResponse = $this->postJson('/api/template-deadline', [
            'nama_template' => 'Template A',
            'keterangan' => 'Keterangan A',
        ]);

        $createResponse->assertCreated();
        $id = $createResponse->json('data.id_template');

        $this->getJson("/api/template-deadline/{$id}")->assertOk();
        $this->putJson("/api/template-deadline/{$id}", ['nama_template' => 'Template B'])->assertOk();
        $this->deleteJson("/api/template-deadline/{$id}")->assertNoContent();
    }

    public function test_pekerjaan_crud_flow(): void
    {
        $klien = $this->createKlien('KTR-020');
        $pic = User::factory()->create();
        $template = TemplateDeadline::create(['nama_template' => 'T1']);

        $createResponse = $this->postJson('/api/pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_pic' => $pic->id_user,
            'id_template' => $template->id_template,
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
        $pekerjaan = $this->createPekerjaan('KTR-030');

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

    private function createKontrak(string $noKontrak): Kontrak
    {
        $calonKlien = CalonKlien::create([
            'id_user' => User::factory()->create()->id_user,
            'nama_perusahaan' => 'PT '.$noKontrak,
            'kontak' => '0819',
            'status_prospek' => 'prospek',
        ]);

        return Kontrak::create([
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'no_kontrak' => $noKontrak,
            'tgl_mulai' => '2026-09-01',
            'tgl_selesai' => '2026-09-30',
            'status' => 'aktif',
        ]);
    }

    private function createKlien(string $noKontrak): Klien
    {
        $kontrak = $this->createKontrak($noKontrak);

        return Klien::create([
            'id_kontrak' => $kontrak->id_kontrak,
            'nama_perusahaan' => 'PT Klien '.$noKontrak,
            'alamat' => 'Alamat '.$noKontrak,
            'kontak' => '0819',
            'layanan' => 'Layanan '.$noKontrak,
        ]);
    }

    private function createPekerjaan(string $noKontrak): Pekerjaan
    {
        $klien = $this->createKlien($noKontrak);
        $pic = User::factory()->create();
        $template = TemplateDeadline::create(['nama_template' => 'Template '.$noKontrak]);

        return Pekerjaan::create([
            'id_klien' => $klien->id_klien,
            'id_pic' => $pic->id_user,
            'id_template' => $template->id_template,
            'judul' => 'Judul '.$noKontrak,
            'deadline' => '2026-09-25',
            'status' => 'baru',
        ]);
    }
}
