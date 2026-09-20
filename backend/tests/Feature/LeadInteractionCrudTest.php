<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\LeadInteraction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeadInteractionCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);
    }

    public function test_index_lists_interactions_with_relations(): void
    {
        $interaction = LeadInteraction::factory()->create();

        $response = $this->getJson('/api/lead-interactions');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id_interaction', $interaction->id_interaction)
            ->assertJsonStructure(['data' => [['calon_klien', 'user']]]);
    }

    public function test_store_creates_lead_interaction(): void
    {
        $calonKlien = CalonKlien::factory()->create();
        $user = User::factory()->create();

        $response = $this->postJson('/api/lead-interactions', [
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'id_user' => $user->id_user,
            'tipe_interaksi' => 'meeting',
            'tanggal_interaksi' => '2026-09-15',
            'ringkasan' => 'Diskusi kebutuhan klien.',
            'hasil' => 'Klien tertarik dengan proposal.',
            'jadwal_followup' => '2026-09-22',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tipe_interaksi', 'meeting')
            ->assertJsonPath('data.ringkasan', 'Diskusi kebutuhan klien.');

        $this->assertDatabaseHas('lead_interactions', [
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'tipe_interaksi' => 'meeting',
        ]);
    }

    public function test_show_returns_single_interaction(): void
    {
        $interaction = LeadInteraction::factory()->create();

        $response = $this->getJson("/api/lead-interactions/{$interaction->id_interaction}");

        $response->assertOk()
            ->assertJsonPath('data.id_interaction', $interaction->id_interaction);
    }

    public function test_update_modifies_lead_interaction(): void
    {
        $interaction = LeadInteraction::factory()->create([
            'tipe_interaksi' => 'telepon',
        ]);

        $response = $this->putJson("/api/lead-interactions/{$interaction->id_interaction}", [
            'tipe_interaksi' => 'email',
            'ringkasan' => 'Follow up via email.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.tipe_interaksi', 'email')
            ->assertJsonPath('data.ringkasan', 'Follow up via email.');
    }

    public function test_delete_removes_lead_interaction(): void
    {
        $interaction = LeadInteraction::factory()->create();

        $response = $this->deleteJson("/api/lead-interactions/{$interaction->id_interaction}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('lead_interactions', [
            'id_interaction' => $interaction->id_interaction,
        ]);
    }

    public function test_validation_rejects_invalid_tipe_interaksi(): void
    {
        $calonKlien = CalonKlien::factory()->create();
        $user = User::factory()->create();

        $response = $this->postJson('/api/lead-interactions', [
            'id_calon_klien' => $calonKlien->id_calon_klien,
            'id_user' => $user->id_user,
            'tipe_interaksi' => 'invalid_type',
            'tanggal_interaksi' => '2026-09-15',
            'ringkasan' => 'Test.',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('tipe_interaksi');
    }

    public function test_validation_rejects_missing_required_fields(): void
    {
        $response = $this->postJson('/api/lead-interactions', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['id_calon_klien', 'id_user', 'tipe_interaksi', 'tanggal_interaksi', 'ringkasan']);
    }
}
