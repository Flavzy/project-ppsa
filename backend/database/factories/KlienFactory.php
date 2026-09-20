<?php

namespace Database\Factories;

use App\Models\Klien;
use App\Models\Kontrak;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Klien>
 */
class KlienFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_kontrak' => Kontrak::factory(),
            'nama_perusahaan' => 'PT '.fake()->company(),
            'alamat' => fake()->address(),
            'kontak' => fake()->phoneNumber(),
            'layanan' => fake()->randomElement(['Konsultansi', 'Audit', 'Digital Marketing', 'IT Support', 'Pelatihan']),
        ];
    }
}
