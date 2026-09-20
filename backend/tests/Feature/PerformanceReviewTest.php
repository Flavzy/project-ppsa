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

class PerformanceReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_performance_review_calculates_speed_and_final_score(): void
    {
        $leader = User::factory()->create(['role' => 'pimpinan']);
        $task = $this->createCompletedTask();

        Sanctum::actingAs($leader);
        $response = $this
            ->postJson('/api/performance-reviews', [
                'id_pekerjaan' => $task->id_pekerjaan,
                'reviewed_by' => $leader->id_user,
                'quality_score' => 90,
                'revision_count' => 1,
                'catatan' => 'Kualitas baik.',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.speed_score', 100)
            ->assertJsonPath('data.quality_score', 90)
            ->assertJsonPath('data.final_score', '94.00');
    }

    private function createCompletedTask(): Pekerjaan
    {
        $pic = User::factory()->create(['role' => 'karyawan']);
        $sales = User::factory()->create(['role' => 'sales']);
        $lead = CalonKlien::create([
            'id_user' => $sales->id_user,
            'nama_perusahaan' => 'PT Nilai',
            'kontak' => '08123456789',
            'status_prospek' => 'deal',
            'prioritas' => 'medium',
        ]);
        $contract = Kontrak::create([
            'id_calon_klien' => $lead->id_calon_klien,
            'no_kontrak' => 'KTR-PR-001',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-01',
            'tgl_selesai' => '2026-10-01',
            'status' => 'active',
        ]);
        $client = Klien::create([
            'id_kontrak' => $contract->id_kontrak,
            'nama_perusahaan' => 'PT Nilai',
            'alamat' => 'Jl. Nilai',
            'kontak' => '08123456789',
            'layanan' => 'Review',
        ]);
        $template = TemplateDeadline::create([
            'nama_template' => 'Standar',
        ]);

        return Pekerjaan::create([
            'id_klien' => $client->id_klien,
            'id_pic' => $pic->id_user,
            'id_template' => $template->id_template,
            'judul' => 'Pekerjaan Dinilai',
            'deadline' => '2026-09-30',
            'prioritas' => 'medium',
            'progress_persen' => 100,
            'status' => 'completed',
            'tgl_selesai' => '2026-09-29',
            'review_status' => 'approved',
        ]);
    }
}
