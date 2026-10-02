<?php

namespace App\Observers;

use App\Models\InventoryItem;
use App\Services\Pos\PosAvailableInventoryCache;

class InventoryItemObserver
{
    public function saved(InventoryItem $inventoryItem): void
    {
        PosAvailableInventoryCache::forgetStore($inventoryItem->store_id);
    }

    public function deleted(InventoryItem $inventoryItem): void
    {
        PosAvailableInventoryCache::forgetStore($inventoryItem->store_id);
    }
}
