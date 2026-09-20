<?php

namespace Tests\Feature;

use App\Models\Pekerjaan;
use App\Models\Reporting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_reporting_can_be_published_to_client(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $reporting = Reporting::factory()->create([
            'tipe_laporan' => 'internal',
            'status_laporan' => 'draft',
            'is_visible_to_client' => false,
        ]);

        Sanctum::actingAs($pimpinan);
        $response = $this
            ->postJson("/api/reporting/{$reporting->id_reporting}/publish-client", [
                'catatan' => 'Laporan dikirim ke klien.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.tipe_laporan', 'client')
            ->assertJsonPath('data.status_laporan', 'sent')
            ->assertJsonPath('data.is_visible_to_client', true);

        $this->assertDatabaseHas('reporting', [
            'id_reporting' => $reporting->id_reporting,
            'is_visible_to_client' => true,
            'status_laporan' => 'sent',
        ]);
    }

    public function test_client_reports_endpoint_returns_only_visible_reports(): void
    {
        $user = User::factory()->create();
        $pekerjaan = Pekerjaan::factory()->create();

        // Visible report
        Reporting::factory()->publishedToClient()->create([
            'id_pekerjaan' => $pekerjaan->id_pekerjaan,
        ]);

        // Approved + visible
        Reporting::factory()->approved()->create([
            'id_pekerjaan' => $pekerjaan->id_pekerjaan,
            'is_visible_to_client' => true,
        ]);

        // Internal (not visible)
        Reporting::factory()->create([
            'id_pekerjaan' => $pekerjaan->id_pekerjaan,
            'is_visible_to_client' => false,
        ]);

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/client-reports');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_unauthorized_role_cannot_publish_client_report(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $reporting = Reporting::factory()->create();

        Sanctum::actingAs($karyawan);
        $response = $this
            ->postJson("/api/reporting/{$reporting->id_reporting}/publish-client", [
                'catatan' => 'Test',
            ]);

        $response->assertForbidden();
    }

    public function test_publish_without_user_header_returns_unauthorized(): void
    {
        $reporting = Reporting::factory()->create();

        $response = $this->postJson("/api/reporting/{$reporting->id_reporting}/publish-client", [
            'catatan' => 'Test',
        ]);

        $response->assertUnauthorized();
    }
}
