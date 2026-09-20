<?php

namespace App\Policies;

use App\Models\CalonKlien;
use App\Models\User;

class CalonKlienPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function view(User $user, CalonKlien $calonKlien): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function update(User $user, CalonKlien $calonKlien): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if ($user->role === 'sales') {
            return (int) $calonKlien->id_user === (int) $user->id_user;
        }

        return false;
    }

    public function delete(User $user, CalonKlien $calonKlien): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }

    public function convert(User $user, CalonKlien $calonKlien): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if ($user->role === 'sales') {
            return (int) $calonKlien->id_user === (int) $user->id_user;
        }

        return false;
    }
}
