<?php

namespace Database\Seeders;

use App\Enums\InventoryOrigin;
use App\Enums\InventoryStatus;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Seeder;

class InventoryItemSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::query()->where('code', 'UNI-001')->first()
            ?? Store::query()->firstOrFail();

        $products = Product::query()
            ->where('store_id', $store->id)
            ->orderBy('id')
            ->get();

        if ($products->isEmpty()) {
            $this->call(ProductSeeder::class);
            $products = Product::query()
                ->where('store_id', $store->id)
                ->orderBy('id')
                ->get();
        }

        $grades = ['Como nuevo', 'Grado A', 'Grado B', 'Grado C'];
        $created = 0;
        $imeiBase = 350000000000000;

        // At least one available phone per product, capped so we always get 40+.
        $target = max(40, $products->count());

        for ($i = 0; $i < $target; $i++) {
            $product = $products[$i % $products->count()];
            $imei = (string) ($imeiBase + $i + 1);

            if (InventoryItem::query()->where('store_id', $store->id)->where('imei', $imei)->exists()) {
                continue;
            }

            [$cost, $minSale] = $this->pricingFor($product->brand, $product->model, $i);

            InventoryItem::query()->create([
                'store_id' => $store->id,
                'product_id' => $product->id,
                'imei' => $imei,
                'serial' => sprintf('SN-%s-%04d', strtoupper(substr($product->brand, 0, 3)), $i + 1),
                'condition_grade' => $grades[$i % count($grades)],
                'battery_health' => 100 - ($i % 25),
                'cost' => $cost,
                'min_sale_price' => $minSale,
                'purchased_at' => now()->subDays($i % 60)->toDateString(),
                'warranty_months' => 3,
                'sold_at' => null,
                'warranty_expires_at' => null,
                'status' => InventoryStatus::Available,
                'origin' => InventoryOrigin::Purchase,
                'notes' => null,
            ]);

            $created++;
        }

        $this->command?->info("Inventario: {$created} teléfonos disponibles creados.");
    }

    /**
     * @return array{0: float, 1: float}
     */
    private function pricingFor(string $brand, string $model, int $index): array
    {
        $base = match (true) {
            str_contains($model, 'Pro Max'), str_contains($model, 'Ultra'), str_contains($model, 'Fold') => 42000,
            str_contains($model, 'Pro'), str_contains($model, 'Flip'), str_contains($model, 'Razr') => 32000,
            $brand === 'Apple' => 22000,
            $brand === 'Samsung' && str_starts_with($model, 'Galaxy S') => 18000,
            $brand === 'Google' => 16000,
            default => 9000,
        };

        $variance = ($index % 7) * 350;
        $cost = $base + $variance;
        $minSale = round($cost * 1.25, -2);

        return [(float) $cost, (float) $minSale];
    }
}
