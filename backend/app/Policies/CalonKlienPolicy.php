<?php

namespace App\Policies;

use App\Models\CalonKlien;
use App\Models\User;

class CalonKlienPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function view(User $user, CalonKlien $calonKlien): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function update(User $user, CalonKlien $calonKlien): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if (in_array($user->role, ['operator', 'sales'], true)) {
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

        if (in_array($user->role, ['operator', 'sales'], true)) {
            return (int) $calonKlien->id_user === (int) $user->id_user;
        }

        return false;
    }
}
