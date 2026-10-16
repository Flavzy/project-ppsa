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
            'status_laporan' => 'draft',
            'dokumen_bukti' => null,
            'catatan' => fake()->optional()->paragraph(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (): array => [
            'status_laporan' => 'approved',
        ]);
    }
}
