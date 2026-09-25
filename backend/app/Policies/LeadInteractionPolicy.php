<?php

namespace App\Policies;

use App\Models\LeadInteraction;
use App\Models\User;

class LeadInteractionPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function view(User $user, LeadInteraction $leadInteraction): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'pimpinan', 'operator', 'sales'], true);
    }

    public function update(User $user, LeadInteraction $leadInteraction): bool
    {
        if (in_array($user->role, ['admin', 'pimpinan'], true)) {
            return true;
        }

        if (in_array($user->role, ['operator', 'sales'], true)) {
            return (int) $leadInteraction->id_user === (int) $user->id_user
                || ((int) $leadInteraction->calonKlien?->id_user === (int) $user->id_user);
        }

        return false;
    }

    public function delete(User $user, LeadInteraction $leadInteraction): bool
    {
        return in_array($user->role, ['admin', 'pimpinan'], true);
    }
}
