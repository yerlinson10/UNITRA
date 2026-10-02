<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Seeds Spatie roles and permissions.
 *
 * PRODUCTION NOTE:
 * Run this seeder on every production deploy after migrations, or roles/permissions
 * will be missing and authorization will fail for new environments:
 *
 *   php artisan db:seed --class=RolesAndPermissionsSeeder --force
 *
 * Prefer including it in your deploy checklist alongside `php artisan migrate --force`.
 * It is idempotent (firstOrCreate / syncPermissions).
 */
class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * @var list<string>
     */
    private array $permissions = [
        'store.update',
        'users.manage',
        'invoices.void',
        'reports.view',
        'costs.view',
        'products.manage',
        'inventory.manage',
        'purchases.manage',
        'pos.sell',
        'invoices.view',
        'cash.manage',
    ];

    /**
     * @var list<string>
     */
    private array $cashierPermissions = [
        'pos.sell',
        'invoices.view',
        'cash.manage',
        'inventory.manage',
        'purchases.manage',
        'products.manage',
    ];

    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach ($this->permissions as $name) {
            Permission::findOrCreate($name);
        }

        $admin = Role::findOrCreate('admin');
        $admin->syncPermissions(Permission::query()->pluck('name')->all());

        $cashier = Role::findOrCreate('cashier');
        $cashier->syncPermissions($this->cashierPermissions);

        User::query()->each(function (User $user): void {
            $role = $user->role?->value ?? 'cashier';
            $user->syncRoles([$role]);
        });
    }
}
