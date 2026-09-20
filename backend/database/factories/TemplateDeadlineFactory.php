<?php

namespace Database\Factories;

use App\Models\TemplateDeadline;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TemplateDeadline>
 */
class TemplateDeadlineFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama_template' => fake()->randomElement(['Standar', 'Urgent', 'Custom', 'Reguler', 'Prioritas']).' '.fake()->unique()->numerify('##'),
            'keterangan' => fake()->optional()->sentence(),
        ];
    }
}
