<?php

namespace App\Policies;

use App\Models\Kontrak;
use App\Models\User;

class KontrakPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function view(User $user, Kontrak $kontrak): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function update(User $user, Kontrak $kontrak): bool
    {
        return in_array($user->role, ['admin', 'sales', 'pimpinan'], true);
    }

    public function delete(User $user, Kontrak $kontrak): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }
}
