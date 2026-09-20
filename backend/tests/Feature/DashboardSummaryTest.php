<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\Pekerjaan;
use App\Models\TemplateDeadline;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_summary_returns_business_metrics(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $pic = User::factory()->create(['role' => 'karyawan']);
        $lead = CalonKlien::create([
            'id_user' => $user->id_user,
            'nama_perusahaan' => 'PT Dashboard',
            'kontak' => '08123456789',
            'status_prospek' => 'deal',
            'prioritas' => 'high',
        ]);
        $contract = Kontrak::create([
            'id_calon_klien' => $lead->id_calon_klien,
            'no_kontrak' => 'KTR-DS-001',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-01',
            'tgl_selesai' => '2026-10-01',
            'status' => 'active',
        ]);
        $client = Klien::create([
            'id_kontrak' => $contract->id_kontrak,
            'nama_perusahaan' => 'PT Dashboard',
            'alamat' => 'Jl. Dashboard',
            'kontak' => '08123456789',
            'layanan' => 'Dashboard',
        ]);
        $template = TemplateDeadline::create([
            'nama_template' => 'Standar',
        ]);
        Pekerjaan::create([
            'id_klien' => $client->id_klien,
            'id_pic' => $pic->id_user,
            'id_template' => $template->id_template,
            'judul' => 'Overdue Task',
            'deadline' => '2020-01-01',
            'prioritas' => 'urgent',
            'progress_persen' => 20,
            'status' => 'in_progress',
        ]);

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/dashboard-summary');

        $response->assertOk()
            ->assertJsonPath('data.totals.leads', 1)
            ->assertJsonPath('data.totals.lead_deal', 1)
            ->assertJsonPath('data.totals.active_clients', 1)
            ->assertJsonPath('data.totals.overdue_tasks', 1)
            ->assertJsonPath('data.lead_by_status.deal', 1)
            ->assertJsonPath('data.contract_by_status.active', 1)
            ->assertJsonPath('data.work_by_status.in_progress', 1);
    }
}
