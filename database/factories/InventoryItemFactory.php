<?php

namespace Database\Factories;

use App\Enums\InventoryOrigin;
use App\Enums\InventoryStatus;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryItem>
 */
class InventoryItemFactory extends Factory
{
    public function definition(): array
    {
        $minSalePrice = fake()->randomFloat(2, 150, 800);

        return [
            'store_id' => Store::factory(),
            'product_id' => Product::factory(),
            'imei' => fake()->unique()->numerify('###############'),
            'serial' => fake()->optional()->bothify('SN########'),
            'condition_grade' => fake()->randomElement(['A', 'B', 'C']),
            'battery_health' => fake()->numberBetween(80, 100),
            'cost' => fake()->randomFloat(2, 100, 800),
            'min_sale_price' => $minSalePrice,
            'regular_sale_price' => fake()->randomFloat(2, (float) $minSalePrice, 1200),
            'purchased_at' => now()->toDateString(),
            'warranty_months' => 3,
            'sold_at' => null,
            'warranty_expires_at' => null,
            'status' => InventoryStatus::Available,
            'origin' => InventoryOrigin::Purchase,
            'notes' => null,
        ];
    }

    public function available(): static
    {
        return $this->state(fn () => [
            'status' => InventoryStatus::Available,
            'sold_at' => null,
        ]);
    }

    public function sold(): static
    {
        return $this->state(fn () => [
            'status' => InventoryStatus::Sold,
            'sold_at' => now(),
            'warranty_expires_at' => now()->addMonths(3)->toDateString(),
        ]);
    }
}
