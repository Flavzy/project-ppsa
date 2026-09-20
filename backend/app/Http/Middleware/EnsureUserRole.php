<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (! in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => 'Role pengguna tidak memiliki akses untuk aksi ini.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
