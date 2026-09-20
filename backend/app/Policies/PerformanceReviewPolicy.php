<?php

namespace App\Policies;

use App\Models\PerformanceReview;
use App\Models\User;

class PerformanceReviewPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'karyawan'], true);
    }

    public function view(User $user, PerformanceReview $performanceReview): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if ($user->role === 'karyawan') {
            return (int) $performanceReview->id_user === (int) $user->id_user;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }

    public function update(User $user, PerformanceReview $performanceReview): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }

    public function delete(User $user, PerformanceReview $performanceReview): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }
}
