<?php

namespace App\Policies;

use App\Models\Pekerjaan;
use App\Models\User;

class PekerjaanPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales', 'karyawan'], true);
    }

    public function view(User $user, Pekerjaan $pekerjaan): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true)) {
            return true;
        }

        if ($user->role === 'karyawan') {
            return (int) $pekerjaan->id_pic === (int) $user->id_user;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function update(User $user, Pekerjaan $pekerjaan): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true)) {
            return true;
        }

        if ($user->role === 'karyawan') {
            return (int) $pekerjaan->id_pic === (int) $user->id_user;
        }

        return false;
    }

    public function delete(User $user, Pekerjaan $pekerjaan): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }

    public function submit(User $user, Pekerjaan $pekerjaan): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if ($user->role === 'karyawan') {
            return (int) $pekerjaan->id_pic === (int) $user->id_user;
        }

        return false;
    }

    public function approve(User $user, Pekerjaan $pekerjaan): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }

    public function reject(User $user, Pekerjaan $pekerjaan): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }
}
