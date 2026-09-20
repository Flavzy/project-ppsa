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

class PekerjaanWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_can_be_submitted_and_approved(): void
    {
        [$leader, $task, $pic] = $this->createTask();

        Sanctum::actingAs($pic);
        $submitResponse = $this
            ->postJson("/api/pekerjaan/{$task->id_pekerjaan}/submit", [
                'progress_persen' => 90,
            ]);

        $submitResponse->assertOk()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.review_status', 'submitted');

        Sanctum::actingAs($leader);
        $approveResponse = $this
            ->postJson("/api/pekerjaan/{$task->id_pekerjaan}/approve", [
                'approved_by' => $leader->id_user,
                'catatan_review' => 'Hasil sudah sesuai.',
            ]);

        $approveResponse->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.progress_persen', 100)
            ->assertJsonPath('data.review_status', 'approved');
    }

    public function test_task_can_be_rejected_for_revision(): void
    {
        [$leader, $task] = $this->createTask();

        Sanctum::actingAs($leader);
        $response = $this
            ->postJson("/api/pekerjaan/{$task->id_pekerjaan}/reject", [
                'approved_by' => $leader->id_user,
                'catatan_review' => 'Perlu revisi bukti kerja.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'revision_needed')
            ->assertJsonPath('data.review_status', 'revision_needed')
            ->assertJsonPath('data.catatan_review', 'Perlu revisi bukti kerja.');
    }

    /**
     * @return array{0: User, 1: Pekerjaan, 2: User}
     */
    private function createTask(): array
    {
        $leader = User::factory()->create(['role' => 'pimpinan']);
        $pic = User::factory()->create(['role' => 'karyawan']);
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = CalonKlien::create([
            'id_user' => $sales->id_user,
            'nama_perusahaan' => 'PT Klien',
            'kontak' => '08123456789',
            'status_prospek' => 'deal',
            'prioritas' => 'high',
        ]);
        $contract = Kontrak::create([
            'id_calon_klien' => $lead->id_calon_klien,
            'no_kontrak' => 'KTR-WF-001',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-15',
            'tgl_selesai' => '2026-10-15',
            'status' => 'active',
        ]);
        $client = Klien::create([
            'id_kontrak' => $contract->id_kontrak,
            'nama_perusahaan' => 'PT Klien',
            'alamat' => 'Jl. Test',
            'kontak' => '08123456789',
            'layanan' => 'Audit',
        ]);
        $template = TemplateDeadline::create([
            'nama_template' => 'Standar',
            'keterangan' => 'Template standar',
        ]);
        $task = Pekerjaan::create([
            'id_klien' => $client->id_klien,
            'id_pic' => $pic->id_user,
            'id_template' => $template->id_template,
            'judul' => 'Pekerjaan Test',
            'deadline' => '2026-09-30',
            'prioritas' => 'high',
            'progress_persen' => 50,
            'status' => 'in_progress',
        ]);

        return [$leader, $task, $pic];
    }
}
