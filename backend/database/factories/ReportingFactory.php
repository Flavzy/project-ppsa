<?php

namespace Database\Factories;

use App\Models\Pekerjaan;
use App\Models\Reporting;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reporting>
 */
class ReportingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_pekerjaan' => Pekerjaan::factory(),
            'id_user' => User::factory(),
            'tgl_lapor' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'progress_persen' => fake()->numberBetween(0, 100),
            'tipe_laporan' => 'internal',
            'status_laporan' => 'draft',
            'is_visible_to_client' => false,
            'published_at' => null,
            'dokumen_bukti' => null,
            'catatan' => fake()->optional()->paragraph(),
        ];
    }

    public function publishedToClient(): static
    {
        return $this->state(fn (): array => [
            'tipe_laporan' => 'client',
            'status_laporan' => 'sent',
            'is_visible_to_client' => true,
            'published_at' => now(),
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (): array => [
            'status_laporan' => 'approved',
        ]);
    }
}
