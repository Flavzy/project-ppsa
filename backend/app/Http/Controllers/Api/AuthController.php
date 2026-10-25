<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    private const MAX_FAILED_ATTEMPTS = 5;

    public function login(LoginRequest $request): JsonResponse
    {
        $cacheKey = 'login_lockout:' . sha1((string) $request->ip());
        $lockoutState = Cache::get($cacheKey, [
            'attempts' => 0,
            'stage' => 0,
            'locked_until' => 0,
        ]);

        $now = now()->timestamp;

        if (($lockoutState['locked_until'] ?? 0) > $now) {
            $retryAfter = (int) ($lockoutState['locked_until'] - $now);
            $stage = (int) ($lockoutState['stage'] ?? 1);

            return response()->json([
                'message' => $this->formatLockoutMessage($retryAfter),
                'retry_after' => $retryAfter,
                'lockout_stage' => $stage,
            ], 429)->header('Retry-After', (string) $retryAfter);
        }

        $identifier = $request->input('username') ?? $request->input('email');
        $user = User::where('email', $identifier)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            $attempts = ((int) ($lockoutState['attempts'] ?? 0)) + 1;
            $stage = (int) ($lockoutState['stage'] ?? 0);

            if ($attempts >= self::MAX_FAILED_ATTEMPTS) {
                $stage += 1;
                $duration = match ($stage) {
                    1 => 30,
                    2 => 180,
                    default => 1800,
                };
                $lockedUntil = $now + $duration;

                Cache::put($cacheKey, [
                    'attempts' => 0,
                    'stage' => $stage,
                    'locked_until' => $lockedUntil,
                ], now()->addDay());

                return response()->json([
                    'message' => $this->formatLockoutMessage($duration),
                    'retry_after' => $duration,
                    'lockout_stage' => $stage,
                ], 429)->header('Retry-After', (string) $duration);
            }

            Cache::put($cacheKey, [
                'attempts' => $attempts,
                'stage' => $stage,
                'locked_until' => 0,
            ], now()->addDay());

            $remainingAttempts = self::MAX_FAILED_ATTEMPTS - $attempts;

            return response()->json([
                'message' => 'Kredensial yang diberikan tidak cocok dengan data kami.',
                'remaining_attempts' => $remainingAttempts,
                'failed_attempts' => $attempts,
            ], 401);
        }

        Cache::forget($cacheKey);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => [
                'id_user' => $user->id_user,
                'nama' => $user->nama,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
        ]);
    }

    private function formatLockoutMessage(int $seconds): string
    {
        if ($seconds >= 60) {
            $minutes = intdiv($seconds, 60);
            $remSeconds = $seconds % 60;
            $durationText = $remSeconds > 0
                ? "{$minutes} menit {$remSeconds} detik"
                : "{$minutes} menit";
        } else {
            $durationText = "{$seconds} detik";
        }

        return "Terlalu banyak percobaan login yang gagal (5 kali berturut-turut). Login diblokir sementara selama {$durationText}.";
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id_user' => $user->id_user,
                'nama' => $user->nama,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        if (auth()->guard('sanctum') instanceof \Illuminate\Auth\RequestGuard) {
            auth()->guard('sanctum')->forgetUser();
        }

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }
}
