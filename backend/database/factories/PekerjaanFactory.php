<?php

namespace Database\Factories;

use App\Models\Klien;
use App\Models\Pekerjaan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pekerjaan>
 */
class PekerjaanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_klien' => Klien::factory(),
            'id_pic' => User::factory(),
            'judul' => fake()->sentence(3),
            'deskripsi' => fake()->optional()->paragraph(),
            'deadline' => fake()->dateTimeBetween('now', '+3 months')->format('Y-m-d'),
            'prioritas' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'progress_persen' => fake()->numberBetween(0, 100),
            'status' => 'in_progress',
            'tgl_selesai' => null,
            'submitted_at' => null,
            'approved_at' => null,
            'approved_by' => null,
            'review_status' => 'pending',
            'catatan_review' => null,
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn (): array => [
            'status' => 'in_progress',
            'progress_persen' => fake()->numberBetween(10, 80),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (): array => [
            'status' => 'completed',
            'progress_persen' => 100,
            'review_status' => 'approved',
            'tgl_selesai' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'approved_at' => now(),
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn (): array => [
            'status' => 'in_progress',
            'deadline' => fake()->dateTimeBetween('-2 months', '-1 day')->format('Y-m-d'),
            'progress_persen' => fake()->numberBetween(10, 60),
        ]);
    }

    public function submitted(): static
    {
        return $this->state(fn (): array => [
            'status' => 'submitted',
            'review_status' => 'submitted',
            'progress_persen' => fake()->numberBetween(80, 100),
            'submitted_at' => now(),
        ]);
    }
}
