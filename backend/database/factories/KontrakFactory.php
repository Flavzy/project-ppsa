<?php

namespace Database\Factories;

use App\Models\CalonKlien;
use App\Models\Kontrak;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Kontrak>
 */
class KontrakFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('-3 months', '+1 month');
        $endDate = fake()->dateTimeBetween($startDate, '+6 months');

        return [
            'id_calon_klien' => CalonKlien::factory()->deal(),
            'no_kontrak' => 'KTR-'.fake()->unique()->numerify('####'),
            'jenis_dokumen' => fake()->randomElement(['kontrak', 'spk']),
            'no_spk' => fake()->optional()->numerify('SPK-####'),
            'nilai_proyek' => fake()->randomFloat(2, 10000000, 500000000),
            'lingkup_kerja' => fake()->sentence(),
            'tgl_mulai' => $startDate->format('Y-m-d'),
            'tgl_selesai' => $endDate->format('Y-m-d'),
            'status' => fake()->randomElement(['draft', 'active', 'completed']),
            'dokumen_draft' => null,
            'dokumen_final' => null,
            'ditandatangani_pada' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (): array => [
            'status' => 'active',
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (): array => [
            'status' => 'draft',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (): array => [
            'status' => 'completed',
        ]);
    }
}
