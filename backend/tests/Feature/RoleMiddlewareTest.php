<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_returns_401_on_protected_route(): void
    {
        $lead = CalonKlien::factory()->deal()->create();

        $response = $this->postJson("/api/calon-klien/{$lead->id_calon_klien}/convert", [
            'no_kontrak' => 'KTR-AUTH-001',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-15',
            'tgl_selesai' => '2026-10-15',
            'alamat' => 'Jl. Test',
            'layanan' => 'Test',
        ]);

        $response->assertUnauthorized();
    }

    public function test_unauthorized_role_returns_403(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $lead = CalonKlien::factory()->deal()->create();

        Sanctum::actingAs($karyawan);
        $response = $this->postJson("/api/calon-klien/{$lead->id_calon_klien}/convert", [
            'no_kontrak' => 'KTR-AUTH-002',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-15',
            'tgl_selesai' => '2026-10-15',
            'alamat' => 'Jl. Test',
            'layanan' => 'Test',
        ]);

        $response->assertForbidden()
            ->assertJsonPath('message', 'Role pengguna tidak memiliki akses untuk aksi ini.');
    }

    public function test_authorized_role_passes_through(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = CalonKlien::factory()->deal()->create();

        Sanctum::actingAs($admin);
        $response = $this->postJson("/api/calon-klien/{$lead->id_calon_klien}/convert", [
            'no_kontrak' => 'KTR-AUTH-003',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-15',
            'tgl_selesai' => '2026-10-15',
            'alamat' => 'Jl. Test',
            'layanan' => 'Test',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('kontrak', ['no_kontrak' => 'KTR-AUTH-003']);
    }

    public function test_sales_role_can_access_lead_conversion(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = CalonKlien::factory()->deal()->create(['id_user' => $sales->id_user]);

        Sanctum::actingAs($sales);
        $response = $this->postJson("/api/calon-klien/{$lead->id_calon_klien}/convert", [
            'no_kontrak' => 'KTR-AUTH-004',
            'jenis_dokumen' => 'spk',
            'tgl_mulai' => '2026-09-15',
            'tgl_selesai' => '2026-10-15',
            'alamat' => 'Jl. Sales',
            'layanan' => 'Sales Service',
        ]);

        $response->assertOk();
    }

    public function test_operator_role_can_access_lead_conversion(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        $lead = CalonKlien::factory()->deal()->create(['id_user' => $operator->id_user]);

        Sanctum::actingAs($operator);
        $response = $this->postJson("/api/calon-klien/{$lead->id_calon_klien}/convert", [
            'no_kontrak' => 'KTR-AUTH-OPERATOR',
            'jenis_dokumen' => 'spk',
            'tgl_mulai' => '2026-09-15',
            'tgl_selesai' => '2026-10-15',
            'alamat' => 'Jl. Operator',
            'layanan' => 'Operator Service',
        ]);

        $response->assertOk();
    }

    public function test_pimpinan_can_create_user(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);

        Sanctum::actingAs($pimpinan);
        $response = $this->postJson('/api/users', [
            'nama' => 'Staff Baru',
            'email' => 'staffbaru@example.com',
            'password' => 'password123',
            'role' => 'karyawan',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', ['email' => 'staffbaru@example.com']);
    }

    public function test_pimpinan_can_approve_pekerjaan(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $pekerjaan = \App\Models\Pekerjaan::factory()->submitted()->create();

        Sanctum::actingAs($pimpinan);
        $response = $this->postJson("/api/pekerjaan/{$pekerjaan->id_pekerjaan}/approve", [
            'approved_by' => $pimpinan->id_user,
            'catatan_review' => 'Disetujui.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'completed');
    }

    public function test_karyawan_cannot_approve_pekerjaan(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $pekerjaan = \App\Models\Pekerjaan::factory()->submitted()->create();

        Sanctum::actingAs($karyawan);
        $response = $this->postJson("/api/pekerjaan/{$pekerjaan->id_pekerjaan}/approve", [
            'approved_by' => $karyawan->id_user,
        ]);

        $response->assertForbidden();
    }

    public function test_operator_can_create_pekerjaan_and_assign_pic(): void
    {
        $operator = User::factory()->create(['role' => 'operator']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $klien = \App\Models\Klien::factory()->create();

        Sanctum::actingAs($operator);
        $response = $this->postJson('/api/pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_pic' => $karyawan->id_user,
            'judul' => 'Pembuatan Landing Page Klien',
            'deadline' => '2026-10-30',
            'status' => 'baru',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.id_pic', $karyawan->id_user);
        $this->assertDatabaseHas('pekerjaan', [
            'judul' => 'Pembuatan Landing Page Klien',
            'id_pic' => $karyawan->id_user,
        ]);
    }

    public function test_pekerjaan_creation_rejects_past_dates_and_non_karyawan_pic(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $klien = \App\Models\Klien::factory()->create();

        Sanctum::actingAs($admin);

        // 1. Non-karyawan (e.g. pimpinan) as PIC must be rejected
        $resNonKaryawan = $this->postJson('/api/pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_pic' => $pimpinan->id_user,
            'judul' => 'Tugas Test Non Karyawan',
            'tgl_penugasan' => now()->toDateString(),
            'deadline' => now()->addDays(5)->toDateString(),
            'status' => 'baru',
        ]);
        $resNonKaryawan->assertUnprocessable()
            ->assertJsonValidationErrors(['id_pic']);

        // 2. Past tgl_penugasan must be rejected
        $resPastTgl = $this->postJson('/api/pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_pic' => $karyawan->id_user,
            'judul' => 'Tugas Test Past Date',
            'tgl_penugasan' => now()->subDay()->toDateString(),
            'deadline' => now()->addDays(5)->toDateString(),
            'status' => 'baru',
        ]);
        $resPastTgl->assertUnprocessable()
            ->assertJsonValidationErrors(['tgl_penugasan']);

        // 3. Deadline before tgl_penugasan must be rejected
        $resPastDeadline = $this->postJson('/api/pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_pic' => $karyawan->id_user,
            'judul' => 'Tugas Test Past Deadline',
            'tgl_penugasan' => now()->addDays(3)->toDateString(),
            'deadline' => now()->addDays(1)->toDateString(),
            'status' => 'baru',
        ]);
        $resPastDeadline->assertUnprocessable()
            ->assertJsonValidationErrors(['deadline']);

        // 4. Valid realtime creation succeeds
        $resValid = $this->postJson('/api/pekerjaan', [
            'id_klien' => $klien->id_klien,
            'id_pic' => $karyawan->id_user,
            'judul' => 'Tugas Valid Realtime',
            'tgl_penugasan' => now()->toDateString(),
            'deadline' => now()->addDays(7)->toDateString(),
            'status' => 'baru',
        ]);
        $resValid->assertCreated();
    }
}
