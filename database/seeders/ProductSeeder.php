<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::query()->where('code', 'UNI-001')->first()
            ?? Store::query()->firstOrFail();

        foreach ($this->catalog() as $item) {
            Product::query()->firstOrCreate(
                [
                    'store_id' => $store->id,
                    'sku' => $item['sku'],
                ],
                [
                    'brand' => $item['brand'],
                    'model' => $item['model'],
                    'storage' => $item['storage'],
                    'color' => $item['color'],
                ],
            );
        }
    }

    /**
     * @return list<array{brand: string, model: string, storage: string, color: string, sku: string}>
     */
    private function catalog(): array
    {
        return [
            ['brand' => 'Apple', 'model' => 'iPhone 11', 'storage' => '64GB', 'color' => 'Black', 'sku' => 'APL-IP11-64-BLK'],
            ['brand' => 'Apple', 'model' => 'iPhone 11', 'storage' => '128GB', 'color' => 'White', 'sku' => 'APL-IP11-128-WHT'],
            ['brand' => 'Apple', 'model' => 'iPhone 12', 'storage' => '64GB', 'color' => 'Blue', 'sku' => 'APL-IP12-64-BLU'],
            ['brand' => 'Apple', 'model' => 'iPhone 12', 'storage' => '128GB', 'color' => 'Black', 'sku' => 'APL-IP12-128-BLK'],
            ['brand' => 'Apple', 'model' => 'iPhone 13', 'storage' => '128GB', 'color' => 'Midnight', 'sku' => 'APL-IP13-128-MID'],
            ['brand' => 'Apple', 'model' => 'iPhone 13', 'storage' => '256GB', 'color' => 'Pink', 'sku' => 'APL-IP13-256-PNK'],
            ['brand' => 'Apple', 'model' => 'iPhone 13 Pro', 'storage' => '256GB', 'color' => 'Graphite', 'sku' => 'APL-IP13P-256-GRP'],
            ['brand' => 'Apple', 'model' => 'iPhone 14', 'storage' => '128GB', 'color' => 'Blue', 'sku' => 'APL-IP14-128-BLU'],
            ['brand' => 'Apple', 'model' => 'iPhone 14', 'storage' => '256GB', 'color' => 'Purple', 'sku' => 'APL-IP14-256-PRP'],
            ['brand' => 'Apple', 'model' => 'iPhone 14 Pro', 'storage' => '256GB', 'color' => 'Deep Purple', 'sku' => 'APL-IP14P-256-DPR'],
            ['brand' => 'Apple', 'model' => 'iPhone 15', 'storage' => '128GB', 'color' => 'Black', 'sku' => 'APL-IP15-128-BLK'],
            ['brand' => 'Apple', 'model' => 'iPhone 15', 'storage' => '256GB', 'color' => 'Blue', 'sku' => 'APL-IP15-256-BLU'],
            ['brand' => 'Apple', 'model' => 'iPhone 15 Pro', 'storage' => '256GB', 'color' => 'Natural Titanium', 'sku' => 'APL-IP15P-256-NTI'],
            ['brand' => 'Apple', 'model' => 'iPhone 15 Pro Max', 'storage' => '512GB', 'color' => 'Black Titanium', 'sku' => 'APL-IP15PM-512-BTI'],
            ['brand' => 'Apple', 'model' => 'iPhone 16', 'storage' => '128GB', 'color' => 'Teal', 'sku' => 'APL-IP16-128-TEA'],
            ['brand' => 'Apple', 'model' => 'iPhone 16 Pro', 'storage' => '256GB', 'color' => 'Desert Titanium', 'sku' => 'APL-IP16P-256-DTI'],

            ['brand' => 'Samsung', 'model' => 'Galaxy A15', 'storage' => '128GB', 'color' => 'Blue Black', 'sku' => 'SAM-A15-128-BBK'],
            ['brand' => 'Samsung', 'model' => 'Galaxy A25', 'storage' => '128GB', 'color' => 'Blue Black', 'sku' => 'SAM-A25-128-BBK'],
            ['brand' => 'Samsung', 'model' => 'Galaxy A35', 'storage' => '256GB', 'color' => 'Awesome Lilac', 'sku' => 'SAM-A35-256-LIL'],
            ['brand' => 'Samsung', 'model' => 'Galaxy A54', 'storage' => '256GB', 'color' => 'Awesome Graphite', 'sku' => 'SAM-A54-256-GRP'],
            ['brand' => 'Samsung', 'model' => 'Galaxy A55', 'storage' => '256GB', 'color' => 'Awesome Navy', 'sku' => 'SAM-A55-256-NAV'],
            ['brand' => 'Samsung', 'model' => 'Galaxy S21', 'storage' => '128GB', 'color' => 'Phantom Gray', 'sku' => 'SAM-S21-128-PGR'],
            ['brand' => 'Samsung', 'model' => 'Galaxy S22', 'storage' => '256GB', 'color' => 'Phantom Black', 'sku' => 'SAM-S22-256-PBK'],
            ['brand' => 'Samsung', 'model' => 'Galaxy S23', 'storage' => '256GB', 'color' => 'Phantom Black', 'sku' => 'SAM-S23-256-PBK'],
            ['brand' => 'Samsung', 'model' => 'Galaxy S23 Ultra', 'storage' => '512GB', 'color' => 'Green', 'sku' => 'SAM-S23U-512-GRN'],
            ['brand' => 'Samsung', 'model' => 'Galaxy S24', 'storage' => '256GB', 'color' => 'Onyx Black', 'sku' => 'SAM-S24-256-ONY'],
            ['brand' => 'Samsung', 'model' => 'Galaxy S24 Ultra', 'storage' => '512GB', 'color' => 'Titanium Gray', 'sku' => 'SAM-S24U-512-TGR'],
            ['brand' => 'Samsung', 'model' => 'Galaxy Z Flip5', 'storage' => '256GB', 'color' => 'Mint', 'sku' => 'SAM-ZF5-256-MNT'],
            ['brand' => 'Samsung', 'model' => 'Galaxy Z Fold5', 'storage' => '512GB', 'color' => 'Icy Blue', 'sku' => 'SAM-ZFO5-512-ICY'],

            ['brand' => 'Xiaomi', 'model' => 'Redmi 13C', 'storage' => '128GB', 'color' => 'Midnight Black', 'sku' => 'XIA-R13C-128-MBK'],
            ['brand' => 'Xiaomi', 'model' => 'Redmi Note 12', 'storage' => '128GB', 'color' => 'Onyx Gray', 'sku' => 'XIA-RN12-128-ONY'],
            ['brand' => 'Xiaomi', 'model' => 'Redmi Note 13', 'storage' => '128GB', 'color' => 'Midnight Black', 'sku' => 'XIA-RN13-128-MBK'],
            ['brand' => 'Xiaomi', 'model' => 'Redmi Note 13 Pro', 'storage' => '256GB', 'color' => 'Aurora Purple', 'sku' => 'XIA-RN13P-256-AUR'],
            ['brand' => 'Xiaomi', 'model' => 'Redmi Note 14', 'storage' => '256GB', 'color' => 'Midnight Black', 'sku' => 'XIA-RN14-256-MBK'],
            ['brand' => 'Xiaomi', 'model' => 'Poco X6', 'storage' => '256GB', 'color' => 'Black', 'sku' => 'XIA-PX6-256-BLK'],
            ['brand' => 'Xiaomi', 'model' => 'Poco F6', 'storage' => '256GB', 'color' => 'Titanium', 'sku' => 'XIA-PF6-256-TIT'],
            ['brand' => 'Xiaomi', 'model' => '14T', 'storage' => '256GB', 'color' => 'Titan Blue', 'sku' => 'XIA-14T-256-TBL'],

            ['brand' => 'Motorola', 'model' => 'Moto G84', 'storage' => '256GB', 'color' => 'Midnight Blue', 'sku' => 'MOT-G84-256-MBL'],
            ['brand' => 'Motorola', 'model' => 'Moto G54', 'storage' => '256GB', 'color' => 'Mint Green', 'sku' => 'MOT-G54-256-MGR'],
            ['brand' => 'Motorola', 'model' => 'Edge 40', 'storage' => '256GB', 'color' => 'Eclipse Black', 'sku' => 'MOT-E40-256-EBK'],
            ['brand' => 'Motorola', 'model' => 'Edge 50 Fusion', 'storage' => '256GB', 'color' => 'Forest Blue', 'sku' => 'MOT-E50F-256-FBL'],
            ['brand' => 'Motorola', 'model' => 'Razr 40', 'storage' => '256GB', 'color' => 'Sage Green', 'sku' => 'MOT-RZ40-256-SGR'],

            ['brand' => 'Google', 'model' => 'Pixel 7a', 'storage' => '128GB', 'color' => 'Charcoal', 'sku' => 'GOO-P7A-128-CHR'],
            ['brand' => 'Google', 'model' => 'Pixel 8', 'storage' => '128GB', 'color' => 'Obsidian', 'sku' => 'GOO-P8-128-OBS'],
            ['brand' => 'Google', 'model' => 'Pixel 8 Pro', 'storage' => '256GB', 'color' => 'Porcelain', 'sku' => 'GOO-P8P-256-POR'],
            ['brand' => 'Google', 'model' => 'Pixel 9', 'storage' => '256GB', 'color' => 'Obsidian', 'sku' => 'GOO-P9-256-OBS'],
        ];
    }
}
