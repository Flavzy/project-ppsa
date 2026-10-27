<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password123'),
            'role' => 'karyawan',
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes): array => [
            'role' => 'admin',
        ]);
    }

    public function sales(): static
    {
        return $this->state(fn (array $attributes): array => [
            'role' => 'sales',
        ]);
    }

    public function operator(): static
    {
        return $this->state(fn (array $attributes): array => [
            'role' => 'operator',
        ]);
    }

    public function karyawan(): static
    {
        return $this->state(fn (array $attributes): array => [
            'role' => 'karyawan',
        ]);
    }

    public function pimpinan(): static
    {
        return $this->state(fn (array $attributes): array => [
            'role' => 'pimpinan',
        ]);
    }
}
