<?php

namespace Tests\Feature;

use App\Enums\InventoryStatus;
use App\Enums\PaymentMethod;
use App\Enums\UserRole;
use App\Models\CashSession;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class RegularSalePriceTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_inventory_persists_regular_sale_price(): void
    {
        $store = Store::factory()->create();
        $user = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $product = Product::factory()->create(['store_id' => $store->id]);

        $this->actingAs($user)->post('/inventory', [
            'product_id' => $product->id,
            'imei' => '359999999999001',
            'cost' => 12000,
            'min_sale_price' => 14000,
            'regular_sale_price' => 16500,
            'condition_grade' => 'Grado A',
            'purchased_at' => now()->toDateString(),
            'warranty_months' => 3,
        ])->assertRedirect(route('inventory.index'));

        $this->assertDatabaseHas('inventory_items', [
            'imei' => '359999999999001',
            'min_sale_price' => 14000,
            'regular_sale_price' => 16500,
        ]);
    }

    public function test_regular_sale_price_cannot_be_below_min(): void
    {
        $store = Store::factory()->create();
        $user = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $product = Product::factory()->create(['store_id' => $store->id]);

        $this->actingAs($user)->post('/inventory', [
            'product_id' => $product->id,
            'imei' => '359999999999002',
            'cost' => 12000,
            'min_sale_price' => 16000,
            'regular_sale_price' => 15000,
            'purchased_at' => now()->toDateString(),
        ])->assertSessionHasErrors('regular_sale_price');
    }

    public function test_pos_lookup_includes_regular_sale_price(): void
    {
        $store = Store::factory()->create();
        $user = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $product = Product::factory()->create([
            'store_id' => $store->id,
            'brand' => 'Apple',
            'model' => 'iPhone 13',
        ]);
        InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '357777777777001',
            'min_sale_price' => 500,
            'regular_sale_price' => 650,
            'status' => InventoryStatus::Available,
        ]);

        $this->actingAs($user)
            ->getJson('/pos/lookup?q=357777777777001')
            ->assertOk()
            ->assertJsonPath('results.0.min_sale_price', '500.00')
            ->assertJsonPath('results.0.regular_sale_price', '650.00');
    }

    public function test_sale_below_min_is_rejected_even_when_regular_exists(): void
    {
        Queue::fake();

        $store = Store::factory()->create();
        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $product = Product::factory()->create(['store_id' => $store->id]);
        $item = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '357777777777002',
            'cost' => 400,
            'min_sale_price' => 500,
            'regular_sale_price' => 650,
            'status' => InventoryStatus::Available,
        ]);
        CashSession::factory()->create([
            'store_id' => $store->id,
            'user_id' => $cashier->id,
        ]);

        $this->actingAs($cashier)->post('/pos', [
            'payment_method' => PaymentMethod::Cash->value,
            'amount_paid' => 450,
            'items' => [
                [
                    'inventory_item_id' => $item->id,
                    'sale_price' => 450,
                ],
            ],
        ])->assertSessionHas('error');

        $item->refresh();
        $this->assertSame(InventoryStatus::Available, $item->status);
    }
}
