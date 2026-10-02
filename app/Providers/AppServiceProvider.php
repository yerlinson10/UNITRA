<?php

namespace App\Providers;

use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Observers\InventoryItemObserver;
use App\Policies\InventoryItemPolicy;
use App\Policies\InvoicePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        InventoryItem::observe(InventoryItemObserver::class);

        Gate::policy(InventoryItem::class, InventoryItemPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
    }
}
