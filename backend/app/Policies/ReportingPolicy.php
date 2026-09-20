<?php

namespace App\Policies;

use App\Models\Reporting;
use App\Models\User;

class ReportingPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'karyawan'], true);
    }

    public function view(User $user, Reporting $reporting): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if ($user->role === 'karyawan') {
            return (int) $reporting->id_user === (int) $user->id_user
                || ((int) $reporting->pekerjaan?->id_pic === (int) $user->id_user);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'karyawan'], true);
    }

    public function update(User $user, Reporting $reporting): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if ($user->role === 'karyawan') {
            return (int) $reporting->id_user === (int) $user->id_user
                || ((int) $reporting->pekerjaan?->id_pic === (int) $user->id_user);
        }

        return false;
    }

    public function delete(User $user, Reporting $reporting): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }

    public function publishClient(User $user, Reporting $reporting): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }
}
