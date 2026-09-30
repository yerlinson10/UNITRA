<?php

namespace Tests\Feature;

use App\Enums\InventoryStatus;
use App\Enums\UserRole;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreInventoryUnitTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_inventory_unit_with_existing_Marca(): void
    {
        $store = Store::factory()->create();
        $user = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $Marca = Product::factory()->create(['store_id' => $store->id]);

        $response = $this->actingAs($user)->post('/inventory', [
            'product_id' => $Marca->id,
            'imei' => '359999999999999',
            'cost' => 12000,
            'min_sale_price' => 15000,
            'condition_grade' => 'Grado A',
        ]);

        $item = InventoryItem::query()->where('imei', '359999999999999')->first();
        $this->assertNotNull($item);
        $this->assertSame(InventoryStatus::Available, $item->status);
        $response->assertRedirect(route('inventory.index'));
    }

    public function test_can_create_inventory_unit_and_new_Marca_in_one_step(): void
    {
        $store = Store::factory()->create();
        $user = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)->post('/inventory', [
            'brand' => 'Apple',
            'model' => 'iPhone 15',
            'storage' => '128GB',
            'color' => 'Negro',
            'imei' => '358888888888888',
            'cost' => 22000,
        ])->assertRedirect();

        $this->assertDatabaseHas('products', [
            'store_id' => $store->id,
            'brand' => 'Apple',
            'model' => 'iPhone 15',
        ]);
        $this->assertDatabaseHas('inventory_items', [
            'imei' => '358888888888888',
            'status' => InventoryStatus::Available->value,
        ]);
    }

    public function test_pos_lookup_searches_by_Marca_name(): void
    {
        $store = Store::factory()->create();
        $user = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $Marca = Product::factory()->create([
            'store_id' => $store->id,
            'brand' => 'Samsung',
            'model' => 'S24',
            'name' => 'Samsung S24 256GB',
        ]);
        InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $Marca->id,
            'imei' => '357777777777777',
            'status' => InventoryStatus::Available,
        ]);

        $this->actingAs($user)
            ->getJson('/pos/lookup?q=Samsung')
            ->assertOk()
            ->assertJsonPath('results.0.imei', '357777777777777');
    }
}
