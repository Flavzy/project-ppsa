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

    public function test_storing_review_twice_rejects_duplicate_on_same_pekerjaan(): void
    {
        $leader = User::factory()->create(['role' => 'pimpinan']);
        $task = $this->createCompletedTask();

        Sanctum::actingAs($leader);
        $this->postJson('/api/performance-reviews', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'reviewed_by' => $leader->id_user,
            'quality_score' => 80,
            'revision_count' => 0,
        ])->assertCreated();

        $secondResponse = $this->postJson('/api/performance-reviews', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'reviewed_by' => $leader->id_user,
            'quality_score' => 95,
            'revision_count' => 0,
        ]);

        $secondResponse->assertStatus(422)
            ->assertJsonValidationErrors(['id_pekerjaan']);

        // Verify in database there is only 1 row for this pekerjaan
        $this->assertDatabaseCount('performance_reviews', 1);
    }

    public function test_storing_review_rejects_uncompleted_task(): void
    {
        $leader = User::factory()->create(['role' => 'pimpinan']);
        $pic = User::factory()->create(['role' => 'karyawan']);
        $client = Klien::factory()->create();

        $uncompletedTask = Pekerjaan::create([
            'id_klien' => $client->id_klien,
            'id_pic' => $pic->id_user,
            'judul' => 'Tugas Belum Selesai',
            'deadline' => now()->addDays(7)->toDateString(),
            'status' => 'baru',
            'review_status' => 'pending',
        ]);

        Sanctum::actingAs($leader);
        $res = $this->postJson('/api/performance-reviews', [
            'id_pekerjaan' => $uncompletedTask->id_pekerjaan,
            'quality_score' => 85,
        ]);

        $res->assertStatus(422)
            ->assertJsonValidationErrors(['id_pekerjaan']);
        $this->assertDatabaseCount('performance_reviews', 0);
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
        return Pekerjaan::create([
            'id_klien' => $client->id_klien,
            'id_pic' => $pic->id_user,
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
