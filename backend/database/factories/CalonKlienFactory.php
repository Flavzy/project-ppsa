<?php

namespace Database\Factories;

use App\Models\CalonKlien;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CalonKlien>
 */
class CalonKlienFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_user' => User::factory(),
            'nama_perusahaan' => 'PT '.fake()->company(),
            'decision_maker' => fake()->name(),
            'kontak' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'pain_points' => fake()->sentence(),
            'budget' => fake()->randomFloat(2, 5000000, 100000000),
            'timeline' => fake()->randomElement(['1 bulan', '3 bulan', '6 bulan', '1 tahun']),
            'lead_source' => fake()->randomElement(['website', 'referral', 'cold_call', 'event', 'social_media']),
            'prioritas' => fake()->randomElement(['low', 'medium', 'high']),
            'nilai_estimasi' => fake()->randomFloat(2, 10000000, 500000000),
            'catatan' => fake()->optional()->paragraph(),
            'status_prospek' => fake()->randomElement(['prospek', 'negotiation', 'proposal', 'deal', 'lost']),
            'tgl_followup' => fake()->optional()->dateTimeBetween('now', '+30 days')?->format('Y-m-d'),
        ];
    }

    public function deal(): static
    {
        return $this->state(fn (): array => [
            'status_prospek' => 'deal',
            'prioritas' => 'high',
        ]);
    }

    public function prospek(): static
    {
        return $this->state(fn (): array => [
            'status_prospek' => 'prospek',
        ]);
    }

    public function lost(): static
    {
        return $this->state(fn (): array => [
            'status_prospek' => 'lost',
        ]);
    }

    public function negotiation(): static
    {
        return $this->state(fn (): array => [
            'status_prospek' => 'negotiation',
        ]);
    }
}
