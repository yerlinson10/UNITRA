<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::query()->create([
            'name' => 'UNITRA Principal',
            'code' => 'UNI-001',
            'address' => 'Santo Domingo, República Dominicana',
            'phone' => '809-555-0100',
            'is_active' => true,
        ]);

        User::query()->create([
            'name' => 'Administrador UNITRA',
            'email' => 'admin@unitra.local',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);

        User::query()->create([
            'name' => 'Cajero UNITRA',
            'email' => 'cashier@unitra.local',
            'password' => Hash::make('password'),
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);

        $catalog = [
            ['brand' => 'Apple', 'model' => 'iPhone 13', 'storage' => '128GB', 'color' => 'Midnight', 'sku' => 'APL-IP13-128-MID'],
            ['brand' => 'Apple', 'model' => 'iPhone 14', 'storage' => '128GB', 'color' => 'Blue', 'sku' => 'APL-IP14-128-BLU'],
            ['brand' => 'Apple', 'model' => 'iPhone 15', 'storage' => '256GB', 'color' => 'Black', 'sku' => 'APL-IP15-256-BLK'],
            ['brand' => 'Samsung', 'model' => 'Galaxy S23', 'storage' => '256GB', 'color' => 'Phantom Black', 'sku' => 'SAM-S23-256-PBK'],
            ['brand' => 'Samsung', 'model' => 'Galaxy S24', 'storage' => '256GB', 'color' => 'Onyx Black', 'sku' => 'SAM-S24-256-ONY'],
            ['brand' => 'Xiaomi', 'model' => 'Redmi Note 13', 'storage' => '128GB', 'color' => 'Midnight Black', 'sku' => 'XIA-RN13-128-MBK'],
        ];

        foreach ($catalog as $item) {
            Product::query()->create([
                'store_id' => $store->id,
                ...$item,
            ]);
        }
    }
}
