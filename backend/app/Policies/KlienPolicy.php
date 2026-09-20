<?php

namespace App\Policies;

use App\Models\Klien;
use App\Models\User;

class KlienPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function view(User $user, Klien $klien): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function update(User $user, Klien $klien): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function delete(User $user, Klien $klien): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }
}
