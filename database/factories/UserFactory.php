<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => UserRole::Cashier,
            'store_id' => null,
            'is_active' => true,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function admin(?Store $store = null): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Admin,
            'store_id' => $store?->id ?? $attributes['store_id'] ?? null,
        ]);
    }

    public function cashier(?Store $store = null): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Cashier,
            'store_id' => $store?->id ?? $attributes['store_id'] ?? null,
        ]);
    }

    public function forStore(Store $store): static
    {
        return $this->state(fn (array $attributes) => [
            'store_id' => $store->id,
        ]);
    }
}
