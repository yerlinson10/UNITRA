<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $brand = fake()->randomElement(['Apple', 'Samsung', 'Xiaomi', 'Motorola']);
        $model = fake()->randomElement(['A1', 'Pro', 'Plus', 'Ultra']);
        $storage = fake()->randomElement(['64GB', '128GB', '256GB']);
        $color = fake()->safeColorName();

        return [
            'store_id' => Store::factory(),
            'brand' => $brand,
            'model' => $model,
            'storage' => $storage,
            'color' => $color,
            'name' => trim("{$brand} {$model} {$storage} {$color}"),
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####-??')),
        ];
    }
}
