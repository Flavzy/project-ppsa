<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\Pekerjaan;
use App\Models\Reporting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RouteProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_to_business_routes_returns_401(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
        $this->getJson('/api/dashboard-summary')->assertUnauthorized();
        $this->getJson('/api/client-reports')->assertUnauthorized();
        $this->getJson('/api/calon-klien')->assertUnauthorized();
        $this->getJson('/api/pekerjaan')->assertUnauthorized();
        $this->getJson('/api/kontrak')->assertUnauthorized();
        $this->getJson('/api/klien')->assertUnauthorized();
        $this->getJson('/api/template-deadline')->assertUnauthorized();
        $this->getJson('/api/reporting')->assertUnauthorized();
        $this->getJson('/api/performance-reviews')->assertUnauthorized();
    }

    public function test_invalid_token_to_business_routes_returns_401(): void
    {
        $this->withToken('invalid-bearer-token-xyz')
            ->getJson('/api/dashboard-summary')
            ->assertUnauthorized();
    }

    public function test_x_user_id_alone_cannot_access_protected_business_routes(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeader('X-User-Id', (string) $admin->id_user)
            ->getJson('/api/dashboard-summary')
            ->assertUnauthorized();

        $this->withHeader('X-User-Id', (string) $admin->id_user)
            ->getJson('/api/pekerjaan')
            ->assertUnauthorized();

        $this->withHeader('X-User-Id', (string) $admin->id_user)
            ->getJson('/api/calon-klien')
            ->assertUnauthorized();
    }

    public function test_x_user_id_cannot_override_sanctum_authenticated_identity(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $admin = User::factory()->create(['role' => 'admin']);
        $task = Pekerjaan::factory()->submitted()->create();

        // Karyawan authenticated via Sanctum token attempts to spoof Admin via X-User-Id
        $token = $karyawan->createToken('karyawan_token')->plainTextToken;

        $response = $this
            ->withToken($token)
            ->withHeader('X-User-Id', (string) $admin->id_user)
            ->postJson("/api/pekerjaan/{$task->id_pekerjaan}/approve", [
                'catatan_review' => 'Attempted spoof approval',
            ]);

        // Must be 403 Forbidden because real authenticated user is karyawan, not admin
        $response->assertForbidden();
    }

    public function test_lead_conversion_role_authorization(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);

        $leadSales = CalonKlien::factory()->deal()->create(['id_user' => $sales->id_user]);
        $leadKaryawan = CalonKlien::factory()->deal()->create();

        // Sales is allowed
        Sanctum::actingAs($sales);
        $responseAllowed = $this->postJson("/api/calon-klien/{$leadSales->id_calon_klien}/convert", [
            'no_kontrak' => 'KTR-ROUTE-SALES',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-17',
            'tgl_selesai' => '2026-10-17',
            'alamat' => 'Jl. Bisnis',
            'layanan' => 'Layanan Sales',
        ]);
        $responseAllowed->assertOk();

        // Karyawan is denied (403)
        Sanctum::actingAs($karyawan);
        $responseDenied = $this->postJson("/api/calon-klien/{$leadKaryawan->id_calon_klien}/convert", [
            'no_kontrak' => 'KTR-ROUTE-KARYAWAN',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-17',
            'tgl_selesai' => '2026-10-17',
            'alamat' => 'Jl. Bisnis',
            'layanan' => 'Layanan Karyawan',
        ]);
        $responseDenied->assertForbidden();
    }

    public function test_pekerjaan_approval_role_authorization(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $task = Pekerjaan::factory()->submitted()->create();

        // Pimpinan is allowed
        Sanctum::actingAs($pimpinan);
        $this->postJson("/api/pekerjaan/{$task->id_pekerjaan}/approve", [
            'approved_by' => $pimpinan->id_user,
            'catatan_review' => 'Disetujui pimpinan',
        ])->assertOk();

        // Karyawan is forbidden
        $task2 = Pekerjaan::factory()->submitted()->create();
        Sanctum::actingAs($karyawan);
        $this->postJson("/api/pekerjaan/{$task2->id_pekerjaan}/approve", [
            'approved_by' => $karyawan->id_user,
            'catatan_review' => 'Percobaan approval',
        ])->assertForbidden();
    }

    public function test_pekerjaan_submission_role_authorization(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $task = Pekerjaan::factory()->inProgress()->create(['id_pic' => $karyawan->id_user]);

        Sanctum::actingAs($karyawan);
        $response = $this->postJson("/api/pekerjaan/{$task->id_pekerjaan}/submit");
        $response->assertOk();
    }

    public function test_reporting_publication_role_authorization(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $reporting = Reporting::factory()->create(['is_visible_to_client' => false]);

        // Pimpinan is allowed
        Sanctum::actingAs($pimpinan);
        $this->postJson("/api/reporting/{$reporting->id_reporting}/publish-client")
            ->assertOk();

        // Karyawan is forbidden
        $reporting2 = Reporting::factory()->create(['is_visible_to_client' => false]);
        Sanctum::actingAs($karyawan);
        $this->postJson("/api/reporting/{$reporting2->id_reporting}/publish-client")
            ->assertForbidden();
    }

    public function test_dashboard_summary_accessible_by_authenticated_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);
        $this->getJson('/api/dashboard-summary')
            ->assertOk()
            ->assertJsonStructure(['data' => ['totals', 'lead_by_status', 'contract_by_status', 'work_by_status']]);
    }

    public function test_client_report_access_requires_authentication(): void
    {
        $this->getJson('/api/client-reports')->assertUnauthorized();

        $user = User::factory()->create(['role' => 'pimpinan']);
        Sanctum::actingAs($user);
        $this->getJson('/api/client-reports')->assertOk();
    }
}
