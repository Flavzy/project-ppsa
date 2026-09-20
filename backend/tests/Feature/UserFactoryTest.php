<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserFactoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_factory_role_is_karyawan(): void
    {
        $user = User::factory()->create();

        $this->assertSame('karyawan', $user->role);
        $this->assertNotNull($user->id_user);
        $this->assertTrue(Hash::check('password', $user->password));
    }

    public function test_factory_admin_state(): void
    {
        $admin = User::factory()->admin()->create();

        $this->assertSame('admin', $admin->role);
    }

    public function test_factory_sales_state(): void
    {
        $sales = User::factory()->sales()->create();

        $this->assertSame('sales', $sales->role);
    }

    public function test_factory_karyawan_state(): void
    {
        $karyawan = User::factory()->karyawan()->create();

        $this->assertSame('karyawan', $karyawan->role);
    }

    public function test_factory_pimpinan_state(): void
    {
        $pimpinan = User::factory()->pimpinan()->create();

        $this->assertSame('pimpinan', $pimpinan->role);
    }
}
