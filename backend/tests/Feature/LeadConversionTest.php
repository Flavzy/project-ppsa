<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeadConversionTest extends TestCase
{
    use RefreshDatabase;

    public function test_deal_lead_can_be_converted_to_contract_and_client(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $lead = CalonKlien::create([
            'id_user' => $user->id_user,
            'nama_perusahaan' => 'PT Maju Jaya',
            'kontak' => '08123456789',
            'status_prospek' => 'deal',
            'prioritas' => 'high',
            'nilai_estimasi' => 15000000,
        ]);

        Sanctum::actingAs($user);
        $response = $this
            ->postJson("/api/calon-klien/{$lead->id_calon_klien}/convert", [
                'no_kontrak' => 'KTR-001',
                'jenis_dokumen' => 'kontrak',
                'tgl_mulai' => '2026-09-15',
                'tgl_selesai' => '2026-10-15',
                'alamat' => 'Jl. Mawar No. 1',
                'layanan' => 'Digital marketing',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.kontrak.no_kontrak', 'KTR-001')
            ->assertJsonPath('data.kontrak.klien.nama_perusahaan', 'PT Maju Jaya');

        $this->assertDatabaseHas('kontrak', [
            'id_calon_klien' => $lead->id_calon_klien,
            'no_kontrak' => 'KTR-001',
            'status' => 'draft',
        ]);

        $this->assertDatabaseHas('klien', [
            'nama_perusahaan' => 'PT Maju Jaya',
            'layanan' => 'Digital marketing',
        ]);
    }

    public function test_non_deal_lead_cannot_be_converted(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $lead = CalonKlien::create([
            'id_user' => $user->id_user,
            'nama_perusahaan' => 'PT Belum Deal',
            'kontak' => '08123456789',
            'status_prospek' => 'negotiation',
            'prioritas' => 'medium',
        ]);

        Sanctum::actingAs($user);
        $response = $this
            ->postJson("/api/calon-klien/{$lead->id_calon_klien}/convert", [
                'no_kontrak' => 'KTR-002',
                'jenis_dokumen' => 'kontrak',
                'tgl_mulai' => '2026-09-15',
                'tgl_selesai' => '2026-10-15',
                'alamat' => 'Jl. Mawar No. 1',
                'layanan' => 'Digital marketing',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('status_prospek');
    }
}
