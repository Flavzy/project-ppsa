<?php

namespace App\Policies;

use App\Models\Kontrak;
use App\Models\User;

class KontrakPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function view(User $user, Kontrak $kontrak): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function update(User $user, Kontrak $kontrak): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if (in_array($user->role, ['operator', 'sales'], true)) {
            $operatorPicId = $kontrak->operator_pic_id;
            return $operatorPicId !== null && (int) $operatorPicId === (int) $user->id_user;
        }

        return false;
    }

    public function delete(User $user, Kontrak $kontrak): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }
}
