<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('users.manage') || $user->isAdmin();
    }

    public function view(User $actor, User $model): bool
    {
        if (! ($actor->can('users.manage') || $actor->isAdmin())) {
            return false;
        }

        return $actor->store_id === $model->store_id || $actor->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->can('users.manage') || $user->isAdmin();
    }

    public function update(User $actor, User $model): bool
    {
        return $this->view($actor, $model);
    }
}
