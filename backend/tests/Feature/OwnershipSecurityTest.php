<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\Pekerjaan;
use App\Models\PerformanceReview;
use App\Models\Reporting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OwnershipSecurityTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // 1. Task Ownership & PIC Restrictions
    // ==========================================

    public function test_karyawan_can_only_view_own_assigned_tasks_in_index(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);

        $taskA = Pekerjaan::factory()->create(['id_pic' => $karyawanA->id_user]);
        $taskB = Pekerjaan::factory()->create(['id_pic' => $karyawanB->id_user]);

        Sanctum::actingAs($karyawanA);
        $response = $this->getJson('/api/pekerjaan');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id_pekerjaan', $taskA->id_pekerjaan);
    }

    public function test_karyawan_cannot_view_task_assigned_to_other_employee(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);

        $taskB = Pekerjaan::factory()->create(['id_pic' => $karyawanB->id_user]);

        Sanctum::actingAs($karyawanA);
        $response = $this->getJson("/api/pekerjaan/{$taskB->id_pekerjaan}");

        $response->assertForbidden();
    }

    public function test_karyawan_can_submit_own_task(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $task = Pekerjaan::factory()->inProgress()->create(['id_pic' => $karyawan->id_user]);

        Sanctum::actingAs($karyawan);
        $file = \Illuminate\Http\UploadedFile::fake()->create('tugas.pdf', 100);
        $response = $this->postJson("/api/pekerjaan/{$task->id_pekerjaan}/submit", [
            'progress_persen' => 95,
            'file_tugas' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'submitted');
    }

    public function test_karyawan_cannot_submit_other_employee_task(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);
        $taskB = Pekerjaan::factory()->inProgress()->create(['id_pic' => $karyawanB->id_user]);

        Sanctum::actingAs($karyawanA);
        $file = \Illuminate\Http\UploadedFile::fake()->create('tugas.pdf', 100);
        $response = $this->postJson("/api/pekerjaan/{$taskB->id_pekerjaan}/submit", [
            'progress_persen' => 95,
            'file_tugas' => $file,
        ]);

        $response->assertForbidden();
    }

    public function test_karyawan_can_update_progress_of_own_task(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $task = Pekerjaan::factory()->inProgress()->create(['id_pic' => $karyawan->id_user]);

        Sanctum::actingAs($karyawan);
        $response = $this->putJson("/api/pekerjaan/{$task->id_pekerjaan}", [
            'progress_persen' => 75,
            'deskripsi' => 'Progres baru telah diperbarui',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.progress_persen', 75);
    }

    public function test_karyawan_cannot_update_other_employee_task(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);
        $taskB = Pekerjaan::factory()->inProgress()->create(['id_pic' => $karyawanB->id_user]);

        Sanctum::actingAs($karyawanA);
        $response = $this->putJson("/api/pekerjaan/{$taskB->id_pekerjaan}", [
            'progress_persen' => 75,
        ]);

        $response->assertForbidden();
    }

    public function test_karyawan_cannot_change_id_pic_on_task_update(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);
        $taskA = Pekerjaan::factory()->inProgress()->create(['id_pic' => $karyawanA->id_user]);

        Sanctum::actingAs($karyawanA);
        $response = $this->putJson("/api/pekerjaan/{$taskA->id_pekerjaan}", [
            'id_pic' => $karyawanB->id_user,
            'progress_persen' => 80,
        ]);

        // Must either be rejected (403) or id_pic not changed
        if ($response->status() === 200) {
            $this->assertEquals($karyawanA->id_user, $taskA->fresh()->id_pic);
        } else {
            $response->assertForbidden();
        }
    }

    public function test_karyawan_cannot_create_or_delete_task(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $task = Pekerjaan::factory()->create();

        Sanctum::actingAs($karyawan);

        // POST pekerjaan -> 403 Forbidden
        $this->postJson('/api/pekerjaan', [
            'id_klien' => $task->id_klien,
            'id_pic' => $karyawan->id_user,
            'judul' => 'Tugas Baru Ilegal',
            'deadline' => '2026-10-01',
            'status' => 'baru',
        ])->assertForbidden();

        // DELETE pekerjaan -> 403 Forbidden
        $this->deleteJson("/api/pekerjaan/{$task->id_pekerjaan}")
            ->assertForbidden();
    }

    public function test_sales_cannot_access_pekerjaan(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $task = Pekerjaan::factory()->create();

        Sanctum::actingAs($sales);

        $this->getJson('/api/pekerjaan')->assertForbidden();
        $this->getJson("/api/pekerjaan/{$task->id_pekerjaan}")->assertForbidden();
        $this->postJson("/api/pekerjaan/{$task->id_pekerjaan}/submit")->assertForbidden();
    }

    public function test_operator_pic_can_update_pekerjaan(): void
    {
        $operatorA = User::factory()->create(['role' => 'operator']);
        $leadA = CalonKlien::factory()->create(['id_user' => $operatorA->id_user]);
        $kontrakA = Kontrak::factory()->create(['id_calon_klien' => $leadA->id_calon_klien]);
        $klienA = Klien::factory()->create(['id_kontrak' => $kontrakA->id_kontrak]);
        $taskA = Pekerjaan::factory()->create(['id_klien' => $klienA->id_klien]);

        Sanctum::actingAs($operatorA);
        $response = $this->putJson("/api/pekerjaan/{$taskA->id_pekerjaan}", [
            'judul' => 'Judul Diupdate Operator PIC',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.judul', 'Judul Diupdate Operator PIC');
    }

    public function test_non_pic_operator_cannot_update_pekerjaan(): void
    {
        $operatorA = User::factory()->create(['role' => 'operator']);
        $operatorB = User::factory()->create(['role' => 'operator']);

        $leadA = CalonKlien::factory()->create(['id_user' => $operatorA->id_user]);
        $kontrakA = Kontrak::factory()->create(['id_calon_klien' => $leadA->id_calon_klien]);
        $klienA = Klien::factory()->create(['id_kontrak' => $kontrakA->id_kontrak]);
        $taskA = Pekerjaan::factory()->create(['id_klien' => $klienA->id_klien]);

        Sanctum::actingAs($operatorB);
        $response = $this->putJson("/api/pekerjaan/{$taskA->id_pekerjaan}", [
            'judul' => 'Judul Dibajak Operator Lain',
        ]);

        $response->assertForbidden();
    }

    // ==========================================
    // 2. Actor Identity Integrity & Anti-Spoofing
    // ==========================================

    public function test_approved_by_is_strictly_resolved_from_authenticated_user_on_approve(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $otherUser = User::factory()->create(['role' => 'pimpinan']);
        $task = Pekerjaan::factory()->submitted()->create();

        Sanctum::actingAs($pimpinan);
        $response = $this->postJson("/api/pekerjaan/{$task->id_pekerjaan}/approve", [
            'approved_by' => $otherUser->id_user,
            'catatan_review' => 'Approval note',
        ]);

        $response->assertOk();
        $this->assertEquals($pimpinan->id_user, $task->fresh()->approved_by);
        $this->assertNotEquals($otherUser->id_user, $task->fresh()->approved_by);
    }

    public function test_approved_by_is_strictly_resolved_from_authenticated_user_on_reject(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $otherUser = User::factory()->create(['role' => 'pimpinan']);
        $task = Pekerjaan::factory()->submitted()->create();

        Sanctum::actingAs($pimpinan);
        $response = $this->postJson("/api/pekerjaan/{$task->id_pekerjaan}/reject", [
            'approved_by' => $otherUser->id_user,
            'catatan_review' => 'Perlu perbaikan',
        ]);

        $response->assertOk();
        $this->assertEquals($pimpinan->id_user, $task->fresh()->approved_by);
        $this->assertNotEquals($otherUser->id_user, $task->fresh()->approved_by);
    }

    public function test_reviewed_by_is_strictly_resolved_from_authenticated_user_in_performance_review(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $otherUser = User::factory()->create(['role' => 'pimpinan']);
        $task = Pekerjaan::factory()->completed()->create();

        Sanctum::actingAs($pimpinan);
        $response = $this->postJson('/api/performance-reviews', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'reviewed_by' => $otherUser->id_user, // Attempted spoof
            'quality_score' => 88,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('performance_reviews', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'reviewed_by' => $pimpinan->id_user, // Must be authenticated user
            'id_user' => $task->id_pic, // Must be employee subject
        ]);
    }

    public function test_reporting_id_user_assigned_to_authenticated_karyawan(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $otherUser = User::factory()->create(['role' => 'karyawan']);
        $task = Pekerjaan::factory()->create(['id_pic' => $karyawan->id_user]);

        Sanctum::actingAs($karyawan);
        $response = $this->postJson('/api/reporting', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'id_user' => $otherUser->id_user, // Attempted spoof
            'tgl_lapor' => now()->toDateString(),
            'catatan' => 'Laporan progress saya',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('reporting', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'id_user' => $karyawan->id_user, // Must be authenticated user
        ]);
    }

    // ==========================================
    // 3. CRM & Lead Ownership / IDOR
    // ==========================================

    public function test_sales_can_view_all_leads_shared_view(): void
    {
        $salesA = User::factory()->create(['role' => 'sales']);
        $salesB = User::factory()->create(['role' => 'sales']);

        $leadA = CalonKlien::factory()->create(['id_user' => $salesA->id_user]);
        $leadB = CalonKlien::factory()->create(['id_user' => $salesB->id_user]);

        Sanctum::actingAs($salesA);
        $response = $this->getJson('/api/calon-klien');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_sales_can_update_own_lead(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = CalonKlien::factory()->create(['id_user' => $sales->id_user]);

        Sanctum::actingAs($sales);
        $response = $this->putJson("/api/calon-klien/{$lead->id_calon_klien}", [
            'nama_perusahaan' => 'PT Nama Baru',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.nama_perusahaan', 'PT Nama Baru');
    }

    public function test_sales_cannot_update_lead_owned_by_another_sales(): void
    {
        $salesA = User::factory()->create(['role' => 'sales']);
        $salesB = User::factory()->create(['role' => 'sales']);
        $leadB = CalonKlien::factory()->create(['id_user' => $salesB->id_user]);

        Sanctum::actingAs($salesA);
        $response = $this->putJson("/api/calon-klien/{$leadB->id_calon_klien}", [
            'nama_perusahaan' => 'PT Pembajakan',
        ]);

        $response->assertForbidden();
    }

    public function test_sales_cannot_convert_lead_owned_by_another_sales(): void
    {
        $salesA = User::factory()->create(['role' => 'sales']);
        $salesB = User::factory()->create(['role' => 'sales']);
        $leadB = CalonKlien::factory()->deal()->create(['id_user' => $salesB->id_user]);

        Sanctum::actingAs($salesA);
        $response = $this->postJson("/api/calon-klien/{$leadB->id_calon_klien}/convert", [
            'no_kontrak' => 'KTR-HIJACK-001',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-17',
            'tgl_selesai' => '2026-10-17',
            'alamat' => 'Jl. Bisnis',
            'layanan' => 'Layanan Ilegal',
        ]);

        $response->assertForbidden();
    }

    public function test_sales_cannot_delete_any_lead(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = CalonKlien::factory()->create(['id_user' => $sales->id_user]);

        Sanctum::actingAs($sales);
        $response = $this->deleteJson("/api/calon-klien/{$lead->id_calon_klien}");

        $response->assertForbidden();
    }

    public function test_sales_cannot_delete_kontrak_or_klien(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $kontrak = Kontrak::factory()->create();
        $klien = Klien::factory()->create();

        Sanctum::actingAs($sales);

        $this->deleteJson("/api/kontrak/{$kontrak->id_kontrak}")
            ->assertForbidden();

        $this->deleteJson("/api/klien/{$klien->id_klien}")
            ->assertForbidden();
    }

    // ==========================================
    // 4. Performance Review Access & Scoping
    // ==========================================

    public function test_karyawan_can_view_own_performance_reviews_only(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);

        $reviewA = PerformanceReview::factory()->create(['id_user' => $karyawanA->id_user]);
        $reviewB = PerformanceReview::factory()->create(['id_user' => $karyawanB->id_user]);

        Sanctum::actingAs($karyawanA);
        $response = $this->getJson('/api/performance-reviews');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id_performance_review', $reviewA->id_performance_review);
    }

    public function test_karyawan_cannot_view_other_employee_performance_review_detail(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);

        $reviewB = PerformanceReview::factory()->create(['id_user' => $karyawanB->id_user]);

        Sanctum::actingAs($karyawanA);
        $response = $this->getJson("/api/performance-reviews/{$reviewB->id_performance_review}");

        $response->assertForbidden();
    }

    public function test_karyawan_cannot_create_or_modify_performance_reviews(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $task = Pekerjaan::factory()->completed()->create();
        $review = PerformanceReview::factory()->create(['id_user' => $karyawan->id_user]);

        Sanctum::actingAs($karyawan);

        // POST -> 403
        $this->postJson('/api/performance-reviews', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'quality_score' => 99,
        ])->assertForbidden();

        // PUT -> 403
        $this->putJson("/api/performance-reviews/{$review->id_performance_review}", [
            'quality_score' => 99,
        ])->assertForbidden();

        // DELETE -> 403
        $this->deleteJson("/api/performance-reviews/{$review->id_performance_review}")
            ->assertForbidden();
    }

    public function test_sales_cannot_access_performance_reviews(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $review = PerformanceReview::factory()->create();

        Sanctum::actingAs($sales);

        $this->getJson('/api/performance-reviews')->assertForbidden();
        $this->getJson("/api/performance-reviews/{$review->id_performance_review}")->assertForbidden();
    }

    // ==========================================
    // 5. Reporting Granular Protection & IDOR
    // ==========================================

    public function test_karyawan_can_only_view_own_reports_in_index(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);

        $taskA = Pekerjaan::factory()->create(['id_pic' => $karyawanA->id_user]);
        $taskB = Pekerjaan::factory()->create(['id_pic' => $karyawanB->id_user]);

        $reportA = Reporting::factory()->create([
            'id_pekerjaan' => $taskA->id_pekerjaan,
            'id_user' => $karyawanA->id_user,
        ]);
        $reportB = Reporting::factory()->create([
            'id_pekerjaan' => $taskB->id_pekerjaan,
            'id_user' => $karyawanB->id_user,
        ]);

        Sanctum::actingAs($karyawanA);
        $response = $this->getJson('/api/reporting');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id_reporting', $reportA->id_reporting);
    }

    public function test_karyawan_cannot_create_report_for_unassigned_task(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);
        $taskB = Pekerjaan::factory()->create(['id_pic' => $karyawanB->id_user]);

        Sanctum::actingAs($karyawanA);
        $response = $this->postJson('/api/reporting', [
            'id_pekerjaan' => $taskB->id_pekerjaan,
            'tgl_lapor' => now()->toDateString(),
            'catatan' => 'Laporan pada tugas orang lain',
        ]);

        $response->assertForbidden();
    }

    public function test_karyawan_cannot_delete_reporting(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $task = Pekerjaan::factory()->create(['id_pic' => $karyawan->id_user]);
        $report = Reporting::factory()->create([
            'id_pekerjaan' => $task->id_pekerjaan,
            'id_user' => $karyawan->id_user,
        ]);

        Sanctum::actingAs($karyawan);
        $this->deleteJson("/api/reporting/{$report->id_reporting}")
            ->assertForbidden();
    }

    public function test_sales_cannot_access_reporting(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $report = Reporting::factory()->create();

        Sanctum::actingAs($sales);

        $this->getJson('/api/reporting')->assertForbidden();
        $this->getJson("/api/reporting/{$report->id_reporting}")->assertForbidden();
    }

    // ==========================================
    // 7. Role-Aware Dashboard Metrics
    // ==========================================

    public function test_karyawan_dashboard_does_not_expose_global_financial_metrics(): void
    {
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $lead = CalonKlien::factory()->create();
        $kontrak = Kontrak::factory()->create();
        $klien = Klien::factory()->create();
        $task = Pekerjaan::factory()->create(['id_pic' => $karyawan->id_user]);

        Sanctum::actingAs($karyawan);
        $response = $this->getJson('/api/dashboard-summary');

        $response->assertOk()
            ->assertJsonPath('data.totals.tasks', 1)
            ->assertJsonMissingPath('data.totals.leads')
            ->assertJsonMissingPath('data.totals.contracts')
            ->assertJsonMissingPath('data.totals.active_clients')
            ->assertJsonMissingPath('data.lead_by_status')
            ->assertJsonMissingPath('data.contract_by_status')
            ->assertJsonMissingPath('data.employee_scores');
    }

    public function test_sales_dashboard_returns_crm_metrics_without_employee_scores(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = CalonKlien::factory()->deal()->create();
        $kontrak = Kontrak::factory()->create(['id_calon_klien' => $lead->id_calon_klien]);

        Sanctum::actingAs($sales);
        $response = $this->getJson('/api/dashboard-summary');

        $response->assertOk()
            ->assertJsonPath('data.totals.leads', 1)
            ->assertJsonPath('data.totals.contracts', 1)
            ->assertJsonMissingPath('data.employee_scores');
    }

    public function test_admin_and_pimpinan_receive_full_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);

        Sanctum::actingAs($admin);
        $this->getJson('/api/dashboard-summary')
            ->assertOk()
            ->assertJsonStructure(['data' => ['totals', 'lead_by_status', 'contract_by_status', 'work_by_status', 'employee_scores']]);

        Sanctum::actingAs($pimpinan);
        $this->getJson('/api/dashboard-summary')
            ->assertOk()
            ->assertJsonStructure(['data' => ['totals', 'lead_by_status', 'contract_by_status', 'work_by_status', 'employee_scores']]);
    }
}
