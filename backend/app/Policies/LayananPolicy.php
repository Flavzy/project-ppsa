<?php

namespace App\Policies;

use App\Models\Layanan;
use App\Models\User;

class LayananPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Layanan $layanan): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }

    public function update(User $user, Layanan $layanan): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }

    public function delete(User $user, Layanan $layanan): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }
}
