<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_credentials_can_login(): void
    {
        $user = User::factory()->create([
            'nama' => 'Budi Utomo',
            'email' => 'budi@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'budi@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'message',
                'user' => [
                    'id_user',
                    'nama',
                    'email',
                    'role',
                ],
                'token',
            ])
            ->assertJsonPath('user.id_user', $user->id_user)
            ->assertJsonPath('user.nama', 'Budi Utomo')
            ->assertJsonPath('user.email', 'budi@example.com')
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonMissing(['password']);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_invalid_password_returns_401(): void
    {
        User::factory()->create([
            'email' => 'siti@example.com',
            'password' => Hash::make('password-benar'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'siti@example.com',
            'password' => 'password-salah',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('message', 'Kredensial yang diberikan tidak cocok dengan data kami.');
    }

    public function test_unknown_email_returns_401(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'tidak_terdaftar@example.com',
            'password' => 'password123',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('message', 'Kredensial yang diberikan tidak cocok dengan data kami.');
    }

    public function test_missing_email_returns_422(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'password' => 'secret123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_missing_password_returns_422(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@example.com',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_auth_me_without_authentication_returns_401(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertUnauthorized();
    }

    public function test_auth_me_with_valid_token_returns_authenticated_user(): void
    {
        $user = User::factory()->create([
            'nama' => 'Andi Pratama',
            'email' => 'andi@example.com',
            'role' => 'karyawan',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this
            ->withToken($token)
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('user.id_user', $user->id_user)
            ->assertJsonPath('user.nama', 'Andi Pratama')
            ->assertJsonPath('user.email', 'andi@example.com')
            ->assertJsonPath('user.role', 'karyawan');
    }

    public function test_auth_me_does_not_expose_password(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this
            ->withToken($token)
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonMissing(['password', 'password_hash']);
    }

    public function test_logout_invalidates_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('logout_test_token')->plainTextToken;

        $logoutResponse = $this
            ->withToken($token)
            ->postJson('/api/auth/logout');

        $logoutResponse->assertOk()
            ->assertJsonPath('message', 'Logout berhasil.');

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Verify that the revoked token can no longer access /api/auth/me
        $meResponse = $this
            ->withToken($token)
            ->getJson('/api/auth/me');

        $meResponse->assertUnauthorized();
    }

    public function test_x_user_id_alone_cannot_authenticate_auth_me(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->withHeader('X-User-Id', (string) $user->id_user)
            ->getJson('/api/auth/me');

        $response->assertUnauthorized();
    }

    public function test_invalid_authorization_cannot_be_replaced_by_x_user_id(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->withHeader('Authorization', 'Bearer invalid-token-string')
            ->withHeader('X-User-Id', (string) $user->id_user)
            ->getJson('/api/auth/me');

        $response->assertUnauthorized();
    }

    public function test_authenticated_identity_comes_from_server_authentication(): void
    {
        $realUser = User::factory()->create([
            'nama' => 'Real User',
            'email' => 'real@example.com',
            'role' => 'karyawan',
        ]);

        $spoofedUser = User::factory()->create([
            'nama' => 'Admin To Impersonate',
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);

        $token = $realUser->createToken('real_token')->plainTextToken;

        // Send valid token of $realUser together with spoofed X-User-Id of $spoofedUser
        $response = $this
            ->withToken($token)
            ->withHeader('X-User-Id', (string) $spoofedUser->id_user)
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('user.id_user', $realUser->id_user)
            ->assertJsonPath('user.nama', 'Real User')
            ->assertJsonPath('user.email', 'real@example.com')
            ->assertJsonPath('user.role', 'karyawan');

        $this->assertNotEquals($spoofedUser->id_user, $response->json('user.id_user'));
    }
}
