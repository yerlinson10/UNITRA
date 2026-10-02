<?php

namespace App\Policies;

use App\Models\Store;
use App\Models\User;

class StorePolicy
{
    public function view(User $user, Store $store): bool
    {
        return $user->store_id === $store->id || $user->isAdmin();
    }

    public function update(User $user, Store $store): bool
    {
        if ($user->store_id !== $store->id && ! $user->isAdmin()) {
            return false;
        }

        return $user->can('store.update') || $user->isAdmin();
    }
}
