<?php

namespace Database\Factories;

use App\Models\Pekerjaan;
use App\Models\PerformanceReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PerformanceReview>
 */
class PerformanceReviewFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $speedScore = fake()->numberBetween(40, 100);
        $qualityScore = fake()->numberBetween(50, 100);

        return [
            'id_pekerjaan' => Pekerjaan::factory()->completed(),
            'id_user' => User::factory(),
            'reviewed_by' => User::factory(),
            'speed_score' => $speedScore,
            'quality_score' => $qualityScore,
            'revision_count' => fake()->numberBetween(0, 5),
            'final_score' => PerformanceReview::calculateFinalScore($speedScore, $qualityScore),
            'catatan' => fake()->optional()->sentence(),
            'reviewed_at' => now(),
        ];
    }
}
