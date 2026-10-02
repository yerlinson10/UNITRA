<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::query()->firstOrCreate(
            ['code' => 'UNI-001'],
            [
                'name' => 'UNITRA Principal',
                'address' => 'Santo Domingo, República Dominicana',
                'phone' => '809-555-0100',
                'is_active' => true,
            ],
        );

        User::query()->firstOrCreate(
            ['email' => 'admin@unitra.local'],
            [
                'name' => 'Administrador UNITRA',
                'password' => Hash::make('password'),
                'role' => UserRole::Admin,
                'store_id' => $store->id,
                'email_verified_at' => now(),
            ],
        );

        User::query()->firstOrCreate(
            ['email' => 'cashier@unitra.local'],
            [
                'name' => 'Cajero UNITRA',
                'password' => Hash::make('password'),
                'role' => UserRole::Cashier,
                'store_id' => $store->id,
                'email_verified_at' => now(),
            ],
        );

        $this->call([
            ProductSeeder::class,
            InventoryItemSeeder::class,
        ]);
    }
}
