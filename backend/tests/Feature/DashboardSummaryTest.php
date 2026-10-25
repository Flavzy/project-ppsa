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
        Pekerjaan::create([
            'id_klien' => $client->id_klien,
            'id_pic' => $pic->id_user,
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

    public function test_dashboard_summary_returns_monthly_reminders_for_unassigned_monthly_tasks(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $lead = CalonKlien::create([
            'id_user' => $admin->id_user,
            'nama_perusahaan' => 'PT Monthly Test',
            'kontak' => '08123456789',
            'status_prospek' => 'deal',
        ]);
        $contract = Kontrak::create([
            'id_calon_klien' => $lead->id_calon_klien,
            'no_kontrak' => 'KTR-REMIND-001',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-01-01',
            'tgl_selesai' => '2026-12-31',
            'status' => 'aktif',
        ]);
        $client = Klien::create([
            'id_kontrak' => $contract->id_kontrak,
            'nama_perusahaan' => 'PT Monthly Test',
            'alamat' => 'Jl. Test',
            'kontak' => '08123456789',
            'layanan' => 'Jasa Pembukuan',
        ]);
        $layanan = \App\Models\Layanan::create([
            'nama_layanan' => 'Jasa Pembukuan Rutin',
            'deskripsi' => 'Deskripsi layanan',
            'is_active' => true,
        ]);
        $contract->layanan()->attach($layanan->id_layanan);

        $template = \App\Models\MasterPekerjaan::create([
            'id_layanan' => $layanan->id_layanan,
            'nama_pekerjaan' => 'Pencatatan Jurnal Bulanan',
            'sifat_periode' => 'bulanan',
            'estimasi_hari' => 5,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);
        $response = $this->getJson('/api/dashboard-summary');

        $response->assertOk()
            ->assertJsonPath('data.monthly_reminders.0.nama_perusahaan', 'PT Monthly Test')
            ->assertJsonPath('data.monthly_reminders.0.nama_layanan', 'Jasa Pembukuan Rutin')
            ->assertJsonPath('data.monthly_reminders.0.nama_pekerjaan', 'Pencatatan Jurnal Bulanan');

        // Once the task is created for this month, reminder should clear
        Pekerjaan::create([
            'id_klien' => $client->id_klien,
            'id_layanan' => $layanan->id_layanan,
            'id_master_pekerjaan' => $template->id_master_pekerjaan,
            'id_pic' => $karyawan->id_user,
            'judul' => 'Pencatatan Jurnal Bulanan',
            'periode_bulan' => now()->format('Y-m'),
            'deadline' => now()->addDays(5)->toDateString(),
            'status' => 'baru',
        ]);

        $responseAfter = $this->getJson('/api/dashboard-summary');
        $responseAfter->assertOk()
            ->assertJsonCount(0, 'data.monthly_reminders');
    }
}
