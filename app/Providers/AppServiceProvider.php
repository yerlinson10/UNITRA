<?php

namespace App\Providers;

use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\Store;
use App\Models\User;
use App\Policies\InventoryItemPolicy;
use App\Policies\InvoicePolicy;
use App\Policies\StorePolicy;
use App\Policies\UserPolicy;
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

        Gate::policy(InventoryItem::class, InventoryItemPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(Store::class, StorePolicy::class);
        Gate::policy(User::class, UserPolicy::class);
    }
}
