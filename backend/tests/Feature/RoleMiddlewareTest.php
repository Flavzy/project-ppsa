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
}
