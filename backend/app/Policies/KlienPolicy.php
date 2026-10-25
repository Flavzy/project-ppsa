<?php

namespace App\Policies;

use App\Models\Klien;
use App\Models\User;

class KlienPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales', 'karyawan'], true);
    }

    public function view(User $user, Klien $klien): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales', 'karyawan'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function update(User $user, Klien $klien): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if (in_array($user->role, ['operator', 'sales'], true)) {
            $operatorPicId = $klien->operator_pic_id;
            return $operatorPicId !== null && (int) $operatorPicId === (int) $user->id_user;
        }

        return false;
    }

    public function delete(User $user, Klien $klien): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }
}
