<?php

namespace Database\Factories;

use App\Models\CalonKlien;
use App\Models\LeadInteraction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadInteraction>
 */
class LeadInteractionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_calon_klien' => CalonKlien::factory(),
            'id_user' => User::factory(),
            'tipe_interaksi' => fake()->randomElement(['telepon', 'email', 'meeting', 'follow_up', 'proposal', 'negosiasi']),
            'tanggal_interaksi' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'ringkasan' => fake()->sentence(),
            'hasil' => fake()->optional()->sentence(),
            'jadwal_followup' => fake()->optional()->dateTimeBetween('now', '+14 days')?->format('Y-m-d'),
        ];
    }
}
