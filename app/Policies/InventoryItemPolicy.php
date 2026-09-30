<?php

namespace App\Policies;

use App\Models\InventoryItem;
use App\Models\User;

class InventoryItemPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, InventoryItem $inventoryItem): bool
    {
        return $user->store_id === $inventoryItem->store_id || $user->isAdmin();
    }

    public function update(User $user, InventoryItem $inventoryItem): bool
    {
        return $user->store_id === $inventoryItem->store_id || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->store_id !== null;
    }

    public function viewCost(User $user, ?InventoryItem $inventoryItem = null): bool
    {
        return $user->canViewCosts();
    }
}
